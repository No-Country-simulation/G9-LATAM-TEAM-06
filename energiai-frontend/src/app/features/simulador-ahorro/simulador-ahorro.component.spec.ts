import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HistorialResponse } from '../../core/models/historial-response';
import { SimuladorAhorroComponent } from './simulador-ahorro.component';

describe('SimuladorAhorroComponent', () => {
  let fixture: ComponentFixture<SimuladorAhorroComponent>;
  let componente: SimuladorAhorroComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.removeItem('energiai_usuario');
    await TestBed.configureTestingModule({
      imports: [SimuladorAhorroComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SimuladorAhorroComponent);
    componente = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('calcula consumos, costos y ahorro anual desde el registro seleccionado', () => {
    http.expectOne((req) => req.method === 'GET').flush(pagina([registro()]));
    componente.reduccionConsumo.set(20);
    fixture.detectChanges();
    expect(componente.consumoProyectado()).toBe(800);
    expect(componente.kwhAhorrados()).toBe(200);
    expect(componente.costoProyectado()).toBe(600);
    expect(componente.ahorroMensual()).toBe(150);
    expect(componente.ahorroAnual()).toBe(1800);
  });

  it('restablece el escenario sin crear ni modificar análisis', () => {
    http.expectOne((req) => req.method === 'GET').flush(pagina([registro()]));
    componente.reduccionConsumo.set(30);
    componente.restablecer();
    expect(componente.reduccionConsumo()).toBe(15);
    http.expectNone((req) => req.method === 'POST' || req.method === 'PUT');
  });
});

function registro(): HistorialResponse { return { id: 7, creadoEn: '2026-08-13T10:00:00Z', usuario: 'invitado', consumoKwh: 1000, tipoInmueble: 'Casa', cantidadEquipos: 10, horasAltoConsumo: 8, usoHorarioPico: true, categoria: 'Ineficiente', probabilidad: .9, costo_estimado_mensual: 750, recomendaciones: [] }; }
function pagina(content: HistorialResponse[]) { return { content, totalElements: content.length, totalPages: 1, size: 100, number: 0, numberOfElements: content.length, first: true, last: true, empty: !content.length }; }
