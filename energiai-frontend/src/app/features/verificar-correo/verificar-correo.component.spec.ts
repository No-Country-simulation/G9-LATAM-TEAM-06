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
});