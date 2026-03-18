'use client';
import { useState, useEffect } from 'react';

const LOCALES = ['Kennedy', 'LAP', 'Larco', 'Cusco'];
const MESES = ['Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26',
               'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'];

const CAMPOS = [
  { key: 'renta_espacio',      label: 'Renta Espacio' },
  { key: 'marketing',          label: 'Marketing' },
  { key: 'software_licencias', label: 'Software y Licencias' },
  { key: 'soporte',            label: 'Soporte' },
  { key: 'incentivo_fijo',     label: 'Incentivo Fijo' },
  { key: 'incentivo_variable', label: 'Incentivo Variable' },
];

const emptyForm = () => Object.fromEntries(CAMPOS.map(c => [c.key, '']));

export default function ConfiguracionPage() {
  const [local, setLocal] = useState('Kennedy');
  const [mes, setMes] = useState('Jan-26');
  const [form, setForm] = useState<Record<string, string>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/configuracion')
      .then(r => r.json())
      .then(data => {
        const vals = data?.[local]?.[mes] ?? {};
        setForm(Object.fromEntries(CAMPOS.map(c => [c.key, vals[c.key] ?? ''])));
      });
  }, [local, mes]);

  const handleSave = async () => {
    setSaving(true);
    const body: Record<string, string | number> = { local, mes };
    CAMPOS.forEach(c => { body[c.key] = parseFloat(form[c.key] || '0') || 0; });
    await fetch('/api/configuracion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: 'linear-gradient(180deg, #3b82f6, #10b981)' }} />
          <h1 style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-0.5px' }}>Configuración de Costos</h1>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '16px', fontFamily: 'DM Mono, monospace' }}>
          COSTOS MANUALES · POR LOCAL Y MES
        </p>
      </div>

      {/* Selectores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', maxWidth: '460px' }}>
        {[
          { label: 'LOCAL', value: local, set: setLocal, opts: LOCALES },
          { label: 'MES',   value: mes,   set: setMes,   opts: MESES },
        ].map(({ label, value, set, opts }) => (
          <div key={label}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>{label}</label>
            <select value={value} onChange={e => set(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
              {opts.map(o => <option key={o} value={o} style={{ background: '#111827' }}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Formulario */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', maxWidth: '560px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.05))', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', color: '#93c5fd', fontSize: '13px', fontWeight: '500' }}>{local} · {mes}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>S/. soles</span>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {CAMPOS.map(campo => (
            <div key={campo.key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '200px', flexShrink: 0 }}>{campo.label}</label>
              <input
                type="number" step="0.01" placeholder="0.00"
                value={form[campo.key]}
                onChange={e => setForm(f => ({ ...f, [campo.key]: e.target.value }))}
                style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 12px', color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace', fontSize: '13px', outline: 'none' }}
              />
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            {saved ? '✓ Guardado correctamente' : 'Los cambios se guardan en el servidor'}
          </span>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '9px 22px', borderRadius: '7px', border: 'none', cursor: 'pointer',
            background: saved ? 'var(--accent-green)' : 'var(--accent-blue)',
            color: 'white', fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: '500',
            transition: 'all 0.2s ease',
          }}>
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}