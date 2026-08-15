import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
<<<<<<< Updated upstream
import { UsuarioService } from '../../core/services/usuario.service';
=======
import { CsvAnalisisService } from '../../core/services/csv-analisis.service';
>>>>>>> Stashed changes
import { ProcesamientoCsvComponent } from './procesamiento-csv.component';

const CSV_VALIDO = [
  'consumo_kwh,uso_horario_pico,cantidad_equipos,tipo_inmueble,horas_alto_consumo,dispositivos_alto,dispositivos_medio,dispositivos_bajo',
  '250,false,8,Casa,4,2,3,3',
  '650,true,12,Comercio,8,4,5,3',
].join('\n');

describe('ProcesamientoCsvComponent', () => {
  let fixture: ComponentFixture<ProcesamientoCsvComponent>;
  let componente: ProcesamientoCsvComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProcesamientoCsvComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    // Garantiza sesión de invitado (sin correo verificado).
    TestBed.inject(UsuarioService).limpiar();
    fixture = TestBed.createComponent(ProcesamientoCsvComponent);
    componente = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('valida y procesa secuencialmente las filas correctas', () => {
    componente.cargarContenido('consumos.csv', CSV_VALIDO);
    fixture.detectChanges();
    expect(componente.filasValidas().length).toBe(2);
    expect(componente.filasInvalidas().length).toBe(0);

    componente.procesarLote();
    const primera = http.expectOne((req) => req.method === 'POST');
    expect(primera.request.body.usuarioId).toBe('invitado');
    primera.flush(respuesta('Eficiente', 187.5));
    const segunda = http.expectOne((req) => req.method === 'POST');
    segunda.flush(respuesta('Moderado', 487.5));
    fixture.detectChanges();

    expect(componente.exitosas()).toBe(2);
    expect(componente.progreso()).toBe(100);
    expect(fixture.nativeElement.textContent).toContain('Lote completado');
  });

  it('señala una distribución de equipos inconsistente y no permite enviarla', () => {
    componente.cargarContenido('error.csv', CSV_VALIDO.replace('2,3,3', '2,2,2'));
    fixture.detectChanges();
    expect(componente.filasInvalidas().length).toBe(1);
    expect(componente.filasInvalidas()[0].errores.join(' ')).toContain('suma 6');
  });

  it('rechaza campos obligatorios vacíos aunque su rango admita cero', () => {
    const conHoraVacia = CSV_VALIDO.replace('250,false,8,Casa,4,2,3,3', '250,false,8,Casa,,2,3,3');
    componente.cargarContenido('vacio.csv', conHoraVacia);
    expect(componente.filasInvalidas().length).toBe(1);
    expect(componente.filasInvalidas()[0].errores.join(' ')).toContain('obligatorio');
  });

  it('rechaza estructura ambigua, columnas duplicadas y comillas sin cerrar', () => {
    componente.cargarContenido('duplicado.csv', CSV_VALIDO.replace('consumo_kwh,', 'consumo_kwh,consumo_kwh,'));
    expect(componente.erroresGlobales().join(' ')).toContain('duplicadas');

    componente.cargarContenido('comillas.csv', CSV_VALIDO + '\n"250,false');
    expect(componente.erroresGlobales().join(' ')).toContain('comilla sin cerrar');
  });

  it('genera una plantilla compatible con Excel y que el analizador puede leer', () => {
    const servicio = TestBed.inject(CsvAnalisisService);
    const plantilla = servicio.plantilla();
    const resultado = servicio.parsear(plantilla);

    expect(plantilla.startsWith('\uFEFF')).toBeTrue();
    expect(plantilla.split('\r\n')[0]).toContain(';');
    expect(resultado.erroresGlobales).toEqual([]);
    expect(resultado.filas.length).toBe(3);
    expect(resultado.filas.every((fila) => fila.datos !== null)).toBeTrue();
  });

  it('explica cuando Excel guardó cada fila como una sola celda', () => {
    const corrupto = CSV_VALIDO
      .split('\n')
      .map((fila) => `"${fila}"`)
      .join('\r\n');

    componente.cargarContenido('corrupto.csv', corrupto);

    expect(componente.erroresGlobales().join(' ')).toContain('una sola celda');
  });
});

function respuesta(categoria: string, costo: number) {
  return { categoria, probabilidad: 0.9, recomendaciones: [], costo_estimado_mensual: costo, nivel_analisis: 'basico', campos_imputados: [] };
}
