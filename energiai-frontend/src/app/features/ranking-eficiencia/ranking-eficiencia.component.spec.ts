import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HistorialResponse } from '../../core/models/historial-response';
import { RankingEficienciaComponent } from './ranking-eficiencia.component';

describe('RankingEficienciaComponent', () => {
  let fixture: ComponentFixture<RankingEficienciaComponent>;
  let componente: RankingEficienciaComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.removeItem('energiai_usuario');
    await TestBed.configureTestingModule({
      imports: [RankingEficienciaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(RankingEficienciaComponent);
    componente = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('prioriza clasificación y después menor intensidad energética', () => {
    http.expectOne((req) => req.method === 'GET').flush(pagina([
      registro(1, 'Eficiente', 300, 5, 'Casa'),
      registro(2, 'Moderado', 100, 10, 'Oficina'),
      registro(3, 'Eficiente', 240, 8, 'Apartamento'),
    ]));
    fixture.detectChanges();
    expect(componente.ranking().map((item) => item.id)).toEqual([3, 1, 2]);
    expect(componente.ranking()[0].intensidad).toBe(30);
    expect(fixture.nativeElement.textContent).toContain('No se inventa una puntuación adicional');
  });

  it('filtra el ranking por tipo de inmueble', () => {
    http.expectOne((req) => req.method === 'GET').flush(pagina([
      registro(1, 'Eficiente', 300, 5, 'Casa'),
      registro(2, 'Eficiente', 200, 8, 'Oficina'),
    ]));
    componente.filtroInmueble.set('Casa');
    expect(componente.ranking().map((item) => item.id)).toEqual([1]);
  });
});

function registro(id: number, categoria: string, consumoKwh: number, cantidadEquipos: number, tipoInmueble: string): HistorialResponse {
  return { id, creadoEn: '2026-08-13T10:00:00Z', usuario: 'invitado', consumoKwh, tipoInmueble, cantidadEquipos, horasAltoConsumo: 5, usoHorarioPico: false, categoria, probabilidad: .9, costo_estimado_mensual: consumoKwh * .75, recomendaciones: [] };
}
function pagina(content: HistorialResponse[]) { return { content, totalElements: content.length, totalPages: 1, size: 100, number: 0, numberOfElements: content.length, first: true, last: true, empty: !content.length }; }
