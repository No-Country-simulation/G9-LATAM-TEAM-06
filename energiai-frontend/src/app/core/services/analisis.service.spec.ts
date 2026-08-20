import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnalisisRequest } from '../models/analisis-request';
import { AnalisisService } from './analisis.service';
import { HistorialInvitadoService } from './historial-invitado.service';
import { UsuarioService } from './usuario.service';

describe('AnalisisService', () => {
  let servicio: AnalisisService;
  let http: HttpTestingController;
  let usuarioService: UsuarioService;
  let historialInvitado: HistorialInvitadoService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(AnalisisService);
    http = TestBed.inject(HttpTestingController);
    usuarioService = TestBed.inject(UsuarioService);
    historialInvitado = TestBed.inject(HistorialInvitadoService);
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

  it('envía como invitado cuando el usuario no está verificado', () => {
    servicio.crearAnalisis(entradaValida(), 'persona@ejemplo.com').subscribe();
    const solicitud = http.expectOne((req) => req.method === 'POST');
    expect(solicitud.request.body.usuarioId).toBe('invitado');
    solicitud.flush({ categoria: 'Eficiente', probabilidad: .9, recomendaciones: [], costo_estimado_mensual: 187.5, nivel_analisis: 'basico', campos_imputados: [] });
  });

  it('guarda el análisis del invitado en el historial del navegador', () => {
    expect(historialInvitado.listar()).toEqual([]);
    servicio.crearAnalisis(entradaValida(), 'invitado').subscribe();
    const solicitud = http.expectOne((req) => req.method === 'POST');
    solicitud.flush({ categoria: 'Eficiente', probabilidad: .9, recomendaciones: [], costo_estimado_mensual: 187.5, nivel_analisis: 'basico', campos_imputados: [] });
    expect(historialInvitado.listar().length).toBe(1);
  });

  it('normaliza el usuario y envía una solicitud válida cuando está verificado', () => {
    usuarioService.marcarVerificado('persona@ejemplo.com');
    servicio.crearAnalisis(entradaValida(), ' Persona@Ejemplo.COM ').subscribe();
    const solicitud = http.expectOne((req) => req.method === 'POST');
    expect(solicitud.request.body.usuarioId).toBe('persona@ejemplo.com');
    solicitud.flush({ categoria: 'Eficiente', probabilidad: .9, recomendaciones: [], costo_estimado_mensual: 187.5, nivel_analisis: 'basico', campos_imputados: [] });
  });

  it('no guarda en el historial del navegador cuando el usuario está verificado', () => {
    usuarioService.marcarVerificado('persona@ejemplo.com');
    servicio.crearAnalisis(entradaValida(), 'persona@ejemplo.com').subscribe();
    const solicitud = http.expectOne((req) => req.method === 'POST');
    solicitud.flush({ categoria: 'Eficiente', probabilidad: .9, recomendaciones: [], costo_estimado_mensual: 187.5, nivel_analisis: 'basico', campos_imputados: [] });
    expect(historialInvitado.listar()).toEqual([]);
  });

  it('lista el historial del navegador para invitados sin tocar la red', () => {
    historialInvitado.agregar(entradaValida(), { categoria: 'Eficiente', probabilidad: .9, recomendaciones: [], costo_estimado_mensual: 187.5, nivel_analisis: 'basico', campos_imputados: [] });
    servicio.listarPorUsuario('invitado', null, 0, 10).subscribe((pagina) => {
      expect(pagina.content.length).toBe(1);
      expect(pagina.content[0].categoria).toBe('Eficiente');
    });
    http.expectNone(() => true);
  });

  it('borra el historial del navegador para invitados sin tocar la red', () => {
    historialInvitado.agregar(entradaValida(), { categoria: 'Eficiente', probabilidad: .9, recomendaciones: [], costo_estimado_mensual: 187.5, nivel_analisis: 'basico', campos_imputados: [] });
    servicio.borrarHistorial('invitado').subscribe();
    expect(historialInvitado.listar()).toEqual([]);
    http.expectNone(() => true);
  });

  it('borra el historial en la BD para usuarios verificados', () => {
    usuarioService.marcarVerificado('persona@ejemplo.com');
    servicio.borrarHistorial('persona@ejemplo.com').subscribe();
    const solicitud = http.expectOne((req) => req.method === 'DELETE');
    expect(solicitud.request.params.get('usuarioId')).toBe('persona@ejemplo.com');
    solicitud.flush(null);
  });

  it('borra la selección del navegador para invitados sin tocar la red', () => {
    historialInvitado.agregar(entradaValida(), { categoria: 'Eficiente', probabilidad: .9, recomendaciones: [], costo_estimado_mensual: 187.5, nivel_analisis: 'basico', campos_imputados: [] });
    historialInvitado.agregar(entradaValida(), { categoria: 'Moderado', probabilidad: .7, recomendaciones: [], costo_estimado_mensual: 200, nivel_analisis: 'basico', campos_imputados: [] });

    servicio.borrarSeleccion('invitado', [1]).subscribe();

    const restantes = historialInvitado.listar();
    expect(restantes.map((item) => item.id)).toEqual([2]);
    http.expectNone(() => true);
  });

  it('borra la selección en la BD para usuarios verificados', () => {
    usuarioService.marcarVerificado('persona@ejemplo.com');
    servicio.borrarSeleccion('persona@ejemplo.com', [3, 7]).subscribe();
    const solicitud = http.expectOne((req) => req.method === 'DELETE');
    expect(solicitud.request.url).toContain('/seleccion');
    expect(solicitud.request.params.get('usuarioId')).toBe('persona@ejemplo.com');
    expect(solicitud.request.params.get('ids')).toBe('3,7');
    solicitud.flush(null);
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