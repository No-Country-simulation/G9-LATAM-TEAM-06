import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgTemplateOutlet, NgClass } from '@angular/common';

import { UsuarioService } from '../../core/services/usuario.service';
import { ThemeOptions } from '../../core/services/theme-options';
import { GuiaService } from '../../core/services/guia.service';
import { TarjetasGuiaComponent } from '../../features/inicio/tarjetas-guia.component';

@Component({
  selector: 'app-header',
  imports: [
    NgTemplateOutlet,
    NgClass,
    TarjetasGuiaComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly usuarioService = inject(UsuarioService);
  readonly globals = inject(ThemeOptions);
  readonly guiaService = inject(GuiaService);
  private readonly router = inject(Router);

  inicial(): string {
    const usuario = this.usuarioService.usuario();
    if (!usuario) {
      return 'I';
    }
    return usuario.trim().charAt(0).toUpperCase();
  }

  alternarSidebar(): void {
    this.globals.toggleSidebar.set(!this.globals.toggleSidebar());
    if (this.globals.toggleSidebar()) {
      this.globals.sidebarHover.set(false);
    }
  }

  alternarMenuMovil(): void {
    this.globals.toggleSidebarMobile.set(!this.globals.toggleSidebarMobile());
  }

  abrirGuia(): void {
    this.guiaService.abrirAyuda();
  }

  cerrarGuia(): void {
    this.guiaService.cerrarAyuda();
  }

  cerrarGuiaSiBackdrop(evento: Event): void {
    if (evento.target === evento.currentTarget) {
      this.guiaService.cerrarAyuda();
    }
  }

  accederConCorreo(): void {
    this.router.navigate(['/verificar-correo']);
  }

  salir(): void {
    this.usuarioService.limpiar();
  }
}