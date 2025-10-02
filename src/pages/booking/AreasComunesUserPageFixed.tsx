import { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Search, Menu, X, LogOut, Home, Building2, CreditCard, Receipt, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAreasComunes } from '../../hooks/useAreasComunes';
import SimpleReservaModal from '../../components/SimpleReservaModal';
import PaymentMethodModal from '../../components/PaymentMethodModal';
import QRPayment from '../../components/QRPayment';
import { apiService } from '../../services/api';
import type { AreaComun, CreateReservaDto } from '../../types';

const AreasComunesUserPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { areas, loading, error } = useAreasComunes();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reservaModalOpen, setReservaModalOpen] = useState(false);
  const [areaToReserve, setAreaToReserve] = useState<AreaComun | null>(null);
  
  // 🆕 Estados para pago
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [qrPaymentModalOpen, setQrPaymentModalOpen] = useState(false);
  const [pendingReservaData, setPendingReservaData] = useState<CreateReservaDto | null>(null);
  const [reservaIdForPayment, setReservaIdForPayment] = useState<number | null>(null);

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
    // 🆕 Nuevo flujo: Guardar datos y mostrar selección de método de pago
    console.log('🚀 [DEBUG] handleCreateReserva ejecutado!');
    console.log('📋 [User Page] Datos de reserva listos:', reservaData);
    console.log('🔄 [User Page] areaToReserve actual:', areaToReserve);
    console.log('🔄 [User Page] Mostrando selección de método de pago');
    
    // Guardar datos para usar después de seleccionar método de pago
    setPendingReservaData(reservaData);
    
    // Cerrar modal de reserva y mostrar selección de método de pago
    setReservaModalOpen(false);
    setPaymentMethodModalOpen(true);
    
    // 🚨 NO limpiamos areaToReserve aquí, lo necesitamos para el modal de pago
    console.log('✅ [DEBUG] Estados actualizados - paymentMethodModalOpen:', true);
    console.log('✅ [DEBUG] areaToReserve mantenido:', areaToReserve);
  };

  // 🆕 Manejar pago con Stripe (método existente)
  const handleStripePayment = async () => {
    if (!pendingReservaData) return;
    
    try {
      console.log('💳 [User Page] Procesando pago con Stripe:', pendingReservaData);
      console.log('🌐 [User Page] Flujo: Frontend → Gateway → Microservicio → Stripe');
      
      const response = await apiService.createReservaWithStripe(pendingReservaData);
      console.log('✅ [User Page] Reserva con Stripe creada:', response);
      
      if (response.stripe?.checkoutUrl) {
        console.log('🚀 [User Page] Redirigiendo a Stripe Checkout');
        window.location.href = response.stripe.checkoutUrl;
      } else {
        throw new Error('No se pudo obtener la URL de pago de Stripe');
      }
      
      // Limpiar estado
      setPaymentMethodModalOpen(false);
      setPendingReservaData(null);
      setAreaToReserve(null);
      
    } catch (error: any) {
      console.error('❌ [User Page] Error con pago Stripe:', error);
      alert(`Error: ${error.response?.data?.message || 'Error al procesar pago con tarjeta'}`);
    }
  };

  // 🆕 Manejar pago con QR
  const handleQRPayment = async () => {
    if (!pendingReservaData) return;
    
    try {
      console.log('📱 [User Page] Iniciando pago con QR:', pendingReservaData);
      console.log('🌐 [User Page] Flujo: Frontend → Gateway → Microservicio');
      
      // Primero crear la reserva sin pago (estado PENDING)
      const response = await apiService.createReserva(pendingReservaData);
      console.log('✅ [User Page] Reserva creada para QR:', response);
      
      // Guardar ID de reserva y mostrar QR
      setReservaIdForPayment(response.id);
      setPaymentMethodModalOpen(false);
      setQrPaymentModalOpen(true);
      
    } catch (error: any) {
      console.error('❌ [User Page] Error creando reserva para QR:', error);
      alert(`Error: ${error.response?.data?.message || 'Error al crear reserva para pago QR'}`);
    }
  };

  // 🆕 Manejar éxito de pago (cualquier método)
  const handlePaymentSuccess = () => {
    console.log('✅ [User Page] Pago completado exitosamente');
    
    // Limpiar todo el estado
    setPaymentMethodModalOpen(false);
    setQrPaymentModalOpen(false);
    setPendingReservaData(null);
    setReservaIdForPayment(null);
    setAreaToReserve(null);
    
    // Redirigir a página de éxito o mostrar mensaje
    alert('¡Pago completado exitosamente! Tu reserva ha sido confirmada.');
    
    // Opcional: Redirigir a reservas
    // navigate('/reservas');
  };

  // 🆕 Cerrar modales de pago
  const handleClosePaymentModals = () => {
    setPaymentMethodModalOpen(false);
    setQrPaymentModalOpen(false);
    setPendingReservaData(null);
    setReservaIdForPayment(null);
    // Volver a mostrar el modal de reserva si había un área seleccionada
    if (areaToReserve) {
      setReservaModalOpen(true);
    }
  };

  // 🚨 DEBUG: Log estados antes del render
  console.log('🎯 [RENDER DEBUG]', {
    paymentMethodModalOpen,
    pendingReservaData: !!pendingReservaData,
    areaToReserve: !!areaToReserve,
    reservaModalOpen
  });

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
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
      <div className={`bg-white shadow-lg transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-white mr-2" />
            <span className="text-xl font-bold text-white">BookingApp</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-white lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${
                  isActive ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-700'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-gray-500 hover:text-gray-600 lg:hidden mr-4"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Áreas Comunes</h1>
                <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer ml-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar áreas comunes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-primary-600 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-100">Total de Áreas</p>
                    <p className="text-3xl font-bold">{areasComunes.length}</p>
                  </div>
                  <MapPin className="h-10 w-10 text-primary-200" />
                </div>
              </div>
              <div className="bg-blue-600 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Disponibles</p>
                    <p className="text-3xl font-bold">{areasComunes.filter(a => a.activa).length}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-200" />
                </div>
              </div>
              <div className="bg-green-600 rounded-lg shadow p-6 text-white">
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
                      {area.activa ? 'Reservar' : 'No Disponible'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredAreas.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay áreas comunes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'No se encontraron áreas que coincidan con tu búsqueda.' : 'No hay áreas comunes disponibles en este momento.'}
                </p>
              </div>
            )}
          </div>
        </main>
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

      {/* 🆕 Payment Method Selection Modal */}
      {pendingReservaData && areaToReserve && paymentMethodModalOpen && (
        <PaymentMethodModal
          isOpen={paymentMethodModalOpen}
          onClose={handleClosePaymentModals}
          onSelectStripe={handleStripePayment}
          onSelectQR={handleQRPayment}
          reservaInfo={{
            areaName: areaToReserve.nombre,
            fechaInicio: new Date(pendingReservaData.inicio).toLocaleDateString(),
            fechaFin: new Date(pendingReservaData.fin).toLocaleDateString(),
            monto: pendingReservaData.costo || 0
          }}
        />
      )}

      {/* 🆕 QR Payment Modal */}
      {reservaIdForPayment && (
        <QRPayment
          isOpen={qrPaymentModalOpen}
          onClose={handleClosePaymentModals}
          onBack={() => {
            setQrPaymentModalOpen(false);
            setPaymentMethodModalOpen(true);
          }}
          reservaId={reservaIdForPayment}
          onPaymentSuccess={handlePaymentSuccess}
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