const fs = require('fs');
const path = require('path');

function leerApiKeyDev() {
  const ruta = path.resolve(__dirname, '../secrets/api_key_secret.txt');
  try {
    const clave = fs.readFileSync(ruta, 'utf8').trim();
    if (!clave) {
      console.warn('[proxy] El secret de desarrollo esta vacio. Los requests a la API seran rechazados (401).');
    }
    return clave;
  } catch (error) {
    console.warn('[proxy] No existe secrets/api_key_secret.txt. Los requests a la API seran rechazados (401).');
    return '';
  }
}

const API_KEY_DEV = leerApiKeyDev();

module.exports = {
  '/analisis-energetico': {
    target: 'http://localhost:8090',
    changeOrigin: true,
    secure: false,
    headers: API_KEY_DEV ? { 'X-API-KEY': API_KEY_DEV } : undefined,
  },
  '/verificacion': {
    target: 'http://localhost:8090',
    changeOrigin: true,
    secure: false,
    headers: API_KEY_DEV ? { 'X-API-KEY': API_KEY_DEV } : undefined,
  },
};