import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Search, Menu, X, LogOut, Home, Building2, CreditCard, Receipt, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAreasComunes } from '../../hooks/useAreasComunes';
import SimpleReservaModal from '../../components/SimpleReservaModal';
import CalendarioAreasComunes from '../../components/CalendarioAreasComunes';
import { apiService } from '../../services/api';
import type { AreaComun, CreateReservaDto, Reserva } from '../../types';

const AreasComunesUserPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { areas, loading, error } = useAreasComunes();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reservaModalOpen, setReservaModalOpen] = useState(false);
  const [areaToReserve, setAreaToReserve] = useState<AreaComun | null>(null);
  const [vistaActual, setVistaActual] = useState<'calendario' | 'areas'>('calendario');
  const [reservas, setReservas] = useState<Reserva[]>([]);

  // Cargar reservas existentes
  useEffect(() => {
    const cargarReservas = async () => {
      try {
        // SOLUCIÓN ANTI-DUPLICADOS: USER_CASUAL necesita ver TODAS las reservas para validaciones
        console.log('👤 USER_CASUAL: obteniendo TODAS las reservas para validaciones anti-duplicado');
        const response = await apiService.getReportesIngresos(); // Este endpoint devuelve TODAS las reservas
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

  // Datos de áreas (ahora viene del backend)
  const areasComunes = areas;

  const filteredAreas = areasComunes.filter(area => {
    const matchesSearch = area.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         area.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && area.activa; // Solo áreas activas para usuarios
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReservar = (area: AreaComun) => {
    setAreaToReserve(area);
    setReservaModalOpen(true);
  };

  const handleCreateReserva = async (reservaData: CreateReservaDto) => {
    try {
      console.log('💳 Creating reserva with Stripe (User):', reservaData);
      
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando áreas comunes...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', name: 'Inicio', icon: Home, path: '/dashboard' },
    { id: 'areas-comunes', name: 'Ver Áreas Comunes', icon: Building2, path: '/areas-comunes' },
    { id: 'mis-reservas', name: 'Mis Reservas', icon: Calendar, path: '/reservas' },
    { id: 'hacer-reserva', name: 'Hacer Reserva', icon: MapPin, path: '/nueva-reserva' },
    { id: 'mis-pagos', name: 'Mis Pagos', icon: CreditCard, path: '/pagos' },
    { id: 'mis-facturas', name: 'Mis Facturas', icon: Receipt, path: '/facturas' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 px-4 bg-gray-900">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-white mr-2" />
            <span className="text-white text-lg font-semibold">BookingApp</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden ml-auto text-gray-300 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <IconComponent className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="ml-4 lg:ml-0 text-2xl font-bold text-gray-900">Áreas Comunes</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer ml-4" />
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{user?.nombre || user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
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
                  Calendario
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
                  Lista de Áreas
                </button>
              </nav>
            </div>
          </div>

          {/* Contenido según la vista actual */}
          {vistaActual === 'calendario' ? (
            <CalendarioAreasComunes 
              onNuevaReserva={(fecha, hora, areaId) => {
                console.log('Nueva reserva:', { fecha, hora, areaId });
                // Aquí puedes manejar la nueva reserva si es necesario
              }}
            />
          ) : (
            <>
              {/* Search and Filter - Solo en vista de áreas */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar áreas comunes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100">Áreas Disponibles</p>
                  <p className="text-3xl font-bold">{filteredAreas.length}</p>
                </div>
                <MapPin className="h-10 w-10 text-primary-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Capacidad Total</p>
                  <p className="text-3xl font-bold">
                    {filteredAreas.reduce((sum, area) => sum + area.capacidad, 0)}
                  </p>
                </div>
                <Users className="h-10 w-10 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Desde</p>
                  <p className="text-3xl font-bold">
                    ${areasComunes.filter(a => a.activa).length > 0 ? Math.min(...areasComunes.filter(a => a.activa).map(a => a.costoHora)) : 0}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-green-200" />
              </div>
            </div>
          </div>

          {/* Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAreas.map((area) => (
              <div key={area.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-6xl">🏢</span>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Área Común
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{area.nombre}</h3>
                  {area.descripcion && (
                    <p className="text-gray-600 text-sm mb-4">{area.descripcion}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      Capacidad: {area.capacidad} personas
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      ${area.costoHora} por hora
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleReservar(area)}
                    disabled={!area.activa}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                      area.activa
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {area.activa ? 'Reservar' : 'No disponible'}
                  </button>
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
              <p className="text-gray-500">No se encontraron áreas comunes que coincidan con tu búsqueda.</p>
            </div>
          )}
            </>
          )}
        </div>
      </div>

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
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AreasComunesUserPage;