import { Injectable, signal } from '@angular/core';

const CLAVE_USUARIO = 'energiai_usuario';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly usuarioSignal = signal<string>(this.cargarUsuario());

  readonly usuario = this.usuarioSignal.asReadonly();

  get usuarioActual(): string {
    return this.usuarioSignal();
  }

  setUsuario(correo: string): void {
    this.usuarioSignal.set(correo);
    localStorage.setItem(CLAVE_USUARIO, correo);
  }

  limpiar(): void {
    this.setUsuario('');
  }

  private cargarUsuario(): string {
    return localStorage.getItem(CLAVE_USUARIO) ?? '';
  }
}