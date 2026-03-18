'use client';
import { useState, useCallback, useEffect } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Plan {
  codigo:       string;
  nombre:       string;
  bundle_key:   string;
  gb:           number;
  precio_igv:   number;
  num_usuarios: number;
}

interface PlanRow extends Plan {
  datos_plan_mb:   number;
  uso_data_mb:     number;  // editable
  uso_social_mb:   number;  // editable
  uso_voz_sal_min: number;  // editable
  uso_sms_unit:    number;  // editable
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const IGV            = 1.18;
const PRECIO_DATA_MB = 0.0010;
const FACTOR_DATA    = 1.2427;
const PRECIO_VOZ_SAL = 0.0097;
const PRECIO_VOZ_ENT = 0.0065;
const PRECIO_SMS     = 0.01;
const COSTO_CRM      = 0.60;
const PCT_MTC        = 0.027998;

// ─── Solo los 8 planes con MB mapeados ───────────────────────────────────────
const PLANES_BASE: Plan[] = [
  { codigo: 'P_S1', nombre: 'Perú SIM 5GB',            bundle_key: '5 GB',            gb: 5,   precio_igv: 19.90,  num_usuarios: 0 },
  { codigo: 'P_S2', nombre: 'Perú SIM 15GB',           bundle_key: 'PeruSIM 15 GB',   gb: 15,  precio_igv: 29.90,  num_usuarios: 0 },
  { codigo: 'P_S3', nombre: 'PeruSim 30GB',            bundle_key: 'PeruSim 30 GB',   gb: 30,  precio_igv: 49.90,  num_usuarios: 0 },
  // { codigo: 'P_S4', nombre: 'PeruSIM 1GB',             bundle_key: 'PeruSIM 1 GB',    gb: 1,   precio_igv: 9.90,   num_usuarios: 0 },
  // { codigo: 'P_S5', nombre: 'PeruSIM 10GB',            bundle_key: '10 GB',           gb: 10,  precio_igv: 24.90,  num_usuarios: 0 },
  { codigo: 'PSL1', nombre: 'PeruSIM Ilimitado 25GB',  bundle_key: 'Ilimitado 25 GB', gb: 25,  precio_igv: 136.67, num_usuarios: 0 },
  { codigo: 'PSL2', nombre: 'PeruSIM Ilimitado 50GB',  bundle_key: 'Ilimitado 50 GB', gb: 50,  precio_igv: 196.67, num_usuarios: 0 },
  { codigo: 'PSL3', nombre: 'PeruSIM Ilimitado 100GB', bundle_key: 'Ilimitado 100 GB',gb: 100, precio_igv: 270.00, num_usuarios: 0 },
];

// ─── Construcción de filas ────────────────────────────────────────────────────
function buildRows(usuariosPorPlan: Record<string, number>): PlanRow[] {
  return PLANES_BASE.map(p => {
    const mb = p.gb * 1024;
    return {
      ...p,
      num_usuarios:    usuariosPorPlan[p.bundle_key] ?? 0,
      datos_plan_mb:   mb,
      uso_data_mb:     +(mb * 0.40).toFixed(2),
      uso_social_mb:   +(mb * 0.20).toFixed(2),
      uso_voz_sal_min: 0,
      uso_sms_unit:    0,
    };
  });
}

// ─── Cálculo por fila ─────────────────────────────────────────────────────────
function calcRow(r: PlanRow) {
  const uso_data_pct    = r.datos_plan_mb > 0 ? r.uso_data_mb   / r.datos_plan_mb : 0;
  const uso_social_pct  = r.datos_plan_mb > 0 ? r.uso_social_mb / r.datos_plan_mb : 0;
  const uso_total_pct   = uso_data_pct + uso_social_pct;
  const uso_voz_ent_min = +(r.uso_voz_sal_min * 0.85).toFixed(2);

  const costo_data    = +((r.uso_data_mb + r.uso_social_mb) * PRECIO_DATA_MB * FACTOR_DATA).toFixed(4);
  const costo_voz_sal = +(r.uso_voz_sal_min * PRECIO_VOZ_SAL).toFixed(4);
  const costo_voz_ent = +(uso_voz_ent_min   * PRECIO_VOZ_ENT).toFixed(4);
  const costo_sms     = +(r.uso_sms_unit    * PRECIO_SMS).toFixed(4);
  const costos_red    = +(costo_data + costo_voz_sal + costo_voz_ent + costo_sms).toFixed(4);

  const precio_sin_igv = +(r.precio_igv / IGV).toFixed(4);
  const costo_mtc      = +(precio_sin_igv * PCT_MTC).toFixed(4);
  const costos_totales = +(costos_red + COSTO_CRM + costo_mtc).toFixed(4);

  const margen_red       = +(precio_sin_igv - costos_red).toFixed(4);
  const margen_red_pct   = precio_sin_igv > 0 ? margen_red / precio_sin_igv : 0;
  const margen_bruto     = +(precio_sin_igv - costos_totales).toFixed(4);
  const margen_bruto_pct = precio_sin_igv > 0 ? margen_bruto / precio_sin_igv : 0;

  return {
    uso_data_pct, uso_social_pct, uso_total_pct, uso_voz_ent_min,
    costo_data, costo_voz_sal, costo_voz_ent, costo_sms,
    costo_crm: COSTO_CRM, costo_mtc,
    costos_red, costos_totales, precio_sin_igv,
    margen_red, margen_red_pct, margen_bruto, margen_bruto_pct,
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const S = (v: number) => `S/.${v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const P = (v: number) => `${(v * 100).toFixed(2)}%`;
const N = (v: number, d = 2) => v.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function ColHeaderLeft({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '8px 10px', textAlign: 'left', fontFamily: 'DM Mono, monospace',
      fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px',
      color: 'var(--text-muted)', whiteSpace: 'nowrap',
      borderBottom: '2px solid var(--border)', background: 'var(--bg-base)',
    }}>{children}</th>
  );
}

function ColHeader({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <th style={{
      padding: '8px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace',
      fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px',
      color: 'var(--text-muted)', whiteSpace: 'nowrap',
      borderBottom: '2px solid var(--border)', background: 'var(--bg-base)',
    }}>
      {children}
      {sub && <div style={{ fontSize: '9px', opacity: 0.7 }}>{sub}</div>}
    </th>
  );
}

function GroupHeader({ label, color, span = 1 }: { label: string; color: string; span?: number }) {
  return (
    <th colSpan={span} style={{
      padding: '4px 10px', textAlign: 'center', fontSize: '9px', fontWeight: '700',
      letterSpacing: '1px', color: '#fff', background: color, whiteSpace: 'nowrap',
      borderRight: '1px solid rgba(255,255,255,0.1)',
    }}>{label}</th>
  );
}

function Cell({ value, color, bold }: { value: string; color?: string; bold?: boolean }) {
  return (
    <td style={{
      padding: '7px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace',
      fontSize: '12px', fontWeight: bold ? '600' : '400',
      color: color ?? 'var(--text-primary)',
      borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
    }}>{value}</td>
  );
}

function EditableCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <td style={{ padding: '4px 6px', borderBottom: '1px solid var(--border)' }}>
      <input
        type="number" min={0} value={value}
        onChange={e => onChange(Math.max(0, Number(e.target.value)))}
        style={{
          width: '88px', textAlign: 'right',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: '4px', color: '#93c5fd',
          fontFamily: 'DM Mono, monospace', fontSize: '12px',
          padding: '3px 6px', outline: 'none',
        }}
      />
    </td>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function AnalisisPlanesPage() {
  const [rows, setRows]       = useState<PlanRow[]>(() => buildRows({}));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/planes')
      .then(r => r.json())
      .then((d: Record<string, number>) => {
        setRows(buildRows(d));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const update = useCallback((idx: number, field: keyof PlanRow, val: number) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }, []);

  const resetDefaults = () => {
    setRows(prev => prev.map(r => {
      const mb = r.gb * 1024;
      return { ...r, uso_data_mb: +(mb * 0.40).toFixed(2), uso_social_mb: +(mb * 0.20).toFixed(2), uso_voz_sal_min: 0, uso_sms_unit: 0 };
    }));
  };

  const totalUsuarios = rows.reduce((a, r) => a + r.num_usuarios, 0);
  const calcs = rows.map(r => ({ ...calcRow(r), u: r.num_usuarios }));
  const wavg = (fn: (c: ReturnType<typeof calcRow> & { u: number }) => number) =>
    totalUsuarios > 0 ? calcs.reduce((a, c) => a + fn(c) * c.u, 0) / totalUsuarios : 0;

  return (
    <div>
      {/* Título */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: 'linear-gradient(180deg, #f59e0b, #ef4444)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-0.5px' }}>Análisis de Planes</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '16px', fontFamily: 'DM Mono, monospace' }}>
            RENTABILIDAD POR PLAN · PERUSIM CONSOLIDADO
          </p>
        </div>
        <button onClick={resetDefaults} style={{
          padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
          fontFamily: 'DM Mono, monospace', fontWeight: '500',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
        }}>
          Reset defaults
        </button>
      </div>

      {/* Leyenda de precios */}
      <div style={{
        display: 'flex', gap: '24px', marginBottom: '20px', padding: '12px 16px',
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', flexWrap: 'wrap',
      }}>
        {/* {[
          ['Data',     `S/.${PRECIO_DATA_MB} × MB × ${FACTOR_DATA}`],
          ['Voz Sal.', `S/.${PRECIO_VOZ_SAL}/min`],
          ['Voz Ent.', `S/.${PRECIO_VOZ_ENT}/min`],
          ['SMS',      `S/.${PRECIO_SMS}/unit`],
          ['CRM',      `S/.${COSTO_CRM} fijo`],
          ['MTC',      `${(PCT_MTC * 100).toFixed(4)}%`],
          ['IGV',      '18%'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>{k}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>{v}</span>
          </div>
        ))} */}
        {loading && (
          <span style={{ fontSize: '11px', color: '#f59e0b', fontFamily: 'DM Mono, monospace', marginLeft: 'auto' }}>
            ● cargando usuarios...
          </span>
        )}
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
          <thead>
            <tr>
              <th colSpan={3} style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }} />
              <GroupHeader label="CAPACIDAD"    color="#1d4ed8" />
              <GroupHeader label="USO DATA"     color="#0369a1" span={2} />
              <GroupHeader label="USO SOCIAL"   color="#0e7490" span={2} />
              <GroupHeader label="USO TOTAL"    color="#0f766e" />
              <GroupHeader label="VOZ SALIENTE" color="#7c3aed" />
              <GroupHeader label="VOZ ENTRANTE" color="#6d28d9" />
              <GroupHeader label="SMS"          color="#9333ea" />
              <GroupHeader label="COSTOS"       color="#b45309" span={6} />
              <GroupHeader label="C. RED"       color="#92400e" />
              <GroupHeader label="C. TOTALES"   color="#7f1d1d" />
              <GroupHeader label="MÁRGENES"     color="#065f46" span={5} />
            </tr>
            <tr>
              <ColHeaderLeft>Código</ColHeaderLeft>
              <ColHeaderLeft>Nombre del Plan</ColHeaderLeft>
              <ColHeader>Usuarios</ColHeader>
              <ColHeader sub="MB">Datos Plan</ColHeader>
              <ColHeader sub="MB">Uso Data</ColHeader>
              <ColHeader>%</ColHeader>
              <ColHeader sub="MB">Uso Social</ColHeader>
              <ColHeader>%</ColHeader>
              <ColHeader>Total %</ColHeader>
              <ColHeader sub="min">Voz Sal.</ColHeader>
              <ColHeader sub="min">Voz Ent.</ColHeader>
              <ColHeader sub="unit">SMS</ColHeader>
              <ColHeader>Data</ColHeader>
              <ColHeader>Voz Sal.</ColHeader>
              <ColHeader>Voz Ent.</ColHeader>
              <ColHeader>SMS</ColHeader>
              <ColHeader>CRM</ColHeader>
              <ColHeader>MTC</ColHeader>
              <ColHeader>Red</ColHeader>
              <ColHeader>Totales</ColHeader>
              <ColHeader>P. s/IGV</ColHeader>
              <ColHeader>Mg. Red</ColHeader>
              <ColHeader>%</ColHeader>
              <ColHeader>Mg. Bruto</ColHeader>
              <ColHeader>%</ColHeader>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => {
              const c = calcRow(r);
              const mgColor = c.margen_bruto_pct >= 0.80 ? 'var(--accent-green)'
                            : c.margen_bruto_pct >= 0.60 ? '#fbbf24'
                            : '#f87171';
              return (
                <tr key={r.codigo} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '7px 10px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    {r.codigo}
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', minWidth: '190px' }}>
                    {r.nombre}
                  </td>
                  <Cell value={loading ? '—' : N(r.num_usuarios, 0)} color="#93c5fd" bold />

                  <Cell value={N(r.datos_plan_mb, 0)} />

                  <EditableCell value={r.uso_data_mb}     onChange={v => update(i, 'uso_data_mb', v)} />
                  <Cell value={P(c.uso_data_pct)}   color="#7dd3fc" />

                  <EditableCell value={r.uso_social_mb}   onChange={v => update(i, 'uso_social_mb', v)} />
                  <Cell value={P(c.uso_social_pct)}  color="#67e8f9" />

                  <Cell value={P(c.uso_total_pct)} color="#a5f3fc" bold />

                  <EditableCell value={r.uso_voz_sal_min} onChange={v => update(i, 'uso_voz_sal_min', v)} />
                  <Cell value={N(c.uso_voz_ent_min)} color="#c4b5fd" />

                  <EditableCell value={r.uso_sms_unit}    onChange={v => update(i, 'uso_sms_unit', v)} />

                  <Cell value={S(c.costo_data)}     color="#fde68a" />
                  <Cell value={S(c.costo_voz_sal)}  color="#fde68a" />
                  <Cell value={S(c.costo_voz_ent)}  color="#fde68a" />
                  <Cell value={S(c.costo_sms)}      color="#fde68a" />
                  <Cell value={S(c.costo_crm)}      color="#fde68a" />
                  <Cell value={S(c.costo_mtc)}      color="#fde68a" />
                  <Cell value={S(c.costos_red)}     color="#fb923c" bold />
                  <Cell value={S(c.costos_totales)} color="#f87171" bold />

                  <Cell value={S(c.precio_sin_igv)}   color="#86efac" bold />
                  <Cell value={S(c.margen_red)}       color="#4ade80" bold />
                  <Cell value={P(c.margen_red_pct)}   color="#4ade80" bold />
                  <Cell value={S(c.margen_bruto)}     color={mgColor}  bold />
                  <Cell value={P(c.margen_bruto_pct)} color={mgColor}  bold />
                </tr>
              );
            })}
          </tbody>

          {/* Totales ponderados */}
          <tfoot>
            <tr style={{ background: 'rgba(59,130,246,0.06)' }}>
              <td colSpan={2} style={{ padding: '9px 10px', fontSize: '12px', fontWeight: '600', fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)', borderTop: '2px solid var(--border)' }}>
                PROMEDIO PONDERADO
              </td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color: '#93c5fd', borderTop: '2px solid var(--border)' }}>
                {N(totalUsuarios, 0)}
              </td>
              {Array.from({ length: 9 }).map((_, k) => (
                <td key={k} style={{ borderTop: '2px solid var(--border)' }} />
              ))}
              {([
                [wavg(c => c.costo_data),     '#fde68a'],
                [wavg(c => c.costo_voz_sal),  '#fde68a'],
                [wavg(c => c.costo_voz_ent),  '#fde68a'],
                [wavg(c => c.costo_sms),      '#fde68a'],
                [wavg(c => c.costo_crm),      '#fde68a'],
                [wavg(c => c.costo_mtc),      '#fde68a'],
                [wavg(c => c.costos_red),     '#fb923c'],
                [wavg(c => c.costos_totales), '#f87171'],
                [wavg(c => c.precio_sin_igv), '#86efac'],
                [wavg(c => c.margen_red),     '#4ade80'],
              ] as [number, string][]).map(([val, color], k) => (
                <td key={k} style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color, borderTop: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                  {S(val)}
                </td>
              ))}
              <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color: '#4ade80', borderTop: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                {P(wavg(c => c.margen_red_pct))}
              </td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color: '#4ade80', borderTop: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                {S(wavg(c => c.margen_bruto))}
              </td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color: '#4ade80', borderTop: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                {P(wavg(c => c.margen_bruto_pct))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
        * PIE de pagina
      </p>
    </div>
  );
}
