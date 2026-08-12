export interface HistorialResponse {
  id: number;
  creadoEn: string;
  usuario: string;
  consumoKwh: number;
  tipoInmueble: string;
  cantidadEquipos: number;
  horasAltoConsumo: number;
  usoHorarioPico: boolean;
  categoria: string;
  probabilidad: number;
  costo_estimado_mensual: number;
  recomendaciones: string[];
  clasificacion_equipos?: Record<string, number>;
}