import { Routes } from '@angular/router';

import { BaseLayoutComponent } from './layout/base-layout';
import { InicioComponent } from './features/inicio/inicio.component';
import { AnalisisGeneralComponent } from './features/analisis-general/analisis-general.component';
import { HistorialComponent } from './features/historial/historial.component';

export const routes: Routes = [
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: InicioComponent },
      { path: 'analisis-general', component: AnalisisGeneralComponent },
      { path: 'historial', component: HistorialComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];