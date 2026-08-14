export type TipoInmueble = 'Casa' | 'Apartamento' | 'Comercio' | 'Oficina';

export interface LimitesInmueble {
  descripcion: string;
  consumo: { min: number; max: number };
  equipos: { min: number; max: number; sugerido: string };
  personas: { min: number; max: number };
  area: { min: number; max: number };
  equiposAlto: { min: number; max: number };
  consumoAnterior: { min: number; max: number };
}

export const LIMITES_INMUEBLE: Record<TipoInmueble, LimitesInmueble> = {
  Casa: {
    descripcion: 'Vivienda independiente de uso residencial.',
    consumo: { min: 40, max: 5000 },
    equipos: { min: 1, max: 500, sugerido: '8 a 18' },
    personas: { min: 1, max: 7 },
    area: { min: 60, max: 350 },
    equiposAlto: { min: 0, max: 500 },
    consumoAnterior: { min: 35, max: 5000 },
  },
  Apartamento: {
    descripcion: 'Unidad residencial dentro de un edificio.',
    consumo: { min: 40, max: 5000 },
    equipos: { min: 1, max: 500, sugerido: '8 a 18' },
    personas: { min: 1, max: 7 },
    area: { min: 35, max: 180 },
    equiposAlto: { min: 0, max: 500 },
    consumoAnterior: { min: 35, max: 5000 },
  },
  Comercio: {
    descripcion: 'Local comercial o pequeño negocio con atención o producción.',
    consumo: { min: 40, max: 5000 },
    equipos: { min: 1, max: 500, sugerido: '10 a 12' },
    personas: { min: 1, max: 15 },
    area: { min: 30, max: 420 },
    equiposAlto: { min: 0, max: 500 },
    consumoAnterior: { min: 35, max: 5000 },
  },
  Oficina: {
    descripcion: 'Espacio administrativo con puestos de trabajo y equipos electrónicos.',
    consumo: { min: 40, max: 5000 },
    equipos: { min: 1, max: 500, sugerido: '10 a 20' },
    personas: { min: 1, max: 30 },
    area: { min: 30, max: 420 },
    equiposAlto: { min: 0, max: 500 },
    consumoAnterior: { min: 35, max: 5000 },
  },
};

export const HORAS_ALTO_CONSUMO = { min: 0, max: 24 };
export const HORAS_AIRE_ACONDICIONADO = { min: 0, max: 12 };
export const DIAS_FACTURADOS = { min: 28, max: 31 };
