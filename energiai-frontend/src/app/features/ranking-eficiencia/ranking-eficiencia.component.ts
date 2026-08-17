import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { HistorialResponse } from '../../core/models/historial-response';
import { AnalisisService } from '../../core/services/analisis.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { PageTitleComponent } from '../../layout/page-title';
import * as formato from '../../core/util/formato';

interface PosicionRanking extends HistorialResponse {
  posicion: number;
  intensidad: number;
}

@Component({
  selector: 'app-ranking-eficiencia',
  imports: [FormsModule, PageTitleComponent, RouterLink],
  templateUrl: './ranking-eficiencia.component.html',
  styleUrl: './ranking-eficiencia.component.scss',
})
export class RankingEficienciaComponent implements OnInit, OnDestroy {
  private readonly analisisService = inject(AnalisisService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly destruir$ = new Subject<void>();

  readonly historial = signal<HistorialResponse[]>([]);
  readonly cargando = signal(true);
  readonly errorSignal = signal('');
  readonly filtroInmueble = signal('Todos');
  readonly totalRegistros = signal(0);

  readonly inmuebles = computed(() => [
    'Todos',
    ...Array.from(new Set(this.historial().map((item) => item.tipoInmueble))).sort(),
  ]);

  readonly ranking = computed<PosicionRanking[]>(() => {
    const filtro = this.filtroInmueble();
    return this.historial()
      .filter((item) => filtro === 'Todos' || item.tipoInmueble === filtro)
      .map((item) => ({
        ...item,
        posicion: 0,
        intensidad: Number(item.consumoKwh) / Math.max(Number(item.cantidadEquipos), 1),
      }))
      .sort((a, b) =>
        formato.nivelCategoria(b.categoria) - formato.nivelCategoria(a.categoria) ||
        a.intensidad - b.intensidad ||
        Number(a.consumoKwh) - Number(b.consumoKwh) ||
        b.id - a.id,
      )
      .map((item, indice) => ({ ...item, posicion: indice + 1 }));
  });

  readonly mejorRegistro = computed(() => this.ranking()[0] ?? null);

  ngOnInit(): void {
    this.cargarRanking();
    this.usuarioService.cambioUsuario
      .pipe(takeUntil(this.destruir$))
      .subscribe(() => this.cargarRanking());
  }
  ngOnDestroy(): void { this.destruir$.next(); this.destruir$.complete(); }

  cargarRanking(): void {
    this.cargando.set(true);
    this.errorSignal.set('');
    this.analisisService
      .listarPorUsuario(this.usuarioService.usuarioActual, null, 0, 100)
      .pipe(takeUntil(this.destruir$), finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (pagina) => {
          this.historial.set(pagina.content);
          this.totalRegistros.set(pagina.totalElements);
        },
        error: () => this.errorSignal.set('No pudimos calcular el ranking. Intenta nuevamente.'),
      });
  }

  actualizarFiltro(valor: unknown): void {
    const filtro = String(valor ?? '');
    this.filtroInmueble.set(this.inmuebles().includes(filtro) ? filtro : 'Todos');
  }

  medalla(posicion: number): string { return ['🥇', '🥈', '🥉'][posicion - 1] ?? `#${posicion}`; }

  claseCategoria(categoria: string): string {
    const nivel = formato.nivelCategoria(categoria);
    return nivel === 3 ? 'eficiente' : nivel === 2 ? 'moderado' : 'ineficiente';
  }

  formatearFecha(fecha: string): string {
    return formato.formatearFecha(fecha);
  }

  formatearNumero(valor: number, decimales = 1): string {
    return formato.formatearNumero(valor, decimales);
  }

  formatearMoneda(valor: number): string {
    return formato.formatearMoneda(valor);
  }
}
