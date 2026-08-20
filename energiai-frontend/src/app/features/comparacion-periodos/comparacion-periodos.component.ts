import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { HistorialResponse } from '../../core/models/historial-response';
import { AnalisisService } from '../../core/services/analisis.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { PageTitleComponent } from '../../layout/page-title';
import * as formato from '../../core/util/formato';
import { TripleStarComponent } from '../../shared/triple-star.component';

interface FilaComparacion {
  etiqueta: string;
  unidad: string;
  base: number;
  comparado: number;
  diferencia: number;
  porcentaje: number | null;
  precision: number;
  menorEsMejor: boolean;
}

interface ResumenComparacion {
  estado: 'mejora' | 'alerta' | 'estable';
  titulo: string;
  mensaje: string;
  icono: string;
}

const MAXIMO_REGISTROS = 100;

@Component({
  selector: 'app-comparacion-periodos',
  imports: [FormsModule, PageTitleComponent, RouterLink, TripleStarComponent],
  templateUrl: './comparacion-periodos.component.html',
  styleUrl: './comparacion-periodos.component.scss',
})
export class ComparacionPeriodosComponent implements OnInit, OnDestroy {
  private readonly analisisService = inject(AnalisisService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly destruir$ = new Subject<void>();

  readonly historial = signal<HistorialResponse[]>([]);
  readonly totalRegistros = signal(0);
  readonly periodoBaseId = signal<number | null>(null);
  readonly periodoComparadoId = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly errorSignal = signal('');

  readonly usuarioActual = computed(() => this.usuarioService.usuarioActual);

  readonly periodoBase = computed(() =>
    this.historial().find((item) => item.id === this.periodoBaseId()) ?? null,
  );

  readonly periodoComparado = computed(() =>
    this.historial().find((item) => item.id === this.periodoComparadoId()) ?? null,
  );

  readonly puedeComparar = computed(
    () =>
      this.periodoBase() !== null &&
      this.periodoComparado() !== null &&
      this.periodoBaseId() !== this.periodoComparadoId(),
  );

  readonly filas = computed<FilaComparacion[]>(() => {
    const base = this.periodoBase();
    const comparado = this.periodoComparado();
    if (!base || !comparado) {
      return [];
    }

    return [
      this.crearFila(
        'Consumo energético',
        'kWh',
        base.consumoKwh,
        comparado.consumoKwh,
        0,
        true,
      ),
      this.crearFila(
        'Costo mensual estimado',
        '',
        base.costo_estimado_mensual,
        comparado.costo_estimado_mensual,
        2,
        true,
      ),
      this.crearFila(
        'Horas de alto consumo',
        'h/día',
        base.horasAltoConsumo,
        comparado.horasAltoConsumo,
        0,
        true,
      ),
      this.crearFila(
        'Cantidad de equipos',
        'equipos',
        base.cantidadEquipos,
        comparado.cantidadEquipos,
        0,
        false,
      ),
    ];
  });

  readonly resumen = computed<ResumenComparacion | null>(() => {
    const base = this.periodoBase();
    const comparado = this.periodoComparado();
    if (!base || !comparado) {
      return null;
    }

    const diferencia = Number(comparado.consumoKwh) - Number(base.consumoKwh);
    const porcentaje = this.calcularPorcentaje(
      base.consumoKwh,
      comparado.consumoKwh,
    );
    const categoriaMejoro =
      formato.nivelCategoria(comparado.categoria) >
      formato.nivelCategoria(base.categoria);
    const categoriaEmpeoro =
      formato.nivelCategoria(comparado.categoria) <
      formato.nivelCategoria(base.categoria);

    if (diferencia < 0 || categoriaMejoro) {
      return {
        estado: 'mejora',
        titulo: 'Tu eficiencia energética mejoró',
        mensaje:
          diferencia < 0
            ? `El período comparado consumió ${this.formatearNumero(Math.abs(diferencia), 0)} kWh menos${porcentaje === null ? '' : `, una reducción de ${this.formatearNumero(Math.abs(porcentaje), 1)}%`}.`
            : `La clasificación avanzó de ${base.categoria} a ${comparado.categoria}.`,
        icono: 'pe-7s-leaf',
      };
    }

    if (diferencia > 0 || categoriaEmpeoro) {
      return {
        estado: 'alerta',
        titulo: 'El consumo requiere atención',
        mensaje:
          diferencia > 0
            ? `El período comparado consumió ${this.formatearNumero(diferencia, 0)} kWh más${porcentaje === null ? '' : `, un incremento de ${this.formatearNumero(Math.abs(porcentaje), 1)}%`}.`
            : `La clasificación cambió de ${base.categoria} a ${comparado.categoria}.`,
        icono: 'pe-7s-attention',
      };
    }

    return {
      estado: 'estable',
      titulo: 'El consumo se mantuvo estable',
      mensaje:
        'No se detectó una variación relevante entre los dos períodos seleccionados.',
      icono: 'pe-7s-graph1',
    };
  });

  ngOnInit(): void {
    this.cargarHistorial();
    this.usuarioService.cambioUsuario
      .pipe(takeUntil(this.destruir$))
      .subscribe(() => this.cargarHistorial());
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
  }

  cargarHistorial(): void {
    this.cargando.set(true);
    this.errorSignal.set('');
    this.analisisService
      .listarPorUsuario(
        this.usuarioService.usuarioActual,
        null,
        0,
        MAXIMO_REGISTROS,
      )
      .pipe(
        takeUntil(this.destruir$),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (pagina) => {
          this.historial.set(pagina.content);
          this.totalRegistros.set(pagina.totalElements);
          this.seleccionarPeriodosIniciales(pagina.content);
        },
        error: () =>
          this.errorSignal.set(
            'No pudimos consultar los períodos guardados. Intenta nuevamente.',
          ),
      });
  }

  intercambiarPeriodos(): void {
    const base = this.periodoBaseId();
    this.periodoBaseId.set(this.periodoComparadoId());
    this.periodoComparadoId.set(base);
  }

  seleccionarPeriodoBase(valor: unknown): void {
    const id = this.idHistorialValido(valor);
    if (id !== null && id !== this.periodoComparadoId()) this.periodoBaseId.set(id);
  }

  seleccionarPeriodoComparado(valor: unknown): void {
    const id = this.idHistorialValido(valor);
    if (id !== null && id !== this.periodoBaseId()) this.periodoComparadoId.set(id);
  }

  esSeleccionInvalida(): boolean {
    return (
      this.periodoBaseId() !== null &&
      this.periodoBaseId() === this.periodoComparadoId()
    );
  }

  etiquetaPeriodo(item: HistorialResponse): string {
    return `${this.nombreAnalisis(item)} · ${this.formatearFecha(item.creadoEn)} · ${this.formatearNumero(item.consumoKwh, 0)} kWh · ${item.categoria}`;
  }

  nombreAnalisis(item: HistorialResponse): string {
    return item.nombre_o_numero_analisis ?? `Análisis #${item.id}`;
  }

  formatearFecha(fecha: string): string {
    return formato.formatearFechaHora(fecha);
  }

  formatearNumero(valor: number, decimales = 1): string {
    return formato.formatearNumero(valor, decimales);
  }

  textoVariacion(fila: FilaComparacion): string {
    if (fila.diferencia === 0) {
      return 'Sin cambio';
    }
    const signo = fila.diferencia > 0 ? '+' : '−';
    const diferencia = this.formatearNumero(
      Math.abs(fila.diferencia),
      fila.precision,
    );
    const porcentaje =
      fila.porcentaje === null
        ? ''
        : ` (${signo}${this.formatearNumero(Math.abs(fila.porcentaje), 1)}%)`;
    return `${signo}${diferencia} ${fila.unidad}${porcentaje}`.trim();
  }

  claseVariacion(fila: FilaComparacion): string {
    if (fila.diferencia === 0 || !fila.menorEsMejor) {
      return 'variacion-neutra';
    }
    return fila.diferencia < 0 ? 'variacion-favorable' : 'variacion-desfavorable';
  }

  iconoVariacion(fila: FilaComparacion): string {
    if (fila.diferencia === 0) {
      return 'pe-7s-minus';
    }
    return fila.diferencia < 0 ? 'pe-7s-bottom-arrow' : 'pe-7s-up-arrow';
  }

  anchoBarra(valor: number, base: number, comparado: number): number {
    const maximo = Math.max(Number(base), Number(comparado), 1);
    return Math.max(4, (Number(valor) / maximo) * 100);
  }

  claseCategoria(categoria: string): string {
    const nivel = formato.nivelCategoria(categoria);
    if (nivel === 3) {
      return 'categoria-eficiente';
    }
    if (nivel === 2) {
      return 'categoria-moderada';
    }
    return 'categoria-ineficiente';
  }

  textoCambioCategoria(): string {
    const base = this.periodoBase();
    const comparado = this.periodoComparado();
    if (!base || !comparado) {
      return '';
    }
    const cambio =
      formato.nivelCategoria(comparado.categoria) -
      formato.nivelCategoria(base.categoria);
    if (cambio > 0) {
      return 'Mejoró';
    }
    if (cambio < 0) {
      return 'Empeoró';
    }
    return 'Sin cambio';
  }

  claseCambioCategoria(): string {
    const base = this.periodoBase();
    const comparado = this.periodoComparado();
    if (!base || !comparado) {
      return 'variacion-neutra';
    }
    const cambio =
      formato.nivelCategoria(comparado.categoria) -
      formato.nivelCategoria(base.categoria);
    return cambio > 0
      ? 'variacion-favorable'
      : cambio < 0
        ? 'variacion-desfavorable'
        : 'variacion-neutra';
  }

  private seleccionarPeriodosIniciales(registros: HistorialResponse[]): void {
    if (registros.length >= 2) {
      this.periodoBaseId.set(registros[1].id);
      this.periodoComparadoId.set(registros[0].id);
      return;
    }
    this.periodoBaseId.set(registros[0]?.id ?? null);
    this.periodoComparadoId.set(null);
  }

  private idHistorialValido(valor: unknown): number | null {
    const id = Number(valor);
    return Number.isInteger(id) && this.historial().some((item) => item.id === id)
      ? id
      : null;
  }

  private crearFila(
    etiqueta: string,
    unidad: string,
    base: number,
    comparado: number,
    precision: number,
    menorEsMejor: boolean,
  ): FilaComparacion {
    return {
      etiqueta,
      unidad,
      base: Number(base),
      comparado: Number(comparado),
      diferencia: Number(comparado) - Number(base),
      porcentaje: this.calcularPorcentaje(base, comparado),
      precision,
      menorEsMejor,
    };
  }

  private calcularPorcentaje(base: number, comparado: number): number | null {
    const valorBase = Number(base);
    if (!Number.isFinite(valorBase) || valorBase === 0) {
      return null;
    }
    return ((Number(comparado) - valorBase) / valorBase) * 100;
  }
}
