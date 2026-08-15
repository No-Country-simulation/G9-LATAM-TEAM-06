import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

const CLAVE_USUARIO = 'energiai_usuario';
export const MAXIMO_CORREO_USUARIO = 100;
// Misma regex que el backend (AnalisisRequest.REGEX_USUARIO_VALIDO, sin "invitado").
const FORMATO_CORREO =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function normalizarCorreoUsuario(correo: string): string {
  return (correo ?? '').trim().toLowerCase();
}

export function errorCorreoUsuario(correo: string): string {
  const normalizado = normalizarCorreoUsuario(correo);
  if (!normalizado) return 'Ingresa un correo para separar correctamente el historial.';
  if (normalizado.length > MAXIMO_CORREO_USUARIO) return `El correo no puede superar ${MAXIMO_CORREO_USUARIO} caracteres.`;
  if (!FORMATO_CORREO.test(normalizado)) return 'Ingresa un correo válido, por ejemplo nombre@dominio.com.';
  return '';
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly usuarioSignal = signal<string>(this.cargarUsuario());
  private readonly cambiosUsuario = new Subject<string>();

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly cambioUsuario = this.cambiosUsuario.asObservable();

  get usuarioActual(): string {
    return this.usuarioSignal() || 'invitado';
  }

  setUsuario(correo: string): void {
    const usuario = normalizarCorreoUsuario(correo);
    if (errorCorreoUsuario(usuario)) {
      return;
    }
    this.usuarioSignal.set(usuario);
    if (usuario) {
      localStorage.setItem(CLAVE_USUARIO, usuario);
    } else {
      localStorage.removeItem(CLAVE_USUARIO);
    }
    this.cambiosUsuario.next(usuario);
  }

  limpiar(): void {
    this.usuarioSignal.set('');
    localStorage.removeItem(CLAVE_USUARIO);
    this.cambiosUsuario.next('');
  }

  private cargarUsuario(): string {
    const guardado = normalizarCorreoUsuario(localStorage.getItem(CLAVE_USUARIO) ?? '');
    if (guardado && errorCorreoUsuario(guardado)) {
      localStorage.removeItem(CLAVE_USUARIO);
      return '';
    }
    return guardado;
  }
}
