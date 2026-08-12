import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <div class="app-footer">
      <div class="app-footer__inner">
        <div class="app-footer-left">
          <span class="ps-2">{{ anio }} - EnergiAI · G9-LATAM-TEAM-06</span>
        </div>
        <div class="app-footer-right">
          <span class="ps-2">Optimizador energético con IA</span>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class FooterComponent {
  readonly anio = new Date().getFullYear();
}