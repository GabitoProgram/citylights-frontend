import { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Clock, Search, Filter, Edit, Trash2, ToggleRight, ToggleLeft, Calendar, Menu, X, LogOut, Bell, Home, Building2, CreditCard, Receipt, Settings, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAreasComunes } from '../../hooks/useAreasComunes';
// import { useReservas } from '../../hooks/useReservas';
import { SimpleAreaComunModal } from '../../components/SimpleAreaComunModal';
import SimpleReservaModal from '../../components/SimpleReservaModal';
import CalendarioAreasComunes from '../../components/CalendarioAreasComunes';

import { apiService } from '../../services/api';
import type { AreaComun, CreateAreaComunDto, UpdateAreaComunDto, CreateReservaDto, Reserva } from '../../types';

const AreasComunesAdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vistaActual, setVistaActual] = useState<'calendario' | 'areas'>('calendario');

  // Hooks para manejar áreas y reservas
  const { areas, loading: areasLoading, createArea, updateArea, deleteArea, fetchAreas } = useAreasComunes();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  
  // Estados del modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaComun | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [reservaModalOpen, setReservaModalOpen] = useState(false);
  const [areaToReserve, setAreaToReserve] = useState<AreaComun | null>(null);

  // Cargar reservas existentes
  useEffect(() => {
    const cargarReservas = async () => {
      try {
        const response = await apiService.getReservas();
        if (response && Array.isArray(response)) {
          setReservas(response);
        }
      } catch (error) {
        console.error('Error al cargar reservas:', error);
      }
    };
    cargarReservas();
  }, []);

  // Función de validación anti-duplicados
  const verificarConflictoReserva = (areaId: number, inicio: string, fin: string): { tieneConflicto: boolean; mensaje: string } => {
    const inicioNueva = new Date(inicio);
    const finNueva = new Date(fin);

    for (const reserva of reservas) {
      if (reserva.estado === 'CANCELLED') continue;
      if (reserva.areaId !== areaId) continue;

      const inicioExistente = new Date(reserva.inicio);
      const finExistente = new Date(reserva.fin);

      // Verificar duplicado exacto
      if (inicioNueva.getTime() === inicioExistente.getTime() && 
          finNueva.getTime() === finExistente.getTime()) {
        return { tieneConflicto: true, mensaje: 'Ya existe una reserva exactamente en este horario y área' };
      }

      // Verificar solapamiento
      if (inicioNueva < finExistente && finNueva > inicioExistente) {
        const inicioConflicto = inicioExistente.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const finConflicto = finExistente.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return { tieneConflicto: true, mensaje: `Se solapa con reserva existente (${inicioConflicto} - ${finConflicto})` };
      }
    }

    return { tieneConflicto: false, mensaje: '' };
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAreas();
  }, []);

  // Datos de áreas (ahora viene del backend)
  const areasComunes = areas;

  // getTipoColor function removed - not used in current implementation

  const filteredAreas = areasComunes.filter(area => {
    const matchesSearch = area.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         area.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateArea = () => {
    setEditingArea(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditArea = (area: AreaComun) => {
    setEditingArea(area);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDeleteArea = async (areaId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta área común?')) {
      try {
        await deleteArea(areaId);
        alert('Área común eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar área:', error);
        alert('Error al eliminar el área común');
      }
    }
  };

  const handleSaveArea = async (areaData: CreateAreaComunDto | UpdateAreaComunDto) => {
    try {
      if (modalMode === 'create') {
        await createArea(areaData as CreateAreaComunDto);
        alert('Área común creada exitosamente');
      } else {
        await updateArea(editingArea!.id, areaData as UpdateAreaComunDto);
        alert('Área común actualizada exitosamente');
      }
      setModalOpen(false);
      setEditingArea(null);
    } catch (error) {
      console.error('Error al guardar área:', error);
      alert('Error al guardar el área común');
    }
  };

  const getReservasActivas = (areaId: number) => {
    return reservas.filter(reserva => 
      reserva.areaId === areaId && 
      reserva.estado !== 'CANCELLED' && 
      new Date(reserva.inicio) >= new Date()
    ).length;
  };

  const handleAddArea = () => {
    handleCreateArea();
  };

  const handleReservar = (areaId: number) => {
    const area = areasComunes.find(a => a.id === areaId);
    if (area) {
      setAreaToReserve(area);
      setReservaModalOpen(true);
    }
  };

  const handleCreateReserva = async (reservaData: CreateReservaDto) => {
    try {
      console.log('💳 Creating reserva with Stripe (Admin):', reservaData);
      
      // 🛡️ Validación anti-duplicados
      const conflicto = verificarConflictoReserva(reservaData.areaId, reservaData.inicio, reservaData.fin);
      if (conflicto.tieneConflicto) {
        alert(`❌ No se puede crear la reserva: ${conflicto.mensaje}`);
        return;
      }
      
      // Crear reserva con integración de Stripe
      const response = await apiService.createReservaWithStripe(reservaData);
      console.log('✅ Reserva with Stripe created successfully:', response);
      
      if (response.stripe?.checkoutUrl) {
        // Redirigir a Stripe Checkout
        console.log('🚀 Redirecting to Stripe Checkout:', response.stripe.checkoutUrl);
        window.location.href = response.stripe.checkoutUrl;
      } else {
        throw new Error('No se pudo obtener la URL de pago de Stripe');
      }
      
      // Cerrar modal
      setReservaModalOpen(false);
      setAreaToReserve(null);
      
    } catch (error: any) {
      console.error('❌ Error creating reserva with Stripe:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear la reserva con pago';
      alert(`Error: ${errorMessage}`);
    }
  };

  if (areasLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando áreas comunes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">CityLights</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <button
              onClick={() => setVistaActual('calendario')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                vistaActual === 'calendario'
                  ? 'bg-primary-50 text-primary-600 border border-primary-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Calendario</span>
            </button>

            <button
              onClick={() => setVistaActual('areas')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                vistaActual === 'areas'
                  ? 'bg-primary-50 text-primary-600 border border-primary-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span>Gestión de Áreas</span>
            </button>

            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/admin/users')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Shield className="h-5 w-5" />
              <span>Usuarios</span>
            </button>

            <button
              onClick={() => navigate('/admin/settings')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Configuración</span>
            </button>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {vistaActual === 'calendario' ? 'Calendario de Reservas' : 'Gestión de Áreas Comunes'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Bell className="h-6 w-6 text-gray-400" />
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {vistaActual === 'calendario' ? (
            <CalendarioAreasComunes />
          ) : (
            <>
              {/* Header con búsqueda y botón crear */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex-1 mb-4 sm:mb-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar áreas comunes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddArea}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Nueva Área</span>
                </button>
              </div>

              {/* Areas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAreas.map((area) => (
                  <div
                    key={area.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Area Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {area.nombre.includes('Piscina') ? '🏊‍♂️' : 
                             area.nombre.includes('Gym') ? '🏋️‍♂️' : 
                             area.nombre.includes('Salón') ? '🎉' : 
                             area.nombre.includes('Cancha') ? '⚽' : 
                             area.nombre.includes('BBQ') ? '🔥' : '🏢'}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {area.nombre}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{area.capacidad} personas</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>${area.costoHora}/hora</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {area.activa ? (
                            <span className="flex items-center space-x-1 text-green-600 text-sm">
                              {area.activa ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                              <span>Activa</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-gray-400 text-sm">
                              <ToggleLeft className="h-4 w-4" />
                              <span>Inactiva</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {area.descripcion && (
                        <p className="text-gray-600 text-sm mb-3">
                          {area.descripcion}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-blue-600">
                          <Calendar className="h-4 w-4" />
                          <span>{getReservasActivas(area.id)} reservas activas</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditArea(area)}
                            className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="text-sm">Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteArea(area.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-sm">Eliminar</span>
                          </button>
                        </div>
                        {area.activa && (
                          <button
                            onClick={() => handleReservar(area.id)}
                            className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors"
                          >
                            Reservar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredAreas.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Building2 className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay áreas disponibles</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm 
                      ? 'No se encontraron áreas comunes que coincidan con tu búsqueda.'
                      : 'Aún no se han creado áreas comunes.'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleAddArea}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Crear Primera Área</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Area Modal */}
      {modalOpen && (
        <SimpleAreaComunModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingArea(null);
          }}
          onSave={handleSaveArea}
          area={editingArea}
          mode={modalMode}
        />
      )}

      {/* Reserva Modal */}
      {areaToReserve && (
        <SimpleReservaModal
          isOpen={reservaModalOpen}
          onClose={() => {
            setReservaModalOpen(false);
            setAreaToReserve(null);
          }}
          area={areaToReserve}
          onSave={handleCreateReserva}
        />
      )}

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AreasComunesAdminPage;