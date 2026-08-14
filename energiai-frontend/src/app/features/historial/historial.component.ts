import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, Subject, Subscription, takeUntil, tap } from 'rxjs';
import { AnalisisService } from '../../core/services/analisis.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { HistorialResponse } from '../../core/models/historial-response';
import { PageTitleComponent } from '../../layout/page-title';

interface ItemHistorial {
  id: number;
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
  readonly ocultoLocalmente = signal(false);

  private readonly destruir$ = new Subject<void>();
  private suscripcionActual: Subscription | undefined;

  readonly usuarioService = inject(UsuarioService);
  private readonly analisisService = inject(AnalisisService);

  get usuarioActual(): string {
    return this.usuarioService.usuarioActual;
  }

  readonly vacio = computed(
    () => this.historial().length === 0 && !this.cargando(),
  );

  ngOnInit(): void {
    this.ocultoLocalmente.set(
      this.analisisService.historialOcultoLocalmente(this.usuarioActual),
    );
    this.cargarHistorial(0, false);
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
      .listarPorUsuario(this.usuarioActual, null, page, TAMANO_PAGINA)
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

  ocultarHistorial(): void {
    const confirmar = window.confirm(
      `¿Deseas ocultar en este navegador el historial de ${this.usuarioActual}? Los registros seguirán guardados en la base de datos.`,
    );
    if (!confirmar) {
      return;
    }

    const ultimoId = Math.max(...this.historial().map((item) => item.id));
    this.analisisService.ocultarHistorialLocal(this.usuarioActual, ultimoId);
    this.historial.set([]);
    this.pagina.set(0);
    this.tieneMas.set(false);
    this.ocultoLocalmente.set(true);
  }

  restaurarHistorial(): void {
    this.analisisService.restaurarHistorialLocal(this.usuarioActual);
    this.ocultoLocalmente.set(false);
    this.cargarHistorial(0, false);
  }

  private mapearItem(item: HistorialResponse): ItemHistorial {
    return {
      id: item.id,
      fecha: new Date(item.creadoEn).toLocaleString(),
      categoria: item.categoria,
      consumoKwh: item.consumoKwh,
      tipoInmueble: item.tipoInmueble,
      cantidadEquipos: item.cantidadEquipos,
      costo: item.costo_estimado_mensual,
      probabilidad: item.probabilidad,
    };
  }

  formatearProbabilidad(probabilidad: number): string {
    return `${(Number(probabilidad) * 100).toFixed(0)}%`;
  }

  formatearCosto(costo: number): string {
    return Number(costo).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  claseCategoria(categoria: string): string {
    const valor = (categoria ?? '').toLowerCase();
    if (valor.includes('ineficiente')) {
      return 'bg-danger';
    }
    if (valor.includes('moderado') || valor.includes('medio') || valor.includes('normal')) {
      return 'bg-warning text-white';
    }
    if (valor.includes('eficiente')) {
      return 'bg-success';
    }
    return 'bg-danger';
  }
}
