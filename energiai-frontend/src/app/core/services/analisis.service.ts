import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalisisRequest } from '../models/analisis-request';
import { AnalisisResponse } from '../models/analisis-response';
import { HistorialResponse } from '../models/historial-response';
import { Paginacion } from '../models/paginacion';

const RUTA_BASE = '/analisis-energetico';

@Injectable({ providedIn: 'root' })
export class AnalisisService {
  private readonly http = inject(HttpClient);

  crearAnalisis(datos: AnalisisRequest, usuarioId: string): Observable<AnalisisResponse> {
    const body: AnalisisRequest = {
      ...datos,
      usuarioId: usuarioId || 'invitado',
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
    return this.http.get<Paginacion<HistorialResponse>>(
      `${environment.apiUrl}${RUTA_BASE}`,
      { params },
    );
  }
}