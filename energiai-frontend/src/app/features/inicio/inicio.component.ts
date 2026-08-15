import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { HistorialResponse } from '../../core/models/historial-response';
import { AnalisisService } from '../../core/services/analisis.service';
import { UsuarioService } from '../../core/services/usuario.service';

interface DistribucionCategoria {
  etiqueta: string;
  cantidad: number;
  porcentaje: number;
  clase: string;
}

interface AlertaConsumo {
  nivel: "danger" | "warning";
  titulo: string;
  mensaje: string;
  icono: string;
}

const TAMANO_MUESTRA = 30;
const PUNTOS_GRAFICA = 12;

@Component({
  selector: "app-inicio",
  imports: [RouterLink],
  templateUrl: "./inicio.component.html",
  styleUrl: "./inicio.component.scss",
})
export class InicioComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly analisisService = inject(AnalisisService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly destruir$ = new Subject<void>();

  readonly historial = signal<HistorialResponse[]>([]);
  readonly totalAnalisis = signal(0);
  readonly cargando = signal(true);
  readonly errorSignal = signal("");

  readonly usuarioActual = computed(() => this.usuarioService.usuario());
  readonly ultimoAnalisis = computed(() => this.historial()[0] ?? null);
  readonly cantidadMuestra = computed(() => this.historial().length);

  readonly promedioConsumo = computed(() =>
    this.promedio(this.historial().map((item) => Number(item.consumoKwh))),
  );

  readonly promedioCosto = computed(() =>
    this.promedio(
      this.historial().map((item) => Number(item.costo_estimado_mensual)),
    ),
  );

  readonly porcentajeEficiente = computed(() => {
    const registros = this.historial();
    if (!registros.length) {
      return 0;
    }
    const eficientes = registros.filter(
      (item) => this.tipoCategoria(item.categoria) === "eficiente",
    ).length;
    return Math.round((eficientes / registros.length) * 100);
  });

  readonly variacionReciente = computed<number | null>(() => {
    const registros = this.historial();
    if (registros.length < 2) {
      return null;
    }
    const actual = Number(registros[0].consumoKwh);
    const anterior = Number(registros[1].consumoKwh);
    if (
      !Number.isFinite(actual) ||
      !Number.isFinite(anterior) ||
      anterior === 0
    ) {
      return null;
    }
    return ((actual - anterior) / anterior) * 100;
  });

  readonly distribucion = computed<DistribucionCategoria[]>(() => {
    const registros = this.historial();
    const total = registros.length;
    const conteo = { eficiente: 0, moderado: 0, ineficiente: 0 };

    registros.forEach((item) => conteo[this.tipoCategoria(item.categoria)]++);

    return [
      {
        etiqueta: "Eficiente",
        cantidad: conteo.eficiente,
        porcentaje: total ? (conteo.eficiente / total) * 100 : 0,
        clase: "barra-eficiente",
      },
      {
        etiqueta: "Moderado",
        cantidad: conteo.moderado,
        porcentaje: total ? (conteo.moderado / total) * 100 : 0,
        clase: "barra-moderado",
      },
      {
        etiqueta: "Ineficiente",
        cantidad: conteo.ineficiente,
        porcentaje: total ? (conteo.ineficiente / total) * 100 : 0,
        clase: "barra-ineficiente",
      },
    ];
  });

  readonly puntosGrafica = computed(() => {
    const registros = this.registrosGrafica();
    if (!registros.length) {
      return "";
    }

    const valores = registros.map((item) => Number(item.consumoKwh));
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);
    const rango = maximo - minimo;
    const ancho = 560;
    const margen = 14;
    // Guías en y=15 (superior) e y=165 (inferior). El trazo mide 4px (non-scaling)
    // y tiene sombra hacia abajo; la banda se inseta holgadamente para que el
    // trazo y la sombra queden siempre dentro de las guías.
    const cima = 15;
    const base = 125;

    return valores
      .map((valor, indice) => {
        const x =
          valores.length === 1
            ? ancho / 2
            : margen + (indice / (valores.length - 1)) * (ancho - margen * 2);
        const yCalculado =
          rango === 0
            ? (cima + base) / 2
            : cima + ((maximo - valor) / rango) * (base - cima);
        const y = Math.min(Math.max(yCalculado, cima), base);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  });

  readonly alertas = computed<AlertaConsumo[]>(() => {
    const ultimo = this.ultimoAnalisis();
    if (!ultimo) {
      return [];
    }

    const alertas: AlertaConsumo[] = [];
    if (this.tipoCategoria(ultimo.categoria) === "ineficiente") {
      alertas.push({
        nivel: "danger",
        titulo: "Consumo alto detectado",
        mensaje: `El análisis más reciente registró ${this.formatearNumero(ultimo.consumoKwh, 0)} kWh y fue clasificado como ineficiente. Revisa las recomendaciones para actuar sobre las causas principales.`,
        icono: "pe-7s-attention",
      });
    }

    if (Number(ultimo.horasAltoConsumo) >= 8 || ultimo.usoHorarioPico) {
      const detalle =
        Number(ultimo.horasAltoConsumo) >= 8
          ? `${this.formatearNumero(ultimo.horasAltoConsumo, 0)} horas diarias de alto consumo`
          : "uso de equipos en horario pico";
      alertas.push({
        nivel: "warning",
        titulo: "Patrón de uso que requiere atención",
        mensaje: `Se detectó ${detalle}. Distribuir la demanda puede ayudar a evitar picos y sobrecostos.`,
        icono: "pe-7s-clock",
      });
    }

    const variacion = this.variacionReciente();
    if (variacion !== null && variacion >= 10) {
      alertas.push({
        nivel: "warning",
        titulo: "El consumo aumentó frente al análisis anterior",
        mensaje: `El incremento fue de ${this.formatearNumero(variacion, 0)}%. Compara tus hábitos recientes antes de que la tendencia continúe.`,
        icono: "pe-7s-up-arrow",
      });
    }

    return alertas;
  });

  ngOnInit(): void {
    this.cargarDashboard();
    this.usuarioService.cambioUsuario
      .pipe(takeUntil(this.destruir$))
      .subscribe(() => this.cargarDashboard());
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
  }

  cargarDashboard(): void {
    this.cargando.set(true);
    this.errorSignal.set("");
    this.analisisService
      .listarPorUsuario(
        this.usuarioService.usuarioActual,
        null,
        0,
        TAMANO_MUESTRA,
      )
      .pipe(
        takeUntil(this.destruir$),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (pagina) => {
          this.historial.set(pagina.content);
          this.totalAnalisis.set(pagina.totalElements);
        },
        error: () =>
          this.errorSignal.set(
            "No pudimos cargar tu seguimiento. Tus análisis siguen guardados; intenta nuevamente.",
          ),
      });
  }

  irAAnalisisGeneral(): void {
    this.router.navigate(["/analisis-general"]);
  }

  registrosGrafica(): HistorialResponse[] {
    return this.historial().slice(0, PUNTOS_GRAFICA).reverse();
  }

  fechaCorta(fecha: string): string {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
    }).format(new Date(fecha));
  }

  rangoGrafica(): string {
    const registros = this.registrosGrafica();
    if (!registros.length) {
      return "";
    }
    return `${this.fechaCorta(registros[0].creadoEn)} – ${this.fechaCorta(registros.at(-1)!.creadoEn)}`;
  }

  descripcionGrafica(): string {
    const registros = this.registrosGrafica();
    if (!registros.length) {
      return "Sin datos de consumo disponibles.";
    }
    return `Evolución de ${registros.length} análisis, desde ${this.fechaCorta(registros[0].creadoEn)} hasta ${this.fechaCorta(registros.at(-1)!.creadoEn)}.`;
  }

  claseCategoria(categoria: string): string {
    const tipo = this.tipoCategoria(categoria);
    if (tipo === "eficiente") {
      return "estado-eficiente";
    }
    if (tipo === "moderado") {
      return "estado-moderado";
    }
    return "estado-ineficiente";
  }

  formatearNumero(valor: number, decimales = 1): string {
    return Number(valor ?? 0).toLocaleString("es-MX", {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    });
  }

  formatearVariacion(): string {
    const variacion = this.variacionReciente();
    if (variacion === null) {
      return "Sin comparación previa";
    }
    const signo = variacion > 0 ? "+" : "";
    return `${signo}${this.formatearNumero(variacion, 0)}% vs. anterior`;
  }

  claseVariacion(): string {
    const variacion = this.variacionReciente();
    if (variacion === null || Math.abs(variacion) < 1) {
      return "variacion-neutra";
    }
    return variacion > 0 ? "variacion-negativa" : "variacion-positiva";
  }

  private promedio(valores: number[]): number {
    const validos = valores.filter(Number.isFinite);
    return validos.length
      ? validos.reduce((total, valor) => total + valor, 0) / validos.length
      : 0;
  }

  private tipoCategoria(
    categoria: string,
  ): "eficiente" | "moderado" | "ineficiente" {
    const valor = (categoria ?? "").toLowerCase();
    if (valor.includes("ineficiente")) {
      return "ineficiente";
    }
    if (
      valor.includes("moderado") ||
      valor.includes("medio") ||
      valor.includes("normal")
    ) {
      return "moderado";
    }
    if (valor.includes("eficiente")) {
      return "eficiente";
    }
    return "moderado";
  }
}
