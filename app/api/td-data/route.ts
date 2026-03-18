import { NextResponse } from 'next/server';
import pool from '@/lib/db';

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

interface RawRow {
  local:    string;
  mes:      string;
  plan:     string;
  usuarios: string;
}

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT
        CASE
          WHEN invoice_serie IN ('BPK1','BM02')          THEN 'Kennedy'
          WHEN invoice_serie IN ('BAL1','BM01','FAL1')   THEN 'LAP'
          WHEN invoice_serie IN ('BSL1','BM03')          THEN 'Larco'
          WHEN invoice_serie IN ('BPC1','BAE1','BM04')   THEN 'Cusco'
          ELSE 'Otros'
        END AS local,
        TO_CHAR(created_dt, 'Mon-YY') AS mes,
        bundle_desc AS plan,
        COUNT(*) AS usuarios
      FROM dataset.odoo_perusim2023 AS odoo
      WHERE segment = 'PeruSIM'
        AND transaction_type = 'Plan'
        AND bundle_desc IS NOT NULL
        AND bundle_desc != ''
      GROUP BY local, mes, plan
      ORDER BY local, mes, usuarios DESC
    `);
    client.release();

    const rows = result.rows.map((r: RawRow) => {
      const mb_plan  = MB_POR_PLAN[r.plan] ?? 0;
      const total_mb = mb_plan * Number(r.usuarios);
      return {
        local:    r.local,
        mes:      r.mes,
        plan:     r.plan,
        usuarios: Number(r.usuarios),
        mb_plan,
        total_mb,
      };
    });

    const porLocal: Record<string, Record<string, typeof rows>> = {};
    for (const row of rows) {
      if (!porLocal[row.local])           porLocal[row.local] = {};
      if (!porLocal[row.local][row.mes])  porLocal[row.local][row.mes] = [];
      porLocal[row.local][row.mes].push(row);
    }

    return NextResponse.json({ rows, porLocal });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
  }
}