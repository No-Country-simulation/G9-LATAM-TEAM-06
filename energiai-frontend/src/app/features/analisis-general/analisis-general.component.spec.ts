import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AnalisisGeneralComponent } from './analisis-general.component';
import { UsuarioService } from '../../core/services/usuario.service';

describe('AnalisisGeneralComponent', () => {
  let componente: AnalisisGeneralComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalisisGeneralComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UsuarioService,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AnalisisGeneralComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('debe marcar formulario inválido si la suma de dispositivos no iguala la cantidad de equipos', () => {
    componente.formulario.get('cantidad_equipos')?.setValue(5);
    componente.formulario.get('dispositivos_alto')?.setValue(2);
    componente.formulario.get('dispositivos_medio')?.setValue(2);
    componente.formulario.get('dispositivos_bajo')?.setValue(0);
    expect(componente.formulario.invalid).toBeTrue();
    expect(componente.mensajeSumaEquipos).toContain('La suma (4)');
  });

  it('debe ser válido cuando la suma de dispositivos iguala la cantidad de equipos', () => {
    componente.formulario.get('cantidad_equipos')?.setValue(5);
    componente.formulario.get('dispositivos_alto')?.setValue(2);
    componente.formulario.get('dispositivos_medio')?.setValue(1);
    componente.formulario.get('dispositivos_bajo')?.setValue(2);
    expect(componente.formulario.valid).toBeTrue();
  });

  it('debe enviar la solicitud al endpoint correcto y guardar el resultado', () => {
    const http = TestBed.inject(HttpTestingController);

    componente.formulario.get('consumo_kwh')?.setValue(250);
    componente.formulario.get('cantidad_equipos')?.setValue(3);
    componente.formulario.get('dispositivos_alto')?.setValue(1);
    componente.formulario.get('dispositivos_medio')?.setValue(1);
    componente.formulario.get('dispositivos_bajo')?.setValue(1);

    componente.enviar();

    const solicitud = http.expectOne((req) => req.method === 'POST');
    expect(solicitud.request.url).toContain('/analisis-energetico');
    const cuerpo = solicitud.request.body;
    expect(cuerpo.consumo_kwh).toBe(250);
    expect(cuerpo.usuarioId).toBe('invitado');

    solicitud.flush({
      categoria: 'Consumo Ineficiente',
      probabilidad: 0.75,
      recomendaciones: ['Ajustar horario'],
      costo_estimado_mensual: 150.5,
    });

    expect(componente.resultado()?.categoria).toBe('Consumo Ineficiente');
    http.verify();
  });
});