import { Injectable, effect, signal } from '@angular/core';

const CLAVE_TEMA = 'energiai_tema';

@Injectable({
  providedIn: 'root',
})
export class ThemeOptions {
  sidebarHover = signal(false);
  toggleSidebar = signal(false);
  toggleSidebarMobile = signal(false);
  toggleFixedFooter = signal(false);

  readonly modoOscuro = signal<boolean>(this.cargarModoOscuroInicial());

  constructor() {
    effect(() => {
      const oscuro = this.modoOscuro();
      document.documentElement.setAttribute(
        'data-bs-theme',
        oscuro ? 'dark' : 'light',
      );
    });
  }

  alternarModoOscuro(): void {
    this.modoOscuro.set(!this.modoOscuro());
    localStorage.setItem(CLAVE_TEMA, this.modoOscuro() ? 'dark' : 'light');
  }

  private cargarModoOscuroInicial(): boolean {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    if (guardado === 'dark') {
      return true;
    }
    if (guardado === 'light') {
      return false;
    }
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }
}