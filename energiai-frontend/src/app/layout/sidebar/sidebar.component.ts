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
    { etiqueta: 'Inicio', ruta: '/', icono: 'pe-7s-home' },
    { etiqueta: 'Análisis General', ruta: '/analisis-general', icono: 'pe-7s-display1' },
    { etiqueta: 'Historial', ruta: '/historial', icono: 'pe-7s-notebook' },
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