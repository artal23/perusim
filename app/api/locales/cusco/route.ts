import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

const PRECIO_DATA_MB = 0.0010;
const PRECIO_VOZ_SAL = 0.0097;
const PRECIO_VOZ_ENT = 0.0065;
const PRECIO_SMS     = 0.01;
const COSTO_CRM      = 0.60;
const COSTO_BIO      = 0.70;
const COSTO_SIM_USD  = 0.38;
const TC             = 3.45;
const PCT_MTC        = 0.023;

const MB_POR_PLAN: Record<string, number> = {
  // 2026
  '5 GB':             5120,
  'PeruSIM 15 GB':    15360,
  'PeruSim 30 GB':    30720,
  'Ilimitado 25 GB':  25600,
  'Ilimitado 50 GB':  51200,
  'Ilimitado 100 GB': 102400,
  '10 GB':            10240,
  'PeruSIM 1 GB':     1024,
  // 2023
  '30 GB':            30720,
  'PeruSim 5 GB Extra':   5120,
  'PeruSim 10 GB Extra':  10240,
  'PeruSim 1 GB Extra':   1024,
};

const VOZ_POR_MES: Record<string, number> = { 'Jan-26': 2012 };
const SMS_POR_MES: Record<string, number> = { 'Jan-26': 315 };
const VIAS_PCT:    Record<string, number> = { 'Jan-26': 0.0503 };

function getCostosManuales(mes: string) {
  try {
    const file = path.join(process.cwd(), 'data', 'costos-manuales.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return data?.Cusco?.[mes] ?? {};
  } catch { return {}; }
}

export async function GET() {
  try {
    const client = await pool.connect();

    const ingresos = await client.query(`
      SELECT
        TO_CHAR(created_dt, 'Mon-YY') as mes,
        COUNT(DISTINCT CASE WHEN transaction_type = 'Plan'
          THEN user_document_number END)                                        AS nuevos_clientes,
        COUNT(DISTINCT CASE WHEN transaction_type IN ('Not found', 'Extra')
          THEN user_document_number END)                                        AS clientes_activos,
        ROUND(SUM(CASE WHEN transaction_type = 'Plan'      THEN tot_with_igv ELSE 0 END)::numeric, 2) AS ingresos_planes,
        ROUND(SUM(CASE WHEN transaction_type = 'Extra'     THEN tot_with_igv ELSE 0 END)::numeric, 2) AS ingresos_activation,
        ROUND(SUM(CASE WHEN transaction_type = 'Not found' THEN tot_with_igv ELSE 0 END)::numeric, 2) AS ingresos_recargas,
        ROUND(SUM(tot_with_igv)::numeric,    2) AS total_con_igv,
        ROUND(SUM(tot_without_igv)::numeric, 2) AS total_sin_igv
      FROM dataset.odoo_perusim2023 AS odoo
      WHERE segment = 'PeruSIM'
        AND invoice_serie IN ('BPC1','BAE1','BM04')
      GROUP BY mes ORDER BY mes
    `);

    const mbQuery = await client.query(`
      SELECT
        TO_CHAR(created_dt, 'Mon-YY') AS mes,
        bundle_desc AS plan,
        COUNT(*) AS usuarios
      FROM dataset.odoo_perusim2023 AS odoo
      WHERE segment = 'PeruSIM'
        AND invoice_serie IN ('BPC1','BAE1','BM04')
        AND transaction_type = 'Plan'
        AND bundle_desc IS NOT NULL AND bundle_desc != ''
      GROUP BY mes, plan
    `);
    client.release();

    const mbPorMes: Record<string, number> = {};
    for (const r of mbQuery.rows) {
      const mb = (MB_POR_PLAN[r.plan] ?? 0) * Number(r.usuarios);
      mbPorMes[r.mes] = (mbPorMes[r.mes] ?? 0) + mb;
    }

    const rows = ingresos.rows.map((row: Record<string, string>) => {
      const mes      = row.mes;
      const nuevos   = Number(row.nuevos_clientes);
      const activos  = Number(row.clientes_activos);
      const sin_igv  = Number(row.total_sin_igv);
      const con_igv  = Number(row.total_con_igv);
      const manuales = getCostosManuales(mes);

      const data_mb       = mbPorMes[mes] ?? 0;
      const voz_min       = VOZ_POR_MES[mes] ?? 0;
      const sms_u         = SMS_POR_MES[mes] ?? 0;
      const costo_data    = data_mb * PRECIO_DATA_MB;
      const costo_voz_sal = voz_min * PRECIO_VOZ_SAL;
      const costo_voz_ent = voz_min * 0.8 * PRECIO_VOZ_ENT;
      const costo_sms     = sms_u   * PRECIO_SMS;
      const costo_red     = costo_data + costo_voz_sal + costo_voz_ent + costo_sms;

      const costo_crm  = activos * COSTO_CRM;
      const costo_mtc  = sin_igv * PCT_MTC;
      const costo_sim  = nuevos  * COSTO_SIM_USD * TC;
      const costo_vias = con_igv * (VIAS_PCT[mes] ?? 0);
      const costo_bio  = nuevos  * COSTO_BIO;
      const gastos_variables = costo_crm + costo_mtc + costo_sim + costo_vias + costo_bio;

      const renta    = Number(manuales.renta_espacio      ?? 0);
      const marketing = Number(manuales.marketing         ?? 0);
      const software  = Number(manuales.software_licencias ?? 0);
      const soporte   = Number(manuales.soporte           ?? 0);
      const inc_fijo  = Number(manuales.incentivo_fijo    ?? 0);
      const inc_var   = Number(manuales.incentivo_variable ?? 0);
      const gastos_otros = renta + marketing + software + soporte + inc_fijo + inc_var;

      const gastos_totales   = costo_red + gastos_variables + gastos_otros;
      const margen_red       = sin_igv - costo_red;
      const margen_red_pct   = sin_igv > 0 ? margen_red / sin_igv : 0;
      const margen_bruto     = sin_igv - gastos_totales;
      const margen_bruto_pct = sin_igv > 0 ? margen_bruto / sin_igv : 0;

      return {
        mes,
        nuevos_clientes:     nuevos,
        clientes_activos:    activos,
        ingresos_planes:     Number(row.ingresos_planes),
        ingresos_activation: Number(row.ingresos_activation),
        ingresos_recargas:   Number(row.ingresos_recargas),
        total_con_igv:       con_igv,
        total_sin_igv:       sin_igv,
        costo_data:          +costo_data.toFixed(2),
        costo_voz_sal:       +costo_voz_sal.toFixed(2),
        costo_voz_ent:       +costo_voz_ent.toFixed(2),
        costo_sms:           +costo_sms.toFixed(2),
        costo_red:           +costo_red.toFixed(2),
        costo_crm:           +costo_crm.toFixed(2),
        costo_mtc:           +costo_mtc.toFixed(2),
        costo_sim:           +costo_sim.toFixed(2),
        costo_vias:          +costo_vias.toFixed(2),
        costo_bio:           +costo_bio.toFixed(2),
        gastos_variables:    +gastos_variables.toFixed(2),
        renta_espacio:       renta,
        marketing,
        software_licencias:  software,
        soporte,
        incentivo_fijo:      inc_fijo,
        incentivo_variable:  inc_var,
        gastos_otros:        +gastos_otros.toFixed(2),
        gastos_totales:      +gastos_totales.toFixed(2),
        margen_red:          +margen_red.toFixed(2),
        margen_red_pct:      +(margen_red_pct * 100).toFixed(2),
        margen_bruto:        +margen_bruto.toFixed(2),
        margen_bruto_pct:    +(margen_bruto_pct * 100).toFixed(2),
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
  }
}