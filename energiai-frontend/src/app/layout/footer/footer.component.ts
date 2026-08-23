import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <div class="app-footer">
      <div class="app-footer__inner">
        <div class="app-footer-left">
          <span class="ps-2">{{ anio }} - EnergiAI ·</span>
          <button
            type="button"
            class="enlace-equipo"
            (click)="abrirModal()"
            (keydown.enter)="abrirModal()"
            aria-label="Créditos del equipo"
          >G9-LATAM-TEAM-06</button>
        </div>
        <div class="app-footer-right">
          <span class="ps-2">Optimizador energético con IA</span>
        </div>
      </div>
    </div>

    @if (mostrarModal) {
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <div class="modal-backdrop-creditos" (click)="cerrarModal()">
        <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events -->
        <div
          class="modal-creditos"
          role="dialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
        >
          <button
            type="button"
            class="modal-creditos__cerrar"
            (click)="cerrarModal()"
            (keydown.enter)="cerrarModal()"
            aria-label="Cerrar"
          >×</button>
          <p class="modal-creditos__texto">
            Hecho con <span class="corazon-rojo">&lt;3</span> por Fernanda, Marco, Ismael, Josué, Arturo, Sergio y Carlos
          </p>
        </div>
      </div>
    }
  `,
  styles: [`
    .enlace-equipo {
      background: none;
      border: none;
      padding: 0;
      margin-left: 4px;
      color: inherit;
      text-decoration: underline;
      cursor: pointer;
      font: inherit;
    }
    .enlace-equipo:hover {
      opacity: 0.8;
    }
    .modal-backdrop-creditos {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }
    .modal-creditos {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem 2rem;
      max-width: 90%;
      position: relative;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
    .modal-creditos__texto {
      margin: 0;
      font-size: 1rem;
      text-align: center;
    }
    .corazon-rojo {
      color: #dc3545;
    }
    .modal-creditos__cerrar {
      position: absolute;
      top: 0.25rem;
      right: 0.5rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      color: #6c757d;
    }
    :host-context(.app-theme-dark) {
      .modal-creditos {
        background: #2b3035;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
      }
      .modal-creditos__texto {
        color: #f8f9fa;
      }
      .modal-creditos__cerrar {
        color: #adb5bd;
      }
    }
  `],
})
export class FooterComponent {
  readonly anio = new Date().getFullYear();
  mostrarModal = false;

  abrirModal(): void {
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }
}
