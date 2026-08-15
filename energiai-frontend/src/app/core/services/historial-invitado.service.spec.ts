import { TestBed } from '@angular/core/testing';
import { AnalisisRequest } from '../models/analisis-request';
import { AnalisisResponse } from '../models/analisis-response';
import { HistorialInvitadoService } from './historial-invitado.service';

describe('HistorialInvitadoService', () => {
  let servicio: HistorialInvitadoService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(HistorialInvitadoService);
  });

  it('agrega análisis y los ordena de más reciente a más antiguo', () => {
    const respuesta: AnalisisResponse = {
      categoria: 'Eficiente',
      probabilidad: 0.9,
      recomendaciones: [],
      costo_estimado_mensual: 150,
      nivel_analisis: 'basico',
      campos_imputados: [],
    };
    servicio.agregar(entradaValida(), respuesta);
    servicio.agregar(entradaValida(), respuesta);

    const lista = servicio.listar();
    expect(lista.length).toBe(2);
    expect(lista[0].id).toBe(2);
    expect(lista[1].id).toBe(1);
    expect(lista[0].consumoKwh).toBe(250);
    expect(lista[0].categoria).toBe('Eficiente');
  });

  it('borra todo el historial', () => {
    const respuesta: AnalisisResponse = {
      categoria: 'Eficiente',
      probabilidad: 0.9,
      recomendaciones: [],
      costo_estimado_mensual: 150,
      nivel_analisis: 'basico',
      campos_imputados: [],
    };
    servicio.agregar(entradaValida(), respuesta);
    servicio.borrarTodo();
    expect(servicio.listar()).toEqual([]);
  });

  it('recupera los registros persistidos en el navegador', () => {
    const respuesta: AnalisisResponse = {
      categoria: 'Moderado',
      probabilidad: 0.7,
      recomendaciones: [],
      costo_estimado_mensual: 200,
      nivel_analisis: 'basico',
      campos_imputados: [],
    };
    servicio.agregar(entradaValida(), respuesta);
    const nuevo = TestBed.inject(HistorialInvitadoService);
    expect(nuevo.listar().length).toBe(1);
    expect(nuevo.listar()[0].categoria).toBe('Moderado');
  });

  it('ignora datos corruptos y devuelve una lista vacía', () => {
    localStorage.setItem('energiai_historial_invitado', '{no-es-json');
    expect(servicio.listar()).toEqual([]);
  });
});

function entradaValida(): AnalisisRequest {
  return {
    consumo_kwh: 250,
    uso_horario_pico: false,
    cantidad_equipos: 8,
    tipo_inmueble: 'Casa',
    horas_alto_consumo: 4,
    equipos_alto_consumo: 2,
    dispositivos_alto: 2,
    dispositivos_medio: 3,
    dispositivos_bajo: 3,
  };
}