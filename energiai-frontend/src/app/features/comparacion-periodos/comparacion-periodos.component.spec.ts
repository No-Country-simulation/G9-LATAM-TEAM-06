import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HistorialResponse } from '../../core/models/historial-response';
import { UsuarioService } from '../../core/services/usuario.service';
import { ComparacionPeriodosComponent } from './comparacion-periodos.component';

const PERIODO_NUEVO: HistorialResponse = {
  id: 2,
  creadoEn: '2026-08-13T18:33:50Z',
  usuario: 'invitado',
  consumoKwh: 400,
  tipoInmueble: 'Casa',
  cantidadEquipos: 8,
  horasAltoConsumo: 5,
  usoHorarioPico: false,
  categoria: 'Eficiente',
  probabilidad: 0.9,
  costo_estimado_mensual: 300,
  recomendaciones: ['Mantener hábitos'],
};

const PERIODO_ANTERIOR: HistorialResponse = {
  id: 1,
  creadoEn: '2026-07-13T18:33:50Z',
  usuario: 'invitado',
  consumoKwh: 500,
  tipoInmueble: 'Casa',
  cantidadEquipos: 9,
  horasAltoConsumo: 8,
  usoHorarioPico: true,
  categoria: 'Moderado',
  probabilidad: 0.82,
  costo_estimado_mensual: 375,
  recomendaciones: ['Evitar horario pico'],
};

describe('ComparacionPeriodosComponent', () => {
  let fixture: ComponentFixture<ComparacionPeriodosComponent>;
  let componente: ComparacionPeriodosComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ComparacionPeriodosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    // Usuario verificado para ejercitar la consulta al servidor.
    TestBed.inject(UsuarioService).marcarVerificado('persona@ejemplo.com');

    fixture = TestBed.createComponent(ComparacionPeriodosComponent);
    componente = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('selecciona los dos registros recientes y calcula una mejora completa', () => {
    const solicitud = http.expectOne((req) => req.method === 'GET');
    expect(solicitud.request.params.get('size')).toBe('100');
    solicitud.flush(
      pagina([PERIODO_NUEVO, PERIODO_ANTERIOR]),
    );
    fixture.detectChanges();

    expect(componente.periodoBaseId()).toBe(PERIODO_ANTERIOR.id);
    expect(componente.periodoComparadoId()).toBe(PERIODO_NUEVO.id);
    expect(componente.filas()[0].diferencia).toBe(-100);
    expect(componente.filas()[0].porcentaje).toBe(-20);
    expect(componente.resumen()?.estado).toBe('mejora');
    expect(componente.textoCambioCategoria()).toBe('Mejoró');

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.textContent).toContain('Tu eficiencia energética mejoró');
    expect(elemento.textContent).toContain('−100 kWh');
    expect(elemento.querySelectorAll('.indicador-comparado').length).toBe(4);
  });

  it('recalcula el resultado al intercambiar los períodos', () => {
    http.expectOne((req) => req.method === 'GET').flush(
      pagina([PERIODO_NUEVO, PERIODO_ANTERIOR]),
    );
    fixture.detectChanges();

    componente.intercambiarPeriodos();
    fixture.detectChanges();

    expect(componente.periodoBaseId()).toBe(PERIODO_NUEVO.id);
    expect(componente.periodoComparadoId()).toBe(PERIODO_ANTERIOR.id);
    expect(componente.filas()[0].diferencia).toBe(100);
    expect(componente.filas()[0].porcentaje).toBe(25);
    expect(componente.resumen()?.estado).toBe('alerta');
    expect(componente.textoCambioCategoria()).toBe('Empeoró');
  });

  it('muestra un estado vacío cuando todavía no existen dos períodos', () => {
    http.expectOne((req) => req.method === 'GET').flush(
      pagina([PERIODO_NUEVO]),
    );
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(componente.puedeComparar()).toBeFalse();
    expect(elemento.textContent).toContain('Necesitas al menos dos análisis');
    expect(elemento.querySelector('.selector-panel')).toBeNull();
  });

  it('muestra una recuperación clara cuando falla la consulta', () => {
    http.expectOne((req) => req.method === 'GET').flush(
      { mensaje: 'Error' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.textContent).toContain('No pudimos cargar la comparación');
    expect(elemento.querySelector('.estado-error button')).toBeTruthy();
  });
});

function pagina(content: HistorialResponse[]) {
  return {
    content,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    size: 100,
    number: 0,
    numberOfElements: content.length,
    first: true,
    last: true,
    empty: content.length === 0,
  };
}
