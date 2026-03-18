import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        TO_CHAR(created_dt, 'Mon-YY') as mes,
        CASE 
          WHEN invoice_serie IN ('BAL1','BM01','FAL1') THEN 'LAP'
          WHEN invoice_serie IN ('BPK1','BM02') THEN 'Kennedy'
          WHEN invoice_serie IN ('BSL1','BM03') THEN 'Larco'
          WHEN invoice_serie IN ('BPC1','BAE1','BM04') THEN 'Cusco'
          ELSE 'Otros'
        END as local,
        COUNT(*) as transacciones,
        ROUND(SUM(tot_without_igv)::numeric, 2) as ingresos_sin_igv,
        ROUND(SUM(tot_with_igv)::numeric, 2) as ingresos_con_igv
      FROM dataset.odoo
      WHERE segment = 'PeruSIM'
      GROUP BY mes, local
      ORDER BY mes, local
    `);
    client.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
  }
}