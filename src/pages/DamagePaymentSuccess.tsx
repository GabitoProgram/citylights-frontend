import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import apiService from '../services/api';

const DamagePaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setMessage('No se encontró el ID de sesión de Stripe');
      return;
    }

    // Verificar el pago de daños
    const verifyPayment = async () => {
      try {
        console.log('🔍 Verificando pago de daños para sesión:', sessionId);
        
        const result = await apiService.verifyDamagePayment(sessionId);
        
        if (result.success) {
          setStatus('success');
          setMessage('¡Pago de daños procesado exitosamente! El estado de entrega se ha actualizado a ENTREGADO.');
        } else {
          setStatus('error');
          setMessage(result.message || 'Error verificando el pago');
        }
      } catch (error: any) {
        console.error('❌ Error verificando pago:', error);
        setStatus('error');
        setMessage('Error verificando el estado del pago');
      }
    };

    // Esperar un momento y luego verificar
    setTimeout(verifyPayment, 2000);
  }, [searchParams]);

  const handleGoBack = () => {
    navigate('/reservas');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Clock className="mx-auto h-12 w-12 text-yellow-500 animate-pulse" />
                <h2 className="mt-6 text-2xl font-bold text-gray-900">
                  Verificando pago...
                </h2>
                <p className="mt-2 text-gray-600">
                  Procesando el pago de daños, por favor espera.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h2 className="mt-6 text-2xl font-bold text-gray-900">
                  ¡Pago Exitoso!
                </h2>
                <p className="mt-2 text-gray-600">
                  {message}
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="mx-auto h-12 w-12 text-red-500" />
                <h2 className="mt-6 text-2xl font-bold text-gray-900">
                  Error en el pago
                </h2>
                <p className="mt-2 text-gray-600">
                  {message}
                </p>
              </>
            )}

            <div className="mt-6">
              <button
                onClick={handleGoBack}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Volver a Reservas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DamagePaymentSuccess;