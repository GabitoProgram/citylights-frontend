import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, RefreshCw, Calendar } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Factura, PagoReserva } from '../../types';
import { rolePermissions } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface FacturasProps {}

const Facturas: React.FC<FacturasProps> = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pagos, setPagos] = useState<PagoReserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const { user } = useAuth();
  
  const userPermissions = user ? rolePermissions[user.role] : { canRead: false, canCreate: false, canEdit: false, canDelete: false };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [facturasResponse, pagosResponse] = await Promise.all([
        apiService.getFacturas(),
        apiService.getPagos()
      ]);
      
      setFacturas(facturasResponse.data || []);
      setPagos(pagosResponse.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const descargarFactura = async (facturaId: number, numeroFactura: string) => {
    try {
      const blob = await apiService.descargarFactura(facturaId);
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura_${numeroFactura}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al descargar la factura');
    }
  };

  const regenerarPDF = async (facturaId: number) => {
    try {
      await apiService.regenerarFacturaPDF(facturaId);
      alert('PDF regenerado exitosamente');
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al regenerar el PDF');
    }
  };

  const verDetalles = (factura: Factura) => {
    setSelectedFactura(factura);
    setShowModal(true);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'GENERADA':
        return 'bg-blue-100 text-blue-800';
      case 'ENVIADA':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAGADA':
        return 'bg-green-100 text-green-800';
      case 'ANULADA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPagoInfo = (pagoReservaId: number) => {
    const pago = pagos.find(p => p.id === pagoReservaId);
    if (!pago) return null;
    
    return {
      monto: pago.monto,
      metodoPago: pago.metodoPago,
      estado: pago.estado
    };
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Facturas</h1>
        <button
          onClick={cargarDatos}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <RefreshCw size={20} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Facturas</p>
              <p className="text-2xl font-bold text-blue-800">{facturas.length}</p>
            </div>
            <FileText className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Pagadas</p>
              <p className="text-2xl font-bold text-green-800">
                {facturas.filter(f => f.estado === 'PAGADA').length}
              </p>
            </div>
            <FileText className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-800">
                {facturas.filter(f => f.estado === 'GENERADA' || f.estado === 'ENVIADA').length}
              </p>
            </div>
            <Calendar className="text-yellow-500" size={24} />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total Facturado</p>
              <p className="text-2xl font-bold text-purple-800">
                ${facturas.reduce((sum, f) => sum + f.total, 0).toLocaleString()}
              </p>
            </div>
            <FileText className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IVA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facturas.map((factura) => (
                <tr key={factura.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {factura.numeroFactura}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearFecha(factura.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${factura.monto.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${factura.iva.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${factura.total.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(factura.estado)}`}>
                      {factura.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => verDetalles(factura)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {factura.rutaArchivo && (
                        <button
                          onClick={() => descargarFactura(factura.id, factura.numeroFactura)}
                          className="text-green-600 hover:text-green-800"
                          title="Descargar PDF"
                        >
                          <Download size={16} />
                        </button>
                      )}
                      
                      {userPermissions.canEdit && (
                        <button
                          onClick={() => regenerarPDF(factura.id)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Regenerar PDF"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {facturas.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No hay facturas registradas</p>
        </div>
      )}

      {/* Modal para ver detalles de factura */}
      {showModal && selectedFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Detalles de Factura</h2>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(selectedFactura.estado)}`}>
                  {selectedFactura.estado}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Número de Factura
                    </label>
                    <p className="text-lg font-mono text-gray-900">
                      {selectedFactura.numeroFactura}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha
                    </label>
                    <p className="text-lg text-gray-900">
                      {formatearFecha(selectedFactura.fecha)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Detalle Financiero</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${selectedFactura.monto.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">IVA:</span>
                      <span className="font-medium">${selectedFactura.iva.toLocaleString()}</span>
                    </div>
                    
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>${selectedFactura.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  const pagoInfo = getPagoInfo(selectedFactura.pagoReservaId);
                  if (!pagoInfo) {
                    return (
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Pago</h3>
                        <p className="text-gray-500">Información del pago no disponible</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Pago</h3>
                      
                      <div className="bg-gray-50 p-3 rounded-md space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Método de Pago:</span>
                          <span className="font-medium">{pagoInfo.metodoPago}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estado del Pago:</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            pagoInfo.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {pagoInfo.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Sistema</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <strong>Fecha de Creación:</strong> {new Date(selectedFactura.fechaCreacion).toLocaleString()}
                    </div>
                    
                    <div>
                      <strong>Última Actualización:</strong> {new Date(selectedFactura.fechaActualizacion).toLocaleString()}
                    </div>
                    
                    {selectedFactura.rutaArchivo && (
                      <div>
                        <strong>Archivo PDF:</strong> Disponible
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cerrar
                </button>
                
                {selectedFactura.rutaArchivo && (
                  <button
                    onClick={() => descargarFactura(selectedFactura.id, selectedFactura.numeroFactura)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Descargar PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturas;