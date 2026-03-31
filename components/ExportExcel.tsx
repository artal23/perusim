'use client';

interface Column {
  header: string;
  key:    string;
  format?: 'number' | 'currency' | 'percent' | 'text';
}

interface ExportExcelProps {
  /** Datos a exportar — array de objetos */
  data:     Record<string, unknown>[];
  /** Definición de columnas */
  columns:  Column[];
  /** Nombre del archivo sin extensión */
  filename?: string;
  /** Nombre de la hoja */
  sheetName?: string;
}

export default function ExportExcel({
  data,
  columns,
  filename  = 'reporte-perusim',
  sheetName = 'Datos',
}: ExportExcelProps) {

  const handleExport = async () => {
    const XLSX = await import('xlsx');

    // Cabecera
    const header = columns.map(c => c.header);

    // Filas
    const rows = data.map(row =>
      columns.map(c => {
        const val = row[c.key];
        if (val === null || val === undefined) return '';
        if (c.format === 'currency' || c.format === 'number' || c.format === 'percent') {
          return Number(val);
        }
        return String(val);
      })
    );

    // Fila de totales numéricos
    const totalsRow = columns.map(c => {
      if (c.format === 'number' || c.format === 'currency' || c.format === 'percent') {
        return data.reduce((acc, row) => acc + (Number(row[c.key]) || 0), 0);
      }
      return c === columns[0] ? 'TOTAL' : '';
    });

    const wsData = [header, ...rows, totalsRow];
    const ws     = XLSX.utils.aoa_to_sheet(wsData);

    // Ancho de columnas automático
    ws['!cols'] = columns.map((c, i) => {
      const maxLen = Math.max(
        c.header.length,
        ...data.map(row => String(row[c.key] ?? '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });

    // Estilo de cabecera (fila 1)
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        font:      { bold: true, color: { rgb: 'FFFFFF' } },
        fill:      { fgColor: { rgb: '1E293B' } },
        alignment: { horizontal: 'center' },
      };
    }

    // Estilo de fila de totales (última fila)
    const lastRow = wsData.length - 1;
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: lastRow, c: col });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        border: {
          top: { style: 'medium', color: { rgb: '1E293B' } },
        },
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${filename}-${fecha}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderRadius: '6px', fontSize: '12px',
        cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontWeight: '500',
        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
        color: '#34d399',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      Exportar Excel
    </button>
  );
}
