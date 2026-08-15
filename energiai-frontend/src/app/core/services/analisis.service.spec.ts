import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnalisisRequest } from '../models/analisis-request';
import { AnalisisService } from './analisis.service';

describe('AnalisisService', () => {
  let servicio: AnalisisService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(AnalisisService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('bloquea solicitudes inválidas antes de tocar la red', () => {
    const invalida = { ...entradaValida(), consumo_kwh: Number.NaN };
    let mensaje = '';
    servicio.crearAnalisis(invalida, 'persona@ejemplo.com').subscribe({
      error: (error: Error) => { mensaje = error.message; },
    });
    expect(mensaje).toContain('Solicitud bloqueada');
    http.expectNone(() => true);
  });

  it('normaliza el usuario y envía una solicitud válida', () => {
    servicio.crearAnalisis(entradaValida(), ' Persona@Ejemplo.COM ').subscribe();
    const solicitud = http.expectOne((req) => req.method === 'POST');
    expect(solicitud.request.body.usuarioId).toBe('persona@ejemplo.com');
    solicitud.flush({ categoria: 'Eficiente', probabilidad: .9, recomendaciones: [], costo_estimado_mensual: 187.5, nivel_analisis: 'basico', campos_imputados: [] });
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
