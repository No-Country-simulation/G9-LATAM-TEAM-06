import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HistorialResponse } from '../../core/models/historial-response';
import { UsuarioService } from '../../core/services/usuario.service';
import { InicioComponent } from './inicio.component';

const HISTORIAL: HistorialResponse[] = [
  {
    id: 3,
    creadoEn: '2026-08-13T10:00:00Z',
    usuario: 'invitado',
    consumoKwh: 900,
    tipoInmueble: 'Casa',
    cantidadEquipos: 12,
    horasAltoConsumo: 9,
    usoHorarioPico: true,
    categoria: 'Ineficiente',
    probabilidad: 0.91,
    costo_estimado_mensual: 180,
    recomendaciones: ['Reducir el uso durante horarios pico'],
  },
];

describe('InicioComponent', () => {
  let fixture: ComponentFixture<InicioComponent>;
  let componente: InicioComponent;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    TestBed.inject(UsuarioService).marcarVerificado('persona@ejemplo.com');

    fixture = TestBed.createComponent(InicioComponent);
    componente = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('muestra la guía con botón central cuando no hay análisis', () => {
    http.expectOne((req) => req.method === 'GET').flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 1,
      number: 0,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    });
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('.hero-inicio')).toBeTruthy();
    expect(elemento.querySelector('.que-es-bloque')).toBeTruthy();
    expect(elemento.textContent).toContain('Qué es EnergiAI');
    expect(elemento.querySelectorAll('.tarjeta-info').length).toBe(5);
    expect(elemento.querySelector('.accion-hero')).toBeTruthy();
    expect(elemento.textContent).toContain('Empezar');
    expect(elemento.textContent).toContain('Convierte tus datos');
    expect(elemento.textContent).toContain('Resumen personal');
  });

  it('muestra el botón Empezar en el hero, la ficha del último análisis y oculta la guía cuando hay análisis', () => {
    http.expectOne((req) => req.method === 'GET').flush({
      content: HISTORIAL,
      totalElements: 1,
      totalPages: 1,
      size: 1,
      number: 0,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    });
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('.accion-hero')).toBeTruthy();
    expect(elemento.querySelector('.guia-inicio')).toBeFalsy();
    expect(elemento.querySelector('.que-es-bloque')).toBeTruthy();
    expect(elemento.querySelector('.ultimo-analisis')).toBeTruthy();
    expect(elemento.textContent).toContain('Tu último análisis');
    expect(elemento.textContent).toContain('Ineficiente');
    expect(elemento.textContent).toContain('Ver mi resumen personal');
    expect(elemento.textContent).toContain('Ver resumen completo');
    const enlace = elemento.querySelector('.link-resumen') as HTMLElement;
    expect(enlace.getAttribute('routerlink')).toBe('/resumen');
  });

  it('navega a /resumen al invocar verResumen', () => {
    http.expectOne((req) => req.method === 'GET').flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 1,
      number: 0,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    });
    const navegar = spyOn(router, 'navigate');
    componente.verResumen();
    expect(navegar).toHaveBeenCalledWith(['/resumen']);
  });

  it('navega a /analisis-general al invocar irAAnalisisGeneral', () => {
    http.expectOne((req) => req.method === 'GET').flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 1,
      number: 0,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    });
    const navegar = spyOn(router, 'navigate');
    componente.irAAnalisisGeneral();
    expect(navegar).toHaveBeenCalledWith(['/analisis-general']);
  });
});