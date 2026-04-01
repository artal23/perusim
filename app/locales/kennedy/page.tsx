'use client';
import { useEffect, useState, useMemo } from 'react';
// import ExportPDF                         from '@/components/ExportPDF';
import ExportExcelLocal, { LocalData }   from '@/components/ExportExcelLocal';

// ── Orden cronológico ─────────────────────────────────────────────────────────
const MES_ORDER: Record<string, number> = {
  Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12,
};
function parseMes(mes: string): number {
  const [mon, yy] = mes.split('-');
  return parseInt(yy) * 100 + (MES_ORDER[mon] ?? 0);
}
function sortMeses(a: string, b: string) { return parseMes(a) - parseMes(b); }

const S = (v: number) => `S/.${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
const P = (v: number) => `${Number(v).toFixed(2)}%`;

const REPORT_ID = 'reporte-kennedy';

// ── Sub-componentes ───────────────────────────────────────────────────────────
function SecHeader({ title }: { title: string }) {
  return (
    <div style={{ padding: '7px 16px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{title}</span>
    </div>
  );
}

function Section({ title, summary, children }: { title: string; summary?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '7px 16px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{title}</span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.5, fontFamily: 'DM Mono, monospace' }}>{open ? '▲' : '▼'}</span>
        </div>
        {!open && summary && (
          <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: 'var(--text-secondary)', fontWeight: '500' }}>{summary}</span>
        )}
      </div>
      {open && children}
    </>
  );
}

function Row({ label, value, bold, indent, color }: { label: string; value: string; bold?: boolean; indent?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '13px', color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: bold ? '600' : '400', paddingLeft: indent ? '12px' : 0 }}>{label}</span>
      <span style={{ fontSize: '13px', fontFamily: 'DM Mono, monospace', fontWeight: bold ? '600' : '500', color: color ?? 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function KennedyPage() {
  const [data, setData]           = useState<LocalData[]>([]);
  const [loading, setLoading]     = useState(true);
  const [mesFiltro, setMesFiltro] = useState<string>('');

  useEffect(() => {
    fetch('/api/locales/kennedy')
      .then(r => r.json())
      .then((d: LocalData[]) => {
        const sorted = [...d].sort((a, b) => sortMeses(a.mes, b.mes));
        setData(sorted);
        if (sorted.length > 0) setMesFiltro(sorted[sorted.length - 1].mes);
        setLoading(false);
      });
  }, []);

  const mesesDisponibles = useMemo(() => data.map(d => d.mes), [data]);

  const mesesVisibles = useMemo(() => {
    if (!mesFiltro || mesesDisponibles.length === 0) return [];
    const idx   = mesesDisponibles.indexOf(mesFiltro);
    if (idx === -1) return [];
    const start = Math.max(0, idx - 2);
    return mesesDisponibles.slice(start, idx + 1);
  }, [mesFiltro, mesesDisponibles]);

  const dataVisible = useMemo(
    () => data.filter(d => mesesVisibles.includes(d.mes)),
    [data, mesesVisibles]
  );

  if (loading) return (
    <div style={{ color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>Cargando...</div>
  );

  return (
    <div>
      {/* Título */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: 'linear-gradient(180deg, #3b82f6, #10b981)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-0.5px' }}>Kennedy</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '16px', fontFamily: 'DM Mono, monospace' }}>
            MODELO RENTABILIDAD · PERUSIM MIRAFLORES
          </p>
        </div>
        {/* Botones exportar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
          <ExportExcelLocal
            data={data}
            localName="Kennedy"
            filename="kennedy-rentabilidad-perusim"
          />
          {/* <ExportPDF targetId={REPORT_ID} filename="kennedy-perusim" /> */}
        </div>
      </div>

      {/* Filtro */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '1px' }}>MES HASTA</span>
        <select
          value={mesFiltro}
          onChange={e => setMesFiltro(e.target.value)}
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '6px', color: '#93c5fd', fontFamily: 'DM Mono, monospace', fontSize: '13px', padding: '5px 10px', cursor: 'pointer', outline: 'none' }}
        >
          {mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
          mostrando: {mesesVisibles.join(' · ')}
        </span>
      </div>

      {/* Cards */}
      <div id={REPORT_ID}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {dataVisible.map((d, i) => (
            <div key={d.mes} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease forwards', animationDelay: `${i * 60}ms`, opacity: 0 }}>
              {/* Header */}
              <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.08))', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: '500', fontSize: '14px', color: '#93c5fd' }}>{d.mes}</span>
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '4px', fontFamily: 'DM Mono, monospace', fontWeight: '600', background: d.margen_bruto_pct > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: d.margen_bruto_pct > 0 ? 'var(--accent-green)' : '#f87171' }}>
                  {P(d.margen_bruto_pct)} margen
                </span>
              </div>

              {/* Clientes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
                <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>NUEVOS</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', fontFamily: 'DM Mono, monospace' }}>{d.nuevos_clientes}</div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>ACTIVOS</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', fontFamily: 'DM Mono, monospace', color: '#93c5fd' }}>{d.clientes_activos}</div>
                </div>
              </div>

              <SecHeader title="INGRESOS" />
              <Row label="Ventas Stand Planes"  value={S(d.ingresos_planes)}     indent />
              <Row label="Activation Fee"       value={S(d.ingresos_activation)} indent />
              <Row label="Recargas"             value={S(d.ingresos_recargas)}   indent />
              <Row label="Total Con IGV"        value={S(d.total_con_igv)}       bold color="#93c5fd" />
              <Row label="Total Sin IGV"        value={S(d.total_sin_igv)}       bold color="#93c5fd" />

              <Section title="COSTOS DE RED" summary={S(d.costo_red)}>
                <Row label="Costo Data"          value={S(d.costo_data)}    indent />
                <Row label="Costo Voz Saliente"  value={S(d.costo_voz_sal)} indent />
                <Row label="Costo Voz Entrante"  value={S(d.costo_voz_ent)} indent />
                <Row label="Costo SMS"           value={S(d.costo_sms)}     indent />
                <Row label="Total Costos de Red" value={S(d.costo_red)}     bold />
              </Section>

              <Section title="COSTOS VARIABLES" summary={S(d.gastos_variables)}>
                <Row label="Costo CRM / Plataforma" value={S(d.costo_crm)}        indent />
                <Row label="Costo MTC"              value={S(d.costo_mtc)}        indent />
                <Row label="Costo SIM Cards"        value={S(d.costo_sim)}        indent />
                <Row label="Vías de Pago"           value={S(d.costo_vias)}       indent />
                <Row label="Biometría Vendedor"     value={S(d.costo_bio)}        indent />
                <Row label="Total Costos Variables" value={S(d.gastos_variables)} bold />
              </Section>

              <Section title="OTROS COSTOS" summary={S(d.gastos_otros)}>
                <Row label="Renta Espacio"        value={S(d.renta_espacio)}      indent />
                <Row label="Marketing"            value={S(d.marketing)}          indent />
                <Row label="Software y Licencias" value={S(d.software_licencias)} indent />
                <Row label="Soporte"              value={S(d.soporte)}            indent />
                <Row label="Incentivo Fijo"       value={S(d.incentivo_fijo)}     indent />
                <Row label="Incentivo Variable"   value={S(d.incentivo_variable)} indent />
                <Row label="Total Otros Costos"   value={S(d.gastos_otros)}       bold />
              </Section>

              <div style={{ padding: '7px 16px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>RESULTADO</span>
              </div>
              <Row label="Costos Totales Negocio Móvil" value={S(d.gastos_totales)}   bold color="#f87171" />
              <Row label="Margen de Red Móvil"          value={S(d.margen_red)}       bold />
              <Row label="Margen de Red Móvil (%)"      value={P(d.margen_red_pct)}   bold color="var(--accent-green)" />
              <Row label="Margen Bruto Móvil"           value={S(d.margen_bruto)}     bold />
              <Row label="Margen Bruto Móvil (%)"       value={P(d.margen_bruto_pct)} bold color="var(--accent-green)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}