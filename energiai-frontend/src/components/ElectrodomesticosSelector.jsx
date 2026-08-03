import React from 'react';
import { CATALOGO, CATEGORIA_COLORS, getCategoriaById, calcularTotales } from '../constants/catalogo';

export default function ElectrodomesticosSelector({
  value,
  onChange,
  totalEquipos,
  onValidationChange,
}) {
  const [electrodomesticos, setElectrodomesticos] = React.useState(value || {});

  React.useEffect(() => {
    onChange(electrodomesticos);
  }, [electrodomesticos, onChange]);

  React.useEffect(() => {
    const total = Object.values(electrodomesticos).reduce((a, b) => a + b, 0);
    const valido = total === totalEquipos;
    onValidationChange?.(valido, total);
  }, [electrodomesticos, totalEquipos, onValidationChange]);

  const handleToggle = (id, checked) => {
    setElectrodomesticos(prev => {
      const next = { ...prev };
      if (checked) {
        next[id] = 1;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const handleCantidad = (id, cantidad) => {
    setElectrodomesticos(prev => ({
      ...prev,
      [id]: Math.max(1, Math.min(cantidad, totalEquipos))
    }));
  };

  const totales = calcularTotales(electrodomesticos);
  const totalSeleccionado = Object.values(electrodomesticos).reduce((a, b) => a + b, 0);
  const valido = totalSeleccionado === totalEquipos;

  return (
    <div style={styles.container}>
      <div style={styles.resumen}>
        <div style={{ ...styles.chip, ...CATEGORIA_COLORS.ALTO }}>
          ALTO: {totales.ALTO}
        </div>
        <div style={{ ...styles.chip, ...CATEGORIA_COLORS.MEDIO }}>
          MEDIO: {totales.MEDIO}
        </div>
        <div style={{ ...styles.chip, ...CATEGORIA_COLORS.BAJO }}>
          BAJO: {totales.BAJO}
        </div>
        <div style={{
          ...styles.chip,
          backgroundColor: valido ? '#dcfce7' : '#fef2f2',
          color: valido ? '#166534' : '#991b1b'
        }}>
          Total: {totalSeleccionado} / {totalEquipos}
        </div>
      </div>

      <div style={styles.categorias}>
        {['ALTO', 'MEDIO', 'BAJO'].map(cat => (
          <div key={cat} style={styles.categoria}>
            <h4 style={{ ...styles.categoriaTitulo, ...CATEGORIA_COLORS[cat] }}>
              {CATEGORIA_COLORS[cat].label}
            </h4>
            <div style={styles.grid}>
              {CATALOGO[cat].map(item => {
                const cantidad = electrodomesticos[item.id] || 0;
                const checked = cantidad > 0;
                return (
                  <div key={item.id} style={styles.item}>
                    <label style={styles.label}>
                      <input
                        type="checkbox"
                        checked={electrodomesticos[item.id] > 0}
                        onChange={e => handleToggle(item.id, e.target.checked)}
                        style={styles.checkbox}
                      />
                      <span style={styles.nombre}>{item.label}</span>
                    </label>
                    {electrodomesticos[item.id] > 0 && (
                      <input
                        type="number"
                        min="1"
                        max={totalEquipos}
                        value={electrodomesticos[item.id]}
                        onChange={e => handleCantidad(item.id, parseInt(e.target.value) || 1)}
                        style={styles.inputCantidad}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        ...styles.total,
        backgroundColor: valido ? '#dcfce7' : '#fef2f2',
        color: valido ? '#166534' : '#991b1b'
      }}>
        Total seleccionado: {totalSeleccionado} / {totalEquipos}
        {totalEquipos !== totalSeleccionado && ' - Ajuste la cantidad'}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  resumen: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  chip: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    border: '1px solid',
  },
  categorias: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  categoria: {
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  categoriaTitulo: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '6px',
    display: 'inline-block',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '8px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    flex: 1,
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#0284c7',
  },
  nombre: {
    fontSize: '13px',
    color: '#334155',
    flex: 1,
  },
  watts: {
    fontSize: '12px',
    color: '#64748b',
    backgroundColor: '#e2e8f0',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  inputCantidad: {
    width: '60px',
    padding: '4px 8px',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    fontSize: '13px',
  },
  inputCantidadDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  total: {
    marginTop: '16px',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: 600,
    textAlign: 'center',
    border: '1px solid',
  },
};