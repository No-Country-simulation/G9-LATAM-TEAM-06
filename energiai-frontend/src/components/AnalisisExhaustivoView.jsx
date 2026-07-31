import React, { useState, useEffect } from 'react';
import { obtenerAnalisisEnergetico } from '../services/api';
import ElectrodomesticosSelector from './ElectrodomesticosSelector';
import ResumenExhaustivo from './ResumenExhaustivo';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Zap,
  DollarSign,
  Lightbulb,
} from 'lucide-react';

export default function AnalisisExhaustivoView({ usuario }) {
  const [formData, setFormData] = useState({
    consumo_kwh: 250,
    tipo_inmueble: 'Residencial',
    cantidad_equipos: 5,
    horas_alto_consumo: 6,
    uso_horario_pico: true,
    electrodomesticos: {},
  });

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [validacion, setValidacion] = useState({ valido: true, total: 0 });

  const CATALOGO_ALTO = ['aire_acondicionado', 'calefactor', 'secadora', 'horno_electrico', 'ducha_electrica'];
  const CATALOGO_MEDIO = ['lavadora', 'lavavajillas', 'plancha', 'microondas', 'bomba_agua'];

  const calcularTotales = (electrodomesticos) => {
    const totales = { ALTO: 0, MEDIO: 0, BAJO: 0 };
    Object.entries(electrodomesticos).forEach(([id, cant]) => {
      if (CATALOGO_ALTO.includes(id)) {
        totales.ALTO += cant;
      } else if (CATALOGO_MEDIO.includes(id)) {
        totales.MEDIO += cant;
      } else {
        totales.BAJO += cant;
      }
    });
    return totales;
  };

  const totales = calcularTotales(formData.electrodomesticos);
  const totalSeleccionado = Object.values(formData.electrodomesticos).reduce((a, b) => a + b, 0);
  const valido = totalSeleccionado === formData.cantidad_equipos;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
    }));
  };

  const handleElectrodomesticosChange = (nuevosElectrodomesticos) => {
    setFormData(prev => ({ ...prev, electrodomesticos: nuevosElectrodomesticos }));
  };

  const handleValidationChange = (valido, total) => {
    setValidacion({ valido, total });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const data = await obtenerAnalisisEnergetico(formData);
      setResultado(data);
    } catch (err) {
      setError('No se pudo obtener el análisis desde el servidor.');
    } finally {
      setCargando(false);
    }
  };

  const hayElectrodomesticos = Object.keys(formData.electrodomesticos).length > 0;
  const sumaElectrodomesticos = Object.values(formData.electrodomesticos).reduce((a, b) => a + b, 0);
  const validoElectrodomesticos = !hayElectrodomesticos || sumaElectrodomesticos === formData.cantidad_equipos;
  const botonDisabled = cargando || (hayElectrodomesticos && !valido);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={styles.tarjeta}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <Zap color="#0284c7" size={24} />
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>Parámetros del Análisis Exhaustivo</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              Complete los datos básicos y opcionalmente detalle sus electrodomésticos para un análisis exhaustivo
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.formulario}>
          <div style={styles.gridInputs}>
            <div style={styles.grupoInput}>
              <label style={styles.label}>Consumo Mensual (kWh):</label>
              <input
                type="number"
                name="consumo_kwh"
                value={formData.consumo_kwh}
                onChange={handleChange}
                required
                min="1"
                style={styles.input}
              />
            </div>
            <div style={styles.grupoInput}>
              <label style={styles.label}>Tipo de Inmueble:</label>
              <select name="tipo_inmueble" value={formData.tipo_inmueble} onChange={handleChange} style={styles.input}>
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
              </select>
            </div>
            <div style={styles.grupoInput}>
              <label style={styles.label}>Cantidad de Equipos:</label>
              <input
                type="number"
                name="cantidad_equipos"
                value={formData.cantidad_equipos}
                onChange={handleChange}
                required
                min="1"
                style={styles.input}
              />
            </div>
            <div style={styles.grupoInput}>
              <label style={styles.label}>Horas Alto Consumo / día:</label>
              <input
                type="number"
                name="horas_alto_consumo"
                value={formData.horas_alto_consumo}
                onChange={handleChange}
                required
                min="0"
                max="24"
                style={styles.input}
              />
            </div>
          </div>

          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="uso_horario_pico"
              name="uso_horario_pico"
              checked={formData.uso_horario_pico}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="uso_horario_pico" style={{ color: '#334155', cursor: 'pointer', fontSize: '14px' }}>
              ¿Uso frecuente en horario pico?
            </label>
          </div>

          <button type="submit" disabled={cargando} style={styles.botonSubmit}>
            <Send size={16} />
            {cargando ? 'Analizando...' : 'Generar Análisis Exhaustivo'}
          </button>
        </form>
      </div>

      {error && (
        <div style={styles.badgeError}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={styles.tarjeta}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <Zap color="#eab308" size={22} />
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Detalle de Electrodomésticos (Opcional)</h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              Seleccione sus electrodomésticos y cantidades. La clasificación Alto/Medio/Bajo es automática.
            </p>
          </div>
        </div>

        <ElectrodomesticosSelector
          value={formData.electrodomesticos}
          onChange={(val) => setFormData(prev => ({ ...prev, electrodomesticos: val }))}
          totalEquipos={formData.cantidad_equipos}
          onValidationChange={(valido, total) => setValidacion({ valido, total })}
        />
      </div>

      <ResumenExhaustivo
        alto={Object.entries(formData.electrodomesticos)
          .filter(([id]) => ['aire_acondicionado', 'calefactor', 'secadora', 'horno_electrico', 'ducha_electrica'].includes(id))
          .reduce((a, [, v]) => a + v, 0)}
        medio={Object.entries(formData.electrodomesticos)
          .filter(([id]) => ['lavadora', 'lavavajillas', 'plancha', 'microondas', 'bomba_agua'].includes(id))
          .reduce((a, [, v]) => a + v, 0)}
        bajo={Object.entries(formData.electrodomesticos)
          .filter(([id]) => !['aire_acondicionado', 'calefactor', 'secadora', 'horno_electrico', 'ducha_electrica',
            'lavadora', 'lavavajillas', 'plancha', 'microondas', 'bomba_agua'].includes(id))
          .reduce((a, [, v]) => a + v, 0)}
        total={Object.values(formData.electrodomesticos).reduce((a, b) => a + b, 0)}
        esperado={formData.cantidad_equipos}
        valido={Object.values(formData.electrodomesticos).reduce((a, b) => a + b, 0) === formData.cantidad_equipos}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={cargando || (Object.keys(formData.electrodomesticos).length > 0 && Object.values(formData.electrodomesticos).reduce((a, b) => a + b, 0) !== formData.cantidad_equipos)}
        style={styles.botonSubmit}
      >
        <Send size={16} />
        {cargando ? 'Analizando...' : 'Generar Análisis Exhaustivo'}
      </button>
    </div>
  );
}

const styles = {
  tarjeta: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '15px',
  },
  gridInputs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  grupoInput: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
  },
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
  },
  botonSubmit: {
    marginTop: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    opacity: 1,
    transition: 'opacity 0.2s',
  },
  badgeError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: '12px',
    borderRadius: '8px',
  },
};