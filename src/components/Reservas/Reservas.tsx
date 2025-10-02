import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, DollarSign, Edit, Trash2, Plus, Download, FileText } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Reserva, AreaComun } from '../../types';
import { rolePermissions } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ReservasProps {}

const Reservas: React.FC<ReservasProps> = () => {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [areas, setAreas] = useState<AreaComun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  
  const userPermissions = user ? rolePermissions[user.role] : { canRead: false, canCreate: false, canEdit: false, canDelete: false };

  const [formData, setFormData] = useState({
    areaId: 0,
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      console.log('🔍 [Reservas Frontend] Cargando datos...');
      console.log('👤 [Reservas Frontend] Usuario actual:', user);
      
      const [reservasResponse, areasResponse] = await Promise.all([
        apiService.getReservas(),
        apiService.getAreaComunes()
      ]);
      
      console.log('📊 [Reservas Frontend] Respuesta reservas cruda:', reservasResponse);
      console.log('📊 [Reservas Frontend] Datos de reservas:', reservasResponse.data);
      console.log('📊 [Reservas Frontend] ¿Es array?:', Array.isArray(reservasResponse.data));
      console.log('📊 [Reservas Frontend] Total reservas recibidas:', reservasResponse.data?.length || 0);
      if (reservasResponse.data && reservasResponse.data.length > 0) {
        console.log('🔍 [Reservas Frontend] Primera reserva ejemplo:', reservasResponse.data[0]);
      }
      
      // El backend ya filtra automáticamente las reservas según el rol del usuario
      // USER_CASUAL solo ve sus propias reservas
      // ADMIN/SUPER ven todas las reservas
      console.log('✅ [Reservas Frontend] Reservas recibidas del backend:', reservasResponse.data.length);
      let reservasFiltradas = reservasResponse.data || [];
      
      console.log('✅ [Reservas Frontend] Reservas finales a mostrar:', reservasFiltradas.length);
      setReservas(reservasFiltradas);
      setAreas(areasResponse.data || []);
    } catch (err: any) {
      console.error('❌ [Reservas Frontend] Error cargando datos:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const calcularPrecioTotal = () => {
    if (!formData.horaInicio || !formData.horaFin || !formData.areaId) return 0;
    
    const area = areas.find(a => a.id === formData.areaId);
    if (!area) return 0;

    const inicio = new Date(`2000-01-01T${formData.horaInicio}`);
    const fin = new Date(`2000-01-01T${formData.horaFin}`);
    const horas = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    
    return horas * area.costoHora;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const reservaData = {
        ...formData,
        totalHoras: calcularTotalHoras(),
        precioTotal: calcularPrecioTotal()
      };

      if (editingReserva) {
        await apiService.updateReserva(editingReserva.id, reservaData);
      } else {
        await apiService.createReserva(reservaData);
      }
      
      await cargarDatos();
      resetForm();
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la reserva');
    }
  };

  const calcularTotalHoras = () => {
    if (!formData.horaInicio || !formData.horaFin) return 0;
    
    const inicio = new Date(`2000-01-01T${formData.horaInicio}`);
    const fin = new Date(`2000-01-01T${formData.horaFin}`);
    return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
  };

  const handleEdit = (reserva: Reserva) => {
    setEditingReserva(reserva);
    const fechaInicio = new Date(reserva.inicio);
    const fechaFin = new Date(reserva.fin);
    setFormData({
      areaId: reserva.areaId,
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFin: fechaFin.toISOString().split('T')[0],
      horaInicio: fechaInicio.toTimeString().substring(0, 5),
      horaFin: fechaFin.toTimeString().substring(0, 5)
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      return;
    }

    try {
      console.log('🗑️ [Frontend] Iniciando eliminación de reserva:', id);
      console.log('👤 [Frontend] Usuario actual:', user);
      
      const result = await apiService.deleteReserva(id);
      console.log('✅ [Frontend] Reserva eliminada exitosamente:', result);
      
      await cargarDatos();
      console.log('🔄 [Frontend] Datos recargados después de eliminar');
      
      // Limpiar cualquier error previo
      setError(null);
    } catch (err: any) {
      console.error('❌ [Frontend] Error al eliminar reserva:', err);
      console.error('❌ [Frontend] Response data:', err.response?.data);
      console.error('❌ [Frontend] Status:', err.response?.status);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error al eliminar la reserva';
      setError(errorMessage);
    }
  };

  const handleDownloadPDF = async (reservaId: number) => {
    try {
      console.log('📥 [Download PDF] Iniciando descarga para reserva ID:', reservaId);
      console.log('📥 [Download PDF] Usuario actual:', user);
      console.log('📥 [Download PDF] Todas las reservas disponibles:', reservas.map(r => ({ id: r.id, usuarioId: r.usuarioId })));
      
      // Verificar si la reserva existe en nuestros datos locales
      const reservaLocal = reservas.find(r => r.id === reservaId);
      console.log('📥 [Download PDF] Reserva encontrada localmente:', reservaLocal);
      
      // Obtener la reserva con la factura
      const reservaConFactura = await apiService.getReservaWithFactura(reservaId);
      
      if (reservaConFactura && reservaConFactura.factura) {
        // Descargar la factura usando el ID de la factura
        await apiService.descargarFactura(reservaConFactura.factura.id);
      } else {
        setError('No se encontró la factura para esta reserva');
      }
    } catch (err: any) {
      console.error('❌ [Download PDF] Error:', err);
      console.error('❌ [Download PDF] Detalles del error:', err.response?.data);
      setError(err.response?.data?.message || 'Error al descargar la factura');
    }
  };

  const resetForm = () => {
    setFormData({
      areaId: 0,
      fechaInicio: '',
      fechaFin: '',
      horaInicio: '',
      horaFin: ''
    });
    setEditingReserva(null);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAreaNombre = (areaId: number) => {
    const area = areas.find(a => a.id === areaId);
    return area?.nombre || 'Área no encontrada';
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
        <h1 className="text-3xl font-bold text-gray-800">Reservas</h1>
        {userPermissions.canCreate && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Reserva
            </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Lista de reservas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horario
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
              {reservas.map((reserva) => (
                <tr key={reserva.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getAreaNombre(reserva.areaId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User size={16} className="text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {reserva.usuarioNombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reserva.usuarioRol}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      {new Date(reserva.inicio).toLocaleDateString()} - {new Date(reserva.fin).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock size={16} className="text-gray-400 mr-2" />
                      {new Date(reserva.inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(reserva.fin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        try {
                          const inicio = new Date(reserva.inicio);
                          const fin = new Date(reserva.fin);
                          const horas = Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60));
                          return `${horas} horas`;
                        } catch {
                          return 'N/A horas';
                        }
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <DollarSign size={16} className="text-gray-400 mr-1" />
                      ${(reserva.costo || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(reserva.estado)}`}>
                      {reserva.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {/* Botón de descargar PDF - todos pueden descargar PDFs */}
                      <button
                        onClick={() => handleDownloadPDF(reserva.id)}
                        className="text-green-600 hover:text-green-800"
                        title="Descargar factura PDF"
                      >
                        <Download size={16} />
                      </button>
                      
                      {/* Botón de editar - solo si tiene permisos y es su reserva (para USER_CASUAL) o es admin/super */}
                      {userPermissions.canEdit && (user?.role !== 'USER_CASUAL' || reserva.usuarioId === user?.id) && (
                        <button
                          onClick={() => handleEdit(reserva)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar reserva"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      
                      {/* Botón de eliminar - solo SUPER_USER puede eliminar */}
                      {user?.role === 'SUPER_USER' && (
                        <button
                          onClick={() => handleDelete(reserva.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar reserva"
                        >
                          <Trash2 size={16} />
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

      {reservas.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay reservas registradas</p>
        </div>
      )}

      {/* Modal para crear/editar reserva */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingReserva ? 'Editar Reserva' : 'Nueva Reserva'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Área Común *
                  </label>
                  <select
                    required
                    value={formData.areaId}
                    onChange={(e) => setFormData({...formData, areaId: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Selecciona un área</option>
                    {areas.filter(area => area.activa).map(area => (
                      <option key={area.id} value={area.id}>
                        {area.nombre} - ${area.costoHora}/hora
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Inicio *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Fin *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Inicio *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.horaInicio}
                      onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Fin *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.horaFin}
                      onChange={(e) => setFormData({...formData, horaFin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {formData.areaId > 0 && formData.horaInicio && formData.horaFin && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-sm text-blue-800">
                      <strong>Total a pagar: ${calcularPrecioTotal().toLocaleString()}</strong>
                    </div>
                    <div className="text-xs text-blue-600">
                      {calcularTotalHoras()} horas × ${areas.find(a => a.id === formData.areaId)?.costoHora}/hora
                    </div>
                  </div>
                )}



                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingReserva ? 'Actualizar' : 'Crear Reserva'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservas;