import { Injectable } from '@angular/core';
import { HistorialResponse } from '../models/historial-response';
import { Paginacion } from '../models/paginacion';
import { normalizarCorreoUsuario } from './usuario.service';

const CLAVE_HISTORIAL_OCULTO = 'energiai_historial_oculto_hasta_id';

@Injectable({ providedIn: 'root' })
export class HistorialLocalService {
  ocultarHasta(usuarioId: string, ultimoId: number): void {
    if (!Number.isInteger(ultimoId) || ultimoId <= 0) return;

    const usuario = this.normalizarUsuario(usuarioId);
    const limites = this.cargarLimites();
    limites[usuario] = Math.max(limites[usuario] ?? 0, ultimoId);
    localStorage.setItem(CLAVE_HISTORIAL_OCULTO, JSON.stringify(limites));
  }

  restaurar(usuarioId: string): void {
    const usuario = this.normalizarUsuario(usuarioId);
    const limites = this.cargarLimites();
    delete limites[usuario];

    if (Object.keys(limites).length) {
      localStorage.setItem(CLAVE_HISTORIAL_OCULTO, JSON.stringify(limites));
    } else {
      localStorage.removeItem(CLAVE_HISTORIAL_OCULTO);
    }
  }

  estaOculto(usuarioId: string): boolean {
    return this.obtenerLimite(usuarioId) !== null;
  }

  filtrarPagina(
    usuarioId: string,
    pagina: Paginacion<HistorialResponse>,
  ): Paginacion<HistorialResponse> {
    const limite = this.obtenerLimite(usuarioId);
    if (limite === null) return pagina;

    const contenido = pagina.content.filter((item) => item.id > limite);
    const encontroOcultos = contenido.length !== pagina.content.length;
    if (!encontroOcultos) return pagina;

    // El backend ordena por fecha descendente. Al alcanzar este límite,
    // las páginas posteriores contienen registros todavía más antiguos.
    const totalElements = pagina.number * pagina.size + contenido.length;
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / pagina.size);

    return {
      ...pagina,
      content: contenido,
      totalElements,
      totalPages,
      numberOfElements: contenido.length,
      last: true,
      empty: contenido.length === 0,
    };
  }

  private obtenerLimite(usuarioId: string): number | null {
    const limite = this.cargarLimites()[this.normalizarUsuario(usuarioId)];
    return Number.isInteger(limite) && limite > 0 ? limite : null;
  }

  private cargarLimites(): Record<string, number> {
    const guardado = localStorage.getItem(CLAVE_HISTORIAL_OCULTO);
    if (!guardado) return {};

    try {
      const valor = JSON.parse(guardado) as unknown;
      if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return {};

      return Object.fromEntries(
        Object.entries(valor).filter(
          ([usuario, limite]) => Boolean(usuario) && Number.isInteger(limite) && Number(limite) > 0,
        ),
      ) as Record<string, number>;
    } catch {
      localStorage.removeItem(CLAVE_HISTORIAL_OCULTO);
      return {};
    }
  }

  private normalizarUsuario(usuarioId: string): string {
    return normalizarCorreoUsuario(usuarioId) || 'invitado';
  }
}
