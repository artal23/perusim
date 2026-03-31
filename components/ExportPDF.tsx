'use client';
import { useEffect, useRef } from 'react';

interface ExportPDFProps {
  /** ID del div que se quiere capturar para el PDF */
  targetId: string;
  /** Nombre del archivo sin extensión, ej: "resumen-perusim" */
  filename?: string;
}

const PRINT_STYLES = (targetId: string) => `
  @media print {
    body * { visibility: hidden !important; }
    #${targetId}, #${targetId} * { visibility: visible !important; }
    #${targetId} {
      position: fixed !important;
      top: 0; left: 0;
      width: 100%;
      padding: 32px;
      background: #fff !important;
      color: #111 !important;
    }
    /* Textos */
    #${targetId} * { color: #111 !important; }
    /* Cabeceras de tabla */
    #${targetId} thead th {
      background: #1e293b !important;
      color: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* Filas alternas */
    #${targetId} tbody tr:nth-child(even) td {
      background: #f3f4f6 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* Fila de totales */
    #${targetId} tfoot td {
      border-top: 2px solid #1e293b !important;
      font-weight: 700 !important;
    }
    /* Tarjetas */
    #${targetId} .pdf-card {
      border: 1px solid #ddd !important;
      background: #f9f9f9 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* Elementos solo visibles en PDF */
    #${targetId} .pdf-only { display: block !important; }
    /* Ocultar botón de exportar */
    #btn-exportar-pdf { display: none !important; }
  }
  /* Elementos solo visibles en PDF — ocultos en pantalla */
  #${targetId} .pdf-only { display: none; }
`;

export default function ExportPDF({ targetId, filename = 'reporte-perusim' }: ExportPDFProps) {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = PRINT_STYLES(targetId);
    document.head.appendChild(style);
    styleRef.current = style;
    return () => { style.remove(); };
  }, [targetId]);

  const handlePrint = () => {
    // Actualizar título del documento para que el nombre del PDF sea correcto
    const prevTitle = document.title;
    document.title = filename;
    window.print();
    document.title = prevTitle;
  };

  return (
    <button
      id="btn-exportar-pdf"
      onClick={handlePrint}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderRadius: '6px', fontSize: '12px',
        cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontWeight: '500',
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
        color: '#f87171',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Exportar PDF
    </button>
  );
}