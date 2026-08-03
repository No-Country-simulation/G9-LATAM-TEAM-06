export const CATALOGO = {
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

export const CATEGORIA_COLORS = {
  ALTO: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', label: 'ALTO' },
  MEDIO: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: 'MEDIO' },
  BAJO: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', label: 'BAJO' },
};

export const CATALOGO_FLAT = [
  ...CATALOGO.ALTO.map(e => ({ ...e, categoria: 'ALTO' })),
  ...CATALOGO.MEDIO.map(e => ({ ...e, categoria: 'MEDIO' })),
  ...CATALOGO.BAJO.map(e => ({ ...e, categoria: 'BAJO' })),
];

export function getCategoriaById(id) {
  if (CATALOGO.ALTO.some(e => e.id === id)) return 'ALTO';
  if (CATALOGO.MEDIO.some(e => e.id === id)) return 'MEDIO';
  return 'BAJO';
}

export function calcularTotales(electrodomesticos) {
  const totales = { ALTO: 0, MEDIO: 0, BAJO: 0 };
  Object.entries(electrodomesticos).forEach(([id, cant]) => {
    const cat = getCategoriaById(id);
    totales[cat] += cant;
  });
  return totales;
}