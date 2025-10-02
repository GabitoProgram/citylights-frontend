import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Calendar, FileText, Eye, Plus } from 'lucide-react';
import { apiService } from '../../services/api';
import type { PagoReserva, Reserva } from '../../types';
import { rolePermissions } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface PagosProps {}

const Pagos: React.FC<PagosProps> = () => {
  const [pagos, setPagos] = useState<PagoReserva[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPago, setEditingPago] = useState<PagoReserva | null>(null);
  const { user } = useAuth();
  
  const userPermissions = user ? rolePermissions[user.role] : { canRead: false, canCreate: false, canEdit: false, canDelete: false };

  const [formData, setFormData] = useState({
    reservaId: 0,
    monto: 0,
    metodoPago: 'TARJETA' as 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO',
    referencia: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pagosResponse, reservasResponse] = await Promise.all([
        apiService.getPagos(),
        apiService.getReservas()
      ]);
      
      setPagos(pagosResponse.data || []);
      setReservas(reservasResponse.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPago) {
        await apiService.updatePago(editingPago.id, formData);
      } else {
        await apiService.createPago(formData);
      }
      
      await cargarDatos();
      resetForm();
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el pago');
    }
  };

  const handleEdit = (pago: PagoReserva) => {
    setEditingPago(pago);
    setFormData({
      reservaId: pago.reservaId,
      monto: pago.monto,
      metodoPago: pago.metodoPago,
      referencia: pago.referencia || '',
      observaciones: pago.observaciones || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      reservaId: 0,
      monto: 0,
      metodoPago: 'TARJETA',
      referencia: '',
      observaciones: ''
    });
    setEditingPago(null);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'FALLIDO':
        return 'bg-red-100 text-red-800';
      case 'REEMBOLSADO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'TARJETA':
        return <CreditCard size={16} className="text-blue-500" />;
      case 'EFECTIVO':
        return <DollarSign size={16} className="text-green-500" />;
      case 'TRANSFERENCIA':
        return <FileText size={16} className="text-purple-500" />;
      default:
        return <DollarSign size={16} className="text-gray-500" />;
    }
  };

  const getReservaInfo = (reservaId: number) => {
    const reserva = reservas.find(r => r.id === reservaId);
    if (!reserva) return 'Reserva no encontrada';
    
    return `${reserva.usuarioNombre} - ${new Date(reserva.fechaInicio).toLocaleDateString()}`;
  };

  const generarFactura = async (pagoId: number) => {
    try {
      await apiService.generarFactura(pagoId);
      alert('Factura generada exitosamente');
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al generar la factura');
    }
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
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Pagos</h1>
        {userPermissions.canCreate && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Registrar Pago
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Pagos Completados</p>
              <p className="text-2xl font-bold text-green-800">
                {pagos.filter(p => p.estado === 'COMPLETADO').length}
              </p>
            </div>
            <DollarSign className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-800">
                {pagos.filter(p => p.estado === 'PENDIENTE').length}
              </p>
            </div>
            <Calendar className="text-yellow-500" size={24} />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Fallidos</p>
              <p className="text-2xl font-bold text-red-800">
                {pagos.filter(p => p.estado === 'FALLIDO').length}
              </p>
            </div>
            <FileText className="text-red-500" size={24} />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Recaudado</p>
              <p className="text-2xl font-bold text-blue-800">
                ${pagos.filter(p => p.estado === 'COMPLETADO').reduce((sum, p) => sum + p.monto, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="text-blue-500" size={24} />
          </div>
        </div>
      </div>

      {/* Lista de pagos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserva
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagos.map((pago) => (
                <tr key={pago.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getReservaInfo(pago.reservaId)}
                    </div>
                    {pago.referencia && (
                      <div className="text-sm text-gray-500">
                        Ref: {pago.referencia}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${pago.monto.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getMetodoPagoIcon(pago.metodoPago)}
                      <span className="text-sm text-gray-900">{pago.metodoPago}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(pago.estado)}`}>
                      {pago.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString() : 'Pendiente'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(pago)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      {pago.estado === 'COMPLETADO' && userPermissions.canCreate && (
                        <button
                          onClick={() => generarFactura(pago.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Generar Factura"
                        >
                          <FileText size={16} />
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

      {pagos.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay pagos registrados</p>
        </div>
      )}

      {/* Modal para crear/editar pago */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingPago ? 'Detalles del Pago' : 'Registrar Nuevo Pago'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reserva *
                  </label>
                  <select
                    required
                    value={formData.reservaId}
                    onChange={(e) => setFormData({...formData, reservaId: parseInt(e.target.value)})}
                    disabled={!!editingPago}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value={0}>Selecciona una reserva</option>
                    {reservas.filter(r => r.estado === 'CONFIRMADA').map(reserva => (
                      <option key={reserva.id} value={reserva.id}>
                        {reserva.usuarioNombre} - ${reserva.precioTotal} - {new Date(reserva.fechaInicio).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    required
                    value={formData.metodoPago}
                    onChange={(e) => setFormData({...formData, metodoPago: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia
                  </label>
                  <input
                    type="text"
                    value={formData.referencia}
                    onChange={(e) => setFormData({...formData, referencia: e.target.value})}
                    placeholder="Número de referencia, transacción, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                {editingPago && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-600">
                      <strong>Estado actual:</strong> {editingPago.estado}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Fecha de creación:</strong> {new Date(editingPago.fechaCreacion).toLocaleString()}
                    </div>
                    {editingPago.fechaPago && (
                      <div className="text-sm text-gray-600">
                        <strong>Fecha de pago:</strong> {new Date(editingPago.fechaPago).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    {editingPago ? 'Cerrar' : 'Cancelar'}
                  </button>
                  {!editingPago && (
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Registrar Pago
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;