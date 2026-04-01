'use client';
import { useState, useEffect } from 'react';
import ExportExcel from '@/components/ExportExcel';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Plan {
  codigo:           string;
  nombre:           string;
  bundle_key:       string;
  gb:               number;
  precio_comercial: number;
  num_usuarios:     number;
}

interface PlanRow extends Plan {
  datos_plan_mb:   number;
  uso_data_mb:     number;
  uso_voz_sal_min: number;
  uso_sms_unit:    number;
}

interface PlanAPI {
  usuarios:        number;
  avg_data_mb:     number;
  avg_voz_sal_min: number;
  avg_voz_ent_min: number;
  avg_sms:         number;
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

// ─── Meses disponibles ────────────────────────────────────────────────────────
const MESES_DISPONIBLES = [
  { value: '2023-01', label: 'Enero 2023' },
  { value: '2023-02', label: 'Febrero 2023' },
  { value: '2023-03', label: 'Marzo 2023' },
  { value: '2023-04', label: 'Abril 2023' },
  { value: '2023-05', label: 'Mayo 2023' },
  { value: '2023-06', label: 'Junio 2023' },
  { value: '2023-07', label: 'Julio 2023' },
  { value: '2023-08', label: 'Agosto 2023' },
  { value: '2023-09', label: 'Septiembre 2023' },
  { value: '2023-10', label: 'Octubre 2023' },
  { value: '2023-11', label: 'Noviembre 2023' },
  { value: '2023-12', label: 'Diciembre 2023' },
];

// ─── Planes base ──────────────────────────────────────────────────────────────
const PLANES_BASE: Plan[] = [
  { codigo: 'P_S1', nombre: 'PeruSIM 15 GB',       bundle_key: '15 GB',               gb: 15, precio_comercial: 110.00, num_usuarios: 0 },
  { codigo: 'P_S2', nombre: '30 GB',               bundle_key: '30 GB',               gb: 30, precio_comercial: 150.00, num_usuarios: 0 },
  { codigo: 'P_S3', nombre: 'PeruSIM 5 GB',        bundle_key: 'PeruSIM 5 GB',        gb: 5,  precio_comercial:  80.00, num_usuarios: 0 },
  { codigo: 'P_E1', nombre: 'PeruSim 5 GB Extra',  bundle_key: 'PeruSim 5 GB Extra',  gb: 5,  precio_comercial:  40.00, num_usuarios: 0 },
  { codigo: 'P_E2', nombre: 'PeruSim 10 GB Extra', bundle_key: 'PeruSim 10 GB Extra', gb: 10, precio_comercial:  60.00, num_usuarios: 0 },
  { codigo: 'P_E3', nombre: 'PeruSim 1 GB Extra',  bundle_key: 'PeruSim 1 GB Extra',  gb: 1,  precio_comercial:  20.00, num_usuarios: 0 },
];

const REPORT_ID = 'reporte-analisis-planes';

// ─── Columnas Excel ───────────────────────────────────────────────────────────
const EXCEL_COLUMNS = [
  { header: 'Código',           key: 'codigo',           format: 'text'     as const },
  { header: 'Plan',             key: 'nombre',           format: 'text'     as const },
  { header: 'Usuarios',         key: 'num_usuarios',     format: 'number'   as const },
  { header: 'Datos Plan MB',    key: 'datos_plan_mb',    format: 'number'   as const },
  { header: 'Uso Data MB/usr',  key: 'uso_data_mb',      format: 'number'   as const },
  { header: '% Uso Data',       key: 'uso_data_pct',     format: 'percent'  as const },
  { header: 'Voz Sal min/usr',  key: 'uso_voz_sal_min',  format: 'number'   as const },
  { header: 'Voz Ent min/usr',  key: 'uso_voz_ent_min',  format: 'number'   as const },
  { header: 'SMS unit/usr',     key: 'uso_sms_unit',     format: 'number'   as const },
  { header: 'Costo Data',       key: 'costo_data',       format: 'currency' as const },
  { header: 'Costo Voz Sal',    key: 'costo_voz_sal',    format: 'currency' as const },
  { header: 'Costo Voz Ent',    key: 'costo_voz_ent',    format: 'currency' as const },
  { header: 'Costo SMS',        key: 'costo_sms',        format: 'currency' as const },
  { header: 'Costo CRM',        key: 'costo_crm',        format: 'currency' as const },
  { header: 'Costo MTC',        key: 'costo_mtc',        format: 'currency' as const },
  { header: 'Costos Red',       key: 'costos_red',       format: 'currency' as const },
  { header: 'Costos Totales',   key: 'costos_totales',   format: 'currency' as const },
  { header: 'P. Comercial IGV', key: 'precio_comercial', format: 'currency' as const },
  { header: 'P. sin IGV',       key: 'precio_sin_igv',   format: 'currency' as const },
  { header: 'Margen Red',       key: 'margen_red',       format: 'currency' as const },
  { header: 'Margen Red %',     key: 'margen_red_pct',   format: 'percent'  as const },
  { header: 'Margen Bruto',     key: 'margen_bruto',     format: 'currency' as const },
  { header: 'Margen Bruto %',   key: 'margen_bruto_pct', format: 'percent'  as const },
];

// ─── Construcción de filas ────────────────────────────────────────────────────
function buildRows(api: Record<string, PlanAPI>): PlanRow[] {
  return PLANES_BASE.map(p => {
    const mb = p.gb * 1024;
    const d  = api[p.bundle_key];
    const u  = d?.usuarios ?? 0;
    return {
      ...p,
      num_usuarios:    u,
      datos_plan_mb:   mb,
      uso_data_mb:     d ? +d.avg_data_mb.toFixed(2)     : 0,
      uso_voz_sal_min: d ? +d.avg_voz_sal_min.toFixed(2) : 0,
      uso_sms_unit:    d ? +d.avg_sms.toFixed(2)         : 0,
    };
  });
}

// ─── Cálculo POR USUARIO ──────────────────────────────────────────────────────
function calcRow(r: PlanRow) {
  const uso_data_pct    = r.datos_plan_mb > 0 ? r.uso_data_mb / r.datos_plan_mb : 0;
  const uso_voz_ent_min = +(r.uso_voz_sal_min * 0.85).toFixed(2);
  const u = r.num_usuarios;

  const display_uso_data = r.uso_data_mb     * u;
  const display_voz_sal  = r.uso_voz_sal_min * u;
  const display_voz_ent  = uso_voz_ent_min   * u;
  const display_sms      = r.uso_sms_unit    * u;

  const precio_sin_igv = +(r.precio_comercial / IGV).toFixed(4);

  const costo_data    = +(r.uso_data_mb     * PRECIO_DATA_MB * FACTOR_DATA).toFixed(2);
  const costo_voz_sal = +(r.uso_voz_sal_min * PRECIO_VOZ_SAL).toFixed(2);
  const costo_voz_ent = +(uso_voz_ent_min   * PRECIO_VOZ_ENT).toFixed(2);
  const costo_sms     = +(r.uso_sms_unit    * PRECIO_SMS).toFixed(2);
  const costos_red    = +(costo_data + costo_voz_sal + costo_voz_ent + costo_sms).toFixed(2);

  const costo_crm      = COSTO_CRM;
  const costo_mtc      = +(r.precio_comercial * PCT_MTC).toFixed(2);
  const costos_totales = +(costos_red + costo_crm + costo_mtc).toFixed(2);

  const margen_red       = +(precio_sin_igv - costos_red).toFixed(2);
  const margen_red_pct   = precio_sin_igv > 0 ? margen_red   / precio_sin_igv : 0;
  const margen_bruto     = +(precio_sin_igv - costos_totales).toFixed(2);
  const margen_bruto_pct = precio_sin_igv > 0 ? margen_bruto / precio_sin_igv : 0;

  return {
    uso_data_pct, uso_voz_ent_min,
    display_datos_plan: r.datos_plan_mb,
    display_uso_data, display_voz_sal, display_voz_ent, display_sms,
    costo_data, costo_voz_sal, costo_voz_ent, costo_sms,
    costo_crm, costo_mtc, costos_red, costos_totales,
    precio_comercial: r.precio_comercial,
    precio_sin_igv,
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
      fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px', color: 'var(--text-muted)',
      whiteSpace: 'nowrap', borderBottom: '2px solid var(--border)', background: 'var(--bg-base)',
    }}>{children}</th>
  );
}

function ColHeader({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <th style={{
      padding: '8px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace',
      fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px', color: 'var(--text-muted)',
      whiteSpace: 'nowrap', borderBottom: '2px solid var(--border)', background: 'var(--bg-base)',
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

// ─── Página ───────────────────────────────────────────────────────────────────
export default function AnalisisPlanesPage() {
  const [rows, setRows]       = useState<PlanRow[]>(() => buildRows({}));
  const [loading, setLoading] = useState(true);
  const [mes, setMes]         = useState('2023-12');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const r   = await fetch(`/api/planes?mes=${mes}`);
        const api = await r.json() as Record<string, PlanAPI>;
        if (cancelled) return;
        setRows(buildRows(api));
      } catch { /* silencioso */ }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [mes]);

  const fecha         = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  const mesLabel      = MESES_DISPONIBLES.find(m => m.value === mes)?.label ?? mes;
  const totalUsuarios = rows.reduce((a, r) => a + r.num_usuarios, 0);
  const calcs         = rows.map(r => ({ ...calcRow(r), u: r.num_usuarios }));

  const wsum = (fn: (c: ReturnType<typeof calcRow> & { u: number }) => number) =>
    calcs.reduce((a, c) => a + fn(c) * c.u, 0);
  const wavg = (fn: (c: ReturnType<typeof calcRow> & { u: number }) => number) =>
    totalUsuarios > 0 ? calcs.reduce((a, c) => a + fn(c) * c.u, 0) / totalUsuarios : 0;

  // Datos para Excel: combinar PlanRow + calcRow por fila
  const excelData = rows.map(r => {
    const c = calcRow(r);
    return {
      codigo:           r.codigo,
      nombre:           r.nombre,
      num_usuarios:     r.num_usuarios,
      datos_plan_mb:    r.datos_plan_mb,
      uso_data_mb:      r.uso_data_mb,
      uso_data_pct:     +(c.uso_data_pct * 100).toFixed(2),
      uso_voz_sal_min:  r.uso_voz_sal_min,
      uso_voz_ent_min:  c.uso_voz_ent_min,
      uso_sms_unit:     r.uso_sms_unit,
      costo_data:       c.costo_data,
      costo_voz_sal:    c.costo_voz_sal,
      costo_voz_ent:    c.costo_voz_ent,
      costo_sms:        c.costo_sms,
      costo_crm:        c.costo_crm,
      costo_mtc:        c.costo_mtc,
      costos_red:       c.costos_red,
      costos_totales:   c.costos_totales,
      precio_comercial: c.precio_comercial,
      precio_sin_igv:   c.precio_sin_igv,
      margen_red:       c.margen_red,
      margen_red_pct:   +(c.margen_red_pct * 100).toFixed(2),
      margen_bruto:     c.margen_bruto,
      margen_bruto_pct: +(c.margen_bruto_pct * 100).toFixed(2),
    };
  }) as Record<string, unknown>[];

  return (
    <div>
      {/* ── Cabecera ── */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: 'linear-gradient(180deg, #f59e0b, #ef4444)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-0.5px' }}>Análisis de Planes</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '16px', fontFamily: 'DM Mono, monospace' }}>
            RENTABILIDAD POR PLAN · PERUSIM 2023 · {mesLabel.toUpperCase()}
          </p>
        </div>

        {/* Controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>MES</span>
          <select
            value={mes}
            onChange={e => setMes(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'DM Mono, monospace', fontWeight: '500',
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
              color: '#93c5fd', outline: 'none',
            }}
          >
            {MESES_DISPONIBLES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <ExportExcel
            data={excelData}
            columns={EXCEL_COLUMNS}
            filename={`analisis-planes-${mes}`}
            sheetName={`Planes ${mesLabel}`}
          />
          {/* <ExportPDF targetId={REPORT_ID} filename={`analisis-planes-${mes}`} /> */}
        </div>
      </div>

      <div id={REPORT_ID}>

        {/* ── Leyenda ── */}
        <div style={{
          display: 'flex', gap: '24px', marginBottom: '20px', padding: '12px 16px',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', flexWrap: 'wrap',
        }}>
          {[
            ['Data',     `S/.${PRECIO_DATA_MB} × MB × ${FACTOR_DATA}`],
            ['Voz Sal.', `S/.${PRECIO_VOZ_SAL}/min`],
            ['Voz Ent.', `S/.${PRECIO_VOZ_ENT}/min`],
            ['SMS',      `S/.${PRECIO_SMS}/unit`],
            ['CRM',      `S/.${COSTO_CRM}/usr`],
            ['MTC',      `${(PCT_MTC * 100).toFixed(4)}% × P.comercial`],
            ['IGV',      '18%'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>{k}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>{v}</span>
            </div>
          ))}
          <span style={{
            fontSize: '11px', fontFamily: 'DM Mono, monospace', marginLeft: 'auto',
            color: loading ? '#f59e0b' : 'var(--accent-green)',
          }}>
            {loading ? '● cargando...' : `● ${totalUsuarios.toLocaleString('es-PE')} usuarios activos`}
          </span>
        </div>

        {/* ── Tabla ── */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
            <thead>
              <tr>
                <th colSpan={3} style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }} />
                <GroupHeader label="CAPACIDAD"    color="#1d4ed8" />
                <GroupHeader label="USO DATA"     color="#0369a1" span={2} />
                <GroupHeader label="VOZ SALIENTE" color="#7c3aed" />
                <GroupHeader label="VOZ ENTRANTE" color="#6d28d9" />
                <GroupHeader label="SMS"          color="#9333ea" />
                <GroupHeader label="COSTOS"       color="#b45309" span={6} />
                <GroupHeader label="C. RED"       color="#92400e" />
                <GroupHeader label="C. TOTALES"   color="#7f1d1d" />
                <GroupHeader label="PRECIOS"      color="#1e5631" span={2} />
                <GroupHeader label="MÁRGENES"     color="#065f46" span={4} />
              </tr>
              <tr>
                <ColHeaderLeft>Código</ColHeaderLeft>
                <ColHeaderLeft>Nombre del Plan</ColHeaderLeft>
                <ColHeader>Usuarios</ColHeader>
                <ColHeader sub="MB">Datos Plan</ColHeader>
                <ColHeader sub="MB/usr">Uso Data</ColHeader>
                <ColHeader>%</ColHeader>
                <ColHeader sub="min/usr">Voz Sal.</ColHeader>
                <ColHeader sub="min/usr">Voz Ent.</ColHeader>
                <ColHeader sub="unit/usr">SMS</ColHeader>
                <ColHeader>Data</ColHeader>
                <ColHeader>Voz Sal.</ColHeader>
                <ColHeader>Voz Ent.</ColHeader>
                <ColHeader>SMS</ColHeader>
                <ColHeader>CRM</ColHeader>
                <ColHeader>MTC</ColHeader>
                <ColHeader>Red</ColHeader>
                <ColHeader>Totales</ColHeader>
                <ColHeader sub="c/IGV">P. Comercial</ColHeader>
                <ColHeader sub="s/IGV">P. sin IGV</ColHeader>
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
                              : c.margen_bruto_pct >= 0.60 ? '#fbbf24' : '#f87171';
                return (
                  <tr key={r.codigo} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                      {r.codigo}
                    </td>
                    <td style={{ padding: '7px 10px', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', minWidth: '180px' }}>
                      {r.nombre}
                    </td>
                    <Cell value={loading ? '—' : N(r.num_usuarios, 0)} color="#93c5fd" bold />
                    <Cell value={N(c.display_datos_plan, 0)} />
                    <Cell value={N(r.uso_data_mb)}       color="#7dd3fc" />
                    <Cell value={P(c.uso_data_pct)}      color="#7dd3fc" />
                    <Cell value={N(r.uso_voz_sal_min)}   color="#c4b5fd" />
                    <Cell value={N(c.uso_voz_ent_min)}   color="#c4b5fd" />
                    <Cell value={N(r.uso_sms_unit)}      color="#e9d5ff" />
                    <Cell value={S(c.costo_data)}        color="#fde68a" />
                    <Cell value={S(c.costo_voz_sal)}     color="#fde68a" />
                    <Cell value={S(c.costo_voz_ent)}     color="#fde68a" />
                    <Cell value={S(c.costo_sms)}         color="#fde68a" />
                    <Cell value={S(c.costo_crm)}         color="#fde68a" />
                    <Cell value={S(c.costo_mtc)}         color="#fde68a" />
                    <Cell value={S(c.costos_red)}        color="#fb923c" bold />
                    <Cell value={S(c.costos_totales)}    color="#f87171" bold />
                    <Cell value={S(c.precio_comercial)}  color="#86efac" bold />
                    <Cell value={S(c.precio_sin_igv)}    color="#6ee7b7" bold />
                    <Cell value={S(c.margen_red)}        color="#4ade80" bold />
                    <Cell value={P(c.margen_red_pct)}    color="#4ade80" bold />
                    <Cell value={S(c.margen_bruto)}      color={mgColor}  bold />
                    <Cell value={P(c.margen_bruto_pct)}  color={mgColor}  bold />
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr style={{ background: 'rgba(59,130,246,0.06)' }}>
                <td colSpan={2} style={{ padding: '9px 10px', fontSize: '12px', fontWeight: '600', fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)', borderTop: '2px solid var(--border)' }}>
                  TOTAL / PROMEDIO PONDERADO
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color: '#93c5fd', borderTop: '2px solid var(--border)' }}>
                  {N(totalUsuarios, 0)}
                </td>
                {/* vacíos: datos_plan, uso_data, %, voz_sal, voz_ent, sms */}
                {Array.from({ length: 6 }).map((_, k) => (
                  <td key={k} style={{ borderTop: '2px solid var(--border)' }} />
                ))}
                {([
                  [wsum(c => c.costo_data),        '#fde68a'],
                  [wsum(c => c.costo_voz_sal),     '#fde68a'],
                  [wsum(c => c.costo_voz_ent),     '#fde68a'],
                  [wsum(c => c.costo_sms),         '#fde68a'],
                  [wsum(c => c.costo_crm),         '#fde68a'],
                  [wsum(c => c.costo_mtc),         '#fde68a'],
                  [wsum(c => c.costos_red),        '#fb923c'],
                  [wsum(c => c.costos_totales),    '#f87171'],
                  [wsum(c => c.precio_comercial),  '#86efac'],
                  [wsum(c => c.precio_sin_igv),    '#6ee7b7'],
                  [wsum(c => c.margen_red),        '#4ade80'],
                ] as [number, string][]).map(([val, color], k) => (
                  <td key={k} style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color, borderTop: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                    {S(val)}
                  </td>
                ))}
                <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color: '#4ade80', borderTop: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                  {P(wavg(c => c.margen_red_pct))}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color: '#4ade80', borderTop: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                  {S(wsum(c => c.margen_bruto))}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: '600', color: '#4ade80', borderTop: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                  {P(wavg(c => c.margen_bruto_pct))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
        * Todos los costos y márgenes son por usuario · Usuarios activos = transacciones Not found / Extra en el mes · Consumo social no disponible · No incluye portabilidad, verificación ni SIM
      </p>
    </div>
  );
}