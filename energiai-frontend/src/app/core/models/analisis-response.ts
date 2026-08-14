export interface AnalisisResponse {
  categoria: string;
  probabilidad: number;
  recomendaciones: string[];
  costo_estimado_mensual: number;
  clasificacion_equipos?: Record<string, number>;
  nivel_analisis: 'basico' | 'parcial' | 'avanzado' | 'fallback';
  campos_imputados: string[];
}
