import React, { useState, useEffect } from 'react';
import { crearAnalisisEnergetico } from '../services/api';
import ElectrodomesticosSelector from './ElectrodomesticosSelector';
import ResumenExhaustivo from './ResumenExhaustivo';
import { CATALOGO, calcularTotales } from '../constants/catalogo';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Zap,
  DollarSign,
  Lightbulb,
  AlertTriangle,
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hayElectrodomesticos = Object.keys(formData.electrodomesticos).length > 0;
    const sumaElectrodomesticos = Object.values(formData.electrodomesticos).reduce((a, b) => a + b, 0);
    const validoElectrodomesticos = !hayElectrodomesticos || sumaElectrodomesticos === formData.cantidad_equipos;

    if (!validoElectrodomesticos) {
      setError(`La suma de electrodomésticos (${sumaElectrodomesticos}) debe igualar la cantidad de equipos (${formData.cantidad_equipos})`);
      return;
    }

    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const data = await crearAnalisisEnergetico(formData, usuario);
      setResultado(data);
    } catch (err) {
      setError('No se pudo obtener el análisis desde el servidor.');
    } finally {
      setCargando(false);
    }
  };

  const botonDisabled = cargando || (Object.keys(formData.electrodomesticos).length > 0 && totalSeleccionado !== formData.cantidad_equipos);

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

          <button type="submit" disabled={botonDisabled} style={styles.botonSubmit}>
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
        />
      </div>

      <ResumenExhaustivo
        alto={totales.ALTO}
        medio={totales.MEDIO}
        bajo={totales.BAJO}
        total={totalSeleccionado}
        esperado={formData.cantidad_equipos}
        valido={valido}
      />

      {resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#15803d',
              fontWeight: 'bold',
            }}
          >
            <CheckCircle2 size={20} />
            <span>Resultado Generado con Éxito</span>
          </div>

          <div style={styles.gridMetricas}>
            <div style={styles.tarjetaMetrica}>
              <span style={styles.tituloMetrica}>Categoría de Consumo</span>
              <div style={{ marginTop: '10px' }}>
                <span style={styles.badgeCategoria}>
                  {resultado.categoria}
                </span>
              </div>
              <small
                style={{
                  color: '#64748b',
                  marginTop: '10px',
                  display: 'block',
                }}
              >
                Probabilidad: {(resultado.probabilidad * 100).toFixed(0)}%
              </small>
            </div>

            <div style={styles.tarjetaMetrica}>
              <span style={styles.tituloMetrica}>Costo Estimado Mensual</span>
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px',
                }}
              >
                <DollarSign size={28} color="#16a34a" />
                <span style={styles.valorMetrica}>
                  {resultado.costo_estimado_mensual}
                </span>
              </div>
              <small
                style={{
                  color: '#64748b',
                  marginTop: '10px',
                  display: 'block',
                }}
              >
                Estimación en divisa base
              </small>
            </div>
          </div>

          <div style={styles.tarjeta}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              <Lightbulb color="#eab308" size={22} />
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>
                Recomendaciones
              </h3>
            </div>
            <ul style={styles.listaRecomendaciones}>
              {resultado.recomendaciones?.map((rec, index) => (
                <li key={index} style={styles.itemRecomendacion}>
                  <span style={{ color: '#eab308', fontWeight: 'bold' }}>
                    •
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
  gridMetricas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  tarjetaMetrica: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #0284c7',
  },
  tituloMetrica: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  valorMetrica: { fontSize: '28px', fontWeight: 'bold', color: '#0f172a' },
  badgeCategoria: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
    padding: '4px 12px',
    borderRadius: '16px',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  listaRecomendaciones: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemRecomendacion: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#f8fafc',
    padding: '10px 14px',
    borderRadius: '8px',
    color: '#334155',
    fontSize: '14px',
  },
};