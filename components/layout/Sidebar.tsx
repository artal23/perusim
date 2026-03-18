'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  { label: 'GENERAL', items: [{ name: 'Resumen', href: '/resumen', icon: '◈' }] },
  { label: 'LOCALES', items: [
    { name: 'Kennedy', href: '/locales/kennedy', icon: '◆' },
    { name: 'LAP', href: '/locales/lap', icon: '◆' },
    { name: 'Larco', href: '/locales/larco', icon: '◆' },
    { name: 'Cusco', href: '/locales/cusco', icon: '◆' },
    { name: 'MoneyGram', href: '/locales/moneygram', icon: '◆' },
    { name: 'PeruHOP', href: '/locales/peruhop', icon: '◆' },
  ]},
  { label: 'ANÁLISIS', items: [
    { name: 'Análisis Planes', href: '/analisis-planes', icon: '◈' },
    { name: 'TD Data', href: '/td-data', icon: '◈' },
  ]},
  { label: 'SISTEMA', items: [
    { name: 'Configuración', href: '/configuracion', icon: '⚙' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside style={{ width: '220px', minHeight: '100vh', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #3b82f6, #10b981)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: 'white', fontFamily: 'DM Mono, monospace' }}>P</div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>PeruSIM</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>REPORTES</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {sections.map((section) => (
          <div key={section.label}>
            <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1.2px', color: 'var(--text-muted)', padding: '0 8px', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{section.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.15s ease', background: active ? 'var(--accent-blue-dim)' : 'transparent', color: active ? '#93c5fd' : 'var(--text-secondary)', borderLeft: active ? '2px solid var(--accent-blue)' : '2px solid transparent', fontSize: '13.5px', fontWeight: active ? '500' : '400' }}>
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>v1.0.0 · PeruSIM</div>
    </aside>
  );
}