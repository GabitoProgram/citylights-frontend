import React from 'react';
import { X, CreditCard, QrCode } from 'lucide-react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStripe: () => void;
  onSelectQR: () => void;
  reservaInfo: {
    areaName: string;
    fechaInicio: string;
    fechaFin: string;
    monto: number;
  };
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectStripe,
  onSelectQR,
  reservaInfo
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Seleccionar Método de Pago
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Resumen de la reserva */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Resumen de Reserva</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Área:</span> {reservaInfo.areaName}</p>
              <p><span className="font-medium">Fecha:</span> {reservaInfo.fechaInicio} - {reservaInfo.fechaFin}</p>
              <p className="text-lg font-bold text-blue-600 mt-2">
                Total: ${reservaInfo.monto.toFixed(2)} Bs
              </p>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-4">
            {/* Pago con Tarjeta (Stripe) */}
            <button
              onClick={onSelectStripe}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <CreditCard className="text-blue-600" size={24} />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">Pago con Tarjeta</h4>
                  <p className="text-sm text-gray-600">
                    Visa, Mastercard, American Express
                  </p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    ✓ Procesamiento inmediato
                  </p>
                </div>
              </div>
              <div className="text-blue-600">
                →
              </div>
            </button>

            {/* Pago con QR */}
            <button
              onClick={onSelectQR}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <QrCode className="text-green-600" size={24} />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">Pago con QR</h4>
                  <p className="text-sm text-gray-600">
                    Banco Nacional, BCP, Mercantil
                  </p>
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    ⚠ Requiere confirmación manual
                  </p>
                </div>
              </div>
              <div className="text-green-600">
                →
              </div>
            </button>
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Importante:</strong> Tu reserva se mantendrá por 30 minutos mientras completas el pago. 
              Después de este tiempo, la reserva será liberada automáticamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;