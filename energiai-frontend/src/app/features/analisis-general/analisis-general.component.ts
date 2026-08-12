import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize, tap } from 'rxjs';
import { AnalisisService } from '../../core/services/analisis.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { AnalisisRequest } from '../../core/models/analisis-request';
import { AnalisisResponse } from '../../core/models/analisis-response';
import { PageTitleComponent } from '../../layout/page-title';
import { DatosAvanzadosComponent } from './datos-avanzados/datos-avanzados.component';
import { ResultadoAnalisisComponent } from './resultado-analisis/resultado-analisis.component';

function validarSumaEquipos(grupo: AbstractControl): ValidationErrors | null {
  const cantidad = Number(grupo.get('cantidad_equipos')?.value ?? 0);
  const suma =
    Number(grupo.get('dispositivos_alto')?.value ?? 0) +
    Number(grupo.get('dispositivos_medio')?.value ?? 0) +
    Number(grupo.get('dispositivos_bajo')?.value ?? 0);
  return suma === cantidad ? null : { sumaEquipos: { suma, cantidad } };
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
      consumo_kwh: [250, [Validators.required, Validators.min(1)]],
      tipo_inmueble: ['Residencial', [Validators.required]],
      cantidad_equipos: [5, [Validators.required, Validators.min(1)]],
      horas_alto_consumo: [6, [Validators.required, Validators.min(0), Validators.max(24)]],
      uso_horario_pico: [true],
      dispositivos_alto: [0, [Validators.min(0)]],
      dispositivos_medio: [0, [Validators.min(0)]],
      dispositivos_bajo: [0, [Validators.min(0)]],
      cantidad_personas: [null as number | null],
      area_m2: [null as number | null],
      equipos_alto_consumo: [null as number | null],
      horas_aire_acondicionado: [null as number | null],
      consumo_mes_anterior_kwh: [null as number | null],
      dias_facturados: [null as number | null],
    },
    { validators: [validarSumaEquipos] },
  );

  readonly cargando = signal(false);
  readonly errorSignal = signal<string>('');
  readonly resultado = signal<AnalisisResponse | null>(null);
  readonly avanzadoAbierto = signal(false);

  get mensajeSumaEquipos(): string {
    const error = this.formulario.errors?.['sumaEquipos'];
    if (!error) {
      return '';
    }
    return `La suma de los equipos de alto, medio y bajo consumo debe ser (${error.cantidad})`;
  }

  alternarAvanzado(): void {
    this.avanzadoAbierto.update((abierto) => !abierto);
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.errorSignal.set(this.mensajeSumaEquipos || 'Revisa los campos del formulario.');
      return;
    }

    this.errorSignal.set('');
    this.cargando.set(true);

    const crudo = this.formulario.getRawValue();
    const solicitud: AnalisisRequest = this.mapearSolicitud(crudo);

    this.analisisService
      .crearAnalisis(solicitud, this.usuarioService.usuarioActual)
      .pipe(
        tap((data) => {
          this.resultado.set(data);
        }),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: () => void 0,
        error: () =>
          this.errorSignal.set(
            'Error al cargar, intente más tarde o verifique su conexión a internet.',
          ),
      });
  }

  private mapearSolicitud<T extends Record<string, unknown>>(crudo: T): AnalisisRequest {
    const opcional = (campo: string): number | null => {
      const valor = crudo[campo];
      if (valor === null || valor === undefined || valor === '') {
        return null;
      }
      const numero = Number(valor);
      return Number.isFinite(numero) ? numero : null;
    };

    return {
      consumo_kwh: Number(crudo['consumo_kwh']),
      uso_horario_pico: Boolean(crudo['uso_horario_pico']),
      cantidad_equipos: Number(crudo['cantidad_equipos']),
      tipo_inmueble: String(crudo['tipo_inmueble']),
      horas_alto_consumo: Number(crudo['horas_alto_consumo']),
      cantidad_personas: opcional('cantidad_personas'),
      area_m2: opcional('area_m2'),
      equipos_alto_consumo: opcional('equipos_alto_consumo'),
      horas_aire_acondicionado: opcional('horas_aire_acondicionado'),
      consumo_mes_anterior_kwh: opcional('consumo_mes_anterior_kwh'),
      dias_facturados: opcional('dias_facturados'),
      dispositivos_alto: Number(crudo['dispositivos_alto']),
      dispositivos_medio: Number(crudo['dispositivos_medio']),
      dispositivos_bajo: Number(crudo['dispositivos_bajo']),
    };
  }
}
