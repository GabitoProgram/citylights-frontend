import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  CreditCard,
  Building2,
  Home,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Receipt,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CuotaResidente {
  id: number;
  anio: number;
  mes: number;
  monto: number;
  montoMorosidad: number;
  montoTotal: number;
  estado: string;
  fechaVencimiento: string;
  fechaVencimientoGracia?: string;
  fechaPago?: string;
  diasMorosidad: number;
  porcentajeMorosidad: number;
  metodoPago?: string;
  referencia?: string;
  createdAt: string;
}

interface EstadisticasCuotas {
  total: number;
  pendientes: number;
  pagadas: number;
  morosas: number;
  montoTotalPendiente: number;
}

interface ResumenCuotas {
  cuotas: CuotaResidente[];
  estadisticas: EstadisticasCuotas;
}

const MisPagosPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cuotas, setCuotas] = useState<CuotaResidente[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasCuotas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      cargarCuotasUsuario();
    }
    
    // Verificar si regresamos de Stripe con éxito
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const cuotaId = urlParams.get('cuota_id');
    const sessionId = urlParams.get('session_id');

    if (success === 'true' && cuotaId && sessionId) {
      confirmarPagoStripe(parseInt(cuotaId), sessionId);
    }
  }, [user]);

  const cargarCuotasUsuario = async () => {
    try {
      if (!user) {
        setError('Usuario no autenticado');
        return;
      }

      if (user.role !== 'USER_CASUAL') {
        setError('Esta página es solo para residentes');
        return;
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const response = await fetch(`https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/residente/${user.id}/cuotas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data: ResumenCuotas = await response.json();
        setCuotas(data.cuotas);
        setEstadisticas(data.estadisticas);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setError(`Error cargando cuotas: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error cargando cuotas:', error);
      setError('Error de conexión al cargar cuotas');
    } finally {
      setLoading(false);
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
    { id: 'dashboard', name: 'Inicio', icon: Home, path: '/dashboard' },
    { id: 'areas-comunes', name: 'Ver Áreas Comunes', icon: Building2, path: '/areas-comunes' },
    { id: 'mis-reservas', name: 'Mis Reservas', icon: Calendar, path: '/reservas' },
    { id: 'hacer-reserva', name: 'Hacer Reserva', icon: MapPin, path: '/nueva-reserva' },
    { id: 'mis-pagos', name: 'Mis Pagos', icon: CreditCard, path: '/mis-pagos' },
    { id: 'mis-facturas', name: 'Mis Facturas', icon: Receipt, path: '/facturas' },
  ];

  const pagarCuota = async () => {
    try {
      if (!user) {
        alert('Usuario no autenticado');
        return;
      }

      const token = localStorage.getItem('access_token');
      const response = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/residente/cuota', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id.toString(),
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email
        })
      });

      if (response.ok) {
        const resultado = await response.json();
        if (resultado.session && resultado.session.url) {
          // Redirigir a Stripe para pagar
          window.open(resultado.session.url, '_blank');
        } else {
          alert('Sesión de pago creada exitosamente');
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error procesando el pago');
    }
  };

  const confirmarPagoStripe = async (cuotaId: number, sessionId: string) => {
    try {
      console.log('🔄 Confirmando pago de Stripe...', { cuotaId, sessionId });
      
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/confirmar-pago-cuota', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cuotaId,
          sessionId
        })
      });

      if (response.ok) {
        const resultado = await response.json();
        console.log('✅ Pago confirmado:', resultado);
        
        // Mostrar mensaje de éxito
        alert('✅ ¡Pago realizado exitosamente! Tu cuota ha sido marcada como pagada.');
        
        // Recargar las cuotas para mostrar el estado actualizado
        await cargarCuotasUsuario();
        
        // Limpiar los parámetros de la URL
        window.history.replaceState({}, document.title, '/mis-pagos');
      } else {
        const error = await response.json();
        console.error('❌ Error confirmando pago:', error);
        alert(`Error confirmando el pago: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Error de conexión confirmando pago:', error);
      alert('Error de conexión al confirmar el pago. El pago puede haberse procesado correctamente.');
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PAGADO': return 'bg-green-100 text-green-800';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      case 'MOROSO': return 'bg-red-100 text-red-800';
      case 'VENCIDO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case 'PAGADO': return <CheckCircle className="h-4 w-4" />;
      case 'PENDIENTE': return <Clock className="h-4 w-4" />;
      case 'MOROSO': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!user || user.role !== 'USER_CASUAL') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso Restringido</h3>
          <p className="mt-1 text-sm text-gray-500">Esta página es solo para residentes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-primary-900">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-white mr-2" />
            <span className="text-white text-lg font-semibold">CityLights</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-primary-700">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <div className="text-white text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-primary-300 text-xs">Usuario Casual</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-4 flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigateTo(item.path)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.path === '/mis-pagos'
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-100 hover:bg-primary-700 hover:text-white'
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
        <div className="p-4 border-t border-primary-700 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-primary-100 rounded-md hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">💳 Mis Pagos</h2>
          <div className="flex items-center space-x-4">
            <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Mis Pagos</h1>
              <p className="mt-2 text-sm text-gray-600">
                Bienvenido, {user.firstName} {user.lastName}
              </p>
            </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Cuotas</dt>
                      <dd className="text-lg font-medium text-gray-900">{estadisticas.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                      <dd className="text-lg font-medium text-gray-900">{estadisticas.pendientes}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pagadas</dt>
                      <dd className="text-lg font-medium text-gray-900">{estadisticas.pagadas}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Pendiente</dt>
                      <dd className="text-lg font-medium text-gray-900">${estadisticas.montoTotalPendiente.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Cuotas */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Historial de Cuotas</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Todas tus cuotas mensuales y su estado de pago
            </p>
          </div>
          
          {cuotas.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cuotas</h3>
              <p className="mt-1 text-sm text-gray-500">Aún no se han generado cuotas para tu cuenta</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {cuotas.map((cuota) => (
                <li key={cuota.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {obtenerIconoEstado(cuota.estado)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            Cuota {cuota.mes}/{cuota.anio}
                          </p>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${obtenerColorEstado(cuota.estado)}`}>
                            {cuota.estado}
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            Vencimiento: {formatearFecha(cuota.fechaVencimiento)}
                          </p>
                          {cuota.diasMorosidad > 0 && (
                            <p className="text-sm text-red-600">
                              Morosidad: {cuota.diasMorosidad} días (+${cuota.montoMorosidad.toFixed(2)})
                            </p>
                          )}
                          {cuota.fechaPago && (
                            <p className="text-sm text-green-600">
                              Pagado: {formatearFecha(cuota.fechaPago)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-medium text-gray-900">
                          ${cuota.montoTotal.toFixed(2)}
                        </p>
                        {cuota.montoMorosidad > 0 && (
                          <p className="text-sm text-gray-500">
                            Base: ${cuota.monto.toFixed(2)}
                          </p>
                        )}
                      </div>
                      
                      {(cuota.estado === 'PENDIENTE' || cuota.estado === 'MOROSO') && (
                        <button
                          onClick={() => pagarCuota()}
                          className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 flex items-center"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pagar
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisPagosPage;