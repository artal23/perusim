import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT
        bundle_desc                              AS plan,
        COUNT(DISTINCT user_document_number)     AS usuarios
      FROM dataset.odoo
      WHERE segment        = 'PeruSIM'
        AND transaction_type = 'Plan'
        AND bundle_desc   IS NOT NULL
        AND bundle_desc   != ''
      GROUP BY plan
      ORDER BY usuarios DESC
    `);
    client.release();

    // Devuelve { [plan]: usuarios }
    const data: Record<string, number> = {};
    for (const r of result.rows) {
      data[r.plan] = Number(r.usuarios);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
  }
}