import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
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
import { HistorialLocalService } from './historial-local.service';

const RUTA_BASE = '/analisis-energetico';

@Injectable({ providedIn: 'root' })
export class AnalisisService {
  private readonly http = inject(HttpClient);
  private readonly historialLocal = inject(HistorialLocalService);

  crearAnalisis(datos: AnalisisRequest, usuarioId: string): Observable<AnalisisResponse> {
    const problemas = validarEntradaModelo(datos);
    if (problemas.length) {
      return throwError(
        () => new Error(`Solicitud bloqueada por validación: ${problemas.map((item) => item.mensaje).join(' ')}`),
      );
    }
    const usuarioNormalizado = normalizarCorreoUsuario(usuarioId);
    if (
      usuarioNormalizado &&
      usuarioNormalizado !== 'invitado' &&
      errorCorreoUsuario(usuarioNormalizado)
    ) {
      return throwError(() => new Error('El identificador del usuario no es válido.'));
    }
    const body: AnalisisRequest = {
      ...datos,
      usuarioId: usuarioNormalizado || 'invitado',
    };
    return this.http.post<AnalisisResponse>(
      `${environment.apiUrl}${RUTA_BASE}`,
      body,
    );
  }

  obtenerPorId(id: number): Observable<AnalisisResponse> {
    return this.http.get<AnalisisResponse>(`${environment.apiUrl}${RUTA_BASE}/${id}`);
  }

  listarPorUsuario(
    usuarioId: string,
    categoria: string | null = null,
    page = 0,
    size = 10,
  ): Observable<Paginacion<HistorialResponse>> {
    let params = new HttpParams()
      .set('usuarioId', usuarioId)
      .set('page', page.toString())
      .set('size', size.toString());
    if (categoria) {
      params = params.set('categoria', categoria);
    }
    return this.http
      .get<Paginacion<HistorialResponse>>(`${environment.apiUrl}${RUTA_BASE}`, { params })
      .pipe(map((pagina) => this.historialLocal.filtrarPagina(usuarioId, pagina)));
  }

  ocultarHistorialLocal(usuarioId: string, ultimoId: number): void {
    this.historialLocal.ocultarHasta(usuarioId, ultimoId);
  }

  restaurarHistorialLocal(usuarioId: string): void {
    this.historialLocal.restaurar(usuarioId);
  }

  historialOcultoLocalmente(usuarioId: string): boolean {
    return this.historialLocal.estaOculto(usuarioId);
  }

  borrarHistorial(usuarioId: string): Observable<void> {
    const params = new HttpParams().set('usuarioId', usuarioId || 'invitado');
    return this.http.delete<void>(`${environment.apiUrl}${RUTA_BASE}`, { params });
  }
}
