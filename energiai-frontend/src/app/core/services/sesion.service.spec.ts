import { TestBed } from '@angular/core/testing';
import { SesionService } from './sesion.service';
import { UsuarioService } from './usuario.service';

describe('SesionService', () => {
  let servicio: SesionService;
  let usuarioService: UsuarioService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(SesionService);
    usuarioService = TestBed.inject(UsuarioService);
  });

  afterEach(() => {
    servicio.detener();
  });

  it('registra la última actividad al iniciar', () => {
    servicio.iniciar();
    expect(Number(localStorage.getItem('energiai_ultima_actividad'))).toBeGreaterThan(0);
    servicio.detener();
  });

  it('vuelve a invitado conservando el historial local al expirar la sesión', () => {
    const hace31Minutos = Date.now() - 31 * 60_000;
    localStorage.setItem('energiai_ultima_actividad', String(hace31Minutos));
    localStorage.setItem('energiai_historial_invitado', '[{"id":1}]');
    usuarioService.marcarVerificado('persona@ejemplo.com');

    servicio.iniciar();

    expect(usuarioService.esVerificado()).toBeFalse();
    expect(usuarioService.usuarioActual).toBe('invitado');
    expect(localStorage.getItem('energiai_historial_invitado')).toBe('[{"id":1}]');
    servicio.detener();
  });

  it('no cambia nada si la sesión aún no expira', () => {
    localStorage.setItem('energiai_ultima_actividad', String(Date.now()));
    usuarioService.marcarVerificado('persona@ejemplo.com');

    servicio.iniciar();

    expect(usuarioService.esVerificado()).toBeTrue();
    servicio.detener();
  });

  it('deja intacta la sesión de invitado aunque el tiempo haya pasado', () => {
    const hace31Minutos = Date.now() - 31 * 60_000;
    localStorage.setItem('energiai_ultima_actividad', String(hace31Minutos));

    servicio.iniciar();

    expect(usuarioService.esVerificado()).toBeFalse();
    expect(usuarioService.usuarioActual).toBe('invitado');
    servicio.detener();
  });
});