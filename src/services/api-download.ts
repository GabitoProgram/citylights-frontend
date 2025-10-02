import axios from 'axios';

// Método específico para descargar facturas a través del gateway
export const descargarFactura = async (id: number) => {
  console.log('📄 Descargando factura:', id);
  
  try {
    // URL a través del gateway
    const url = `http://127.0.0.1:3000/api/proxy/booking-copia/factura/${id}/descargar`;
    
    // Obtener token de autorización
    const token = localStorage.getItem('access_token');
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      responseType: 'blob', // Para archivos
    });
    
    console.log('🔍 Response headers:', response.headers);
    
    // Detectar el tipo de archivo
    const contentType = response.headers['content-type'] || '';
    const isHTML = contentType.includes('text/html');
    const extension = isHTML ? 'html' : 'pdf';
    
    console.log(`📄 Tipo detectado: ${isHTML ? 'HTML' : 'PDF'}`);
    
    // Crear blob y descargar
    const blob = new Blob([response.data], { 
      type: contentType
    });
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `factura_${id}.${extension}`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log(`✅ Descarga completada como ${extension.toUpperCase()}`);
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Error descargando factura:', error);
    throw error;
  }
};