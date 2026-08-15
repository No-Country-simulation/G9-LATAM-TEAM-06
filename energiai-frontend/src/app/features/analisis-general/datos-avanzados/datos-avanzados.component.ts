import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import {
  LIMITES_INMUEBLE,
  LimitesInmueble,
  TipoInmueble,
} from '../../../core/models/model-domain';
import {
  CampoEntradaModelo,
  problemasDelCampo,
  validarEntradaModelo,
} from '../../../core/validation/model-input-validator';

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

  limites(): LimitesInmueble {
    const tipo = this.formulario().get('tipo_inmueble')?.value as TipoInmueble;
    return LIMITES_INMUEBLE[tipo] ?? LIMITES_INMUEBLE.Casa;
  }

  mensajes(campo: CampoEntradaModelo): string[] {
    return problemasDelCampo(
      validarEntradaModelo(this.formulario().getRawValue()),
      campo,
    );
  }

  invalido(campo: CampoEntradaModelo): boolean {
    const control = this.formulario().get(campo);
    return Boolean(control?.touched && (control.invalid || this.mensajes(campo).length));
  }
}
