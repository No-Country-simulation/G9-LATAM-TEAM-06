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
});
