import { validarEntradaModelo } from './model-input-validator';

describe('validarEntradaModelo', () => {
  const entradaValida = () => ({
    consumo_kwh: 250,
    uso_horario_pico: false,
    cantidad_equipos: 8,
    tipo_inmueble: 'Casa',
    horas_alto_consumo: 4,
    dispositivos_alto: 2,
    dispositivos_medio: 3,
    dispositivos_bajo: 3,
  });

  it('acepta un registro básico completo dentro del dominio', () => {
    expect(validarEntradaModelo(entradaValida())).toEqual([]);
  });

  it('no convierte campos obligatorios vacíos con mínimo cero en valores válidos', () => {
    const entrada = { ...entradaValida(), horas_alto_consumo: '', dispositivos_alto: '' };
    const problemas = validarEntradaModelo(entrada);
    expect(problemas.some((item) => item.campo === 'horas_alto_consumo' && item.codigo === 'obligatorio')).toBeTrue();
    expect(problemas.some((item) => item.campo === 'dispositivos_alto' && item.codigo === 'obligatorio')).toBeTrue();
  });

  it('rechaza NaN, Infinity, booleanos y decimales en campos enteros', () => {
    const problemas = validarEntradaModelo({
      ...entradaValida(),
      consumo_kwh: Number.NaN,
      cantidad_equipos: Number.POSITIVE_INFINITY,
      horas_alto_consumo: 4.5,
      dispositivos_alto: true,
    });
    expect(problemas.map((item) => item.campo)).toContain('consumo_kwh');
    expect(problemas.map((item) => item.campo)).toContain('cantidad_equipos');
    expect(problemas.some((item) => item.codigo === 'entero')).toBeTrue();
    expect(problemas.map((item) => item.campo)).toContain('dispositivos_alto');
  });

  it('aplica límites avanzados específicos del inmueble', () => {
    const problemas = validarEntradaModelo({
      ...entradaValida(),
      tipo_inmueble: 'Apartamento',
      cantidad_personas: 8,
      area_m2: 181,
    });
    expect(problemas.some((item) => item.campo === 'cantidad_personas' && item.codigo === 'rango')).toBeTrue();
    expect(problemas.some((item) => item.campo === 'area_m2' && item.codigo === 'rango')).toBeTrue();
  });

  it('limita variables continuas a dos decimales', () => {
    const problemas = validarEntradaModelo({
      ...entradaValida(),
      area_m2: 85.123,
      consumo_mes_anterior_kwh: 230.999,
    });
    expect(problemas.filter((item) => item.codigo === 'decimales').length).toBe(2);
  });

  it('rechaza distribuciones incoherentes o duplicados contradictorios', () => {
    const problemas = validarEntradaModelo({
      ...entradaValida(),
      dispositivos_alto: 4,
      equipos_alto_consumo: 2,
    });
    expect(problemas.some((item) => item.codigo === 'coherencia')).toBeTrue();
    expect(problemas.some((item) => item.campo === 'equipos_alto_consumo')).toBeTrue();
  });
});
