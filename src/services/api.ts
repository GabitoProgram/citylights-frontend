import axios from 'axios';

class ApiService {
  api;
  
  constructor() {
    this.api = axios.create({
      baseURL: 'https://citylights-gateway-production.up.railway.app/api/proxy',
      withCredentials: true,
    });
    
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async login(email, password) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData) {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async verifyEmail(email, code) {
    const response = await this.api.post('/auth/verify-email', { email, code });
    return response.data;
  }

  async refreshToken(refreshToken) {
    const response = await this.api.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async forgotPassword(email) {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(email, code, newPassword) {
    const response = await this.api.post('/auth/reset-password', { email, code, newPassword });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/users/me');
    return response.data;
  }

  async getAreaComunes() {
    console.log('🔄 [API Service] Obteniendo áreas comunes...');
    console.log('🌐 Flujo: Frontend → Gateway → Microservicio');
    const response = await this.api.get('/booking-copia/booking');
    console.log('📊 [API Service] Áreas respuesta:', response.data);
    return response;
  }

  async createAreaComun(areaData) {
    const response = await this.api.post('/booking-copia/booking', areaData);
    return response.data;
  }

  async updateAreaComun(id, areaData) {
    console.log('🔄 [API Service] Actualizando área común:', id, areaData);
    const response = await this.api.put(`/booking-copia/booking/${id}`, areaData);
    console.log('✅ [API Service] Área actualizada:', response.data);
    return response.data;
  }

  async deleteAreaComun(id) {
    console.log('🗑️ [API Service] Eliminando área común:', id);
    const response = await this.api.delete(`/booking-copia/booking/${id}`);
    console.log('✅ [API Service] Área eliminada:', response.data);
    return response.data;
  }

  async getReservas() {
    console.log('🔄 [API Service] Obteniendo reservas...');
    console.log('🌐 Flujo: Frontend → Gateway → Microservicio');
    const response = await this.api.get('/booking-copia/reserva');
    console.log('📊 [API Service] Respuesta completa:', response);
    console.log('📊 [API Service] response.data:', response.data);
    return response;
  }

  async createReserva(reservaData) {
    const response = await this.api.post('/booking-copia/reserva', reservaData);
    return response.data;
  }

  async createReservaWithStripe(reservaData) {
    const response = await this.api.post('/booking-copia/reserva/with-stripe', reservaData);
    return response.data;
  }

  async generarFacturaParaSesion(sessionId) {
    const response = await this.api.post('/booking-copia/stripe/generate-invoice/' + sessionId);
    return response.data;
  }

  async getFacturas() {
    const response = await this.api.get('/booking-copia/factura');
    return response.data;
  }

  async descargarFactura(id) {
    console.log('📄 Descargando factura:', id);
    
    try {
      console.log('🌐 Flujo: Frontend → Gateway → Microservicio');
      const fullUrl = this.api.defaults.baseURL + '/booking-copia/factura/' + id + '/descargar';
      console.log('🔗 URL completa de descarga:', fullUrl);
      
      const response = await this.api.get('/booking-copia/factura/' + id + '/descargar', {
        responseType: 'blob',
      });

      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }
      
      const blob = response.data;
      const contentType = response.headers['content-type'] || '';
      const isHTML = contentType.includes('text/html');
      
      // Debug: Ver todos los headers recibidos
      console.log('🔍 Headers recibidos:', response.headers);
      console.log('🔍 Content-Type:', contentType);
      console.log('🔍 Tamaño del blob:', blob.size);
      
      // Obtener el nombre real del archivo desde Content-Disposition
      let fileName = 'factura_' + id + (isHTML ? '.html' : '.pdf');
      const disposition = response.headers['content-disposition'];
      console.log('🔍 Content-Disposition header:', disposition);
      
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
          console.log('✅ Nombre extraído del header:', fileName);
        } else {
          console.log('⚠️ No se pudo extraer nombre del Content-Disposition');
        }
      } else {
        console.log('⚠️ No se encontró header Content-Disposition');
      }
      
      console.log('📁 Nombre final del archivo:', fileName);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Descarga completada exitosamente');

      setTimeout(() => {
        if (isHTML) {
          alert('✅ ¡Factura HTML descargada con información del usuario!\n\n📝 Para convertir a PDF:\n1. Abrir el archivo descargado\n2. Ctrl+P → Guardar como PDF');
        } else {
          alert('✅ ¡Factura PDF descargada exitosamente!');
        }
      }, 500);

      return { success: true, type: isHTML ? 'html' : 'pdf', fileName };
    } catch (error) {
      console.error('❌ Error descargando factura:', error);
      alert('❌ Error al descargar la factura');
      throw error;
    }
  }

  // Métodos para gestión de reservas
  async deleteReserva(id) {
    try {
      console.log('🗑️ [API Service] Eliminando reserva:', id);
      console.log('🌐 [API Service] Flujo: Frontend → Gateway → Microservicio');
      console.log('🔗 [API Service] URL:', '/booking-copia/reserva/' + id);
      
      const response = await this.api.delete('/booking-copia/reserva/' + id);
      
      console.log('✅ [API Service] Reserva eliminada exitosamente');
      console.log('📊 [API Service] Response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [API Service] Error eliminando reserva:', error);
      console.error('❌ [API Service] Response error:', (error as any).response?.data);
      console.error('❌ [API Service] Status error:', (error as any).response?.status);
      console.error('❌ [API Service] Error completo:', (error as any).response);
      throw error;
    }
  }

  async updateReserva(id, reservaData) {
    console.log('✏️ Actualizando reserva:', id, reservaData);
    console.log('🌐 Flujo: Frontend → Gateway → Microservicio');
    const response = await this.api.put('/booking-copia/reserva/' + id, reservaData);
    return response.data;
  }

  async getReservaWithFactura(reservaId) {
    console.log('🔍 Obteniendo reserva con factura:', reservaId);
    console.log('🌐 Flujo: Frontend → Gateway → Microservicio');
    const response = await this.api.get('/booking-copia/reserva/' + reservaId + '/with-factura');
    return response.data;
  }

  // Método GET genérico
  async get(url) {
    const response = await this.api.get(url);
    return response.data;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  }

  getCurrentUserFromStorage() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // 🆕 QR PAYMENT METHODS

  async generarQRPago(reservaId) {
    try {
      console.log('📱 [API Service] Generando QR para reserva:', reservaId);
      console.log('🌐 [API Service] Flujo: Frontend → Gateway → Microservicio');
      
      const response = await this.api.post(`/booking-copia/pago-reserva/qr/generar/${reservaId}`);
      
      console.log('✅ [API Service] QR generado exitosamente');
      console.log('📊 [API Service] Datos QR:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [API Service] Error generando QR:', error);
      console.error('❌ [API Service] Response error:', (error as any).response?.data);
      throw error;
    }
  }

  async confirmarPagoQR(pagoId, referenciaPago) {
    try {
      console.log('✅ [API Service] Confirmando pago QR:', pagoId);
      console.log('🌐 [API Service] Flujo: Frontend → Gateway → Microservicio');
      
      const response = await this.api.post(`/booking-copia/pago-reserva/qr/confirmar/${pagoId}`, {
        referenciaPago
      });
      
      console.log('✅ [API Service] Pago QR confirmado exitosamente');
      console.log('📊 [API Service] Resultado:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [API Service] Error confirmando pago QR:', error);
      console.error('❌ [API Service] Response error:', (error as any).response?.data);
      throw error;
    }
  }

  // 📊 MÉTODOS PARA REPORTES

  async getReportesIngresos() {
    try {
      console.log('📊 [API Service] Obteniendo reportes de ingresos...');
      console.log('🌐 Flujo: Frontend → Gateway → Booking Microservicio');
      
      // Obtener todas las reservas con pagos
      const response = await this.api.get('/booking-copia/reserva');
      console.log('📊 [API Service] Reservas para reportes:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [API Service] Error obteniendo reportes de ingresos:', error);
      throw error;
    }
  }

  async getReportesEgresos() {
    try {
      console.log('📊 [API Service] Obteniendo reportes de egresos...');
      console.log('🌐 Flujo: Frontend → Gateway → Nómina Microservicio');
      
      // Obtener todos los pagos de nómina
      const response = await this.api.get('/nomina/pago');
      console.log('📊 [API Service] Pagos para reportes:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [API Service] Error obteniendo reportes de egresos:', error);
      throw error;
    }
  }

  async getReportesAreasActivas() {
    try {
      console.log('📊 [API Service] Obteniendo áreas activas...');
      console.log('🌐 Flujo: Frontend → Gateway → Booking Microservicio');
      
      // Obtener áreas comunes
      const response = await this.api.get('/booking-copia/booking');
      console.log('📊 [API Service] Áreas para reportes:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [API Service] Error obteniendo áreas activas:', error);
      throw error;
    }
  }

  async getDebugEstadosPagos() {
    try {
      console.log('🔍 [API Service] Obteniendo debug de estados de pagos...');
      console.log('🌐 Flujo: Frontend → Gateway → Nómina Microservicio');
      
      const response = await this.api.get('/nomina/pago/debug/estados');
      console.log('🔍 [API Service] Estados de pagos:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [API Service] Error obteniendo debug de estados:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
