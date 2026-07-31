import React from 'react';

const colores = {
  ALTO: { backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' },
  MEDIO: { backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#92400e' },
  BAJO: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' },
};

const styles = {
  container: {
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  titulo: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e293b',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '12px',
  },
  tarjeta: {
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px solid',
  },
  etiqueta: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  valor: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1,
  },
  total: {
    padding: '12px',
    borderRadius: '8px',
    fontWeight: 600,
    textAlign: 'center',
    border: '2px solid',
    fontSize: '14px',
  },
};

export default function ResumenExhaustivo({ alto = 0, medio = 0, bajo = 0, total = 0, esperado = 0, valido = true }) {
  return (
    <div style={styles.container}>
      <h3 style={styles.titulo}>Clasificación Automática de Equipos</h3>
      <div style={styles.grid}>
        <div style={{ ...styles.tarjeta, ...colores.ALTO }}>
          <div style={styles.etiqueta}>ALTO CONSUMO</div>
          <div style={styles.valor}>{alto}</div>
        </div>
        <div style={{ ...styles.tarjeta, ...colores.MEDIO }}>
          <div style={styles.etiqueta}>MEDIO CONSUMO</div>
          <div style={styles.valor}>{medio}</div>
        </div>
        <div style={{ ...styles.tarjeta, ...colores.BAJO }}>
          <div style={styles.etiqueta}>BAJO CONSUMO</div>
          <div style={styles.valor}>{bajo}</div>
        </div>
      </div>
      <div style={{
        ...styles.total,
        backgroundColor: total === esperado ? '#dcfce7' : '#fef2f2',
        borderColor: total === esperado ? '#16a34a' : '#fca5a5',
        color: total === esperado ? '#166534' : '#991b1b'
      }}>
        Total: {alto + medio + bajo} / {esperado} equipos
        {total !== esperado && ' ⚠️ La suma debe igualar la cantidad de equipos'}
      </div>
    </div>
  );
}