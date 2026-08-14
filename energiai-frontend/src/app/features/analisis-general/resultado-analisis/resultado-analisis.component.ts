import { Component, input } from '@angular/core';
import { AnalisisResponse } from '../../../core/models/analisis-response';

@Component({
  selector: 'app-resultado-analisis',
  imports: [],
  templateUrl: './resultado-analisis.component.html',
  styleUrl: './resultado-analisis.component.scss',
})
export class ResultadoAnalisisComponent {
  readonly resultado = input.required<AnalisisResponse>();

  formatearProbabilidad(probabilidad: number | undefined): string {
    const valor = Number(probabilidad ?? 0);
    return `${(valor * 100).toFixed(0)}%`;
  }

  formatearCosto(costo: number | undefined): string {
    const monto = Number(costo ?? 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `R$ ${monto}`;
  }

  claseCategoria(): string {
    const valor = (this.resultado().categoria ?? '').toLowerCase();
    if (valor.includes('ineficiente')) {
      return 'bg-danger';
    }
    if (valor.includes('moderado') || valor.includes('medio') || valor.includes('normal')) {
      return 'bg-warning text-dark';
    }
    if (valor.includes('eficiente')) {
      return 'bg-success';
    }
    return 'bg-danger';
  }
}