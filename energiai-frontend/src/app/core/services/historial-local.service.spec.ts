import { TestBed } from '@angular/core/testing';
import { HistorialResponse } from '../models/historial-response';
import { Paginacion } from '../models/paginacion';
import { HistorialLocalService } from './historial-local.service';

describe('HistorialLocalService', () => {
  let servicio: HistorialLocalService;

  beforeEach(() => {
    localStorage.removeItem('energiai_historial_oculto_hasta_id');
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(HistorialLocalService);
  });

  afterEach(() => localStorage.removeItem('energiai_historial_oculto_hasta_id'));

  it('oculta registros existentes sin modificar la respuesta original', () => {
    const pagina = crearPagina([crearRegistro(12), crearRegistro(11), crearRegistro(10)]);
    servicio.ocultarHasta(' Persona@Ejemplo.com ', 11);

    const filtrada = servicio.filtrarPagina('persona@ejemplo.com', pagina);

    expect(filtrada.content.map((item) => item.id)).toEqual([12]);
    expect(pagina.content.map((item) => item.id)).toEqual([12, 11, 10]);
    expect(filtrada.last).toBeTrue();
  });

  it('restaura el historial local del usuario', () => {
    const pagina = crearPagina([crearRegistro(3), crearRegistro(2)]);
    servicio.ocultarHasta('invitado', 3);
    expect(servicio.filtrarPagina('invitado', pagina).content).toEqual([]);

    servicio.restaurar('invitado');

    expect(servicio.filtrarPagina('invitado', pagina).content.length).toBe(2);
    expect(servicio.estaOculto('invitado')).toBeFalse();
  });
});

function crearPagina(content: HistorialResponse[]): Paginacion<HistorialResponse> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 10,
    number: 0,
    numberOfElements: content.length,
    first: true,
    last: true,
    empty: content.length === 0,
  };
}

function crearRegistro(id: number): HistorialResponse {
  return {
    id,
    creadoEn: '2026-08-14T12:00:00',
    usuario: 'invitado',
    consumoKwh: 250,
    tipoInmueble: 'Casa',
    cantidadEquipos: 8,
    horasAltoConsumo: 4,
    usoHorarioPico: false,
    categoria: 'Eficiente',
    probabilidad: 0.9,
    costo_estimado_mensual: 187.5,
    recomendaciones: [],
  };
}
