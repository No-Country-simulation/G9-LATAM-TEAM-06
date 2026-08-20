import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { PageTitleComponent } from '../../layout/page-title';
import {
  HistorialInvitadoService,
} from '../../core/services/historial-invitado.service';
import { AnalisisService } from '../../core/services/analisis.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { errorCorreoUsuario } from '../../core/services/usuario.service';
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
  private readonly analisisService = inject(AnalisisService);
  private readonly historialInvitado = inject(HistorialInvitadoService);

  readonly paso = signal<'correo' | 'codigo'>('correo');
  readonly cargando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly errorCampoCorreo = signal('');
  readonly intentos = signal(0);
  readonly codigoAgotado = signal(false);

  correo = '';
  codigoIngresado = '';

  enviarCodigo(): void {
    const correo = this.correo.trim().toLowerCase();
    const errorValidacion = errorCorreoUsuario(correo);
    if (errorValidacion) {
      this.errorCampoCorreo.set(errorValidacion);
      return;
    }
    this.errorCampoCorreo.set('');
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
      this.error.set('El código debe tener exactamente 6 dígitos.');
      return;
    }
    this.error.set('');
    this.cargando.set(true);
    this.verificacionService
      .verificarCodigo(this.correo, valor)
      .pipe(
        finalize(() => this.cargando.set(false)),
        switchMap(() => {
          // Al verificar con éxito se migran los análisis de invitado (localStorage) a la BD.
          this.usuarioService.marcarVerificado(this.correo);
          return this.analisisService.migrarHistorial(this.correo);
        }),
      )
      .subscribe({
        next: () => {
          // Si la migración se completa (o no había nada local) se elimina la copia local.
          this.historialInvitado.borrarTodo();
          this.router.navigate(['/']);
        },
        error: (err) => {
          // La verificación ya se completó: se navega a inicio conservando los datos
          // locales por si la migración puede reintentarse en otro momento.
          this.mostrarError(err);
          this.router.navigate(['/']);
        },
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
    const codigo = detalle?.codigo ?? 'DESCONOCIDO';

    switch (codigo) {
      case 'CODIGO_INCORRECTO': {
        const restantes = Math.max(0, MAXIMO_INTENTOS - (this.intentos() + 1));
        this.intentos.set(this.intentos() + 1);
        this.error.set(
          `Código incorrecto. Te quedan ${restantes} intento(s).`,
        );
        return;
      }
      case 'CODIGO_AGOTADO':
        this.codigoAgotado.set(true);
        this.error.set(
          detalle?.mensaje ??
            'Agotaste los intentos. Solicita un código nuevo.',
        );
        return;
      case 'CODIGO_EXPIRADO':
        this.codigoAgotado.set(true);
        this.error.set(
          detalle?.mensaje ??
            'El código expiró. Solicita uno nuevo.',
        );
        return;
      case 'CODIGO_NO_ENCONTRADO':
        this.codigoAgotado.set(true);
        this.error.set(
          detalle?.mensaje ??
            'No hay un código pendiente para este correo. Solicita uno nuevo.',
        );
        return;
      case 'RATE_LIMIT_SUPERADO':
        this.error.set(
          'Se enviaron demasiados códigos desde este dispositivo. Espera un poco e inténtalo de nuevo.',
        );
        return;
      case 'SMTP_NO_CONFIGURADO':
        this.error.set(
          'El servicio de correo no está disponible por ahora. Intenta más tarde.',
        );
        return;
      case 'ENVIO_CORREO_FALLIDO':
        this.error.set(
          'No se pudo enviar el correo. Revisa que la dirección sea correcta y que exista, o inténtalo de nuevo.',
        );
        return;
      case 'VALIDATION_ERROR': {
        const detalles = (detalle as unknown as { detalles?: Record<string, string> })?.detalles;
        const mensajeCampo = detalles ? Object.values(detalles).join(' ') : '';
        this.errorCampoCorreo.set(
          mensajeCampo || 'Revisa la dirección de correo: no tiene un formato válido.',
        );
        return;
      }
      default:
        this.error.set(
          detalle?.mensaje ??
            'No se pudo completar la verificación. Intenta nuevamente.',
        );
        return;
    }
  }
}