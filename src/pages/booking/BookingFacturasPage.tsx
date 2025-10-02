import React from 'react';
import { Download, FileText } from 'lucide-react';

interface FacturaBooking {
  id: number;
  numeroFactura: string;
  clienteNombre: string;
  total: number;
  estado: string;
  fechaEmision: string;
}

interface BookingFacturasPageProps {
  facturas: FacturaBooking[];
}

const descargarFacturaBookingPDF = async (facturaId: number) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`http://localhost:3000/api/proxy/booking-copia/factura/${facturaId}/descargar`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura_booking_${facturaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      alert('Error descargando la factura PDF de booking');
    }
  } catch (error) {
    console.error('Error descargando factura booking:', error);
    alert('Error al descargar la factura de booking.');
  }
};

const BookingFacturasPage: React.FC<BookingFacturasPageProps> = ({ facturas }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Facturas de Reservas (Booking)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Factura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {facturas.map((factura) => (
              <tr key={factura.id}>
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{factura.numeroFactura}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{factura.clienteNombre}</td>
                <td className="px-6 py-4 text-sm text-gray-900">Bs. {factura.total.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    factura.estado === 'ENVIADA' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {factura.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(factura.fechaEmision).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <button
                    onClick={() => descargarFacturaBookingPDF(factura.id)}
                    className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 flex items-center"
                    title="Descargar factura PDF"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Descargar Factura
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {facturas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No hay facturas de reservas generadas aún</p>
            <p className="text-sm">Las facturas se generan automáticamente al confirmar pagos</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFacturasPage;
