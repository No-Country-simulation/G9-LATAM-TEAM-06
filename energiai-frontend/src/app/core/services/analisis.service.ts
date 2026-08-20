import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalisisRequest } from '../models/analisis-request';
import { AnalisisResponse } from '../models/analisis-response';
import { HistorialResponse } from '../models/historial-response';
import { Paginacion } from '../models/paginacion';
import { validarEntradaModelo } from '../validation/model-input-validator';
import {
  errorCorreoUsuario,
  normalizarCorreoUsuario,
} from './usuario.service';
import { UsuarioService } from './usuario.service';
import {
  HistorialInvitadoService,
  HistorialInvitadoItem,
} from './historial-invitado.service';
import { HistorialLocalService } from './historial-local.service';

const RUTA_BASE = '/analisis-energetico';

@Injectable({ providedIn: 'root' })
export class AnalisisService {
  private readonly http = inject(HttpClient);
  private readonly historialLocal = inject(HistorialLocalService);
  private readonly historialInvitado = inject(HistorialInvitadoService);
  private readonly usuarioService = inject(UsuarioService);

  crearAnalisis(datos: AnalisisRequest, usuarioId: string): Observable<AnalisisResponse> {
    const problemas = validarEntradaModelo(datos);
    if (problemas.length) {
      return throwError(
        () => new Error(`Solicitud bloqueada por validación: ${problemas.map((item) => item.mensaje).join(' ')}`),
      );
    }
    const esInvitado = !this.usuarioService.esVerificado();
    const usuarioNormalizado = normalizarCorreoUsuario(usuarioId);
    if (
      !esInvitado &&
      (errorCorreoUsuario(usuarioNormalizado) || !usuarioNormalizado)
    ) {
      return throwError(() => new Error('El identificador del usuario no es válido.'));
    }
    const body: AnalisisRequest = {
      ...datos,
      usuarioId: esInvitado ? 'invitado' : usuarioNormalizado,
    };
    return this.http
      .post<AnalisisResponse>(`${environment.apiUrl}${RUTA_BASE}`, body)
      .pipe(
        map((respuesta) => {
          if (esInvitado) {
            // Los análisis de invitado se guardan en el navegador, no en la BD.
            this.historialInvitado.agregar(datos, respuesta);
          }
          return respuesta;
        }),
      );
  }

  obtenerPorId(id: number, usuarioId: string): Observable<AnalisisResponse> {
    const params = new HttpParams().set('usuarioId', usuarioId || 'invitado');
    return this.http.get<AnalisisResponse>(`${environment.apiUrl}${RUTA_BASE}/${id}`, { params });
  }

  listarPorUsuario(
    usuarioId: string,
    categoria: string | null = null,
    page = 0,
    size = 10,
  ): Observable<Paginacion<HistorialResponse>> {
    const esInvitado = !this.usuarioService.esVerificado();
    if (esInvitado) {
      return of(this.paginarInvitados(page, size, categoria));
    }

    const pagina = Math.max(0, Math.floor(Number(page) || 0));
    const tamano = Math.min(100, Math.max(1, Math.floor(Number(size) || 10)));
    let params = new HttpParams()
      .set('usuarioId', usuarioId)
      .set('page', pagina.toString())
      .set('size', tamano.toString());
    if (categoria) {
      params = params.set('categoria', categoria);
    }
    return this.http
      .get<Paginacion<HistorialResponse>>(`${environment.apiUrl}${RUTA_BASE}`, { params })
      .pipe(map((respuesta) => this.historialLocal.filtrarPagina(usuarioId, respuesta)));
  }

  borrarHistorial(usuarioId: string): Observable<void> {
    const esInvitado = !this.usuarioService.esVerificado();
    if (esInvitado) {
      this.historialInvitado.borrarTodo();
      return of(undefined);
    }
    const params = new HttpParams().set('usuarioId', usuarioId || 'invitado');
    return this.http.delete<void>(`${environment.apiUrl}${RUTA_BASE}`, { params });
  }

  borrarSeleccion(usuarioId: string, ids: number[]): Observable<void> {
    const esInvitado = !this.usuarioService.esVerificado();
    if (esInvitado) {
      this.historialInvitado.borrarPorIds(ids);
      return of(undefined);
    }
    const params = new HttpParams()
      .set('usuarioId', usuarioId || 'invitado')
      .set('ids', ids.join(','));
    return this.http.delete<void>(
      `${environment.apiUrl}${RUTA_BASE}/seleccion`,
      { params },
    );
  }

  migrarHistorial(usuarioId: string): Observable<HistorialResponse[]> {
    const items = this.historialInvitado.listarParaMigracion();
    if (!items.length) {
      return of([]);
    }
    const body = {
      usuarioId,
      analisis: items.map((item) => this.mapearParaMigracion(item)),
    };
    return this.http.post<HistorialResponse[]>(
      `${environment.apiUrl}${RUTA_BASE}/migrar`,
      body,
    );
  }

  private mapearParaMigracion(item: HistorialInvitadoItem): unknown {
    return {
      solicitud: item.solicitud ?? this.reconstruirSolicitud(item),
      categoria: item.categoria,
      probabilidad: item.probabilidad,
      costo_estimado_mensual: item.costo_estimado_mensual,
      recomendaciones: item.recomendaciones,
      clasificacion_equipos: item.clasificacion_equipos,
      recomendaciones_detalle: item.recomendaciones_detalle,
      origen_prediccion: item.origen_prediccion,
      modelo_version: item.modelo_version,
      advertencias: item.advertencias,
    };
  }

  /** Reconstruye la solicitud mínima para registros locales antiguos sin ella guardada. */
  private reconstruirSolicitud(item: HistorialResponse): AnalisisRequest {
    const clasificacion = item.clasificacion_equipos ?? {};
    const alto = clasificacion['alto'] ?? 0;
    const medio = clasificacion['medio'] ?? 0;
    const bajo = clasificacion['bajo'] ?? 0;
    return {
      consumo_kwh: item.consumoKwh,
      uso_horario_pico: item.usoHorarioPico,
      cantidad_equipos: item.cantidadEquipos,
      tipo_inmueble: item.tipoInmueble as AnalisisRequest['tipo_inmueble'],
      horas_alto_consumo: item.horasAltoConsumo,
      usuarioId: 'invitado',
      nombre_o_numero_analisis: item.nombre_o_numero_analisis,
      dispositivos_alto: alto,
      dispositivos_medio: medio,
      dispositivos_bajo: bajo,
    };
  }

  private paginarInvitados(
    page: number,
    size: number,
    categoria: string | null,
  ): Paginacion<HistorialResponse> {
    const pagina = Math.max(0, Math.floor(Number(page) || 0));
    const tamano = Math.min(100, Math.max(1, Math.floor(Number(size) || 10)));
    const todos = this.historialInvitado.listar();
    const filtrados = categoria
      ? todos.filter((item) => item.categoria === categoria)
      : todos;
    const inicio = pagina * tamano;
    const contenido = filtrados.slice(inicio, inicio + tamano);
    const total = filtrados.length;
    return {
      content: contenido,
      totalElements: total,
      totalPages: total === 0 ? 0 : Math.ceil(total / tamano),
      size: tamano,
      number: pagina,
      numberOfElements: contenido.length,
      first: pagina === 0,
      last: inicio + contenido.length >= total,
      empty: contenido.length === 0,
    };
  }
}