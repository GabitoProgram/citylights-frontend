import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, Receipt, Calendar, MapPin, Clock, DollarSign } from 'lucide-react';
import { apiService } from '../../services/api';

const ReservaExitosaPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<any>(null);
  const [reservaData, setReservaData] = useState<any>(null);
  const [facturaData, setFacturaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>('');

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setError('No se encontró ID de sesión de pago');
      setLoading(false);
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await apiService.get(`/booking-copia/stripe/verify-session/${sessionId}`);
      console.log('🔍 Respuesta completa del servidor:', response);
      console.log('🔍 Datos de verificación:', response);
      
      if (response?.session) {
        setSessionData(response.session);
      }
      if (response?.reserva) {
        setReservaData(response.reserva);
      }
      if (response?.factura) {
        setFacturaData(response.factura);
      } else {
        // Si no hay factura, intentar generarla automáticamente
        console.log('⚠️ No se encontró factura, generando automáticamente...');
        try {
          const facturaResponse = await apiService.generarFacturaParaSesion(sessionId!);
          if (facturaResponse.success && facturaResponse.factura) {
            console.log('✅ Factura generada automáticamente:', facturaResponse.factura);
            setFacturaData(facturaResponse.factura);
          }
        } catch (facturaError) {
          console.error('❌ Error generando factura automática:', facturaError);
          // No mostrar error al usuario, solo dejar que use el botón manual
        }
      }
    } catch (error: any) {
      console.error('Error verificando pago:', error);
      setError('Error al verificar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarFactura = async () => {
    if (!facturaData?.id) {
      alert('No hay factura disponible para descargar');
      return;
    }

    setDownloading(true);
    try {
      console.log('🔍 Intentando descargar factura con ID:', facturaData.id);
      
      // Usar apiService para mantener el flujo: Frontend → Gateway → Microservicio
      await apiService.descargarFactura(facturaData.id);
      
      console.log('✅ Descarga iniciada');
    } catch (error: any) {
      console.error('❌ Error descargando factura:', error);
      
      // Mostrar información más detallada del error
      let errorMessage = 'Error al descargar la factura.';
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        errorMessage += ` Status: ${error.response.status}`;
        if (error.response.data?.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      } else if (error.message) {
        errorMessage += ` - ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerarFactura = async () => {
    if (!sessionId) {
      alert('No se encontró información de la sesión');
      return;
    }

    setDownloading(true);
    try {
      console.log('🧾 Generando factura para sesión:', sessionId);
      const response = await apiService.generarFacturaParaSesion(sessionId);
      
      if (response.success && response.factura) {
        // Actualizar los datos de la factura
        setFacturaData(response.factura);
        alert('¡Factura generada exitosamente!');
        
        // Opcional: descargar automáticamente
        setTimeout(async () => {
          try {
            await apiService.descargarFactura(response.factura.id);
          } catch (downloadError) {
            console.error('Error descargando factura recién generada:', downloadError);
          }
        }, 1000);
      } else {
        alert(response.message || 'Error generando la factura');
      }
    } catch (error: any) {
      console.error('Error generando factura:', error);
      alert('Error al generar la factura. Por favor intenta nuevamente.');
    } finally {
      setDownloading(false);
    }
  };

  const handleGoToAreas = () => {
    navigate('/areas-comunes');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 rounded-full p-3 inline-block mb-4">
            <Receipt className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Error en el Pago</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={handleGoToAreas}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 inline mr-2" />
            Volver a Áreas Comunes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icono de éxito */}
          <div className="bg-green-100 rounded-full p-4 inline-block mb-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>

          {/* Título principal */}
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ¡Pago Exitoso! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Tu reserva ha sido confirmada y el pago procesado correctamente.
          </p>

          {/* Información de la reserva */}
          {reservaData && (
            <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Detalles de la Reserva
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Área:
                  </span>
                  <span className="font-medium text-blue-800">{reservaData.areaComun}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Fecha y Hora:
                  </span>
                  <div className="text-right">
                    <div className="font-medium text-blue-800">
                      {new Date(reservaData.inicio).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-blue-600">
                      {new Date(reservaData.inicio).toLocaleTimeString()} - {new Date(reservaData.fin).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Costo:
                  </span>
                  <span className="font-medium text-blue-800">${reservaData.costo}</span>
                </div>
              </div>
            </div>
          )}

          {/* Información del pago */}
          {sessionData && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del Pago</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium text-green-600">
                    {sessionData.payment_status === 'paid' ? 'Pagado ✅' : sessionData.payment_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pagado:</span>
                  <span className="font-medium text-gray-800">
                    ${(sessionData.amount_total / 100).toFixed(2)} {sessionData.currency?.toUpperCase()}
                  </span>
                </div>
                {sessionData.customer_email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-800">{sessionData.customer_email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sección de descarga de factura */}
          {facturaData ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-green-800">Factura Disponible</h3>
              </div>
              <p className="text-green-700 mb-4 text-center">
                Tu factura <strong>{facturaData.numeroFactura}</strong> está lista para descargar.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleDescargarFactura}
                  disabled={downloading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {downloading ? 'Descargando...' : 'Descargar Factura PDF'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-blue-800">Generar Factura</h3>
              </div>
              <p className="text-blue-700 text-center mb-4">
                Tu pago ha sido procesado correctamente. Genera tu factura oficial para completar el proceso.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleGenerarFactura}
                  disabled={downloading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <Receipt className="h-5 w-5 mr-2" />
                  {downloading ? 'Generando...' : 'Generar Factura PDF'}
                </button>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoToDashboard}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Receipt className="h-5 w-5 mr-2" />
              Ir al Dashboard
            </button>
            
            <button
              onClick={handleGoToAreas}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver a Áreas Comunes
            </button>
          </div>

          {/* Nota adicional */}
          <div className="mt-8 text-sm text-gray-500">
            <p>Si tienes alguna pregunta sobre tu reserva o pago, no dudes en contactar con nuestro equipo de soporte.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservaExitosaPage;