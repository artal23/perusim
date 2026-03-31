'use client';
import { useEffect, useState } from 'react';
import ExportPDF from '@/components/ExportPDF';

interface ResumenRow {
  local:            string;
  ingresos_sin_igv: number;
  ingresos_con_igv: number;
}

const S = (v: number) =>
  `S/.${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const REPORT_ID = 'reporte-resumen';

export default function ResumenPage() {
  const [data, setData]       = useState<ResumenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/resumen')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError('Error al cargar datos'); setLoading(false); });
  }, []);

  const totalSinIGV = data.reduce((a, r) => a + Number(r.ingresos_sin_igv), 0);
  const totalConIGV = data.reduce((a, r) => a + Number(r.ingresos_con_igv), 0);
  const fecha = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

  if (loading) return (
    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: 'var(--text-muted)' }}>
      ● cargando...
    </p>
  );
  if (error) return (
    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: '#f87171' }}>
      Error: {error}
    </p>
  );

  return (
    <div>
      {/* ── Cabecera ── */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: 'linear-gradient(180deg, #f59e0b, #ef4444)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-0.5px' }}>Resumen General</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '16px', fontFamily: 'DM Mono, monospace' }}>
            INGRESOS POR LOCAL · PERUSIM 2023
          </p>
        </div>
        <ExportPDF targetId={REPORT_ID} filename="resumen-perusim-2023" />
      </div>

      {/* ── Contenido del reporte ── */}
      <div id={REPORT_ID}>

        {/* Solo visible en PDF */}
        <div className="pdf-only" style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '18px', fontWeight: '700', marginBottom: '2px' }}>Resumen General — PeruSIM 2023</p>
          <p style={{ fontSize: '11px', letterSpacing: '0.5px' }}>INGRESOS POR LOCAL · Generado el {fecha}</p>
        </div>

        {/* Tarjetas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Total sin IGV', value: S(totalSinIGV), color: '#6ee7b7' },
            { label: 'Total con IGV', value: S(totalConIGV), color: '#93c5fd' },
          ].map(({ label, value, color }) => (
            <div key={label} className="pdf-card" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--border-radius-lg)', padding: '1rem',
            }}>
              <p style={{
                fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace',
                fontWeight: '600', marginBottom: '6px', letterSpacing: '0.5px',
              }}>
                {label.toUpperCase()}
              </p>
              <p style={{ fontSize: '24px', fontWeight: '500', color, fontFamily: 'DM Mono, monospace' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
            <thead>
              <tr>
                {['Local', 'Ingresos sin IGV', 'Ingresos con IGV'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: i === 0 ? 'left' : 'right',
                    fontFamily: 'DM Mono, monospace', fontSize: '10px',
                    fontWeight: '600', letterSpacing: '0.5px', color: 'var(--text-muted)',
                    borderBottom: '2px solid var(--border)', background: 'var(--bg-base)',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.local} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                    {row.local}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '13px', color: '#6ee7b7', borderBottom: '1px solid var(--border)' }}>
                    {S(Number(row.ingresos_sin_igv))}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '13px', color: '#93c5fd', borderBottom: '1px solid var(--border)' }}>
                    {S(Number(row.ingresos_con_igv))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(59,130,246,0.06)' }}>
                <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '600', fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)', borderTop: '2px solid var(--border)' }}>
                  TOTAL
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color: '#6ee7b7', borderTop: '2px solid var(--border)' }}>
                  {S(totalSinIGV)}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color: '#93c5fd', borderTop: '2px solid var(--border)' }}>
                  {S(totalConIGV)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Solo visible en PDF */}
        <p className="pdf-only" style={{ marginTop: '20px', fontSize: '10px' }}>
          Generado el {fecha} · PeruSIM 2023 · Reporte interno
        </p>

      </div>
    </div>
  );
}