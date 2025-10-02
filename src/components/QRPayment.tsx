import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Clock, ArrowLeft, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';

interface QRPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  reservaId: number;
  onPaymentSuccess: () => void;
}

const QRPayment: React.FC<QRPaymentProps> = ({
  isOpen,
  onClose,
  onBack,
  reservaId,
  onPaymentSuccess
}) => {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [referenciaPago, setReferenciaPago] = useState('');
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutos
  const [error, setError] = useState<string | null>(null);
  const [copiedReference, setCopiedReference] = useState(false);

  // Cargar datos del QR al abrir
  useEffect(() => {
    if (isOpen && reservaId) {
      generarQR();
    }
  }, [isOpen, reservaId]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setError('El tiempo para completar el pago ha expirado');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  const generarQR = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📱 [QR Component] Generando QR para reserva:', reservaId);
      
      const data = await apiService.generarQRPago(reservaId);
      setQrData(data);
      console.log('✅ [QR Component] QR generado:', data);
    } catch (err: any) {
      console.error('❌ [QR Component] Error:', err);
      setError(err.response?.data?.message || 'Error al generar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const confirmarPago = async () => {
    if (!referenciaPago.trim()) {
      setError('Por favor ingresa la referencia de pago');
      return;
    }

    try {
      setConfirming(true);
      setError(null);
      console.log('✅ [QR Component] Confirmando pago:', qrData.pagoId);
      
      const result = await apiService.confirmarPagoQR(qrData.pagoId, referenciaPago);
      console.log('✅ [QR Component] Pago confirmado:', result);
      
      // Éxito - cerrar modal y notificar
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ [QR Component] Error confirmando:', err);
      setError(err.response?.data?.message || 'Error al confirmar el pago');
    } finally {
      setConfirming(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReference(true);
      setTimeout(() => setCopiedReference(false), 2000);
    } catch (err) {
      console.error('Error copiando al portapapeles:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-3 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              Pago con QR
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Generando código QR...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={generarQR}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : qrData ? (
            <>
              {/* Timer */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center">
                  <Clock className="text-orange-600 mr-2" size={20} />
                  <span className="text-orange-800 font-semibold">
                    Tiempo restante: {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center mb-6">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 inline-block">
                  <div 
                    dangerouslySetInnerHTML={{ __html: qrData.qrImage }} 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Escanea con tu app bancaria
                </p>
              </div>

              {/* Información de pago */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Banco:</span>
                  <span className="font-semibold">{qrData.banco}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cuenta:</span>
                  <span className="font-semibold">{qrData.numeroCuenta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Titular:</span>
                  <span className="font-semibold">{qrData.titular}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-semibold text-blue-600">
                    ${qrData.monto.toFixed(2)} Bs
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Referencia:</span>
                    <div className="flex items-center">
                      <span className="font-mono text-sm mr-2">
                        {qrData.referenciaPago}
                      </span>
                      <button
                        onClick={() => copyToClipboard(qrData.referenciaPago)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {copiedReference ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Instrucciones:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  {qrData.instrucciones?.map((instruccion: string, index: number) => (
                    <li key={index}>{instruccion}</li>
                  ))}
                </ol>
              </div>

              {/* Confirmación manual */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Confirmar Pago
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Una vez realizado el pago, ingresa la referencia de tu transacción:
                </p>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Referencia de pago (ej: TXN123456)"
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <button
                    onClick={confirmarPago}
                    disabled={confirming || !referenciaPago.trim() || timeLeft <= 0}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                  >
                    {confirming ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Confirmando...
                      </div>
                    ) : (
                      'Confirmar Pago'
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No se pudo cargar la información del pago</p>
              <button
                onClick={generarQR}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRPayment;