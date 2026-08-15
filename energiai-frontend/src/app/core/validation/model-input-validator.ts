import { AnalisisRequest } from '../models/analisis-request';
import {
  DIAS_FACTURADOS,
  HORAS_AIRE_ACONDICIONADO,
  HORAS_ALTO_CONSUMO,
  LIMITES_INMUEBLE,
  TipoInmueble,
} from '../models/model-domain';

export type CampoEntradaModelo = keyof AnalisisRequest;

export interface ProblemaEntradaModelo {
  campo: CampoEntradaModelo;
  codigo: 'obligatorio' | 'tipo' | 'rango' | 'entero' | 'decimales' | 'coherencia';
  mensaje: string;
}

const TIPOS_INMUEBLE: TipoInmueble[] = ['Casa', 'Apartamento', 'Comercio', 'Oficina'];

interface ReglaNumero {
  campo: CampoEntradaModelo;
  etiqueta: string;
  minimo: number;
  maximo: number;
  obligatorio?: boolean;
  entero?: boolean;
  decimales?: number;
}

export function validarEntradaModelo(
  entrada: Partial<Record<CampoEntradaModelo, unknown>>,
): ProblemaEntradaModelo[] {
  const problemas: ProblemaEntradaModelo[] = [];
  const tipoCrudo = entrada.tipo_inmueble;
  const tipo = TIPOS_INMUEBLE.includes(tipoCrudo as TipoInmueble)
    ? (tipoCrudo as TipoInmueble)
    : null;

  if (!tipo) {
    problemas.push({
      campo: 'tipo_inmueble',
      codigo: estaAusente(tipoCrudo) ? 'obligatorio' : 'tipo',
      mensaje: 'Tipo de inmueble: selecciona Casa, Apartamento, Comercio u Oficina.',
    });
  }

  const limites = tipo ? LIMITES_INMUEBLE[tipo] : LIMITES_INMUEBLE.Casa;
  const reglas: ReglaNumero[] = [
    { campo: 'consumo_kwh', etiqueta: 'Consumo mensual', minimo: limites.consumo.min, maximo: limites.consumo.max, obligatorio: true, entero: true },
    { campo: 'cantidad_equipos', etiqueta: 'Cantidad de equipos', minimo: limites.equipos.min, maximo: limites.equipos.max, obligatorio: true, entero: true },
    { campo: 'horas_alto_consumo', etiqueta: 'Horas de alto consumo', minimo: HORAS_ALTO_CONSUMO.min, maximo: HORAS_ALTO_CONSUMO.max, obligatorio: true, entero: true },
    { campo: 'dispositivos_alto', etiqueta: 'Equipos de alto consumo', minimo: 0, maximo: limites.equiposAlto.max, obligatorio: true, entero: true },
    { campo: 'dispositivos_medio', etiqueta: 'Equipos de consumo medio', minimo: 0, maximo: limites.equipos.max, obligatorio: true, entero: true },
    { campo: 'dispositivos_bajo', etiqueta: 'Equipos de bajo consumo', minimo: 0, maximo: limites.equipos.max, obligatorio: true, entero: true },
    { campo: 'cantidad_personas', etiqueta: 'Cantidad de personas', minimo: limites.personas.min, maximo: limites.personas.max, entero: true },
    { campo: 'area_m2', etiqueta: 'Área', minimo: limites.area.min, maximo: limites.area.max, decimales: 2 },
    { campo: 'horas_aire_acondicionado', etiqueta: 'Horas de aire acondicionado', minimo: HORAS_AIRE_ACONDICIONADO.min, maximo: HORAS_AIRE_ACONDICIONADO.max, entero: true },
    { campo: 'consumo_mes_anterior_kwh', etiqueta: 'Consumo del mes anterior', minimo: limites.consumoAnterior.min, maximo: limites.consumoAnterior.max, entero: true },
    { campo: 'dias_facturados', etiqueta: 'Días facturados', minimo: DIAS_FACTURADOS.min, maximo: DIAS_FACTURADOS.max, entero: true },
  ];

  for (const regla of reglas) {
    validarNumero(entrada[regla.campo], regla, problemas);
  }

  if (typeof entrada.uso_horario_pico !== 'boolean') {
    problemas.push({
      campo: 'uso_horario_pico',
      codigo: estaAusente(entrada.uso_horario_pico) ? 'obligatorio' : 'tipo',
      mensaje: 'Horario pico: selecciona una respuesta válida.',
    });
  }

  const cantidad = numeroValido(entrada.cantidad_equipos);
  const alto = numeroValido(entrada.dispositivos_alto);
  const medio = numeroValido(entrada.dispositivos_medio);
  const bajo = numeroValido(entrada.dispositivos_bajo);
  if ([cantidad, alto, medio, bajo].every((valor) => valor !== null)) {
    const suma = alto! + medio! + bajo!;
    if (suma !== cantidad) {
      problemas.push({
        campo: 'cantidad_equipos',
        codigo: 'coherencia',
        mensaje: `Distribución de equipos: alto + medio + bajo suma ${suma}, pero el total es ${cantidad}.`,
      });
    }
    for (const [campo, etiqueta, valor] of [
      ['dispositivos_alto', 'Equipos de alto consumo', alto],
      ['dispositivos_medio', 'Equipos de consumo medio', medio],
      ['dispositivos_bajo', 'Equipos de bajo consumo', bajo],
    ] as const) {
      if (valor! > cantidad!) {
        problemas.push({
          campo,
          codigo: 'coherencia',
          mensaje: `${etiqueta}: no puede superar la cantidad total de equipos (${cantidad}).`,
        });
      }
    }
  }

  const altoDeclarado = entrada.equipos_alto_consumo;
  if (!estaAusente(altoDeclarado)) {
    const valor = numeroValido(altoDeclarado);
    if (valor === null || !Number.isInteger(valor) || valor < 0 || valor > limites.equiposAlto.max) {
      problemas.push({ campo: 'equipos_alto_consumo', codigo: 'rango', mensaje: `Equipos de alto consumo declarados: usa un entero entre 0 y ${limites.equiposAlto.max}.` });
    } else if (alto !== null && valor !== alto) {
      problemas.push({ campo: 'equipos_alto_consumo', codigo: 'coherencia', mensaje: 'Los equipos de alto consumo declarados no coinciden con la distribución.' });
    }
  }

  return quitarDuplicados(problemas);
}

export function problemasDelCampo(
  problemas: ProblemaEntradaModelo[],
  campo: CampoEntradaModelo,
): string[] {
  return problemas.filter((problema) => problema.campo === campo).map((problema) => problema.mensaje);
}

function validarNumero(
  valor: unknown,
  regla: ReglaNumero,
  problemas: ProblemaEntradaModelo[],
): void {
  if (estaAusente(valor)) {
    if (regla.obligatorio) {
      problemas.push({ campo: regla.campo, codigo: 'obligatorio', mensaje: `${regla.etiqueta}: este dato es obligatorio.` });
    }
    return;
  }
  const numero = numeroValido(valor);
  if (numero === null) {
    problemas.push({ campo: regla.campo, codigo: 'tipo', mensaje: `${regla.etiqueta}: ingresa un número válido y finito.` });
    return;
  }
  if (numero < regla.minimo || numero > regla.maximo) {
    problemas.push({ campo: regla.campo, codigo: 'rango', mensaje: `${regla.etiqueta}: usa un valor entre ${regla.minimo} y ${regla.maximo}.` });
  }
  if (regla.entero && !Number.isInteger(numero)) {
    problemas.push({ campo: regla.campo, codigo: 'entero', mensaje: `${regla.etiqueta}: ingresa un número entero.` });
  }
  if (regla.decimales !== undefined && !tieneMaximoDecimales(numero, regla.decimales)) {
    problemas.push({ campo: regla.campo, codigo: 'decimales', mensaje: `${regla.etiqueta}: usa máximo ${regla.decimales} decimales.` });
  }
}

function estaAusente(valor: unknown): boolean {
  return valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '');
}

function numeroValido(valor: unknown): number | null {
  if (estaAusente(valor) || typeof valor === 'boolean') return null;
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function tieneMaximoDecimales(valor: number, decimales: number): boolean {
  const factor = 10 ** decimales;
  return Math.abs(valor * factor - Math.round(valor * factor)) < 1e-8;
}

function quitarDuplicados(problemas: ProblemaEntradaModelo[]): ProblemaEntradaModelo[] {
  const vistos = new Set<string>();
  return problemas.filter((problema) => {
    const clave = `${problema.campo}:${problema.mensaje}`;
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}
