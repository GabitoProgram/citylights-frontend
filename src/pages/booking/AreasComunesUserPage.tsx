import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Search, Menu, X, LogOut, Home, Building2, CreditCard, Receipt, User } from 'lucide-react';
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
        const response = await apiService.getAllReservasForVisualization(); // Método específico para obtener todas las reservas
        if (response.data && Array.isArray(response.data)) {
          setReservas(response.data);
        }
      } catch (error) {
        console.error('Error al cargar reservas:', error);
      }
    };
    cargarReservas();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Inicio', icon: Home, path: '/dashboard' },
    { id: 'areas-comunes', name: 'Ver Áreas Comunes', icon: Building2, path: '/areas-comunes' },
    { id: 'mis-reservas', name: 'Mis Reservas', icon: Calendar, path: '/reservas' },
    { id: 'hacer-reserva', name: 'Hacer Reserva', icon: MapPin, path: '/nueva-reserva' },
    { id: 'mis-pagos', name: 'Mis Pagos', icon: CreditCard, path: '/mis-pagos' },
    { id: 'mis-facturas', name: 'Mis Facturas', icon: Receipt, path: '/mis-facturas' },
  ];

  // Función de validación anti-duplicados
  const verificarConflictoReserva = (areaId: number, inicio: string, fin: string): { tieneConflicto: boolean; mensaje: string } => {
    const inicioNueva = new Date(inicio);
    const finNueva = new Date(fin);

    for (const reserva of reservas) {
      if (reserva.estado === 'CANCELLED') continue;
      if (reserva.areaId !== areaId) continue;

      const inicioExistente = new Date(reserva.inicio);
      const finExistente = new Date(reserva.fin);

      // Verificar solapamiento
      if (
        (inicioNueva >= inicioExistente && inicioNueva < finExistente) ||
        (finNueva > inicioExistente && finNueva <= finExistente) ||
        (inicioNueva <= inicioExistente && finNueva >= finExistente)
      ) {
        return {
          tieneConflicto: true,
          mensaje: `Ya existe una reserva en este horario (${inicioExistente.toLocaleString()} - ${finExistente.toLocaleString()})`
        };
      }
    }

    return { tieneConflicto: false, mensaje: '' };
  };

  const handleReservaClick = (area: AreaComun) => {
    setAreaToReserve(area);
    setReservaModalOpen(true);
  };

  const handleReservaSubmit = async (reservaData: CreateReservaDto) => {
    if (!areaToReserve) return;

    // Validar conflictos antes de enviar
    const validacion = verificarConflictoReserva(
      areaToReserve.id,
      reservaData.inicio,
      reservaData.fin
    );

    if (validacion.tieneConflicto) {
      alert(`❌ ${validacion.mensaje}`);
      return;
    }

    try {
      console.log('📤 Enviando reserva:', reservaData);
      await apiService.createReserva(reservaData);
      alert('✅ Reserva creada exitosamente');
      setReservaModalOpen(false);
      setAreaToReserve(null);
      
      // Recargar reservas
      const response = await apiService.getAllReservasForVisualization();
      if (response.data && Array.isArray(response.data)) {
        setReservas(response.data);
      }
    } catch (error) {
      console.error('❌ Error al crear reserva:', error);
      alert('Error al crear la reserva');
    }
  };

  const areasFiltered = areas.filter(area =>
    area.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (area.descripcion && area.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando áreas comunes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error al cargar las áreas comunes: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar - Dashboard Purple Style */}
      <aside 
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-primary-700">
          <h1 className="text-xl font-bold">Panel de Control</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-primary-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'areas-comunes';
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.path)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary-700">
          <div className="flex items-center mb-4">
            <div className="bg-primary-600 rounded-full p-2 mr-3">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-primary-200 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-primary-100 rounded-lg hover:bg-primary-700 hover:text-white transition-colors duration-200"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 ml-2 lg:ml-0">
                Áreas Comunes
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setVistaActual(vistaActual === 'calendario' ? 'areas' : 'calendario')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
              >
                {vistaActual === 'calendario' ? (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Ver Lista
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver Calendario
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-auto p-6">
          {vistaActual === 'calendario' ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <CalendarioAreasComunes />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Barra de búsqueda */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar áreas comunes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Grid de áreas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {areasFiltered.map((area) => (
                  <div
                    key={area.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {area.nombre}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            area.activa
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {area.activa ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {area.descripcion}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          Capacidad: {area.capacidad} personas
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Costo por hora: ${area.costoHora}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          Disponible las 24 horas
                        </div>
                      </div>

                      <button
                        onClick={() => handleReservaClick(area)}
                        disabled={!area.activa}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                          area.activa
                            ? 'bg-primary-600 hover:bg-primary-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {area.activa ? 'Hacer Reserva' : 'No Disponible'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {areasFiltered.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron áreas comunes
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'Intenta con otros términos de búsqueda'
                      : 'No hay áreas comunes disponibles'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal de Reserva */}
      {reservaModalOpen && areaToReserve && (
        <SimpleReservaModal
          isOpen={reservaModalOpen}
          onClose={() => {
            setReservaModalOpen(false);
            setAreaToReserve(null);
          }}
          onSave={handleReservaSubmit}
          area={areaToReserve}
        />
      )}
    </div>
  );
};

export default AreasComunesUserPage;

