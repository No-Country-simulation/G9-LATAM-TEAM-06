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
import { ResumenPersonalComponent } from './features/inicio/resumen-personal.component';

export const routes: Routes = [
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: InicioComponent, title: 'EnergiAI' },
      { path: 'resumen', component: ResumenPersonalComponent, title: 'Resumen personal | EnergiAI' },
      { path: 'analisis-general', component: AnalisisGeneralComponent, title: 'Análisis energético | EnergiAI' },
      { path: 'historial', component: HistorialComponent, title: 'Historial | EnergiAI' },
      { path: 'comparacion', component: ComparacionPeriodosComponent, title: 'Comparación de periodos | EnergiAI' },
      { path: 'procesamiento-csv', component: ProcesamientoCsvComponent, title: 'Análisis por factura | EnergiAI' },
      { path: 'ranking', component: RankingEficienciaComponent, title: 'Ranking de eficiencia | EnergiAI' },
      { path: 'simulador', component: SimuladorAhorroComponent, title: 'Simulador de ahorro | EnergiAI' },
      { path: 'verificar-correo', component: VerificarCorreoComponent, title: 'Verificar correo | EnergiAI' },
    ],
  },
  { path: '**', redirectTo: '' },
];
