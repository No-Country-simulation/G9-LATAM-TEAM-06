import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet, NgClass } from '@angular/common';

import { UsuarioService } from '../../core/services/usuario.service';
import { ThemeOptions } from '../../core/services/theme-options';

@Component({
  selector: 'app-header',
  imports: [RouterLink, NgTemplateOutlet, NgClass],
  template: `
    <div class="app-header header-shadow">
      <div class="app-header__content">
        <div class="app-header-left">
          <button
            type="button"
            class="hamburger hamburger--elastic me-2"
            [class.is-active]="!globals.toggleSidebar()"
            (click)="alternarSidebar()"
            aria-label="Alternar menú lateral"
          >
            <span class="hamburger-box">
              <span class="hamburger-inner"></span>
            </span>
          </button>
        </div>
        <div class="app-header-right">
          <ng-container
            *ngTemplateOutlet="menuUsuario"
          ></ng-container>
        </div>
      </div>
      <div class="app-header__mobile-menu">
        <button
          type="button"
          class="hamburger close-sidebar-btn hamburger--elastic"
          [class.is-active]="globals.toggleSidebarMobile()"
          (click)="alternarMenuMovil()"
          aria-label="Abrir menú móvil"
        >
          <span class="hamburger-box">
            <span class="hamburger-inner"></span>
          </span>
        </button>
      </div>
      <div class="app-header__menu">
        <ng-container
          *ngTemplateOutlet="menuUsuario"
        ></ng-container>
      </div>
    </div>

    <ng-template #menuUsuario>
      <div class="header-btn-lg d-flex align-items-center dropdown">
        <div class="widget-content-left me-2">
          <div class="widget-heading">
            {{ usuarioService.usuario() || 'Invitado' }}
          </div>
          <div class="widget-subheading">
            @if (usuarioService.esVerificado()) {
              Sesión verificada
            } @else {
              Sesión invitado
            }
          </div>
        </div>
        <button
          type="button"
          class="btn btn-link p-0"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          aria-label="Opciones de sesión"
        >
          <span class="usuario-avatar">
            {{ inicial() }}
          </span>
        </button>
        <div class="dropdown-menu dropdown-menu-end dropdown-menu-sm">
          <div class="dropdown-header text-center">
            <span class="usuario-avatar avatar-lg mb-2">{{ inicial() }}</span>
            <h6 class="mb-0">
              {{ usuarioService.usuario() || 'Modo Invitado' }}
            </h6>
            <small class="text-muted">
              @if (usuarioService.esVerificado()) {
                Correo verificado
              } @else {
                Tus análisis se guardan solo en este navegador.
              }
            </small>
          </div>
          <div class="dropdown-divider"></div>
          <button
            type="button"
            class="dropdown-item"
            (click)="globals.alternarModoOscuro()"
            [attr.aria-label]="globals.modoOscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          >
            <i class="me-2" [ngClass]="globals.modoOscuro() ? 'fas fa-sun' : 'fas fa-moon'"></i>
            {{ globals.modoOscuro() ? 'Modo claro' : 'Modo oscuro' }}
          </button>
          <div class="dropdown-divider"></div>
          @if (!usuarioService.esVerificado()) {
            <button
              type="button"
              class="dropdown-item"
              (click)="accederConCorreo()"
            >
              <i class="pe-7s-mail me-2"></i>
              Acceder con correo
            </button>
            <div class="dropdown-divider"></div>
          }
          <button type="button" class="dropdown-item text-danger" (click)="salir()">
            <i class="pe-7s-close-circle me-2"></i>
            Salir
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .usuario-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
        color: #fff;
        font-weight: 600;
        font-size: 1rem;
      }
      .usuario-avatar.avatar-lg {
        width: 60px;
        height: 60px;
        font-size: 1.4rem;
      }
    `,
  ],
})
export class HeaderComponent {
  readonly usuarioService = inject(UsuarioService);
  readonly globals = inject(ThemeOptions);
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

  accederConCorreo(): void {
    this.router.navigate(['/verificar-correo']);
  }

  salir(): void {
    this.usuarioService.limpiar();
  }
}
