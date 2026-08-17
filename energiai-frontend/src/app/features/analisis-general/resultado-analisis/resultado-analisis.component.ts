import { Component, computed, input } from '@angular/core';
import {
  AnalisisResponse,
  RecomendacionDetalle,
} from '../../../core/models/analisis-response';
import * as formato from '../../../core/util/formato';

@Component({
  selector: 'app-resultado-analisis',
  imports: [],
  templateUrl: './resultado-analisis.component.html',
  styleUrl: './resultado-analisis.component.scss',
})
export class ResultadoAnalisisComponent {
  readonly resultado = input.required<AnalisisResponse>();

  readonly recomendacionesDetalle = computed<RecomendacionDetalle[]>(() => {
    const estructuradas = this.resultado().recomendaciones_detalle;
    if (estructuradas?.length) {
      return estructuradas;
    }
    return (this.resultado().recomendaciones ?? []).map((texto, indice) => ({
      codigo: `legacy_${indice + 1}`,
      texto,
      confianza: null,
      factores_clave: [],
    }));
  });

  readonly esIneficiente = computed(() =>
    (this.resultado().categoria ?? '').toLowerCase().includes('ineficiente'),
  );

  readonly requiereAtencion = computed(() => {
    const valor = (this.resultado().categoria ?? '').toLowerCase();
    return (
      valor.includes('moderado') ||
      valor.includes('medio') ||
      valor.includes('normal')
    );
  });

  formatearProbabilidad(probabilidad: number | undefined): string {
    return formato.formatearProbabilidad(probabilidad);
  }

  formatearCosto(costo: number | undefined): string {
    return formato.formatearMoneda(costo);
  }

  claseCategoria(): string {
    return formato.claseCategoriaBootstrap(this.resultado().categoria);
  }

  etiquetaNivel(): string {
    const nivel = this.resultado().nivel_analisis ?? 'basico';
    return nivel.charAt(0).toUpperCase() + nivel.slice(1);
  }

  etiquetaOrigen(): string {
    return this.resultado().origen_prediccion === 'fallback_reglas'
      ? 'Reglas de respaldo'
      : 'Modelo de IA';
  }

}
