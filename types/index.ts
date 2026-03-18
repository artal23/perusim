export type Local = 'Kennedy' | 'LAP' | 'Larco' | 'Cusco' | 'MoneyGram' | 'PeruHOP';

export interface ResumenMensual {
  local: Local;
  mes: string;
  ingresos_brutos: number;
  ingresos_netos: number;
  gastos_red: number;
  gastos_variables: number;
  otros_gastos: number;
  gastos_totales: number;
  utilidad: number;
  utilidad_porcentaje: number;
}

export interface AnalisisPlan {
  codigo_plan: string;
  nombre_plan: string;
  num_usuarios: number;
  datos_plan_mb: number;
  uso_data_mb: number;
  uso_data_pct: number;
  costo_data: number;
  costo_voz_saliente: number;
  costo_voz_entrante: number;
  costo_sms: number;
  costo_crm: number;
  costo_mtc: number;
  costos_red: number;
  costos_totales: number;
  precio_comercial: number;
}
