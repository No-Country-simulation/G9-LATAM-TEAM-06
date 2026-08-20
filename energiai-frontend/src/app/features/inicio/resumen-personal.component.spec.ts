import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { HistorialResponse } from "../../core/models/historial-response";
import { UsuarioService } from "../../core/services/usuario.service";
import { ResumenPersonalComponent } from "./resumen-personal.component";

const HISTORIAL: HistorialResponse[] = [
  {
    id: 3,
    creadoEn: "2026-08-13T10:00:00Z",
    usuario: "invitado",
    consumoKwh: 900,
    tipoInmueble: "Casa",
    cantidadEquipos: 12,
    horasAltoConsumo: 9,
    usoHorarioPico: true,
    categoria: "Ineficiente",
    probabilidad: 0.91,
    costo_estimado_mensual: 180,
    recomendaciones: ["Reducir el uso durante horarios pico"],
  },
  {
    id: 2,
    creadoEn: "2026-07-13T10:00:00Z",
    usuario: "invitado",
    consumoKwh: 600,
    tipoInmueble: "Casa",
    cantidadEquipos: 10,
    horasAltoConsumo: 6,
    usoHorarioPico: false,
    categoria: "Moderado",
    probabilidad: 0.8,
    costo_estimado_mensual: 120,
    recomendaciones: ["Monitorear el consumo"],
  },
  {
    id: 1,
    creadoEn: "2026-06-13T10:00:00Z",
    usuario: "invitado",
    consumoKwh: 300,
    tipoInmueble: "Casa",
    cantidadEquipos: 8,
    horasAltoConsumo: 3,
    usoHorarioPico: false,
    categoria: "Eficiente",
    probabilidad: 0.87,
    costo_estimado_mensual: 60,
    recomendaciones: ["Mantener hábitos"],
  },
];

describe("ResumenPersonalComponent", () => {
  let fixture: ComponentFixture<ResumenPersonalComponent>;
  let componente: ResumenPersonalComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ResumenPersonalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    // Usuario verificado para ejercitar la consulta al servidor.
    TestBed.inject(UsuarioService).marcarVerificado("persona@ejemplo.com");

    fixture = TestBed.createComponent(ResumenPersonalComponent);
    componente = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it("calcula indicadores, distribución, tendencia y alertas desde el historial", () => {
    const solicitud = http.expectOne(
      (req) => req.method === "GET" && req.url.includes("/analisis-energetico"),
    );
    expect(solicitud.request.params.get("size")).toBe("30");
    solicitud.flush({
      content: HISTORIAL,
      totalElements: 3,
      totalPages: 1,
      size: 30,
      number: 0,
      numberOfElements: 3,
      first: true,
      last: true,
      empty: false,
    });
    fixture.detectChanges();

    expect(componente.promedioConsumo()).toBe(600);
    expect(componente.promedioCosto()).toBe(120);
    expect(componente.porcentajeEficiente()).toBe(33);
    expect(componente.variacionReciente()).toBe(50);
    expect(componente.distribucion().map((item) => item.cantidad)).toEqual([
      1, 1, 1,
    ]);
    expect(componente.alertas().length).toBe(3);
    expect(componente.puntosGrafica()).not.toBe("");

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelectorAll(".tarjeta-metrica").length).toBe(4);
    expect(elemento.querySelector(".grafica-linea")).toBeTruthy();
    expect(elemento.textContent).toContain("Consumo alto detectado");
    expect(elemento.textContent).toContain("Distribución de resultados");
  });

  it("muestra un estado vacío con una acción principal cuando no hay análisis", () => {
    http.expectOne((req) => req.method === "GET").flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 30,
      number: 0,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    });
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.textContent).toContain(
      "Tu seguimiento comienza con el primer análisis",
    );
    expect(elemento.querySelector(".grafica-linea")).toBeNull();
  });

  it("muestra un error recuperable si falla la consulta", () => {
    http.expectOne((req) => req.method === "GET").flush(
      { mensaje: "Error" },
      { status: 503, statusText: "Service Unavailable" },
    );
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.textContent).toContain(
      "No fue posible actualizar el dashboard",
    );
    expect(elemento.querySelector(".estado-error button")).toBeTruthy();
  });
});
