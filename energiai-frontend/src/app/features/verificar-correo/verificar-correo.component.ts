import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageTitleComponent } from '../../layout/page-title';
import {
  HistorialInvitadoService,
} from '../../core/services/historial-invitado.service';
import { UsuarioService } from '../../core/services/usuario.service';
import {
  VerificacionService,
  ErrorVerificacion,
} from '../../core/services/verificacion.service';

const MAXIMO_INTENTOS = 3;

@Component({
  selector: 'app-verificar-correo',
  imports: [FormsModule, PageTitleComponent],
  templateUrl: './verificar-correo.component.html',
  styleUrl: './verificar-correo.component.scss',
})
export class VerificarCorreoComponent {
  private readonly router = inject(Router);
  private readonly verificacionService = inject(VerificacionService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly historialInvitado = inject(HistorialInvitadoService);

  readonly paso = signal<'correo' | 'codigo'>('correo');
  readonly cargando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly intentos = signal(0);
  readonly codigoAgotado = signal(false);

  correo = '';
  codigoIngresado = '';

  enviarCodigo(): void {
    const correo = this.correo.trim().toLowerCase();
    if (!correo) {
      this.error.set('Ingresa un correo válido.');
      return;
    }
    this.error.set('');
    this.cargando.set(true);
    this.verificacionService
      .solicitarCodigo(correo)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (respuesta) => {
          this.correo = respuesta.email;
          this.mensaje.set(respuesta.mensaje);
          this.intentos.set(0);
          this.codigoAgotado.set(false);
          this.paso.set('codigo');
        },
        error: (err) => this.mostrarError(err),
      });
  }

  verificar(codigo: string): void {
    const valor = (codigo ?? '').trim();
    if (valor.length !== 6) {
      this.error.set('El código debe tener 6 dígitos.');
      return;
    }
    this.error.set('');
    this.cargando.set(true);
    this.verificacionService
      .verificarCodigo(this.correo, valor)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => {
          // Al verificar con éxito se borra el historial local (invitado) para no dejar basura.
          this.historialInvitado.borrarTodo();
          this.usuarioService.marcarVerificado(this.correo);
          this.router.navigate(['/']);
        },
        error: (err) => this.mostrarError(err),
      });
  }

  solicitarOtroCodigo(): void {
    this.intentos.set(0);
    this.codigoAgotado.set(false);
    this.error.set('');
    this.enviarCodigo();
  }

  volverComoInvitado(): void {
    this.router.navigate(['/']);
  }

  private mostrarError(err: unknown): void {
    const error = err as { error?: ErrorVerificacion } | undefined;
    const detalle = error?.error;
    if (detalle?.codigo === 'CODIGO_INCORRECTO') {
      const restantes = Math.max(0, MAXIMO_INTENTOS - (this.intentos() + 1));
      this.intentos.set(this.intentos() + 1);
      this.error.set(
        `Código incorrecto. Te quedan ${restantes} intento(s).`,
      );
      return;
    }
    if (detalle?.codigo === 'CODIGO_AGOTADO' || detalle?.codigo === 'CODIGO_EXPIRADO') {
      this.codigoAgotado.set(true);
      this.error.set(
        detalle.mensaje ?? 'Agotaste los intentos. Solicita un código nuevo.',
      );
      return;
    }
    this.error.set(detalle?.mensaje ?? 'No se pudo completar la verificación. Intenta más tarde.');
  }
}