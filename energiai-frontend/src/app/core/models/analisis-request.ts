import { TipoInmueble } from './model-domain';

export interface AnalisisRequest {
  consumo_kwh: number;
  uso_horario_pico: boolean;
  cantidad_equipos: number;
  tipo_inmueble: TipoInmueble;
  horas_alto_consumo: number;
  cantidad_personas?: number | null;
  area_m2?: number | null;
  equipos_alto_consumo?: number | null;
  horas_aire_acondicionado?: number | null;
  consumo_mes_anterior_kwh?: number | null;
  dias_facturados?: number | null;
  usuarioId?: string;
  nombre_o_numero_analisis?: string;
  dispositivos_alto: number;
  dispositivos_medio: number;
  dispositivos_bajo: number;
}
