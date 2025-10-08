import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, DollarSign, Edit, Trash2, Plus, Download, Package } from 'lucide-react';
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
  
  // Estados para gestión de entrega
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [reservaEntrega, setReservaEntrega] = useState<Reserva | null>(null);
  const [entregaData, setEntregaData] = useState({
    estadoEntrega: 'PENDIENTE' as 'PENDIENTE' | 'ENTREGADO' | 'NO_APLICA',
    costoEntrega: '',
    pagoEntrega: false,
    observacionesEntrega: '',
    // Campos para daños
    montoDanos: '',
    descripcionDanos: '',
    hayDanos: false
  });
  
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

  // Manejar retorno desde Stripe para pagos de daños
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const type = urlParams.get('type');
    const id = urlParams.get('id');

    if (payment && type === 'danos' && id) {
      if (payment === 'success') {
        console.log('✅ Pago de daños exitoso, esperando webhook y recargando datos...');
        
        // Dar tiempo al webhook de Stripe para procesar (3 segundos)
        setTimeout(() => {
          cargarDatos();
        }, 3000);
        
        // Limpiar los parámetros de URL inmediatamente
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (payment === 'cancelled') {
        console.log('❌ Pago de daños cancelado');
        setError('El pago de daños fue cancelado. Puede intentarlo nuevamente desde la gestión de entregas.');
        
        // Limpiar los parámetros de URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
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

  // 🔒 VALIDACIONES PARA PREVENIR DUPLICADOS
  
  // Verificar si la fecha es pasada
  const esFechaPasada = (fecha: string): boolean => {
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    return fechaSeleccionada < hoy;
  };

  // Verificar duplicados exactos y solapamientos
  const verificarConflictoReserva = (areaId: number, fechaInicio: string, fechaFin: string, horaInicio: string, horaFin: string, excludeId?: number): {
    hayConflicto: boolean;
    esDuplicadoExacto: boolean;
    conflicto?: any;
    motivo: string;
  } => {
    const fechaInicioCompleta = `${fechaInicio}T${horaInicio}:00`;
    const fechaFinCompleta = `${fechaFin}T${horaFin}:00`;
    
    const nuevaInicio = new Date(fechaInicioCompleta);
    const nuevaFin = new Date(fechaFinCompleta);
    
    const conflicto = reservas.find(reserva => {
      // Excluir la reserva que estamos editando
      if (excludeId && reserva.id === excludeId) return false;
      
      // Solo verificar en la misma área
      if (reserva.areaId !== areaId) return false;
      
      // Solo verificar reservas activas
      if (reserva.estado === 'CANCELLED') return false;
      
      const reservaInicio = new Date(reserva.inicio);
      const reservaFin = new Date(reserva.fin);
      
      // 🚫 VERIFICAR DUPLICADO EXACTO
      const esDuplicadoExacto = (
        reservaInicio.getTime() === nuevaInicio.getTime() &&
        reservaFin.getTime() === nuevaFin.getTime()
      );
      
      if (esDuplicadoExacto) {
        console.log('🚫 DUPLICADO EXACTO DETECTADO en ReservasPage:', {
          nuevaReserva: { fechaInicio, fechaFin, horaInicio, horaFin, areaId },
          reservaExistente: reserva
        });
        return true;
      }
      
      // Verificar solapamiento de horarios
      return (nuevaInicio < reservaFin && nuevaFin > reservaInicio);
    });
    
    if (conflicto) {
      const reservaInicio = new Date(conflicto.inicio);
      const reservaFin = new Date(conflicto.fin);
      
      const esDuplicadoExacto = (
        reservaInicio.getTime() === nuevaInicio.getTime() &&
        reservaFin.getTime() === nuevaFin.getTime()
      );
      
      let motivo = '';
      if (esDuplicadoExacto) {
        motivo = `🚫 Ya existe una reserva exacta en ${horaInicio}-${horaFin} el ${fechaInicio}`;
      } else {
        motivo = `⚡ Conflicto de horarios con reserva del ${reservaInicio.toLocaleDateString()} (${reservaInicio.toLocaleTimeString().substring(0,5)}-${reservaFin.toLocaleTimeString().substring(0,5)})`;
      }
      
      return {
        hayConflicto: true,
        esDuplicadoExacto,
        conflicto,
        motivo
      };
    }
    
    return {
      hayConflicto: false,
      esDuplicadoExacto: false,
      motivo: ''
    };
  };

  // Verificar límite de reservas por usuario (máximo 3 por mes)
  const verificarLimiteReservas = (fecha: string): { 
    excedeLimite: boolean; 
    reservasDelMes: number 
  } => {
    const fechaObj = new Date(fecha);
    const mesActual = fechaObj.getMonth();
    const añoActual = fechaObj.getFullYear();
    
    const reservasDelMes = reservas.filter(reserva => {
      if (reserva.usuarioId !== user?.id) return false;
      if (reserva.estado === 'CANCELLED') return false;
      const fechaReserva = new Date(reserva.inicio);
      return fechaReserva.getMonth() === mesActual && fechaReserva.getFullYear() === añoActual;
    }).length;
    
    return {
      excedeLimite: reservasDelMes >= 3,
      reservasDelMes: reservasDelMes
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔒 VALIDACIONES ANTES DE ENVIAR AL BACKEND
    console.log('🔍 VALIDACIÓN DE RESERVA en ReservasPage:', {
      formData,
      usuario: user?.email,
      esEdicion: !!editingReserva
    });
    
    // Validar campos requeridos
    if (!formData.areaId || !formData.fechaInicio || !formData.fechaFin || !formData.horaInicio || !formData.horaFin) {
      setError('❌ Todos los campos son obligatorios');
      return;
    }
    
    // Validar fecha pasada
    if (esFechaPasada(formData.fechaInicio)) {
      setError('❌ No se pueden crear reservas en fechas pasadas');
      return;
    }
    
    // Validar límite de reservas por mes (solo para nuevas reservas)
    if (!editingReserva) {
      const limiteInfo = verificarLimiteReservas(formData.fechaInicio);
      if (limiteInfo.excedeLimite) {
        setError(`❌ Límite alcanzado: ${limiteInfo.reservasDelMes}/3 reservas este mes`);
        return;
      }
      
      // Mostrar advertencia si está cerca del límite
      if (limiteInfo.reservasDelMes >= 2) {
        const confirmar = confirm(
          `ℹ️ Esta será tu reserva ${limiteInfo.reservasDelMes + 1}/3 del mes. ¿Continuar?`
        );
        if (!confirmar) return;
      }
    }
    
    // Verificar conflictos y duplicados
    const conflictoInfo = verificarConflictoReserva(
      formData.areaId,
      formData.fechaInicio,
      formData.fechaFin,
      formData.horaInicio,
      formData.horaFin,
      editingReserva?.id // Excluir la reserva actual si estamos editando
    );
    
    if (conflictoInfo.hayConflicto) {
      console.error('🚫 RESERVA BLOQUEADA en ReservasPage:', conflictoInfo.motivo);
      
      // Mostrar mensaje específico para duplicados exactos
      if (conflictoInfo.esDuplicadoExacto) {
        const areaSeleccionada = areas.find(a => a.id === formData.areaId);
        setError(`🚫 DUPLICADO DETECTADO\n\nYa existe una reserva exacta para:\n• Fecha: ${formData.fechaInicio}\n• Horario: ${formData.horaInicio}-${formData.horaFin}\n• Área: ${areaSeleccionada?.nombre}\n\nNo se pueden crear reservas duplicadas.`);
        return;
      } else {
        setError(conflictoInfo.motivo);
        return;
      }
    }
    
    try {
      const reservaData = {
        ...formData,
        totalHoras: calcularTotalHoras(),
        precioTotal: calcularPrecioTotal()
      };

      console.log('🔄 Creando/editando reserva con validaciones anti-duplicado:', reservaData);

      if (editingReserva) {
        await apiService.updateReserva(editingReserva.id, reservaData);
      } else {
        await apiService.createReserva(reservaData);
      }
      
      await cargarDatos();
      resetForm();
      setShowModal(false);
      setError(null); // Limpiar errores al tener éxito
    } catch (err: any) {
      console.error('❌ Error al guardar reserva:', err);
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

  // 📦 Función para color del estado de entrega
  const getEstadoEntregaColor = (estadoEntrega: string) => {
    switch (estadoEntrega) {
      case 'ENTREGADO':
        return 'bg-green-100 text-green-800';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'NO_APLICA':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 📦 Función para gestionar entrega
  const handleGestionarEntrega = (reserva: Reserva) => {
    setReservaEntrega(reserva);
    setEntregaData({
      estadoEntrega: (reserva as any).estadoEntrega || 'PENDIENTE',
      costoEntrega: (reserva as any).costoEntrega?.toString() || '',
      pagoEntrega: (reserva as any).pagoEntrega || false,
      observacionesEntrega: (reserva as any).observacionesEntrega || '',
      // Inicializar campos de daños
      montoDanos: '',
      descripcionDanos: '',
      hayDanos: false
    });
    setShowEntregaModal(true);
  };

  const handleEntregaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reservaEntrega) return;
    
    try {
      const dataToSend = {
        estadoEntrega: entregaData.estadoEntrega,
        costoEntrega: entregaData.costoEntrega ? parseFloat(entregaData.costoEntrega) : undefined,
        pagoEntrega: entregaData.pagoEntrega,
        observacionesEntrega: entregaData.observacionesEntrega || undefined,
        // Incluir datos de daños si existen
        montoDanos: entregaData.hayDanos && entregaData.montoDanos ? parseFloat(entregaData.montoDanos) : undefined,
        descripcionDanos: entregaData.hayDanos && entregaData.descripcionDanos ? entregaData.descripcionDanos : undefined
      };
      
      console.log('📦 Enviando datos de entrega:', dataToSend);
      
      const resultado = await apiService.gestionarEntrega(reservaEntrega.id, dataToSend);
      
      // Si hay daños y se creó un pago por daños, redirigir a Stripe
      if (entregaData.hayDanos && entregaData.montoDanos && parseFloat(entregaData.montoDanos) > 0 && resultado.pagoDanosId) {
        console.log('💳 Se detectaron daños, redirigiendo a Stripe para pago...');
        
        try {
          const stripeSession = await apiService.createStripeSessionForDanos(resultado.pagoDanosId);
          
          if (stripeSession?.url) {
            console.log('✅ Sesión de Stripe creada, redirigiendo...');
            // Redirigir a Stripe
            window.location.href = stripeSession.url;
            return; // No continuar con el resto del flujo
          }
        } catch (stripeError: any) {
          console.error('❌ Error creando sesión de Stripe:', stripeError);
          setError('Error al procesar el pago de daños. La entrega se guardó correctamente.');
        }
      }
      
      // Recargar datos solo si no se redirigió a Stripe
      cargarDatos();
      
      // Cerrar modal
      setShowEntregaModal(false);
      setReservaEntrega(null);
      
      console.log('✅ Entrega gestionada exitosamente');
      
    } catch (err: any) {
      console.error('❌ Error gestionando entrega:', err);
      setError(err.response?.data?.message || 'Error al gestionar la entrega');
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
                  Estado Entrega
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoEntregaColor((reserva as any).estadoEntrega || 'PENDIENTE')}`}>
                        {(reserva as any).estadoEntrega || 'PENDIENTE'}
                      </span>
                      {(reserva as any).observacionesEntrega && (
                        <div className="text-xs text-gray-500 max-w-32 truncate" title={(reserva as any).observacionesEntrega}>
                          {(reserva as any).observacionesEntrega}
                        </div>
                      )}
                      {/* Mostrar estado de pagos de daños si existen */}
                      {(reserva as any).pagosDanos && (reserva as any).pagosDanos.length > 0 && (
                        <div className="text-xs">
                          {(() => {
                            const pagoPendiente = (reserva as any).pagosDanos.find((pago: any) => pago.estadoPago === 'PENDIENTE');
                            const pagoPagado = (reserva as any).pagosDanos.find((pago: any) => pago.estadoPago === 'PAGADO');
                            
                            if (pagoPagado) {
                              return (
                                <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                                  💰 Daños: ${pagoPagado.montoDanos} - PAGADO
                                </span>
                              );
                            } else if (pagoPendiente) {
                              return (
                                <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs">
                                  💰 Daños: ${pagoPendiente.montoDanos} - PENDIENTE
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
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
                      
                      {/* 📦 Botón de gestionar entrega - solo admins/super */}
                      {(user?.role === 'SUPER_USER' || user?.role === 'USER_ADMIN') && (
                        <button
                          onClick={() => handleGestionarEntrega(reserva)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Gestionar entrega"
                        >
                          <Package size={16} />
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

      {/* Modal para gestionar entrega */}
      {showEntregaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Gestionar Entrega</h2>
              
              <form onSubmit={handleEntregaSubmit} className="space-y-4">
                {/* Estado de Entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado de Entrega
                  </label>
                  <select
                    value={entregaData.estadoEntrega}
                    onChange={(e) => setEntregaData({...entregaData, estadoEntrega: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="ENTREGADO">Entregado</option>
                    <option value="NO_APLICA">No Aplica</option>
                  </select>
                </div>

                {/* Costo de Entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo de Entrega (opcional)
                  </label>
                  <input
                    type="number"
                    value={entregaData.costoEntrega}
                    onChange={(e) => setEntregaData({...entregaData, costoEntrega: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Pago de Entrega */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={entregaData.pagoEntrega}
                      onChange={(e) => setEntregaData({...entregaData, pagoEntrega: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Entrega pagada</span>
                  </label>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={entregaData.observacionesEntrega}
                    onChange={(e) => setEntregaData({...entregaData, observacionesEntrega: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Observaciones sobre la entrega..."
                  />
                </div>

                {/* Sección de Daños */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Registro de Daños</h3>
                  
                  <div className="mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={entregaData.hayDanos}
                        onChange={(e) => setEntregaData({...entregaData, hayDanos: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Hay daños en el área</span>
                    </label>
                  </div>

                  {entregaData.hayDanos && (
                    <>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto de Daños ($)
                        </label>
                        <input
                          type="number"
                          value={entregaData.montoDanos}
                          onChange={(e) => setEntregaData({...entregaData, montoDanos: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required={entregaData.hayDanos}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción de Daños
                        </label>
                        <textarea
                          value={entregaData.descripcionDanos}
                          onChange={(e) => setEntregaData({...entregaData, descripcionDanos: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={3}
                          placeholder="Describe los daños encontrados..."
                          required={entregaData.hayDanos}
                        />
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                        <p className="text-sm text-yellow-800">
                          💳 <strong>Proceso de pago:</strong> Al guardar, serás redirigido a Stripe para procesar el pago de los daños.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEntregaModal(false);
                      setReservaEntrega(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Guardar Entrega
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