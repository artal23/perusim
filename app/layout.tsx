import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'PeruSIM - Reportes',
  description: 'Sistema de reportes PeruSIM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{
        backgroundColor: '#0a0e1a',
        color: '#e2e8f0',
        fontFamily: "'DM Sans', sans-serif",
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      }}>
        <style>{`
          :root {
            --bg-base: #0a0e1a;
            --bg-surface: #111827;
            --bg-card: #161d2e;
            --border: #1e2d45;
            --border-light: #243352;
            --text-primary: #e2e8f0;
            --text-secondary: #64748b;
            --text-muted: #374151;
            --accent-green: #10b981;
            --accent-green-dim: #064e3b;
            --accent-blue: #3b82f6;
            --accent-blue-dim: #1e3a5f;
            --accent-red: #ef4444;
            --accent-yellow: #f59e0b;
          }
          html, body { background-color: #0a0e1a !important; color: #e2e8f0 !important; }
          * { box-sizing: border-box; }
          input, select, textarea, option {
            background-color: #111827 !important;
            color: #e2e8f0 !important;
            border-color: #1e2d45 !important;
          }
          ::-webkit-scrollbar { width: 4px; height: 4px; }
          ::-webkit-scrollbar-track { background: #0a0e1a; }
          ::-webkit-scrollbar-thumb { background: #243352; border-radius: 2px; }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        `}</style>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: '#0a0e1a' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}