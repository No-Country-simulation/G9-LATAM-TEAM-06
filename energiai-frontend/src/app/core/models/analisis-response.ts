export interface RecomendacionDetalle {
  codigo: string;
  texto: string;
  confianza: number | null;
  factores_clave: string[];
}

export interface AnalisisResponse {
  categoria: string;
  probabilidad: number;
  recomendaciones: string[];
  costo_estimado_mensual: number;
  clasificacion_equipos?: Record<string, number>;
  nivel_analisis: 'basico' | 'parcial' | 'avanzado' | 'fallback';
  campos_imputados: string[];
  recomendaciones_detalle?: RecomendacionDetalle[];
  origen_prediccion?: 'modelo_ml' | 'fallback_reglas' | 'registro_legacy';
  modelo_version?: string;
  advertencias?: string[];
  nombre_o_numero_analisis?: string;
}
