import React from 'react';

const CATALOGO = {
  ALTO: [
    { id: 'aire_acondicionado', label: 'Aire acondicionado', kwh_mes: { min: 150, max: 450 } },
    { id: 'calefactor', label: 'Calefactor eléctrico', kwh_mes: { min: 100, max: 300 } },
    { id: 'secadora', label: 'Secadora', kwh_mes: { min: 80, max: 200 } },
    { id: 'horno_electrico', label: 'Horno eléctrico', kwh_mes: { min: 50, max: 150 } },
    { id: 'ducha_electrica', label: 'Ducha eléctrica', kwh_mes: { min: 200, max: 600 } },
  ],
  MEDIO: [
    { id: 'lavadora', label: 'Lavadora', kwh_mes: { min: 30, max: 100 } },
    { id: 'lavavajillas', label: 'Lavavajillas', kwh_mes: { min: 20, max: 80 } },
    { id: 'plancha', label: 'Plancha', kwh_mes: { min: 15, max: 60 } },
    { id: 'microondas', label: 'Microondas', kwh_mes: { min: 10, max: 40 } },
    { id: 'bomba_agua', label: 'Bomba de agua', kwh_mes: { min: 20, max: 80 } },
  ],
  BAJO: [
    { id: 'nevera', label: 'Nevera/Refrigerador', kwh_mes: { min: 30, max: 80 } },
    { id: 'freezer', label: 'Freezer', kwh_mes: { min: 40, max: 120 } },
    { id: 'televisor', label: 'Televisor', kwh_mes: { min: 15, max: 50 } },
    { id: 'computadora', label: 'Computadora/PC', kwh_mes: { min: 20, max: 80 } },
    { id: 'iluminacion_led', label: 'Iluminación LED', kwh_mes: { min: 5, max: 30 } },
    { id: 'router', label: 'Router/Modem', kwh_mes: { min: 2, max: 10 } },
    { id: 'cargador_celular', label: 'Cargador celular', kwh_mes: { min: 1, max: 5 } },
  ],
};

const CATEGORIA_COLORS = {
  ALTO: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', label: 'ALTO' },
  MEDIO: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: 'MEDIO' },
  BAJO: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', label: 'BAJO' },
};

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

  const getCategoria = (id) => {
    if (CATALOGO.ALTO.some(e => e.id === id)) return 'ALTO';
    if (CATALOGO.MEDIO.some(e => e.id === id)) return 'MEDIO';
    return 'BAJO';
  };

  const calcularTotales = () => {
    const totales = { ALTO: 0, MEDIO: 0, BAJO: 0 };
    Object.entries(electrodomesticos).forEach(([id, cant]) => {
      const cat = CATALOGO.ALTO.some(e => e.id === id) ? 'ALTO' :
                  CATALOGO.MEDIO.some(e => e.id === id) ? 'MEDIO' : 'BAJO';
      totales[cat] += cant;
    });
    return totales;
  };

  const totales = calcularTotales();
  const totalSeleccionado = Object.values(electrodomesticos).reduce((a, b) => a + b, 0);
  const valido = totalSeleccionado === totalEquipos;

  return (
    <div style={styles.container}>
      <div style={styles.resumen}>
        <div style={{ ...styles.chip, ...CATEGORIA_COLORS.ALTO }}>
          ALTO: {Object.entries(electrodomesticos)
            .filter(([id]) => CATALOGO.ALTO.some(e => e.id === id))
            .reduce((a, [, v]) => a + v, 0)}
        </div>
        <div style={{ ...styles.chip, ...CATEGORIA_COLORS.MEDIO }}>
          MEDIO: {Object.entries(electrodomesticos)
            .filter(([id]) => CATALOGO.MEDIO.some(e => e.id === id))
            .reduce((a, [, v]) => a + v, 0)}
        </div>
        <div style={{ ...styles.chip, ...CATEGORIA_COLORS.BAJO }}>
          BAJO: {Object.entries(electrodomesticos)
            .filter(([id]) => CATALOGO.BAJO.some(e => e.id === id))
            .reduce((a, [, v]) => a + v, 0)}
        </div>
        <div style={{
          ...styles.chip,
          backgroundColor: totalEquipos ===
            Object.values(electrodomesticos).reduce((a, b) => a + b, 0)
            ? '#dcfce7' : '#fef2f2',
          color: totalEquipos ===
            Object.values(electrodomesticos).reduce((a, b) => a + b, 0)
            ? '#166534' : '#991b1b'
          }}>
          Total: {Object.values(electrodomesticos).reduce((a, b) => a + b, 0)} / {totalEquipos}
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
        backgroundColor: totalEquipos ===
          Object.values(electrodomesticos).reduce((a, b) => a + b, 0)
          ? '#dcfce7' : '#fef2f2',
        color: totalEquipos ===
          Object.values(electrodomesticos).reduce((a, b) => a + b, 0)
          ? '#166534' : '#991b1b'
      }}>
        Total seleccionado: {Object.values(electrodomesticos).reduce((a, b) => a + b, 0)} / {totalEquipos}
        {totalEquipos !== Object.values(electrodomesticos).reduce((a, b) => a + b, 0) && ' - Ajuste la cantidad'}
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