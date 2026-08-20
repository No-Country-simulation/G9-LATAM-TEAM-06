import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, Subject, Subscription, takeUntil, tap } from 'rxjs';
import { AnalisisService } from '../../core/services/analisis.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { HistorialResponse } from '../../core/models/historial-response';
import * as formato from '../../core/util/formato';
import { PageTitleComponent } from '../../layout/page-title';

interface ItemHistorial {
  id: number;
  nombre: string;
  fecha: string;
  categoria: string;
  consumoKwh: number;
  tipoInmueble: string;
  cantidadEquipos: number;
  costo: number;
  probabilidad: number;
}

const TAMANO_PAGINA = 10;

@Component({
  selector: 'app-historial',
  imports: [PageTitleComponent, RouterLink],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss',
})
export class HistorialComponent implements OnInit, OnDestroy {
  readonly historial = signal<ItemHistorial[]>([]);
  readonly cargando = signal(true);
  readonly errorSignal = signal<string>('');
  readonly tieneMas = signal(false);
  readonly pagina = signal(0);
  readonly borrando = signal(false);
  readonly seleccionados = signal<Set<number>>(new Set());

  private readonly destruir$ = new Subject<void>();
  private suscripcionActual: Subscription | undefined;

  readonly usuarioService = inject(UsuarioService);
  private readonly analisisService = inject(AnalisisService);

  readonly usuarioActual = computed(() => this.usuarioService.usuarioActual);

  readonly vacio = computed(
    () => this.historial().length === 0 && !this.cargando(),
  );

  readonly cantidadSeleccionados = computed(() => this.seleccionados().size);

  readonly todosSeleccionados = computed(
    () =>
      this.historial().length > 0 &&
      this.historial().every((item) => this.seleccionados().has(item.id)),
  );

  ngOnInit(): void {
    this.cargarHistorial(0, false);
    this.usuarioService.cambioUsuario
      .pipe(takeUntil(this.destruir$))
      .subscribe(() => this.cargarHistorial(0, false));
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
  }

  cargarHistorial(page: number, append: boolean): void {
    this.suscripcionActual?.unsubscribe();
    this.cargando.set(true);
    this.errorSignal.set('');

    this.suscripcionActual = this.analisisService
      .listarPorUsuario(this.usuarioActual(), null, page, TAMANO_PAGINA)
      .pipe(
        takeUntil(this.destruir$),
        tap((data) => {
          const nuevos = data.content.map(this.mapearItem);
          this.historial.update((previo) =>
            append ? [...previo, ...nuevos] : nuevos,
          );
          this.tieneMas.set(!data.last);
          this.pagina.set(page);
        }),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        error: () =>
          this.errorSignal.set(
            'No se pudo cargar el historial desde el servidor.',
          ),
      });
  }

  cargarMas(): void {
    if (!this.cargando() && this.tieneMas()) {
      this.cargarHistorial(this.pagina() + 1, true);
    }
  }

  refrescar(): void {
    this.cargarHistorial(0, false);
  }

  borrarHistorial(): void {
    const confirmar = window.confirm(
      `¿Seguro que deseas borrar todo el historial de ${this.usuarioActual()}? Esta acción no se puede deshacer.`,
    );
    if (!confirmar) {
      return;
    }

    this.borrando.set(true);
    this.analisisService
      .borrarHistorial(this.usuarioActual())
      .pipe(finalize(() => this.borrando.set(false)))
      .subscribe({
        next: () => {
          this.historial.set([]);
          this.pagina.set(0);
          this.tieneMas.set(false);
          this.seleccionados.set(new Set());
        },
        error: () =>
          this.errorSignal.set(
            'No se pudo borrar el historial. Intenta nuevamente.',
          ),
      });
  }

  alternarSeleccion(id: number): void {
    this.seleccionados.update((previo) => {
      const siguiente = new Set(previo);
      if (siguiente.has(id)) {
        siguiente.delete(id);
      } else {
        siguiente.add(id);
      }
      return siguiente;
    });
  }

  alternarSeleccionTodos(): void {
    this.seleccionados.update(() => {
      if (this.todosSeleccionados()) {
        return new Set<number>();
      }
      return new Set(this.historial().map((item) => item.id));
    });
  }

  borrarSeleccionados(): void {
    const ids = [...this.seleccionados()];
    if (!ids.length) {
      return;
    }
    const confirmar = window.confirm(
      `¿Seguro que deseas borrar los ${ids.length} análisis seleccionados? Esta acción no se puede deshacer.`,
    );
    if (!confirmar) {
      return;
    }

    this.borrando.set(true);
    this.analisisService
      .borrarSeleccion(this.usuarioActual(), ids)
      .pipe(finalize(() => this.borrando.set(false)))
      .subscribe({
        next: () => {
          const seleccion = this.seleccionados();
          this.historial.update((previo) =>
            previo.filter((item) => !seleccion.has(item.id)),
          );
          this.seleccionados.set(new Set());
        },
        error: () =>
          this.errorSignal.set(
            'No se pudieron borrar los análisis seleccionados. Intenta nuevamente.',
          ),
      });
  }

  private mapearItem(item: HistorialResponse): ItemHistorial {
    return {
      id: item.id,
      nombre: item.nombre_o_numero_analisis ?? `Análisis #${item.id}`,
      fecha: formato.formatearFechaHora(item.creadoEn),
      categoria: item.categoria,
      consumoKwh: item.consumoKwh,
      tipoInmueble: item.tipoInmueble,
      cantidadEquipos: item.cantidadEquipos,
      costo: item.costo_estimado_mensual,
      probabilidad: item.probabilidad,
    };
  }

  formatearProbabilidad(probabilidad: number): string {
    return formato.formatearProbabilidad(probabilidad);
  }

  formatearCosto(costo: number): string {
    return formato.formatearMoneda(costo);
  }

  claseCategoria(categoria: string): string {
    return formato.claseCategoriaBootstrap(categoria);
  }
}