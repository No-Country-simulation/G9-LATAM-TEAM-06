import {
  Component,
  HostListener,
  afterNextRender,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ThemeOptions } from '../../core/services/theme-options';

interface ItemMenu {
  etiqueta: string;
  ruta: string;
  icono: string;
  colorIcono: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly globals = inject(ThemeOptions);

  readonly items: ItemMenu[] = [
    { etiqueta: 'Inicio', ruta: '/', icono: 'pe-7s-home', colorIcono: 'icono-inicio' },
    { etiqueta: 'Análisis General', ruta: '/analisis-general', icono: 'pe-7s-display1', colorIcono: 'icono-analisis' },
    { etiqueta: 'Historial', ruta: '/historial', icono: 'pe-7s-notebook', colorIcono: 'icono-historial' },
    { etiqueta: 'Comparar Períodos', ruta: '/comparacion', icono: 'pe-7s-graph2', colorIcono: 'icono-comparacion' },
    { etiqueta: 'Procesamiento CSV', ruta: '/procesamiento-csv', icono: 'pe-7s-upload', colorIcono: 'icono-csv' },
    { etiqueta: 'Ranking Energético', ruta: '/ranking', icono: 'pe-7s-cup', colorIcono: 'icono-ranking' },
    { etiqueta: 'Simulador de Ahorro', ruta: '/simulador', icono: 'pe-7s-calculator', colorIcono: 'icono-simulador' },
  ];

  constructor() {
    afterNextRender(() => {
      if (window.innerWidth < 1200) {
        this.globals.toggleSidebar.set(true);
      }
    });
  }

  alEntrar(): void {
    if (this.globals.toggleSidebar()) {
      this.globals.sidebarHover.set(true);
    }
  }

  alSalir(): void {
    if (this.globals.toggleSidebar()) {
      this.globals.sidebarHover.set(false);
    }
  }

  alNavegar(): void {
    if (window.innerWidth < 1200) {
      this.globals.toggleSidebarMobile.set(true);
      this.globals.sidebarHover.set(false);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const ancho = (event.target as Window).innerWidth;
    this.globals.toggleSidebar.set(ancho < 1200);
  }
}
