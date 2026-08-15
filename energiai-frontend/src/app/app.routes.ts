import { Routes } from '@angular/router';

import { BaseLayoutComponent } from './layout/base-layout';
import { InicioComponent } from './features/inicio/inicio.component';
import { AnalisisGeneralComponent } from './features/analisis-general/analisis-general.component';
import { HistorialComponent } from './features/historial/historial.component';
import { ComparacionPeriodosComponent } from './features/comparacion-periodos/comparacion-periodos.component';
import { ProcesamientoCsvComponent } from './features/procesamiento-csv/procesamiento-csv.component';
import { RankingEficienciaComponent } from './features/ranking-eficiencia/ranking-eficiencia.component';
import { SimuladorAhorroComponent } from './features/simulador-ahorro/simulador-ahorro.component';
import { VerificarCorreoComponent } from './features/verificar-correo/verificar-correo.component';

export const routes: Routes = [
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: InicioComponent },
      { path: 'analisis-general', component: AnalisisGeneralComponent },
      { path: 'historial', component: HistorialComponent },
      { path: 'comparacion', component: ComparacionPeriodosComponent },
      { path: 'procesamiento-csv', component: ProcesamientoCsvComponent },
      { path: 'ranking', component: RankingEficienciaComponent },
      { path: 'simulador', component: SimuladorAhorroComponent },
      { path: 'verificar-correo', component: VerificarCorreoComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
