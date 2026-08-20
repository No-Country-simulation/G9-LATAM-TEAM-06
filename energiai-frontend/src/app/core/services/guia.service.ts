import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class GuiaService {
  readonly ayudaAbierta = signal(false);

  abrirAyuda(): void {
    this.ayudaAbierta.set(true);
  }

  cerrarAyuda(): void {
    this.ayudaAbierta.set(false);
  }
}