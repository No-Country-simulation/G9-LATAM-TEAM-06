import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { HistorialResponse } from '../../core/models/historial-response';
import { AnalisisService } from '../../core/services/analisis.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { PageTitleComponent } from '../../layout/page-title';

@Component({
  selector: 'app-simulador-ahorro',
  imports: [FormsModule, PageTitleComponent, RouterLink],
  templateUrl: './simulador-ahorro.component.html',
  styleUrl: './simulador-ahorro.component.scss',
})
export class SimuladorAhorroComponent implements OnInit, OnDestroy {
  private readonly analisisService = inject(AnalisisService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly destruir$ = new Subject<void>();

  readonly historial = signal<HistorialResponse[]>([]);
  readonly analisisId = signal<number | null>(null);
  readonly reduccionConsumo = signal(15);
  readonly cargando = signal(true);
  readonly errorSignal = signal('');

  readonly base = computed(() => this.historial().find((item) => item.id === this.analisisId()) ?? null);
  readonly tarifa = computed(() => {
    const base = this.base();
    return base && Number(base.consumoKwh) > 0
      ? Number(base.costo_estimado_mensual) / Number(base.consumoKwh)
      : 0.75;
  });
  readonly consumoProyectado = computed(() => Number(this.base()?.consumoKwh ?? 0) * (1 - this.reduccionConsumo() / 100));
  readonly kwhAhorrados = computed(() => Number(this.base()?.consumoKwh ?? 0) - this.consumoProyectado());
  readonly costoProyectado = computed(() => this.consumoProyectado() * this.tarifa());
  readonly ahorroMensual = computed(() => Math.max(0, Number(this.base()?.costo_estimado_mensual ?? 0) - this.costoProyectado()));
  readonly ahorroAnual = computed(() => this.ahorroMensual() * 12);
  ngOnInit(): void {
    this.cargarHistorial();
    this.usuarioService.cambioUsuario
      .pipe(takeUntil(this.destruir$))
      .subscribe(() => this.cargarHistorial());
  }
  ngOnDestroy(): void { this.destruir$.next(); this.destruir$.complete(); }

  cargarHistorial(): void {
    this.cargando.set(true);
    this.errorSignal.set('');
    this.analisisService.listarPorUsuario(this.usuarioService.usuarioActual, null, 0, 100)
      .pipe(takeUntil(this.destruir$), finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (pagina) => {
          this.historial.set(pagina.content);
          this.analisisId.set(pagina.content[0]?.id ?? null);
        },
        error: () => this.errorSignal.set('No pudimos consultar tus análisis para crear el escenario.'),
      });
  }

  aplicarPreset(porcentaje: number): void { this.actualizarReduccion(porcentaje); }
  seleccionarAnalisis(valor: unknown): void {
    const id = Number(valor);
    if (!Number.isInteger(id) || !this.historial().some((item) => item.id === id)) return;
    this.analisisId.set(id);
  }
  actualizarReduccion(valor: unknown): void {
    this.reduccionConsumo.set(this.enteroLimitado(valor, 0, 40));
  }
  restablecer(): void {
    this.reduccionConsumo.set(15);
  }
  anchoConsumo(valor: number): number { const maximo = Math.max(Number(this.base()?.consumoKwh ?? 0), 1); return Math.max(3, Math.min(100, valor / maximo * 100)); }
  etiquetaAnalisis(item: HistorialResponse): string { return `${item.nombre_o_numero_analisis ?? `Análisis #${item.id}`} · ${this.formatearFecha(item.creadoEn)} · ${this.formatearNumero(item.consumoKwh, 0)} kWh · ${item.categoria}`; }
  formatearFecha(fecha: string): string { return new Intl.DateTimeFormat('es-MX', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(fecha)); }
  formatearNumero(valor: number, decimales = 1): string { return Number(valor ?? 0).toLocaleString('es-MX', { minimumFractionDigits:decimales, maximumFractionDigits:decimales }); }

  private enteroLimitado(valor: unknown, minimo: number, maximo: number): number {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return minimo;
    return Math.min(maximo, Math.max(minimo, Math.round(numero)));
  }
}
