'use client';

// Tipo mínimo necesario — coincide con lo que devuelve kennedy/route.ts
export interface LocalData {
  mes:                string;
  nuevos_clientes:    number;
  clientes_activos:   number;
  ingresos_planes:    number;
  ingresos_activation:number;
  ingresos_recargas:  number;
  total_con_igv:      number;
  total_sin_igv:      number;
  costo_data:         number;
  costo_voz_sal:      number;
  costo_voz_ent:      number;
  costo_sms:          number;
  costo_red:          number;
  costo_crm:          number;
  costo_mtc:          number;
  costo_sim:          number;
  costo_vias:         number;
  costo_bio:          number;
  gastos_variables:   number;
  renta_espacio:      number;
  marketing:          number;
  software_licencias: number;
  soporte:            number;
  incentivo_fijo:     number;
  incentivo_variable: number;
  gastos_otros:       number;
  gastos_totales:     number;
  margen_red:         number;
  margen_red_pct:     number;
  margen_bruto:       number;
  margen_bruto_pct:   number;
}

interface ExportExcelLocalProps {
  data:      LocalData[];
  localName: string;   // e.g. 'Kennedy'
  filename?: string;
}

// Definición de filas — cada entrada es una fila del Excel
// key: campo del objeto | null = fila vacía | 'section' = encabezado de sección
type RowDef =
  | { type: 'section'; label: string }
  | { type: 'empty' }
  | { type: 'data';    label: string; key: keyof LocalData; format: 'number' | 'currency' | 'percent'; bold?: boolean }

const ROW_DEFS: RowDef[] = [
  { type: 'empty' },
  { type: 'section', label: 'CLIENTES' },
  { type: 'data', label: 'Nuevos Clientes',          key: 'nuevos_clientes',    format: 'number'   },
  { type: 'data', label: 'Empresas Nuevos Clientes', key: 'nuevos_clientes',    format: 'number'   }, // placeholder 0
  { type: 'data', label: 'Clientes Activos',         key: 'clientes_activos',   format: 'number',  bold: true },
  { type: 'empty' },
  { type: 'section', label: 'INGRESOS (con IGV)' },
  { type: 'data', label: 'Ingresos Ventas Stand Planes',         key: 'ingresos_planes',    format: 'currency' },
  { type: 'data', label: 'Ingresos Ventas Stand Activation Fee', key: 'ingresos_activation',format: 'currency' },
  { type: 'data', label: 'Ingresos de Ventas Stand Recargas',    key: 'ingresos_recargas',  format: 'currency' },
  { type: 'empty' },
  { type: 'data', label: 'Ingresos Totales PeruSIM (Con IGV)',   key: 'total_con_igv',      format: 'currency', bold: true },
  { type: 'data', label: 'Ingresos Totales PeruSIM (Sin IGV)',   key: 'total_sin_igv',      format: 'currency', bold: true },
  { type: 'empty' },
  { type: 'section', label: 'COSTOS' },
  { type: 'data', label: 'Costos de Red Planes',     key: 'costo_red',          format: 'currency', bold: true },
  { type: 'data', label: 'Costo Data',               key: 'costo_data',         format: 'currency' },
  { type: 'data', label: 'Costo Voz Saliente',       key: 'costo_voz_sal',      format: 'currency' },
  { type: 'data', label: 'Costo Voz Entrante',       key: 'costo_voz_ent',      format: 'currency' },
  { type: 'data', label: 'Costo SMS',                key: 'costo_sms',          format: 'currency' },
  { type: 'data', label: 'Costo CRM / Plataforma',   key: 'costo_crm',          format: 'currency' },
  { type: 'data', label: 'Costo MTC',                key: 'costo_mtc',          format: 'currency' },
  { type: 'data', label: 'Costo SIM Cards',          key: 'costo_sim',          format: 'currency' },
  { type: 'data', label: 'Vías de Pago',             key: 'costo_vias',         format: 'currency' },
  { type: 'data', label: 'Biometría Vendedor',       key: 'costo_bio',          format: 'currency' },
  { type: 'data', label: 'Renta Espacio',            key: 'renta_espacio',      format: 'currency', bold: true },
  { type: 'data', label: 'Marketing',                key: 'marketing',          format: 'currency', bold: true },
  { type: 'data', label: 'Software y Licencias',     key: 'software_licencias', format: 'currency', bold: true },
  { type: 'data', label: 'Soporte',                  key: 'soporte',            format: 'currency', bold: true },
  { type: 'data', label: 'Incentivo Fijo',           key: 'incentivo_fijo',     format: 'currency', bold: true },
  { type: 'data', label: 'Incentivo Variable',       key: 'incentivo_variable', format: 'currency', bold: true },
  { type: 'empty' },
  { type: 'data', label: 'Costos Totales Negocio Móvil', key: 'gastos_totales', format: 'currency', bold: true },
  { type: 'empty' },
  { type: 'section', label: 'RESULTADO' },
  { type: 'data', label: 'Margen de Red Móvil',      key: 'margen_red',         format: 'currency', bold: true },
  { type: 'data', label: 'Margen de Red Móvil (%)',  key: 'margen_red_pct',     format: 'percent',  bold: true },
  { type: 'data', label: 'Margen Bruto Móvil',       key: 'margen_bruto',       format: 'currency', bold: true },
  { type: 'data', label: 'Margen Bruto Móvil (%)',   key: 'margen_bruto_pct',   format: 'percent',  bold: true },
];

// Colores
const COLOR_HEADER_BG  = '1E293B'; // azul oscuro
const COLOR_SECTION_BG = 'E2E8F0'; // gris claro
const COLOR_BOLD_BG    = 'F8FAFC'; // casi blanco
const COLOR_GREEN      = '16A34A';
const COLOR_RED        = 'DC2626';
const COLOR_BLUE       = '1D4ED8';
const COLOR_WHITE      = 'FFFFFF';

export default function ExportExcelLocal({ data, localName, filename }: ExportExcelLocalProps) {

  const handleExport = async () => {
    const XLSX = await import('xlsx');

    // Ordenar meses cronológicamente
    const MES_ORDER: Record<string, number> = {
      Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12,
    };
    const sorted = [...data].sort((a, b) => {
      const [ma, ya] = a.mes.split('-');
      const [mb, yb] = b.mes.split('-');
      const va = parseInt(ya) * 100 + (MES_ORDER[ma] ?? 0);
      const vb = parseInt(yb) * 100 + (MES_ORDER[mb] ?? 0);
      return va - vb;
    });

    const meses = sorted.map(d => d.mes);
    const mesMap = Object.fromEntries(sorted.map(d => [d.mes, d]));

    // ── Construir matriz de celdas ────────────────────────────────────────────
    // Fila 0: título
    // Fila 1: vacía
    // Fila 2: encabezados de meses
    // Fila 3+: datos según ROW_DEFS

    const wsData: unknown[][] = [];

    // Fila 1 — título
    wsData.push([`Modelo Rentabilidad ${localName}`, ...meses.map(() => '')]);

    // Fila 2 — vacía
    wsData.push([]);

    // Fila 3 — cabecera de meses
    wsData.push(['', ...meses]);

    // Filas de datos
    for (const def of ROW_DEFS) {
      if (def.type === 'empty') {
        wsData.push([]);
        continue;
      }
      if (def.type === 'section') {
        wsData.push([def.label, ...meses.map(() => '')]);
        continue;
      }
      // data row
      const row: unknown[] = [def.label];
      for (const mes of meses) {
        const d = mesMap[mes];
        if (!d) { row.push(''); continue; }

        const val = def.key === 'nuevos_clientes' && def.label === 'Empresas Nuevos Clientes'
          ? 0
          : Number(d[def.key]);

        row.push(val);
      }
      wsData.push(row);
    }

    // ── Crear worksheet ───────────────────────────────────────────────────────
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Ancho de columnas
    ws['!cols'] = [
      { wch: 38 }, // columna de etiquetas
      ...meses.map(() => ({ wch: 16 })),
    ];

    // ── Aplicar estilos ───────────────────────────────────────────────────────
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const ref  = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[ref]) continue;

        const isLabelCol = C === 0;
        const isMesRow   = R === 2; // fila de cabeceras de meses
        const isTitleRow = R === 0;

        // Fila título
        if (isTitleRow) {
          ws[ref].s = {
            font:      { bold: true, sz: 13, color: { rgb: COLOR_WHITE } },
            fill:      { fgColor: { rgb: COLOR_HEADER_BG } },
            alignment: { vertical: 'center' },
          };
          continue;
        }

        // Fila de meses
        if (isMesRow) {
          ws[ref].s = {
            font:      { bold: true, sz: 11, color: { rgb: COLOR_WHITE } },
            fill:      { fgColor: { rgb: COLOR_HEADER_BG } },
            alignment: { horizontal: C === 0 ? 'left' : 'center' },
          };
          continue;
        }

        // Buscar qué def corresponde a esta fila
        // wsData[0] = title, wsData[1] = empty, wsData[2] = mes headers
        // wsData[3+] = ROW_DEFS
        const defIdx = R - 3;
        if (defIdx < 0 || defIdx >= ROW_DEFS.length) continue;
        const def = ROW_DEFS[defIdx];

        if (def.type === 'empty') continue;

        if (def.type === 'section') {
          ws[ref].s = {
            font: { bold: true, sz: 10, color: { rgb: '334155' } },
            fill: { fgColor: { rgb: COLOR_SECTION_BG } },
            alignment: { horizontal: 'left' },
          };
          continue;
        }

        // data row
        const isPercent  = def.format === 'percent';
        const isBold     = !!def.bold;
        const numVal     = typeof ws[ref].v === 'number' ? ws[ref].v : null;

        // Color de valor
        let fontColor = '1E293B'; // default oscuro
        if (!isLabelCol && numVal !== null) {
          if (def.key === 'margen_red_pct' || def.key === 'margen_bruto_pct') {
            fontColor = numVal >= 0 ? COLOR_GREEN : COLOR_RED;
          } else if (def.key === 'margen_red' || def.key === 'margen_bruto') {
            fontColor = numVal >= 0 ? COLOR_GREEN : COLOR_RED;
          } else if (def.key === 'total_con_igv' || def.key === 'total_sin_igv') {
            fontColor = COLOR_BLUE;
          }
        }

        ws[ref].s = {
          font: {
            bold: isBold || isLabelCol,
            sz:   10,
            color: { rgb: fontColor },
          },
          fill: isBold
            ? { fgColor: { rgb: COLOR_BOLD_BG } }
            : undefined,
          alignment: {
            horizontal: isLabelCol ? 'left' : 'right',
          },
          numFmt: !isLabelCol && numVal !== null
            ? (isPercent ? '0.00%' : '#,##0.00')
            : undefined,
          border: {
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          },
        };

        // Formato numérico de la celda
        if (!isLabelCol && numVal !== null) {
          ws[ref].t = 'n';
          if (isPercent) {
            ws[ref].v = numVal / 100; // Excel espera decimal para %
            ws[ref].z = '0.00%';
          } else {
            ws[ref].z = '#,##0.00';
          }
        }
      }
    }

    // Merge de la celda título
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.min(meses.length, 5) } }];

    const wb = XLSX.utils.book_new();
    const sheetName = `${localName} - Rentabilidad`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${filename ?? `${localName.toLowerCase()}-rentabilidad`}-${fecha}.xlsx`);
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
