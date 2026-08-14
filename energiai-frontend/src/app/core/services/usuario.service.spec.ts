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
});
