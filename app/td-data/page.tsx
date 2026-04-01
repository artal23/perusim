'use client';
import { useEffect, useState, useMemo } from 'react';
import ExportExcel from '@/components/ExportExcel';

interface Row {
  local:            string;
  mes:              string;
  plan:             string;
  usuarios:         number;
  mb_plan:          number;
  total_mb_plan:    number;
  total_consumo_mb: number;
  avg_consumo_mb:   number;
  pct_uso:          number;
}

interface Data {
  rows: Row[];
  porLocal: Record<string, Record<string, Row[]>>;
}

const LOCALES     = ['Kennedy', 'LAP', 'Larco', 'Cusco'];
const PRECIO_DATA = 0.0010;
const FACTOR_DATA = 1.2427;
const REPORT_ID   = 'reporte-td-data';

const N = (v: number, d = 2) => v.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });
const S = (v: number) => `S/.${N(v)}`;

// Columnas para el Excel
const EXCEL_COLUMNS = [
  { header: 'Plan',               key: 'plan',             format: 'text'     as const },
  { header: 'MB/Plan',            key: 'mb_plan',          format: 'number'   as const },
  { header: 'Usuarios',           key: 'usuarios',         format: 'number'   as const },
  { header: 'Consumo Total MB',   key: 'total_consumo_mb', format: 'number'   as const },
  { header: 'Prom MB/Usr',        key: 'avg_consumo_mb',   format: 'number'   as const },
  { header: '% Uso',              key: 'pct_uso',          format: 'percent'  as const },
  { header: 'Costo Data (S/.)',   key: 'costo',            format: 'currency' as const },
];

export default function TDDataPage() {
  const [data, setData]               = useState<Data | null>(null);
  const [loading, setLoading]         = useState(true);
  const [localActivo, setLocalActivo] = useState('Kennedy');

  useEffect(() => {
    fetch('/api/td-data')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  const { planes, totalConsumo, totalCosto } = useMemo(() => {
    if (!data) return { planes: [], totalConsumo: 0, totalCosto: 0 };

    const localData = data.porLocal[localActivo] ?? {};
    const planMap: Record<string, { mb_plan: number; usuarios: number; total_consumo_mb: number }> = {};

    for (const rows of Object.values(localData)) {
      for (const r of rows) {
        if (!planMap[r.plan]) {
          planMap[r.plan] = { mb_plan: r.mb_plan, usuarios: 0, total_consumo_mb: 0 };
        }
        planMap[r.plan].usuarios         += Number(r.usuarios);
        planMap[r.plan].total_consumo_mb += Number(r.total_consumo_mb);
      }
    }

    const planes = Object.entries(planMap)
      .map(([plan, v]) => {
        const avg_consumo_mb = v.usuarios > 0 ? +(v.total_consumo_mb / v.usuarios).toFixed(2) : 0;
        const pct_uso        = v.mb_plan > 0  ? +((avg_consumo_mb / v.mb_plan) * 100).toFixed(2) : 0;
        const costo          = +(v.total_consumo_mb * PRECIO_DATA * FACTOR_DATA).toFixed(2);
        return { plan, ...v, avg_consumo_mb, pct_uso, costo };
      })
      .sort((a, b) => b.total_consumo_mb - a.total_consumo_mb);

    const totalConsumo = planes.reduce((a, p) => a + p.total_consumo_mb, 0);
    const totalCosto   = totalConsumo * PRECIO_DATA * FACTOR_DATA;

    return { planes, totalConsumo, totalCosto };
  }, [data, localActivo]);

  if (loading) return (
    <div style={{ color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace', fontSize: '13px' }}>
      ● cargando...
    </div>
  );
  if (!data) return null;

  const totalUsuarios = planes.reduce((a, p) => a + p.usuarios, 0);

  // Data para Excel — añade campo costo calculado
  const excelData = planes.map(p => ({ ...p })) as Record<string, unknown>[];

  return (
    <div>
      {/* ── Cabecera ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: 'linear-gradient(180deg, #3b82f6, #10b981)' }} />
          <h1 style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-0.5px' }}>TD Data</h1>
        </div>
        <div style={{ marginLeft: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace', margin: 0 }}>
            CONSUMO DE DATA POR LOCAL Y PLAN · PERUSIM 2023
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <ExportExcel
              data={excelData}
              columns={EXCEL_COLUMNS}
              filename={`td-data-${localActivo.toLowerCase()}-perusim-2023`}
              sheetName={`${localActivo} - TD Data`}
            />
            {/* <ExportPDF targetId={REPORT_ID} filename={`td-data-${localActivo.toLowerCase()}-perusim-2023`} /> */}
          </div>
        </div>
      </div>

      <div id={REPORT_ID}>
        {/* Tabs locales */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {LOCALES.map(l => (
            <button key={l} onClick={() => setLocalActivo(l)} style={{
              padding: '8px 18px', borderRadius: '6px', border: '1px solid',
              borderColor: localActivo === l ? 'rgba(59,130,246,0.5)' : 'var(--border)',
              background:  localActivo === l ? 'rgba(59,130,246,0.1)' : 'transparent',
              color:       localActivo === l ? '#93c5fd' : 'var(--text-secondary)',
              fontFamily: 'DM Mono, monospace', fontSize: '12px', cursor: 'pointer',
              fontWeight:  localActivo === l ? '500' : '400',
            }}>
              {l}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>

          {/* Header resumen */}
          <div style={{
            padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.05))',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: '500', color: '#93c5fd', fontSize: '13px' }}>
              {localActivo} · Consolidado anual
            </span>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>
                {N(totalConsumo)} MB consumidos
              </span>
              <span style={{ fontSize: '12px', color: '#4ade80', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>
                {S(totalCosto)} costo data
              </span>
            </div>
          </div>

          {/* Cabecera columnas */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
            padding: '8px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg-base)',
          }}>
            {['PLAN', 'MB/PLAN', 'USUARIOS', 'CONSUMO TOTAL MB', 'PROM MB/USR', '% USO', 'COSTO DATA'].map(h => (
              <span key={h} style={{
                fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px',
                color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Filas */}
          {planes.map((row, i) => {
            const pctColor = row.pct_uso >= 80 ? '#f87171'
                           : row.pct_uso >= 50 ? '#fbbf24'
                           : '#4ade80';
            return (
              <div key={row.plan} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                padding: '10px 20px', alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{row.plan}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>{N(row.mb_plan, 0)}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>{N(row.usuarios, 0)}</span>
                <span style={{ fontSize: '13px', color: '#93c5fd', fontFamily: 'DM Mono, monospace' }}>{N(row.total_consumo_mb)}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>{N(row.avg_consumo_mb)}</span>
                <span style={{ fontSize: '13px', color: pctColor, fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>{N(row.pct_uso)}%</span>
                <span style={{ fontSize: '13px', color: '#4ade80', fontFamily: 'DM Mono, monospace' }}>{S(row.costo)}</span>
              </div>
            );
          })}

          {/* Fila total */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
            padding: '10px 20px', background: 'rgba(59,130,246,0.06)',
            borderTop: '2px solid var(--border)',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>TOTAL</span>
            <span />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#93c5fd', fontFamily: 'DM Mono, monospace' }}>{N(totalUsuarios, 0)}</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#93c5fd', fontFamily: 'DM Mono, monospace' }}>{N(totalConsumo)}</span>
            <span />
            <span />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#4ade80', fontFamily: 'DM Mono, monospace' }}>{S(totalCosto)}</span>
          </div>
        </div>

        <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
          * Consumo real anual · Costo = MB × S/.{PRECIO_DATA} × {FACTOR_DATA} · Solo msisdn con consumo registrado · DNIs reales (excluye anónimos)
        </p>
      </div>
    </div>
  );
}