import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeOptions } from '../core/services/theme-options';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-base-layout',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
  template: `
    <div
      class="app-container app-theme-white"
      [class.closed-sidebar]="globals.toggleSidebar()"
      [class.closed-sidebar-md]="globals.toggleSidebarMobile()"
      [class.closed-sidebar-open]="globals.sidebarHover() || globals.toggleSidebarMobile()"
      [class.fixed-footer]="globals.toggleFixedFooter()"
    >
      <app-header></app-header>
      <app-sidebar></app-sidebar>
      <div class="app-main__outer">
        <div class="app-main__inner">
          <div class="router-outlet-container">
            <router-outlet></router-outlet>
          </div>
        </div>
        <app-footer></app-footer>
      </div>
      <div
        class="sidebar-menu-overlay"
        tabindex="0"
        role="button"
        (click)="cerrarMenuMovil()"
        (keydown.enter)="cerrarMenuMovil()"
        (keyup.space)="cerrarMenuMovil()"
        aria-label="Cerrar menú lateral"
      ></div>
    </div>
  `,
  styles: [],
})
export class BaseLayoutComponent {
  readonly globals = inject(ThemeOptions);

  cerrarMenuMovil(): void {
    this.globals.toggleSidebarMobile.set(false);
  }
}