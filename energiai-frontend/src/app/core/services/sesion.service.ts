import { Injectable, inject } from '@angular/core';
import { UsuarioService } from './usuario.service';

const CLAVE_ULTIMA_ACTIVIDAD = 'energiai_ultima_actividad';
const TIMEOUT_SESION_MIN = 30;

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly usuarioService = inject(UsuarioService);

  private intervalo?: ReturnType<typeof setInterval>;

  iniciar(): void {
    this.controlarArranque();
    window.addEventListener('visibilitychange', () => this.gestionarVisibilidad());
    window.addEventListener('focus', () => this.gestionarVisibilidad());
    window.addEventListener('pageshow', () => this.gestionarVisibilidad());
    window.addEventListener('beforeunload', () => this.registrarActividad());
    window.addEventListener('click', () => this.registrarActividad());
    window.addEventListener('keydown', () => this.registrarActividad());

    this.intervalo = setInterval(() => this.gestionarVisibilidad(), 60_000);
  }

  detener(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = undefined;
    }
  }

  private controlarArranque(): void {
    const existeRegistro = Boolean(localStorage.getItem(CLAVE_ULTIMA_ACTIVIDAD));
    if (!existeRegistro) {
      this.registrarActividad();
      return;
    }
    this.gestionarVisibilidad();
  }

  private gestionarVisibilidad(): void {
    if (document.visibilityState !== 'visible') {
      return;
    }
    if (this.sesionExpirada()) {
      this.expirarSesion();
      this.registrarActividad();
      return;
    }
    this.registrarActividad();
  }

  private sesionExpirada(): boolean {
    const ultima = Number(localStorage.getItem(CLAVE_ULTIMA_ACTIVIDAD) ?? 0);
    if (!ultima) {
      return false;
    }
    const minutos = (Date.now() - ultima) / 60_000;
    return minutos >= TIMEOUT_SESION_MIN;
  }

  private expirarSesion(): void {
    if (!this.usuarioService.esVerificado()) {
      return;
    }
    this.usuarioService.limpiar();
  }

  private registrarActividad(): void {
    localStorage.setItem(CLAVE_ULTIMA_ACTIVIDAD, String(Date.now()));
  }
}