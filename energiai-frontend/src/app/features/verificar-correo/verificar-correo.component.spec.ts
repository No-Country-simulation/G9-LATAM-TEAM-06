import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HistorialInvitadoService } from '../../core/services/historial-invitado.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { VerificarCorreoComponent } from './verificar-correo.component';

describe('VerificarCorreoComponent', () => {
  let fixture: ComponentFixture<VerificarCorreoComponent>;
  let componente: VerificarCorreoComponent;
  let http: HttpTestingController;
  let router: Router;
  let usuarioService: UsuarioService;
  let historialInvitado: HistorialInvitadoService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [VerificarCorreoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerificarCorreoComponent);
    componente = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    usuarioService = TestBed.inject(UsuarioService);
    historialInvitado = TestBed.inject(HistorialInvitadoService);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('solicita un código para el correo indicado', () => {
    componente.correo = 'Persona@Ejemplo.COM';
    componente.enviarCodigo();

    const solicitud = http.expectOne((req) => req.method === 'POST' && req.url.includes('/verificacion/codigo'));
    expect(solicitud.request.body).toEqual({ email: 'persona@ejemplo.com' });
    solicitud.flush({ email: 'persona@ejemplo.com', verificado: false, mensaje: 'Código enviado', reintentosRestantes: 3 });

    expect(componente.paso()).toBe('codigo');
    expect(componente.correo).toBe('persona@ejemplo.com');
  });

  it('marca el correo como verificado y borra el historial local al ingresar un código correcto', () => {
    componente.correo = 'persona@ejemplo.com';
    localStorage.setItem('energiai_historial_invitado', '[{"id":1}]');
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);

    componente.verificar('123456');

    const solicitud = http.expectOne((req) => req.method === 'POST' && req.url.includes('/verificacion/verificar'));
    expect(solicitud.request.body).toEqual({ email: 'persona@ejemplo.com', codigo: '123456' });
    solicitud.flush({ email: 'persona@ejemplo.com', verificado: true, mensaje: 'Correo verificado', reintentosRestantes: 3 });

    expect(usuarioService.esVerificado()).toBeTrue();
    expect(usuarioService.usuarioActual).toBe('persona@ejemplo.com');
    expect(historialInvitado.listar()).toEqual([]);
    expect(navegar).toHaveBeenCalledWith(['/']);
  });

  it('muestra los intentos restantes cuando el código es incorrecto', () => {
    componente.correo = 'persona@ejemplo.com';
    componente.verificar('111111');

    const solicitud = http.expectOne((req) => req.method === 'POST' && req.url.includes('/verificacion/verificar'));
    solicitud.flush(
      { codigo: 'CODIGO_INCORRECTO', mensaje: 'Código incorrecto', reintentosRestantes: 2 },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(componente.intentos()).toBe(1);
    expect(componente.error()).toContain('2 intento');
  });

  it('ofrece solicitar otro código cuando se agotan los intentos', () => {
    componente.correo = 'persona@ejemplo.com';
    componente.verificar('111111');

    const solicitud = http.expectOne((req) => req.method === 'POST' && req.url.includes('/verificacion/verificar'));
    solicitud.flush(
      { codigo: 'CODIGO_AGOTADO', mensaje: 'Agotaste los intentos', reintentosRestantes: 0 },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(componente.codigoAgotado()).toBeTrue();
    expect(componente.error()).toContain('Agotaste');
  });

  it('navega a inicio cuando el usuario decide volver como invitado', () => {
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);
    componente.volverComoInvitado();
    expect(navegar).toHaveBeenCalledWith(['/']);
  });

  it('rechaza una dirección mal escrita sin llamar al servidor', () => {
    componente.correo = 'correo-sin-dominio';
    componente.enviarCodigo();
    expect(componente.errorCampoCorreo()).toContain('válido');
    http.expectNone(() => true);
  });

  it('muestra el mensaje del servidor cuando la validación de correo falla', () => {
    componente.correo = 'correo-sin-dominio';
    componente.enviarCodigo();
    http.expectNone(() => true);
  });

  it('traduce un fallo de envío con un mensaje claro', () => {
    componente.correo = 'persona@ejemplo.com';
    componente.enviarCodigo();

    const solicitud = http.expectOne((req) => req.method === 'POST' && req.url.includes('/verificacion/codigo'));
    solicitud.flush(
      { codigo: 'ENVIO_CORREO_FALLIDO', mensaje: 'No se pudo enviar el código de verificación. Intenta más tarde.' },
      { status: 502, statusText: 'Bad Gateway' },
    );

    expect(componente.error()).toContain('No se pudo enviar el correo');
    expect(componente.error()).toContain('exista');
  });

  it('traduce el límite de solicitudes por IP', () => {
    componente.correo = 'persona@ejemplo.com';
    componente.enviarCodigo();

    const solicitud = http.expectOne((req) => req.method === 'POST' && req.url.includes('/verificacion/codigo'));
    solicitud.flush(
      { codigo: 'RATE_LIMIT_SUPERADO', mensaje: 'Demasiadas solicitudes', reintentosRestantes: 0 },
      { status: 429, statusText: 'Too Many Requests' },
    );

    expect(componente.error()).toContain('demasiados códigos');
  });

  it('valida el código de 6 dígitos antes de llamar al servidor', () => {
    componente.correo = 'persona@ejemplo.com';
    componente.verificar('123');
    expect(componente.error()).toContain('6 dígitos');
    http.expectNone(() => true);
  });

  it('ofrece solicitar otro código cuando no hay código pendiente', () => {
    componente.correo = 'persona@ejemplo.com';
    componente.verificar('123456');

    const solicitud = http.expectOne((req) => req.method === 'POST' && req.url.includes('/verificacion/verificar'));
    solicitud.flush(
      { codigo: 'CODIGO_NO_ENCONTRADO', mensaje: 'No hay un código pendiente' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(componente.codigoAgotado()).toBeTrue();
    expect(componente.error()).toContain('No hay un código pendiente');
  });
});