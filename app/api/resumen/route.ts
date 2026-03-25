import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        CASE 
          WHEN invoice_serie IN ('BAL1','BM01','FAL1') THEN 'LAP'
          WHEN invoice_serie IN ('BPK1','BM02')        THEN 'Kennedy'
          WHEN invoice_serie IN ('BSL1','BM03')        THEN 'Larco'
          WHEN invoice_serie IN ('BPC1','BAE1','BM04') THEN 'Cusco'
        END AS local,
        ROUND(SUM(tot_without_igv)::numeric, 2) AS ingresos_sin_igv,
        ROUND(SUM(tot_with_igv)::numeric,    2) AS ingresos_con_igv
      FROM dataset.odoo_perusim2023
      WHERE segment = 'PeruSIM'
        AND invoice_serie IN (
          'BAL1','BM01','FAL1',
          'BPK1','BM02',
          'BSL1','BM03',
          'BPC1','BAE1','BM04'
        )
      GROUP BY local
      ORDER BY ingresos_con_igv DESC
    `);
    client.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
  }
}