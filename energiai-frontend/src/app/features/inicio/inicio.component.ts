import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
})
export class InicioComponent {
  private readonly router = inject(Router);

  readonly tarjetas = [
    {
      titulo: 'Análisis Instantáneo',
      descripcion:
        'Ingresa tus kWh consumidos y la cantidad de equipos para obtener un diagnóstico rápido de tu nivel de gasto.',
      icono: 'pe-7s-graph1',
      fondo: 'card-energia',
    },
    {
      titulo: 'Consejos Inteligentes',
      descripcion:
        'Recibe sugerencias personalizadas para redistribuir horarios de uso y reducir significativamente tu factura.',
      icono: 'pe-7s-light',
      fondo: 'card-ia',
    },
    {
      titulo: 'Sin Contraseñas',
      descripcion:
        'Identifícate únicamente con tu correo electrónico para vincular y consultar tu historial de simulaciones.',
      icono: 'pe-7s-shield',
      fondo: 'card-seguridad',
    },
  ];

  irAAnalisisGeneral(): void {
    this.router.navigate(['/analisis-general']);
  }
}
