import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AnalisisGeneralComponent } from './analisis-general.component';
import { UsuarioService } from '../../core/services/usuario.service';

describe('AnalisisGeneralComponent', () => {
  let componente: AnalisisGeneralComponent;

  beforeEach(async () => {
    localStorage.removeItem('energiai_usuario');
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
    expect(componente.mensajeSumaEquipos).toContain('suma 4');
  });

  it('debe ser válido cuando la suma de dispositivos iguala la cantidad de equipos', () => {
    componente.formulario.get('cantidad_equipos')?.setValue(5);
    componente.formulario.get('dispositivos_alto')?.setValue(2);
    componente.formulario.get('dispositivos_medio')?.setValue(1);
    componente.formulario.get('dispositivos_bajo')?.setValue(2);
    expect(componente.formulario.errors)
      .withContext(JSON.stringify(componente.formulario.errors))
      .toBeNull();
    const erroresControles = Object.fromEntries(
      Object.entries(componente.formulario.controls)
        .filter(([, control]) => control.invalid)
        .map(([nombre, control]) => [nombre, control.errors]),
    );
    expect(erroresControles)
      .withContext(JSON.stringify(erroresControles))
      .toEqual({});
    expect(componente.formulario.valid).toBeTrue();
  });

  it('debe aceptar un consumo bajo para comercio dentro del rango general', () => {
    componente.formulario.get('tipo_inmueble')?.setValue('Comercio');
    componente.formulario.get('consumo_kwh')?.setValue(250);
    componente.formulario.get('cantidad_equipos')?.setValue(10);
    componente.formulario.get('dispositivos_alto')?.setValue(2);
    componente.formulario.get('dispositivos_medio')?.setValue(4);
    componente.formulario.get('dispositivos_bajo')?.setValue(4);

    expect(componente.formulario.valid).toBeTrue();
    expect(componente.mensajesDominio).toEqual([]);
  });

  it('debe rechazar decimales en campos entrenados como enteros', () => {
    componente.formulario.get('horas_alto_consumo')?.setValue(4.5);

    expect(componente.formulario.invalid).toBeTrue();
    expect(componente.mensajesDominio.join(' ')).toContain('número entero');
  });

  it('debe aceptar 24 horas de alto consumo y rechazar 25', () => {
    componente.formulario.get('horas_alto_consumo')?.setValue(24);
    expect(componente.formulario.valid).toBeTrue();

    componente.formulario.get('horas_alto_consumo')?.setValue(25);
    expect(componente.formulario.invalid).toBeTrue();
  });

  it('debe aceptar más de nueve equipos de alto consumo cuando no superan el total', () => {
    componente.formulario.get('cantidad_equipos')?.setValue(20);
    componente.formulario.get('dispositivos_alto')?.setValue(10);
    componente.formulario.get('dispositivos_medio')?.setValue(5);
    componente.formulario.get('dispositivos_bajo')?.setValue(5);

    expect(componente.formulario.errors)
      .withContext(JSON.stringify(componente.formulario.errors))
      .toBeNull();
    const erroresControles = Object.fromEntries(
      Object.entries(componente.formulario.controls)
        .filter(([, control]) => control.invalid)
        .map(([nombre, control]) => [nombre, control.errors]),
    );
    expect(erroresControles)
      .withContext(JSON.stringify(erroresControles))
      .toEqual({});
    expect(componente.formulario.valid).toBeTrue();
    expect(componente.maximoEquiposAlto).toBe(20);
  });

  it('debe aplicar el dominio específico al cambiar el tipo de inmueble', () => {
    componente.formulario.get('tipo_inmueble')?.setValue('Apartamento');
    componente.formulario.get('cantidad_personas')?.setValue(8);
    componente.formulario.get('area_m2')?.setValue(181);

    expect(componente.formulario.invalid).toBeTrue();
    expect(componente.mensajesCampo('cantidad_personas').join(' ')).toContain('entre 1 y 7');
    expect(componente.mensajesCampo('area_m2').join(' ')).toContain('entre 35 y 180');
  });

  it('nunca debe enviar NaN, infinitos ni datos fuera del dominio', () => {
    const http = TestBed.inject(HttpTestingController);
    componente.formulario.get('consumo_kwh')?.setValue(Number.NaN);
    componente.formulario.get('cantidad_equipos')?.setValue(Number.POSITIVE_INFINITY);

    componente.enviar();

    expect(componente.formulario.invalid).toBeTrue();
    expect(componente.errorSignal()).toContain('dominio entrenado');
    http.expectNone((req) => req.method === 'POST');
    http.verify();
  });

  it('debe rechazar más de dos decimales en variables continuas y no enteros en consumo previo', () => {
    componente.formulario.get('area_m2')?.setValue(85.123);
    componente.formulario.get('consumo_mes_anterior_kwh')?.setValue(230.999);

    expect(componente.formulario.invalid).toBeTrue();
    expect(componente.mensajesCampo('area_m2').join(' ')).toContain('máximo 2 decimales');
    expect(componente.mensajesCampo('consumo_mes_anterior_kwh').join(' ')).toContain('número entero');
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
    expect(cuerpo.equipos_alto_consumo).toBe(1);

    solicitud.flush({
      categoria: 'Consumo Ineficiente',
      probabilidad: 0.75,
      recomendaciones: ['Ajustar horario'],
      costo_estimado_mensual: 150.5,
      nivel_analisis: 'basico',
      campos_imputados: [],
    });

    expect(componente.resultado()?.categoria).toBe('Consumo Ineficiente');
    http.verify();
  });

  it('envía el nombre opcional recortado y lo omite cuando queda vacío', () => {
    const http = TestBed.inject(HttpTestingController);

    componente.formulario.get('nombre_o_numero_analisis')?.setValue('  Mi consumo de julio  ');
    componente.enviar();
    const conNombre = http.expectOne((req) => req.method === 'POST');
    expect(conNombre.request.body.nombre_o_numero_analisis).toBe('Mi consumo de julio');
    conNombre.flush({
      categoria: 'Eficiente',
      probabilidad: 0.8,
      recomendaciones: [],
      costo_estimado_mensual: 150,
      nivel_analisis: 'basico',
      campos_imputados: [],
    });

    componente.formulario.get('nombre_o_numero_analisis')?.setValue('   ');
    componente.enviar();
    const sinNombre = http.expectOne((req) => req.method === 'POST');
    expect(sinNombre.request.body.nombre_o_numero_analisis).toBeUndefined();
    sinNombre.flush({
      categoria: 'Eficiente',
      probabilidad: 0.8,
      recomendaciones: [],
      costo_estimado_mensual: 150,
      nivel_analisis: 'basico',
      campos_imputados: [],
    });

    http.verify();
  });

  it('rechaza un nombre compuesto solo de puntos, símbolos o espacios', () => {
    const campo = componente.formulario.get('nombre_o_numero_analisis');

    campo?.setValue('...!!! ###');
    expect(campo?.invalid).toBeTrue();
    expect(campo?.hasError('nombreIncongruente')).toBeTrue();

    expect(componente.formulario.invalid).toBeTrue();
  });

  it('acepta un nombre vacío para activar la auto-numeración', () => {
    const campo = componente.formulario.get('nombre_o_numero_analisis');

    campo?.setValue('   ');
    expect(campo?.valid).toBeTrue();
  });

  it('acepta nombres con letras o números, incluidos acentos', () => {
    const campo = componente.formulario.get('nombre_o_numero_analisis');

    campo?.setValue('Mi casa 2026');
    expect(campo?.valid).toBeTrue();

    campo?.setValue('Ánálisis de julio');
    expect(campo?.valid).toBeTrue();
  });
});
