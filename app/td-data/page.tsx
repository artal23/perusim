'use client';
import { useEffect, useState, useMemo } from 'react';

interface Row {
  local: string; mes: string; plan: string;
  usuarios: number; mb_plan: number; total_mb: number;
}

interface Data {
  rows: Row[];
  porLocal: Record<string, Record<string, Row[]>>;
}

const LOCALES = ['Kennedy', 'LAP', 'Larco', 'Cusco'];
const PRECIO_DATA = 0.0010;

export default function TDDataPage() {
  const [data, setData]               = useState<Data | null>(null);
  const [loading, setLoading]         = useState(true);
  const [localActivo, setLocalActivo] = useState('Kennedy');

  useEffect(() => {
    fetch('/api/td-data').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  // Consolidar todos los meses: agrupar por plan, sumar usuarios y total_mb
  const { planes, totalMB, totalCosto } = useMemo(() => {
    if (!data) return { planes: [], totalMB: 0, totalCosto: 0 };

    const localData = data.porLocal[localActivo] ?? {};

    const planMap: Record<string, { mb_plan: number; usuarios: number; total_mb: number }> = {};
    for (const rows of Object.values(localData)) {
      for (const r of rows) {
        if (!planMap[r.plan]) {
          planMap[r.plan] = { mb_plan: r.mb_plan, usuarios: 0, total_mb: 0 };
        }
        planMap[r.plan].usuarios += Number(r.usuarios);
        planMap[r.plan].total_mb += Number(r.total_mb);
      }
    }

    const planes = Object.entries(planMap)
      .map(([plan, v]) => ({ plan, ...v }))
      .sort((a, b) => b.total_mb - a.total_mb);

    const totalMB    = planes.reduce((a, p) => a + p.total_mb, 0);
    const totalCosto = totalMB * PRECIO_DATA;

    return { planes, totalMB, totalCosto };
  }, [data, localActivo]);

  if (loading) return (
    <div style={{ color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace', fontSize: '13px' }}>Cargando datos...</div>
  );
  if (!data) return null;

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: 'linear-gradient(180deg, #3b82f6, #10b981)' }} />
          <h1 style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-0.5px' }}>TD Data</h1>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '16px', fontFamily: 'DM Mono, monospace' }}>
          CONSUMO DE DATA POR LOCAL Y PLAN
        </p>
      </div>

      {/* Tabs locales */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {LOCALES.map(l => (
          <button key={l} onClick={() => setLocalActivo(l)} style={{
            padding: '8px 18px', borderRadius: '6px', border: '1px solid',
            borderColor: localActivo === l ? 'var(--accent-blue)' : 'var(--border)',
            background: localActivo === l ? 'var(--accent-blue-dim)' : 'transparent',
            color: localActivo === l ? '#93c5fd' : 'var(--text-secondary)',
            fontFamily: 'DM Mono, monospace', fontSize: '12px', cursor: 'pointer',
            fontWeight: localActivo === l ? '500' : '400',
          }}>{l}</button>
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
            {localActivo} · Consolidado
          </span>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>
              {totalMB.toLocaleString('es-PE', { minimumFractionDigits: 2 })} MB total
            </span>
            <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>
              S/.{totalCosto.toLocaleString('es-PE', { minimumFractionDigits: 2 })} costo
            </span>
          </div>
        </div>

        {/* Cabecera tabla */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          padding: '8px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-base)',
        }}>
          {['PLAN', 'MB/PLAN', 'USUARIOS', 'TOTAL MB', 'COSTO DATA'].map(h => (
            <span key={h} style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{h}</span>
          ))}
        </div>

        {/* Filas */}
        {planes.map((row, i) => (
          <div key={row.plan} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
            padding: '10px 20px', alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{row.plan}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>
              {row.mb_plan.toLocaleString()}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
              {row.usuarios.toLocaleString()}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
              {row.total_mb.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--accent-green)', fontFamily: 'DM Mono, monospace' }}>
              S/.{(row.total_mb * PRECIO_DATA).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}

        {/* Total */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          padding: '10px 20px', background: 'rgba(59,130,246,0.08)',
          borderTop: '2px solid var(--border)',
        }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>TOTAL</span>
          <span />
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#93c5fd', fontFamily: 'DM Mono, monospace' }}>
            {planes.reduce((a, p) => a + p.usuarios, 0).toLocaleString()}
          </span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#93c5fd', fontFamily: 'DM Mono, monospace' }}>
            {totalMB.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-green)', fontFamily: 'DM Mono, monospace' }}>
            S/.{totalCosto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}