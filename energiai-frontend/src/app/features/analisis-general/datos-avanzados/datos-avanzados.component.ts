import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-datos-avanzados',
  imports: [ReactiveFormsModule],
  templateUrl: './datos-avanzados.component.html',
  styleUrl: './datos-avanzados.component.scss',
})
export class DatosAvanzadosComponent {
  readonly formulario = input.required<FormGroup>();
  readonly abierto = input(false);

  readonly alternar = output();
}