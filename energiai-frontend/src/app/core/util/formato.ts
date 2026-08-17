/**
 * Helpers de formato compartidos (locale pt-BR, moneda BRL).
 * Evitan duplicar toLocaleString/Intl en cada componente.
 */

const LOCALE = 'pt-BR';

function aNumero(valor: number | null | undefined): number | null {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) ? numero : null;
}

export function formatearMoneda(valor: number | null | undefined): string {
  const numero = aNumero(valor);
  return numero === null
    ? '—'
    : numero.toLocaleString(LOCALE, { style: 'currency', currency: 'BRL' });
}

export function formatearNumero(
  valor: number | null | undefined,
  decimales = 1,
): string {
  const numero = aNumero(valor);
  return numero === null
    ? '—'
    : numero.toLocaleString(LOCALE, {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      });
}

export function formatearProbabilidad(valor: number | null | undefined): string {
  const numero = aNumero(valor);
  return numero === null ? '—' : `${Math.round(numero * 100)}%`;
}

function formatearFechaCon(opciones: Intl.DateTimeFormatOptions) {
  return (fecha: string | Date): string => {
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime())
      ? '—'
      : new Intl.DateTimeFormat(LOCALE, opciones).format(valor);
  };
}

export const formatearFecha = formatearFechaCon({
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export const formatearFechaHora = formatearFechaCon({
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatearFechaCorta = formatearFechaCon({
  day: '2-digit',
  month: 'short',
});

export function nivelCategoria(
  categoria: string | null | undefined,
): 1 | 2 | 3 {
  const valor = (categoria ?? '').toLowerCase();
  if (valor.includes('ineficiente')) return 1;
  if (valor.includes('moderado') || valor.includes('medio') || valor.includes('normal')) return 2;
  if (valor.includes('eficiente')) return 3;
  return 2;
}

/** Clases Bootstrap para insignias de categoría (resultado de análisis / historial). */
export function claseCategoriaBootstrap(
  categoria: string | null | undefined,
): string {
  const nivel = nivelCategoria(categoria);
  return nivel === 3
    ? 'bg-success'
    : nivel === 2
      ? 'bg-warning text-white'
      : 'bg-danger';
}