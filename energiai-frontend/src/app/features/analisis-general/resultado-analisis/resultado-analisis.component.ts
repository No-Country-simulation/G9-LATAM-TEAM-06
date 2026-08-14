import { Component, computed, input } from '@angular/core';
import { AnalisisResponse } from '../../../core/models/analisis-response';

@Component({
  selector: 'app-resultado-analisis',
  imports: [],
  templateUrl: './resultado-analisis.component.html',
  styleUrl: './resultado-analisis.component.scss',
})
export class ResultadoAnalisisComponent {
  readonly resultado = input.required<AnalisisResponse>();

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
    const valor = Number(probabilidad ?? 0);
    return `${(valor * 100).toFixed(0)}%`;
  }

  formatearCosto(costo: number | undefined): string {
    return Number(costo ?? 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  claseCategoria(): string {
    const valor = (this.resultado().categoria ?? '').toLowerCase();
    if (valor.includes('ineficiente')) {
      return 'bg-danger';
    }
    if (valor.includes('moderado') || valor.includes('medio') || valor.includes('normal')) {
      return 'bg-warning text-white';
    }
    if (valor.includes('eficiente')) {
      return 'bg-success';
    }
    return 'bg-danger';
  }

  etiquetaNivel(): string {
    const nivel = this.resultado().nivel_analisis ?? 'basico';
    return nivel.charAt(0).toUpperCase() + nivel.slice(1);
  }

}
