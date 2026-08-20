import { Component, OnInit, OnDestroy, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { finalize, takeUntil } from "rxjs";
import { Subject } from "rxjs";
import { HistorialResponse } from "../../core/models/historial-response";
import { AnalisisService } from "../../core/services/analisis.service";
import { UsuarioService } from "../../core/services/usuario.service";
import * as formato from "../../core/util/formato";
import { QueEsEnergiaiComponent } from "./que-es-energiai.component";
import { TarjetasGuiaComponent } from "./tarjetas-guia.component";
import { TripleStarComponent } from "../../shared/triple-star.component";

@Component({
  selector: "app-inicio",
  templateUrl: "./inicio.component.html",
  styleUrl: "./inicio.component.scss",
  imports: [RouterLink, QueEsEnergiaiComponent, TarjetasGuiaComponent, TripleStarComponent],
  standalone: true,
})
export class InicioComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly analisisService = inject(AnalisisService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly destruir$ = new Subject<void>();

  readonly historial = signal<HistorialResponse[]>([]);
  readonly cargando = signal(true);
  readonly usuarioActual = signal("");
  readonly mostrarGuia = computed(() => this.historial().length === 0);
  readonly ultimoAnalisis = computed(() => this.historial()[0] ?? null);

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

  private cargarHistorial(): void {
    this.cargando.set(true);
    this.usuarioActual.set(this.usuarioService.usuarioActual || "invitado");
    this.analisisService
      .listarPorUsuario(this.usuarioService.usuarioActual, null, 0, 1)
      .pipe(
        takeUntil(this.destruir$),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (pagina) => this.historial.set(pagina.content),
        error: () => this.historial.set([]),
      });
  }

  irAAnalisisGeneral(): void {
    this.router.navigate(["/analisis-general"]);
  }

  verResumen(): void {
    this.router.navigate(["/resumen"]);
  }

  formatearNumero(valor: number, decimales = 1): string {
    return formato.formatearNumero(valor, decimales);
  }

  formatearMoneda(valor: number): string {
    return formato.formatearMoneda(valor);
  }

  formatearProbabilidad(valor: number): string {
    return formato.formatearProbabilidad(valor);
  }

  formatearFechaCorta(fecha: string): string {
    return formato.formatearFechaCorta(fecha);
  }

  claseCategoria(categoria: string): string {
    const nivel = formato.nivelCategoria(categoria);
    if (nivel === 3) {
      return "estado-eficiente";
    }
    if (nivel === 2) {
      return "estado-moderado";
    }
    return "estado-ineficiente";
  }
}
