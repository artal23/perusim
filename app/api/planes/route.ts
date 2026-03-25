import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get('mes') ?? '2023-12';

  // Convertir '2023-12' → 'Dec-23' (formato TO_CHAR de Postgres)
  const [anio, numMes] = mes.split('-');
  const meses = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mesChar = `${meses[parseInt(numMes) - 1]}-${anio.slice(2)}`; // e.g. 'Dec-23'
  const mesDate = `${mes}-01`;

  try {
    const client = await pool.connect();

    const result = await client.query(`
      SELECT
        p.bundle_desc                                        AS plan,
        COUNT(DISTINCT a.user_document_number)               AS usuarios,
        COALESCE(SUM(d.total_data_mb),     0)                AS total_data_mb,
        COALESCE(SUM(v.total_voz_sal_min), 0)                AS total_voz_sal_min,
        COALESCE(SUM(v.total_voz_ent_min), 0)                AS total_voz_ent_min,
        COALESCE(SUM(s.total_sms),         0)                AS total_sms
      FROM (
        -- Plan vigente por msisdn: el más reciente activado
        -- HASTA el último día del mes analizado (excluye planes futuros)
        SELECT DISTINCT ON (msisdn)
          msisdn, bundle_desc
        FROM dataset.odoo_perusim2023
        WHERE transaction_type = 'Plan'
          AND bundle_desc IS NOT NULL
          AND bundle_desc != ''
          AND created_dt <= ($2::date + INTERVAL '1 month' - INTERVAL '1 day')
        ORDER BY msisdn, created_dt DESC
      ) p
      -- Clientes activos en el mes seleccionado
      INNER JOIN (
        SELECT DISTINCT msisdn, user_document_number
        FROM dataset.odoo_perusim2023
        WHERE transaction_type IN ('Not found', 'Extra')
          AND TO_CHAR(created_dt, 'Mon-YY') = $1
      ) a ON a.msisdn = p.msisdn
      -- Consumo de datos del mes
      LEFT JOIN (
        SELECT msisdn,
               SUM(rating_input_used_volume_gb) * 1024 AS total_data_mb
        FROM dataset.odoo_data_consumption_daily
        WHERE DATE_TRUNC('month', event_date) = $2
        GROUP BY msisdn
      ) d ON d.msisdn = p.msisdn
      -- Consumo de voz del mes
      LEFT JOIN (
        SELECT msisdn,
               SUM(outgoing_duration_min) AS total_voz_sal_min,
               SUM(incoming_duration_min) AS total_voz_ent_min
        FROM dataset.odoo_voice_consumption_daily
        WHERE DATE_TRUNC('month', event_date) = $2
        GROUP BY msisdn
      ) v ON v.msisdn = p.msisdn
      -- Consumo de SMS del mes
      LEFT JOIN (
        SELECT msisdn,
               SUM(sms_count) AS total_sms
        FROM dataset.odoo_sms_consumption_daily
        WHERE DATE_TRUNC('month', event_date) = $2
        GROUP BY msisdn
      ) s ON s.msisdn = p.msisdn
      GROUP BY p.bundle_desc
      ORDER BY usuarios DESC
    `, [mesChar, mesDate]);

    client.release();

    const data: Record<string, {
      usuarios:        number;
      avg_data_mb:     number;
      avg_voz_sal_min: number;
      avg_voz_ent_min: number;
      avg_sms:         number;
    }> = {};

    for (const r of result.rows) {
      const u = Number(r.usuarios);
      data[r.plan] = {
        usuarios:        u,
        avg_data_mb:     u > 0 ? +(Number(r.total_data_mb)     / u).toFixed(2) : 0,
        avg_voz_sal_min: u > 0 ? +(Number(r.total_voz_sal_min) / u).toFixed(2) : 0,
        avg_voz_ent_min: u > 0 ? +(Number(r.total_voz_ent_min) / u).toFixed(2) : 0,
        avg_sms:         u > 0 ? +(Number(r.total_sms)         / u).toFixed(2) : 0,
      };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
  }
}