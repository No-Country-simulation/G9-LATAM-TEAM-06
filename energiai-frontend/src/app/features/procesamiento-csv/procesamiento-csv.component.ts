import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, concatMap, finalize, from, map, of, tap } from 'rxjs';
import { AnalisisResponse } from '../../core/models/analisis-response';
import { AnalisisService } from '../../core/services/analisis.service';
import {
  CsvAnalisisService,
  FilaAnalisisCsv,
} from '../../core/services/csv-analisis.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { PageTitleComponent } from '../../layout/page-title';

interface ResultadoProcesado {
  fila: number;
  estado: 'exitoso' | 'error';
  categoria?: string;
  costo?: number;
  mensaje?: string;
}

@Component({
  selector: 'app-procesamiento-csv',
  imports: [PageTitleComponent, RouterLink],
  templateUrl: './procesamiento-csv.component.html',
  styleUrl: './procesamiento-csv.component.scss',
})
export class ProcesamientoCsvComponent {
  private readonly csvService = inject(CsvAnalisisService);
  private readonly analisisService = inject(AnalisisService);
  readonly usuarioService = inject(UsuarioService);

  readonly nombreArchivo = signal('');
  readonly filas = signal<FilaAnalisisCsv[]>([]);
  readonly erroresGlobales = signal<string[]>([]);
  readonly procesando = signal(false);
  readonly procesadas = signal(0);
  readonly resultados = signal<ResultadoProcesado[]>([]);
  readonly arrastrando = signal(false);

  readonly filasValidas = computed(() =>
    this.filas().filter((fila) => fila.datos !== null),
  );
  readonly filasInvalidas = computed(() =>
    this.filas().filter((fila) => fila.datos === null),
  );
  readonly exitosas = computed(
    () => this.resultados().filter((item) => item.estado === 'exitoso').length,
  );
  readonly fallidas = computed(
    () => this.resultados().filter((item) => item.estado === 'error').length,
  );
  readonly progreso = computed(() => {
    const total = this.filasValidas().length;
    return total ? Math.round((this.procesadas() / total) * 100) : 0;
  });

  async seleccionarArchivo(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (archivo) {
      await this.cargarArchivo(archivo);
    }
    input.value = '';
  }

  async soltarArchivo(evento: DragEvent): Promise<void> {
    evento.preventDefault();
    this.arrastrando.set(false);
    const archivo = evento.dataTransfer?.files?.[0];
    if (archivo) {
      await this.cargarArchivo(archivo);
    }
  }

  permitirSoltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(true);
  }

  cargarContenido(nombre: string, contenido: string): void {
    this.reiniciarResultados();
    this.nombreArchivo.set(nombre);
    const resultado = this.csvService.parsear(contenido);
    this.filas.set(resultado.filas);
    this.erroresGlobales.set(resultado.erroresGlobales);
  }

  procesarLote(): void {
    const filas = this.filasValidas();
    if (!filas.length || this.procesando()) {
      return;
    }

    this.resultados.set([]);
    this.procesadas.set(0);
    this.procesando.set(true);

    from(filas)
      .pipe(
        concatMap((fila) =>
          this.analisisService
            .crearAnalisis(fila.datos!, this.usuarioService.usuarioActual)
            .pipe(
              map((respuesta: AnalisisResponse): ResultadoProcesado => ({
                fila: fila.numero,
                estado: 'exitoso',
                categoria: respuesta.categoria,
                costo: respuesta.costo_estimado_mensual,
              })),
              catchError(() =>
                of<ResultadoProcesado>({
                  fila: fila.numero,
                  estado: 'error',
                  mensaje: 'El servicio no pudo procesar esta fila.',
                }),
              ),
            ),
        ),
        tap((resultado) => {
          this.resultados.update((actuales) => [...actuales, resultado]);
          this.procesadas.update((valor) => valor + 1);
        }),
        finalize(() => this.procesando.set(false)),
      )
      .subscribe();
  }

  descargarPlantilla(): void {
    const blob = new Blob([this.csvService.plantilla()], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'plantilla_analisis_energia.csv';
    enlace.click();
    URL.revokeObjectURL(url);
  }

  limpiar(): void {
    this.nombreArchivo.set('');
    this.filas.set([]);
    this.erroresGlobales.set([]);
    this.reiniciarResultados();
  }

  private async cargarArchivo(archivo: File): Promise<void> {
    if (!archivo.name.toLowerCase().endsWith('.csv')) {
      this.cargarContenido(archivo.name, '');
      this.erroresGlobales.set(['Selecciona un archivo con extensión .csv.']);
      return;
    }
    if (archivo.size > 1024 * 1024) {
      this.cargarContenido(archivo.name, '');
      this.erroresGlobales.set(['El archivo no debe superar 1 MB.']);
      return;
    }
    this.cargarContenido(archivo.name, await archivo.text());
  }

  private reiniciarResultados(): void {
    this.resultados.set([]);
    this.procesadas.set(0);
    this.procesando.set(false);
  }
}
