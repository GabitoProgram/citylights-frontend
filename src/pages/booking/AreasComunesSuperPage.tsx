import { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Clock, Search, Filter, Edit, Trash2, ToggleLeft, ToggleRight, Calendar, Menu, X, LogOut, Bell, Home, Building2, CreditCard, Receipt, Settings, BarChart3, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAreasComunes } from '../../hooks/useAreasComunes';
import { SimpleAreaComunModal } from '../../components/SimpleAreaComunModal';
import SimpleReservaModal from '../../components/SimpleReservaModal';
import CalendarioAreasComunes from '../../components/CalendarioAreasComunes';

import { apiService } from '../../services/api';
import type { AreaComun, CreateAreaComunDto, UpdateAreaComunDto, CreateReservaDto } from '../../types';

const AreasComunesSuperPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vistaActual, setVistaActual] = useState<'calendario' | 'areas'>('calendario');

  // Hooks para manejar áreas y reservas
  const { areas, loading: areasLoading, createArea, updateArea, deleteArea, fetchAreas } = useAreasComunes();
  
  // Estado para reservas
  const [reservas, setReservas] = useState<any[]>([]);

  // Función para cargar todas las reservas
  const fetchAllReservas = async () => {
    try {
      console.log('🔄 Cargando todas las reservas...');
      const response = await apiService.getReservas();
      console.log('📊 Reservas cargadas:', response);
      setReservas(response.data);
    } catch (error) {
      console.error('❌ Error al cargar reservas:', error);
    }
  };
  
  // Estados del modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaComun | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [reservaModalOpen, setReservaModalOpen] = useState(false);
  const [areaToReserve, setAreaToReserve] = useState<AreaComun | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAreas();
    fetchAllReservas();
  }, []);

  // Datos de áreas (ahora viene del backend)
  const areasComunes = areas;

  const getEstadoColor = (activo: boolean) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const filteredAreas = areasComunes.filter(area => {
    const matchesSearch = area.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (area.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = true; // Sin filtro por tipo ya que no tenemos tipos en el backend
    const matchesStatus = showInactive || area.activa;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Función para obtener número de reservas activas por área
  const getReservasActivasPorArea = (areaId: number) => {
    return reservas.filter(reserva => 
      reserva.areaId === areaId && 
      reserva.estado !== 'CANCELADA' && 
      new Date(reserva.fechaReserva) >= new Date()
    ).length;
  };

  const handleAddArea = () => {
    handleCreateArea();
  };

  // Funciones de manejo de áreas
  const handleCreateArea = () => {
    console.log('➕ Creando nueva área');
    setEditingArea(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditArea = (area: AreaComun) => {
    console.log('✏️ BOTÓN EDITAR PRESIONADO - Área:', area);
    console.log('📝 Abriendo modal de edición...');
    setEditingArea(area);
    setModalMode('edit');
    setModalOpen(true);
    console.log('✅ Modal de edición configurado');
  };

  const handleSaveArea = async (areaData: CreateAreaComunDto | UpdateAreaComunDto) => {
    try {
      if (modalMode === 'create') {
        await createArea(areaData as CreateAreaComunDto);
        console.log('✅ Área creada exitosamente');
      } else if (editingArea) {
        await updateArea(editingArea.id, areaData as UpdateAreaComunDto);
        console.log('✅ Área actualizada exitosamente');
      }
      setModalOpen(false);
      setEditingArea(null);
      // Recargar áreas después de guardar
      await fetchAreas();
    } catch (error) {
      console.error('Error al guardar área:', error);
      throw error; // Re-lanzar el error para que el modal lo pueda manejar
    }
  };

  const handleDeleteArea = async (areaId: number) => {
    console.log('🗑️ BOTÓN ELIMINAR PRESIONADO - AreaID:', areaId);
    const area = areasComunes.find(a => a.id === areaId);
    console.log('📍 Área a eliminar:', area);
    
    if (confirm(`¿Estás seguro de que quieres eliminar el área "${area?.nombre}"?`)) {
      try {
        console.log('🔄 Eliminando área...');
        await deleteArea(areaId);
        console.log('✅ Área eliminada exitosamente');
        alert(`Área "${area?.nombre}" eliminada exitosamente`);
        // Recargar áreas después de eliminar
        await fetchAreas();
      } catch (error) {
        console.error('❌ Error al eliminar área:', error);
        alert('Error al eliminar el área. Puede que tenga reservas asociadas.');
      }
    } else {
      console.log('❌ Eliminación cancelada por el usuario');
    }
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
      console.log('🔄 Creating reserva with Stripe (Super User):', reservaData);
      
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

  const handleToggleEstado = async (areaId: number) => {
    console.log('🔄 BOTÓN TOGGLE ESTADO PRESIONADO - AreaID:', areaId);
    try {
      const area = areasComunes.find(a => a.id === areaId);
      console.log('📍 Área encontrada:', area);
      if (area) {
        const nuevoEstado = !area.activa;
        console.log(`🔄 Cambiando estado de ${area.activa} a ${nuevoEstado}`);
        await updateArea(areaId, { activa: nuevoEstado });
        const estadoTexto = area.activa ? 'desactivada' : 'activada';
        console.log(`✅ Área ${estadoTexto} exitosamente`);
        alert(`Área "${area.nombre}" ${estadoTexto} exitosamente`);
        // Recargar áreas después de cambiar estado
        await fetchAreas();
      } else {
        console.error('❌ No se encontró el área con ID:', areaId);
      }
    } catch (error) {
      console.error('❌ Error al cambiar estado del área:', error);
      alert('Error al cambiar el estado del área');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard Principal', icon: Home, path: '/dashboard' },
    { id: 'areas-comunes', name: 'Gestionar Áreas Comunes', icon: Building2, path: '/areas-comunes' },
    { id: 'reservas', name: 'Todas las Reservas', icon: Calendar, path: '/reservas' },
    { id: 'pagos', name: 'Sistema de Pagos', icon: CreditCard, path: '/pagos' },
    { id: 'facturas', name: 'Todas las Facturas', icon: Receipt, path: '/facturas' },
    { id: 'reportes', name: 'Reportes Avanzados', icon: BarChart3, path: '/reportes' },
    { id: 'configuracion', name: 'Configuración Sistema', icon: Settings, path: '/configuracion' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-purple-900 to-purple-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-purple-950">
          <div className="flex items-center">
            <Crown className="h-8 w-8 text-yellow-400 mr-2" />
            <span className="text-white text-lg font-semibold">CityLights Master</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-purple-700">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <div className="text-white text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-yellow-300 text-xs">Super Usuario</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigateTo(item.path)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.id === 'areas-comunes'
                      ? 'bg-purple-700 text-white'
                      : 'text-purple-100 hover:bg-purple-700 hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-purple-100 rounded-md hover:bg-purple-700 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Panel Super Usuario - Áreas Comunes</h1>
          <div className="flex items-center space-x-4">
            <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between mb-8">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-primary-800">Gestión de Áreas Comunes</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gestiona espacios, reservas y configuraciones del condominio.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                type="button"
                onClick={handleAddArea}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Área
              </button>
            </div>
          </div>

      {/* Estadísticas del dashboard */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">{areasComunes.length}</h3>
              <p className="text-blue-100">Total Áreas</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">{areasComunes.filter(area => area.activa).length}</h3>
              <p className="text-green-100">Áreas Activas</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">{reservas.filter(r => r.estado === 'CONFIRMED').length}</h3>
              <p className="text-purple-100">Reservas Activas</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center">
            <Users className="h-8 w-8 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">{areasComunes.filter(a => a.activa).reduce((sum, a) => sum + a.capacidad, 0)}</h3>
              <p className="text-orange-100">Capacidad Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs para cambiar vista */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setVistaActual('calendario')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                vistaActual === 'calendario'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-5 w-5 inline mr-2" />
              Calendario Global
            </button>
            <button
              onClick={() => setVistaActual('areas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                vistaActual === 'areas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="h-5 w-5 inline mr-2" />
              Administración Total
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido según la vista actual */}
      {vistaActual === 'calendario' ? (
        <CalendarioAreasComunes 
          onNuevaReserva={(fecha, hora, areaId) => {
            console.log('Nueva reserva desde super admin:', { fecha, hora, areaId });
            // Aquí puedes manejar la nueva reserva si es necesario
          }}
        />
      ) : (
        <>

      {/* Búsqueda y filtros */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar áreas por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todos los tipos</option>
                <option value="SALON_EVENTOS">Salón de Eventos</option>
                <option value="GYM">Gimnasio</option>
                <option value="PISCINA">Piscina</option>
                <option value="CANCHA_TENIS">Cancha de Tenis</option>
                <option value="BBQ">Área BBQ</option>
                <option value="SALON_JUEGOS">Salón de Juegos</option>
              </select>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Mostrar inactivas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tabla de áreas comunes */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-primary-800">
            Gestión de Espacios ({filteredAreas.length} {filteredAreas.length === 1 ? 'área' : 'áreas'})
          </h3>
        </div>
        
        <div className="overflow-hidden">
          {areasLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Cargando áreas comunes...</span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacidad/Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAreas.map((area) => {
                console.log('🏢 Renderizando área:', area.id, area.nombre);
                return (
                <tr key={area.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-8 w-8 text-primary-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{area.nombre}</div>
                        <div className="text-sm text-gray-500">{area.descripcion}</div>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Área Común
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <Users className="h-4 w-4 inline mr-1" />
                      {area.capacidad} personas
                    </div>
                    <div className="text-sm text-gray-500">
                      <Clock className="h-4 w-4 inline mr-1" />
                      ${area.costoHora}/hora
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(area.activa)}`}>
                      {area.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {getReservasActivasPorArea(area.id)} activas
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleReservar(area.id)}
                      className="text-primary-600 hover:text-primary-900 px-2 py-1 rounded"
                      title="Reservar"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditArea(area)}
                      className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleEstado(area.id)}
                      className={`px-2 py-1 rounded ${area.activa ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      title={area.activa ? 'Desactivar' : 'Activar'}
                    >
                      {area.activa ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteArea(area.id)}
                      className="text-red-600 hover:text-red-900 px-2 py-1 rounded"
                      title="Eliminar"
                      disabled={getReservasActivasPorArea(area.id) > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Mensaje cuando no hay resultados */}
      {!areasLoading && filteredAreas.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay áreas que coincidan</h3>
          <p className="mt-1 text-sm text-gray-500">
            Intenta cambiar los filtros de búsqueda o agregar una nueva área.
          </p>
        </div>
      )}

      {/* Footer con acciones rápidas */}
      <div className="mt-8 bg-primary-50 rounded-lg p-6 border border-primary-200">
        <h3 className="text-lg font-medium text-primary-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleAddArea}
            className="flex items-center p-3 bg-white rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
          >
            <Plus className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-sm font-medium text-primary-800">Agregar Nueva Área</span>
          </button>
          <button className="flex items-center p-3 bg-white rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors">
            <Calendar className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-sm font-medium text-primary-800">Ver Calendario Completo</span>
          </button>
          <button className="flex items-center p-3 bg-white rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors">
            <Users className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-sm font-medium text-primary-800">Gestionar Reservas</span>
          </button>
        </div>
      </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de área común */}
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

      {/* Modal de reserva */}
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
    </div>
  );
};

export default AreasComunesSuperPage;