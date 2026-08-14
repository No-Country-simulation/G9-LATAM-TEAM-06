import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize, tap } from 'rxjs';
import { AnalisisRequest } from '../../core/models/analisis-request';
import { AnalisisResponse } from '../../core/models/analisis-response';
import {
  DIAS_FACTURADOS,
  HORAS_AIRE_ACONDICIONADO,
  LIMITES_INMUEBLE,
  TipoInmueble,
} from '../../core/models/model-domain';
import { AnalisisService } from '../../core/services/analisis.service';
import { UsuarioService } from '../../core/services/usuario.service';
import {
  CampoEntradaModelo,
  ProblemaEntradaModelo,
  problemasDelCampo,
  validarEntradaModelo,
} from '../../core/validation/model-input-validator';
import { PageTitleComponent } from '../../layout/page-title';
import { DatosAvanzadosComponent } from './datos-avanzados/datos-avanzados.component';
import { ResultadoAnalisisComponent } from './resultado-analisis/resultado-analisis.component';

function validarDominioModelo(grupo: AbstractControl): ValidationErrors | null {
  const problemas = validarEntradaModelo(grupo.getRawValue());
  return problemas.length ? { dominioModelo: problemas } : null;
}

@Component({
  selector: 'app-analisis-general',
  imports: [
    ReactiveFormsModule,
    PageTitleComponent,
    DatosAvanzadosComponent,
    ResultadoAnalisisComponent,
  ],
  templateUrl: './analisis-general.component.html',
  styleUrl: './analisis-general.component.scss',
})
export class AnalisisGeneralComponent {
  private readonly fb = inject(FormBuilder);
  private readonly analisisService = inject(AnalisisService);
  readonly usuarioService = inject(UsuarioService);

  readonly formulario: FormGroup = this.fb.nonNullable.group(
    {
      consumo_kwh: [250, [Validators.required, Validators.min(40), Validators.max(5000)]],
      tipo_inmueble: ['Casa' as TipoInmueble, [Validators.required]],
      cantidad_equipos: [8, [Validators.required, Validators.min(1), Validators.max(500)]],
      horas_alto_consumo: [6, [Validators.required, Validators.min(0), Validators.max(24)]],
      uso_horario_pico: [true],
      dispositivos_alto: [2, [Validators.required, Validators.min(0), Validators.max(500)]],
      dispositivos_medio: [3, [Validators.required, Validators.min(0), Validators.max(500)]],
      dispositivos_bajo: [3, [Validators.required, Validators.min(0), Validators.max(500)]],
      cantidad_personas: [null as number | null, [Validators.min(1), Validators.max(30)]],
      area_m2: [null as number | null, [Validators.min(30), Validators.max(420)]],
      horas_aire_acondicionado: [
        null as number | null,
        [Validators.min(HORAS_AIRE_ACONDICIONADO.min), Validators.max(HORAS_AIRE_ACONDICIONADO.max)],
      ],
      consumo_mes_anterior_kwh: [
        null as number | null,
        [Validators.min(35), Validators.max(5000)],
      ],
      dias_facturados: [
        null as number | null,
        [Validators.min(DIAS_FACTURADOS.min), Validators.max(DIAS_FACTURADOS.max)],
      ],
    },
    { validators: [validarDominioModelo] },
  );

  readonly cargando = signal(false);
  readonly errorSignal = signal<string>('');
  readonly resultado = signal<AnalisisResponse | null>(null);
  readonly avanzadoAbierto = signal(false);

  get problemasModelo(): ProblemaEntradaModelo[] {
    return this.formulario.errors?.['dominioModelo'] ?? [];
  }

  get mensajeSumaEquipos(): string {
    return this.problemasModelo.find(
      (problema) =>
        problema.codigo === 'coherencia' && problema.campo === 'cantidad_equipos',
    )?.mensaje ?? '';
  }

  get mensajesDominio(): string[] {
    return this.problemasModelo
      .filter((problema) => problema.mensaje !== this.mensajeSumaEquipos)
      .map((problema) => problema.mensaje);
  }

  mensajesCampo(campo: CampoEntradaModelo): string[] {
    return problemasDelCampo(this.problemasModelo, campo);
  }

  campoInvalido(campo: CampoEntradaModelo): boolean {
    const control = this.formulario.get(campo);
    return Boolean(
      control?.touched && (control.invalid || this.mensajesCampo(campo).length),
    );
  }

  get tipoActual(): TipoInmueble {
    return this.formulario.get('tipo_inmueble')?.value as TipoInmueble;
  }

  get limitesActuales() {
    return LIMITES_INMUEBLE[this.tipoActual] ?? LIMITES_INMUEBLE.Casa;
  }

  get maximoEquiposAlto(): number {
    const total = Number(this.formulario.get('cantidad_equipos')?.value ?? 0);
    return Math.max(0, Math.min(this.limitesActuales.equiposAlto.max, total));
  }

  get horasTotalesPeriodo(): number | null {
    const horas = Number(this.formulario.get('horas_alto_consumo')?.value);
    const dias = Number(this.formulario.get('dias_facturados')?.value);
    return Number.isFinite(horas) && Number.isFinite(dias) && dias > 0
      ? Math.round(horas * dias * 10) / 10
      : null;
  }

  alternarAvanzado(): void {
    this.avanzadoAbierto.update((abierto) => !abierto);
  }

  enviar(): void {
    this.formulario.updateValueAndValidity();
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.errorSignal.set(
        this.mensajeSumaEquipos ||
          'Revisa los campos marcados. No enviaremos datos fuera del dominio entrenado.',
      );
      return;
    }

    const solicitud = this.mapearSolicitud(this.formulario.getRawValue());
    const problemasFinales = validarEntradaModelo(solicitud);
    if (problemasFinales.length) {
      this.formulario.markAllAsTouched();
      this.errorSignal.set(
        'Los datos cambiaron o no pertenecen al dominio entrenado. Corrige los campos indicados.',
      );
      return;
    }

    this.errorSignal.set('');
    this.cargando.set(true);
    this.analisisService
      .crearAnalisis(solicitud, this.usuarioService.usuarioActual)
      .pipe(
        tap((data) => this.resultado.set(data)),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: () => void 0,
        error: () =>
          this.errorSignal.set(
            'No pudimos procesar los datos. Revisa los valores o intenta más tarde.',
          ),
      });
  }

  private mapearSolicitud<T extends Record<string, unknown>>(crudo: T): AnalisisRequest {
    const opcional = (campo: string): number | null => {
      const valor = crudo[campo];
      if (valor === null || valor === undefined || valor === '') return null;
      const numero = Number(valor);
      return Number.isFinite(numero) ? numero : null;
    };

    return {
      consumo_kwh: Number(crudo['consumo_kwh']),
      uso_horario_pico: crudo['uso_horario_pico'] === true,
      cantidad_equipos: Number(crudo['cantidad_equipos']),
      tipo_inmueble: crudo['tipo_inmueble'] as TipoInmueble,
      horas_alto_consumo: Number(crudo['horas_alto_consumo']),
      cantidad_personas: opcional('cantidad_personas'),
      area_m2: opcional('area_m2'),
      equipos_alto_consumo: Number(crudo['dispositivos_alto']),
      horas_aire_acondicionado: opcional('horas_aire_acondicionado'),
      consumo_mes_anterior_kwh: opcional('consumo_mes_anterior_kwh'),
      dias_facturados: opcional('dias_facturados'),
      dispositivos_alto: Number(crudo['dispositivos_alto']),
      dispositivos_medio: Number(crudo['dispositivos_medio']),
      dispositivos_bajo: Number(crudo['dispositivos_bajo']),
    };
  }
}
