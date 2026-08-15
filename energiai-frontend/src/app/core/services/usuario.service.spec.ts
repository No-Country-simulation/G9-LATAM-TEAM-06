import { TestBed } from '@angular/core/testing';
import {
  MAXIMO_CORREO_USUARIO,
  UsuarioService,
  errorCorreoUsuario,
} from './usuario.service';

describe('UsuarioService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('normaliza y guarda únicamente correos válidos', () => {
    const servicio = TestBed.inject(UsuarioService);
    servicio.setUsuario('  Persona@Ejemplo.COM  ');
    expect(servicio.usuarioActual).toBe('persona@ejemplo.com');
    expect(localStorage.getItem('energiai_usuario')).toBe('persona@ejemplo.com');
  });

  it('rechaza identificadores inválidos o demasiado largos', () => {
    const servicio = TestBed.inject(UsuarioService);
    servicio.setUsuario('correo-sin-dominio');
    expect(servicio.usuario()).toBe('');
    expect(localStorage.getItem('energiai_usuario')).toBeNull();
    expect(errorCorreoUsuario(`${'a'.repeat(MAXIMO_CORREO_USUARIO)}@x.com`)).toContain('100');
  });

  it('emite el cambio de usuario de forma asíncrona al cambiar o cerrar sesión', () => {
    const servicio = TestBed.inject(UsuarioService);
    const eventos: string[] = [];
    const suscripcion = servicio.cambioUsuario.subscribe((correo) =>
      eventos.push(correo),
    );

    servicio.setUsuario('Nuevo@Usuario.com');
    servicio.setUsuario('otro@usuario.com');
    servicio.limpiar();

    suscripcion.unsubscribe();

    expect(eventos).toEqual(['nuevo@usuario.com', 'otro@usuario.com', '']);
    expect(servicio.usuarioActual).toBe('invitado');
  });

  it('no emite cambios cuando el correo es inválido', () => {
    const servicio = TestBed.inject(UsuarioService);
    let emisiones = 0;
    const suscripcion = servicio.cambioUsuario.subscribe(() => emisiones++);

    servicio.setUsuario('correo-invalido');

    suscripcion.unsubscribe();

    expect(emisiones).toBe(0);
  });

  it('aplica la misma regla de correo que el backend', () => {
    expect(errorCorreoUsuario('a@-dominio.com')).not.toBe('');
    expect(errorCorreoUsuario('ñandú@dominio.com')).not.toBe('');
    expect(errorCorreoUsuario('alguien@sub.dominio.com')).toBe('');
  });

  it('marca el correo como verificado y persiste el estado', () => {
    const servicio = TestBed.inject(UsuarioService);
    expect(servicio.esVerificado()).toBeFalse();
    servicio.marcarVerificado('Persona@Ejemplo.COM');
    expect(servicio.esVerificado()).toBeTrue();
    expect(servicio.usuarioActual).toBe('persona@ejemplo.com');
    expect(localStorage.getItem('energiai_usuario_verificado')).toBe('1');
  });

  it('recupera el estado verificado al volver a crear el servicio', () => {
    const servicio = TestBed.inject(UsuarioService);
    servicio.marcarVerificado('persona@ejemplo.com');
    TestBed.resetTestingModule();
    const nuevo = TestBed.inject(UsuarioService);
    expect(nuevo.esVerificado()).toBeTrue();
    expect(nuevo.usuarioActual).toBe('persona@ejemplo.com');
  });

  it('al limpiar vuelve a invitado y conserva el historial local', () => {
    const servicio = TestBed.inject(UsuarioService);
    servicio.marcarVerificado('persona@ejemplo.com');
    localStorage.setItem('energiai_historial_invitado', '[{"id":1}]');
    servicio.limpiar();
    expect(servicio.esVerificado()).toBeFalse();
    expect(servicio.usuarioActual).toBe('invitado');
    expect(localStorage.getItem('energiai_usuario_verificado')).toBeNull();
    expect(localStorage.getItem('energiai_historial_invitado')).toBe('[{"id":1}]');
  });
});
