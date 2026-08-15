import { Injectable } from '@angular/core';
import { AnalisisRequest } from '../models/analisis-request';
import { TipoInmueble } from '../models/model-domain';
import { validarEntradaModelo } from '../validation/model-input-validator';

export interface FilaAnalisisCsv {
  numero: number;
  datos: AnalisisRequest | null;
  errores: string[];
  valores: Record<string, string>;
}

export interface ResultadoCsv {
  filas: FilaAnalisisCsv[];
  erroresGlobales: string[];
}

export const COLUMNAS_CSV = [
  'consumo_kwh',
  'uso_horario_pico',
  'cantidad_equipos',
  'tipo_inmueble',
  'horas_alto_consumo',
  'dispositivos_alto',
  'dispositivos_medio',
  'dispositivos_bajo',
  'cantidad_personas',
  'area_m2',
  'horas_aire_acondicionado',
  'consumo_mes_anterior_kwh',
  'dias_facturados',
] as const;

const OBLIGATORIAS = COLUMNAS_CSV.slice(0, 8);
const TIPOS_INMUEBLE: TipoInmueble[] = ['Casa', 'Apartamento', 'Comercio', 'Oficina'];
const MAXIMO_FILAS = 100;
const MAXIMO_CARACTERES = 1_000_000;
const NUMERO_DECIMAL = /^[+-]?\d+(?:\.\d+)?$/;

@Injectable({ providedIn: 'root' })
export class CsvAnalisisService {
  parsear(contenido: string): ResultadoCsv {
    if (contenido.length > MAXIMO_CARACTERES) {
      return { filas: [], erroresGlobales: ['El contenido del CSV supera el máximo permitido de 1 MB.'] };
    }

    const limpio = contenido.replace(/^\uFEFF/, '').trim();
    if (!limpio) {
      return { filas: [], erroresGlobales: ['El archivo CSV está vacío.'] };
    }
    if (!this.comillasBalanceadas(limpio)) {
      return { filas: [], erroresGlobales: ['El CSV contiene una comilla sin cerrar. Revisa el formato del archivo.'] };
    }

    const separador = this.detectarSeparador(limpio);
    const registros = this.separarRegistros(limpio, separador);
    if (registros.length < 2) {
      return { filas: [], erroresGlobales: ['El CSV debe incluir encabezados y al menos una fila de datos.'] };
    }
    if (registros[0].length === 1 && /[,;]/.test(registros[0][0])) {
      return {
        filas: [],
        erroresGlobales: [
          'El archivo tiene cada fila guardada como una sola celda entre comillas. Descarga una plantilla nueva y conserva su separador al editarla.',
        ],
      };
    }

    const encabezados = registros[0].map((valor) => valor.trim().toLowerCase());
    const erroresGlobales = this.validarEncabezados(encabezados);
    const registrosDatos = registros
      .slice(1)
      .filter((registro) => registro.some((valor) => valor.trim() !== ''));

    if (registrosDatos.length > MAXIMO_FILAS) {
      erroresGlobales.push(`El archivo supera el máximo de ${MAXIMO_FILAS} filas por lote.`);
    }
    if (!registrosDatos.length) {
      erroresGlobales.push('El CSV no contiene filas de datos.');
    }

    const filasConColumnasExtra = registrosDatos
      .map((registro, indice) => ({ registro, numero: indice + 2 }))
      .filter(({ registro }) => registro.length > encabezados.length)
      .map(({ numero }) => numero);
    if (filasConColumnasExtra.length) {
      erroresGlobales.push(
        `Las filas ${filasConColumnasExtra.slice(0, 10).join(', ')} contienen más columnas que el encabezado.`,
      );
    }

    if (erroresGlobales.length) {
      return { filas: [], erroresGlobales };
    }

    const filas = registrosDatos.slice(0, MAXIMO_FILAS).map((registro, indice) => {
      const valores: Record<string, string> = {};
      encabezados.forEach((encabezado, posicion) => {
        valores[encabezado] = (registro[posicion] ?? '').trim();
      });
      return this.convertirFila(indice + 2, valores);
    });

    return { filas, erroresGlobales: [] };
  }

  plantilla(): string {
    const filas = [
      [...COLUMNAS_CSV],
      ['250', 'false', '8', 'Casa', '4', '2', '3', '3', '4', '120', '0', '230', '30'],
      ['650', 'true', '12', 'Comercio', '8', '4', '5', '3', '6', '180', '4', '580', '30'],
      ['180', 'false', '6', 'Apartamento', '2', '1', '2', '3', '2', '75', '0', '210', '30'],
    ];

    // UTF-8 con BOM y punto y coma evita que Excel en configuraciones regionales
    // hispanas abra toda la fila en una sola columna y la corrompa al guardarla.
    return `\uFEFF${filas.map((fila) => fila.map((valor) => this.escaparCampoCsv(valor, ';')).join(';')).join('\r\n')}`;
  }

  private escaparCampoCsv(valor: string, separador: string): string {
    return valor.includes(separador) || /["\r\n]/.test(valor)
      ? `"${valor.replace(/"/g, '""')}"`
      : valor;
  }

  private convertirFila(numeroFila: number, valores: Record<string, string>): FilaAnalisisCsv {
    const tipoNormalizado = this.normalizarTipo(valores['tipo_inmueble']);
    const horarioPico = this.convertirBooleano(valores['uso_horario_pico']);
    const candidato = {
      consumo_kwh: this.convertirNumero(valores['consumo_kwh']),
      uso_horario_pico: horarioPico,
      cantidad_equipos: this.convertirNumero(valores['cantidad_equipos']),
      tipo_inmueble: tipoNormalizado ?? valores['tipo_inmueble'],
      horas_alto_consumo: this.convertirNumero(valores['horas_alto_consumo']),
      dispositivos_alto: this.convertirNumero(valores['dispositivos_alto']),
      dispositivos_medio: this.convertirNumero(valores['dispositivos_medio']),
      dispositivos_bajo: this.convertirNumero(valores['dispositivos_bajo']),
      cantidad_personas: this.convertirNumeroOpcional(valores['cantidad_personas']),
      area_m2: this.convertirNumeroOpcional(valores['area_m2']),
      horas_aire_acondicionado: this.convertirNumeroOpcional(valores['horas_aire_acondicionado']),
      consumo_mes_anterior_kwh: this.convertirNumeroOpcional(valores['consumo_mes_anterior_kwh']),
      dias_facturados: this.convertirNumeroOpcional(valores['dias_facturados']),
    };
    const problemas = validarEntradaModelo(candidato);
    const errores = problemas.map((problema) => problema.mensaje);

    if (errores.length || !tipoNormalizado || horarioPico === null) {
      return { numero: numeroFila, datos: null, errores, valores };
    }

    const datos: AnalisisRequest = {
      consumo_kwh: Number(candidato.consumo_kwh),
      uso_horario_pico: horarioPico,
      cantidad_equipos: Number(candidato.cantidad_equipos),
      tipo_inmueble: tipoNormalizado,
      horas_alto_consumo: Number(candidato.horas_alto_consumo),
      cantidad_personas: candidato.cantidad_personas,
      area_m2: candidato.area_m2,
      equipos_alto_consumo: Number(candidato.dispositivos_alto),
      horas_aire_acondicionado: candidato.horas_aire_acondicionado,
      consumo_mes_anterior_kwh: candidato.consumo_mes_anterior_kwh,
      dias_facturados: candidato.dias_facturados,
      dispositivos_alto: Number(candidato.dispositivos_alto),
      dispositivos_medio: Number(candidato.dispositivos_medio),
      dispositivos_bajo: Number(candidato.dispositivos_bajo),
    };
    return { numero: numeroFila, datos, errores: [], valores };
  }

  private validarEncabezados(encabezados: string[]): string[] {
    const errores: string[] = [];
    const faltantes = OBLIGATORIAS.filter((columna) => !encabezados.includes(columna));
    const desconocidas = encabezados.filter(
      (columna) => columna && !(COLUMNAS_CSV as readonly string[]).includes(columna),
    );
    const duplicadas = encabezados.filter(
      (columna, indice) => columna && encabezados.indexOf(columna) !== indice,
    );
    if (encabezados.some((columna) => !columna)) errores.push('Todos los encabezados deben tener un nombre.');
    if (faltantes.length) errores.push(`Faltan columnas obligatorias: ${faltantes.join(', ')}.`);
    if (desconocidas.length) errores.push(`Columnas no reconocidas: ${Array.from(new Set(desconocidas)).join(', ')}.`);
    if (duplicadas.length) errores.push(`Columnas duplicadas: ${Array.from(new Set(duplicadas)).join(', ')}.`);
    return errores;
  }

  private convertirNumero(valor: string | undefined): number | null {
    const limpio = (valor ?? '').trim();
    if (!limpio) return null;
    if (!NUMERO_DECIMAL.test(limpio)) return Number.NaN;
    return Number(limpio);
  }

  private convertirNumeroOpcional(valor: string | undefined): number | null {
    const limpio = (valor ?? '').trim();
    return limpio ? this.convertirNumero(limpio) : null;
  }

  private normalizarTipo(valor: string): TipoInmueble | null {
    return TIPOS_INMUEBLE.find(
      (tipo) => tipo.toLowerCase() === (valor ?? '').trim().toLowerCase(),
    ) ?? null;
  }

  private convertirBooleano(valor: string): boolean | null {
    const normalizado = (valor ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (['true', 'si', '1'].includes(normalizado)) return true;
    if (['false', 'no', '0'].includes(normalizado)) return false;
    return null;
  }

  private detectarSeparador(contenido: string): ',' | ';' {
    const primeraLinea = contenido.split(/\r?\n/, 1)[0];
    return (primeraLinea.match(/;/g)?.length ?? 0) > (primeraLinea.match(/,/g)?.length ?? 0) ? ';' : ',';
  }

  private comillasBalanceadas(contenido: string): boolean {
    let abiertas = false;
    for (let indice = 0; indice < contenido.length; indice++) {
      if (contenido[indice] !== '"') continue;
      if (abiertas && contenido[indice + 1] === '"') {
        indice++;
      } else {
        abiertas = !abiertas;
      }
    }
    return !abiertas;
  }

  private separarRegistros(contenido: string, separador: string): string[][] {
    const filas: string[][] = [];
    let fila: string[] = [];
    let campo = '';
    let entreComillas = false;
    for (let indice = 0; indice < contenido.length; indice++) {
      const caracter = contenido[indice];
      const siguiente = contenido[indice + 1];
      if (caracter === '"' && entreComillas && siguiente === '"') {
        campo += '"';
        indice++;
      } else if (caracter === '"') {
        entreComillas = !entreComillas;
      } else if (caracter === separador && !entreComillas) {
        fila.push(campo);
        campo = '';
      } else if ((caracter === '\n' || caracter === '\r') && !entreComillas) {
        if (caracter === '\r' && siguiente === '\n') indice++;
        fila.push(campo);
        filas.push(fila);
        fila = [];
        campo = '';
      } else {
        campo += caracter;
      }
    }
    fila.push(campo);
    filas.push(fila);
    return filas;
  }
}
