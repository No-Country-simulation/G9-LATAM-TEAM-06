import { Injectable } from '@angular/core';
import { AnalisisRequest } from '../models/analisis-request';
import { AnalisisResponse } from '../models/analisis-response';
import { HistorialResponse } from '../models/historial-response';

const CLAVE_HISTORIAL_INVITADO = 'energiai_historial_invitado';

function mapearAHistorial(
  solicitud: AnalisisRequest,
  respuesta: AnalisisResponse,
  id: number,
  creadoEn: string,
): HistorialResponse {
  return {
    id,
    creadoEn,
    usuario: 'invitado',
    consumoKwh: solicitud.consumo_kwh,
    tipoInmueble: solicitud.tipo_inmueble,
    cantidadEquipos: solicitud.cantidad_equipos,
    horasAltoConsumo: solicitud.horas_alto_consumo,
    usoHorarioPico: solicitud.uso_horario_pico,
    categoria: respuesta.categoria,
    probabilidad: respuesta.probabilidad,
    costo_estimado_mensual: respuesta.costo_estimado_mensual,
    recomendaciones: respuesta.recomendaciones,
    clasificacion_equipos: respuesta.clasificacion_equipos,
    recomendaciones_detalle: respuesta.recomendaciones_detalle,
    origen_prediccion: respuesta.origen_prediccion,
    modelo_version: respuesta.modelo_version,
    advertencias: respuesta.advertencias,
    nombre_o_numero_analisis: respuesta.nombre_o_numero_analisis,
  };
}

@Injectable({ providedIn: 'root' })
export class HistorialInvitadoService {
  listar(): HistorialResponse[] {
    const registros = this.cargar();
    return [...registros].sort((a, b) => b.id - a.id);
  }

  agregar(solicitud: AnalisisRequest, respuesta: AnalisisResponse): HistorialResponse {
    const registros = this.cargar();
    const id = this.siguienteId(registros);
    const creadoEn = new Date().toISOString();
    const item = mapearAHistorial(solicitud, respuesta, id, creadoEn);
    registros.push(item);
    localStorage.setItem(CLAVE_HISTORIAL_INVITADO, JSON.stringify(registros));
    return item;
  }

  borrarTodo(): void {
    localStorage.removeItem(CLAVE_HISTORIAL_INVITADO);
  }

  siguienteNumeroAnalisis(): number {
    return this.cargar().length + 1;
  }

  private siguienteId(registros: HistorialResponse[]): number {
    const maximo = registros.reduce((mayor, item) => Math.max(mayor, item.id), 0);
    return maximo + 1;
  }

  private cargar(): HistorialResponse[] {
    const guardado = localStorage.getItem(CLAVE_HISTORIAL_INVITADO);
    if (!guardado) {
      return [];
    }
    try {
      const valor = JSON.parse(guardado) as unknown;
      return Array.isArray(valor) ? (valor as HistorialResponse[]) : [];
    } catch {
      localStorage.removeItem(CLAVE_HISTORIAL_INVITADO);
      return [];
    }
  }
}