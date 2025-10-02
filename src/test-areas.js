// Archivo de prueba para verificar la creación de áreas
// Ejecutar en la consola del navegador para probar

console.log('🧪 Iniciando pruebas del servicio de áreas...');

// Importar el servicio (esto se haría en la consola del navegador)
// import { areasComunesService } from './src/services/areasComunes.js';

// Datos de prueba
const testAreaData = {
  nombre: 'Área de Prueba',
  descripcion: 'Esta es un área de prueba',
  capacidad: 10,
  costoHora: 50.0,
  activa: true
};

async function testCreateArea() {
  try {
    console.log('📤 Enviando datos de prueba:', testAreaData);
    
    // Hacer la petición directa al API
    const response = await fetch('http://127.0.0.1:3000/api/proxy/booking-copia/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(testAreaData)
    });

    console.log('📡 Respuesta del servidor:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Área creada exitosamente:', result);
      return result;
    } else {
      const error = await response.text();
      console.error('❌ Error del servidor:', error);
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    throw error;
  }
}

async function testGetAreas() {
  try {
    console.log('📥 Obteniendo lista de áreas...');
    
    const response = await fetch('http://127.0.0.1:3000/api/proxy/booking-copia/booking', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    console.log('📡 Respuesta del servidor:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Áreas obtenidas:', result);
      return result;
    } else {
      const error = await response.text();
      console.error('❌ Error del servidor:', error);
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    throw error;
  }
}

// Para ejecutar en la consola:
// testGetAreas();
// testCreateArea();

console.log('🧪 Pruebas preparadas. Ejecuta testGetAreas() o testCreateArea() en la consola.');