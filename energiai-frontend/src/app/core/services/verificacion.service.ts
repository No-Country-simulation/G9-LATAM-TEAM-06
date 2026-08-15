import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VerificacionResponse {
  email: string;
  verificado: boolean;
  mensaje: string;
  reintentosRestantes: number;
}

export interface ErrorVerificacion {
  codigo: string;
  mensaje: string;
  reintentosRestantes?: number;
}

@Injectable({ providedIn: 'root' })
export class VerificacionService {
  private readonly http = inject(HttpClient);

  solicitarCodigo(email: string): Observable<VerificacionResponse> {
    return this.http.post<VerificacionResponse>(
      `${environment.apiUrl}/verificacion/codigo`,
      { email },
    );
  }

  verificarCodigo(email: string, codigo: string): Observable<VerificacionResponse> {
    return this.http.post<VerificacionResponse>(
      `${environment.apiUrl}/verificacion/verificar`,
      { email, codigo },
    );
  }
}