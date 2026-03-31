import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const MB_POR_PLAN: Record<string, number> = {
  '15 GB':                15360,
  '30 GB':                30720,
  'PeruSIM 5 GB':         5120,
  'PeruSim 5 GB Extra':   5120,
  'PeruSim 10 GB Extra':  10240,
  'PeruSim 1 GB Extra':   1024,
  '10 GB':                10240,
  'PeruSIM 1 GB':         1024,
};

interface RawRow {
  local:            string;
  mes:              string;
  plan:             string;
  usuarios:         string;
  total_consumo_mb: string;
} 

export async function GET() {
  try {
    const client = await pool.connect();

    const result = await client.query(`
      -- Solo msisdn que existen en AMBAS tablas
      WITH msisdn_en_ambas AS (
        SELECT DISTINCT o.msisdn
        FROM dataset.odoo_perusim2023 o
        INNER JOIN dataset.odoo_data_consumption_daily d
          ON d.msisdn = o.msisdn
      ),
      -- Consumo total anual por msisdn
      consumo_anual AS (
        SELECT
          msisdn,
          SUM(rating_input_used_volume_gb) * 1024 AS total_data_mb
        FROM dataset.odoo_data_consumption_daily
        GROUP BY msisdn
      )
      SELECT
        CASE
          WHEN o.invoice_serie IN ('BPK1','BM02')        THEN 'Kennedy'
          WHEN o.invoice_serie IN ('BAL1','BM01','FAL1') THEN 'LAP'
          WHEN o.invoice_serie IN ('BSL1','BM03')        THEN 'Larco'
          WHEN o.invoice_serie IN ('BPC1','BAE1','BM04') THEN 'Cusco'
        END                                                    AS local,
        TO_CHAR(o.created_dt, 'Mon-YY')                       AS mes,
        o.bundle_desc                                          AS plan,
        -- DNIs únicos reales (excluye el placeholder 34407200)
        COUNT(DISTINCT CASE
          WHEN o.user_document_number != '34407200'
           AND o.user_document_number IS NOT NULL
          THEN o.user_document_number
        END)                                                   AS usuarios,
        COALESCE(SUM(c.total_data_mb), 0)                     AS total_consumo_mb
      FROM dataset.odoo_perusim2023 o
      -- Solo msisdn en ambas tablas
      INNER JOIN msisdn_en_ambas m
        ON m.msisdn = o.msisdn
      -- Consumo anual del msisdn
      LEFT JOIN consumo_anual c
        ON c.msisdn = o.msisdn
      WHERE o.transaction_type = 'Plan'
        AND o.bundle_desc IS NOT NULL
        AND o.bundle_desc != ''
        AND o.invoice_serie IN (
          'BPK1','BM02',
          'BAL1','BM01','FAL1',
          'BSL1','BM03',
          'BPC1','BAE1','BM04'
        )
      GROUP BY local, mes, plan
      ORDER BY local, mes, usuarios DESC
    `);

    client.release();

    const rows = result.rows.map((r: RawRow) => {
      const mb_plan          = MB_POR_PLAN[r.plan] ?? 0;
      const usuarios         = Number(r.usuarios);
      const total_consumo_mb = Number(r.total_consumo_mb) || 0;
      const total_mb_plan    = mb_plan * usuarios;
      const avg_consumo_mb   = usuarios > 0
        ? +(total_consumo_mb / usuarios).toFixed(2)
        : 0;
      const pct_uso = mb_plan > 0
        ? +((avg_consumo_mb / mb_plan) * 100).toFixed(2)
        : 0;

      return {
        local:            r.local,
        mes:              r.mes,
        plan:             r.plan,
        usuarios,
        mb_plan,
        total_mb_plan,
        total_consumo_mb: +total_consumo_mb.toFixed(2),
        avg_consumo_mb,
        pct_uso,
      };
    });

    // Agrupar por local → mes → [planes]
    const porLocal: Record<string, Record<string, typeof rows>> = {};
    for (const row of rows) {
      if (!porLocal[row.local])          porLocal[row.local] = {};
      if (!porLocal[row.local][row.mes]) porLocal[row.local][row.mes] = [];
      porLocal[row.local][row.mes].push(row);
    }

    return NextResponse.json({ rows, porLocal });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
  }
}