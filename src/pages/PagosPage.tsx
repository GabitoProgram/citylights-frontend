import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  DollarSign, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Building2,
  Calendar,
  Home,
  LogOut,
  Menu,
  X,
  Bell,
  Receipt,
  Settings,
  BarChart3,
  Shield,
  UserPlus,
  Crown,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Trabajador {
  id: number;
  nombre: string;
  sueldo: number;
  tipo: string;
}

interface Nomina {
  id: number;
  trabajador: Trabajador;
  cantidad: number;
  extra: number;
  is_user: string;
  fecha: string;
}

interface Pago {
  id: number;
  nomina: Nomina;
  monto: number;
  is_user: string;
  fecha: string;
  estado?: string;
  factura?: FacturaNomina;
}

interface FacturaNomina {
  id: number;
  numeroFactura: string;
  trabajadorNombre: string;
  total: number;
  estado: string;
  fechaCreacion: string;
}

const PagosPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [facturas, setFacturas] = useState<FacturaNomina[]>([]);
  const [activeTab, setActiveTab] = useState<'trabajadores' | 'nominas' | 'pagos' | 'facturas'>('trabajadores');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para modales
  const [showTrabajadorModal, setShowTrabajadorModal] = useState(false);
  const [showNominaModal, setShowNominaModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Estados para formularios
  const [nuevoTrabajador, setNuevoTrabajador] = useState({
    nombre: '',
    sueldo: 0,
    tipo: 'Empleado'
  });

  const [editandoTrabajador, setEditandoTrabajador] = useState<Trabajador | null>(null);

  const [nuevaNomina, setNuevaNomina] = useState({
    trabajadorId: 0,
    cantidad: 0,
    extra: 0
  });

  const [nuevoPago, setNuevoPago] = useState({
    nominaId: 0,
    monto: 0
  });

  // Funciones de navegación y sidebar
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // Menú de navegación basado en el rol del usuario
  const getMenuItems = () => {
    if (user?.role === 'SUPER_USER') {
      return [
        { id: 'dashboard', name: 'Dashboard Principal', icon: Home, path: '/dashboard' },
        { id: 'areas-comunes', name: 'Gestionar Áreas Comunes', icon: Building2, path: '/areas-comunes' },
        { id: 'departamentos', name: 'Gestión de Departamentos', icon: Building, path: '/departamentos' },
        { id: 'reservas', name: 'Todas las Reservas', icon: Calendar, path: '/reservas' },
        { id: 'usuarios', name: 'Gestión de Usuarios', icon: Users, path: '/usuarios' },
        { id: 'crear-admin', name: 'Crear Administradores', icon: UserPlus, path: '/crear-admin' },
        { id: 'roles', name: 'Gestión de Roles', icon: Shield, path: '/roles' },
        { id: 'pagos', name: 'Sistema de Nómina', icon: DollarSign, path: '/pagos' },
        { id: 'facturas', name: 'Todas las Facturas', icon: Receipt, path: '/facturas' },
        { id: 'reportes', name: 'Reportes Avanzados', icon: BarChart3, path: '/reportes' },
        { id: 'configuracion', name: 'Configuración Sistema', icon: Settings, path: '/configuracion' },
      ];
    } else {
      // Para USER_ADMIN
      return [
        { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/dashboard' },
        { id: 'areas-comunes', name: 'Áreas Comunes', icon: Building2, path: '/areas-comunes' },
        { id: 'reservas', name: 'Reservas', icon: Calendar, path: '/reservas' },
        { id: 'pagos', name: 'Sistema de Nómina', icon: DollarSign, path: '/pagos' },
        { id: 'facturas', name: 'Facturas', icon: Receipt, path: '/facturas' },
      ];
    }
  };

  useEffect(() => {
    cargarDatos();
    
    // Verificar si regresamos de Stripe con éxito
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const pagoId = urlParams.get('pago_id');
    const sessionId = urlParams.get('session_id');

    if (success === 'true' && pagoId && sessionId) {
      confirmarPagoStripe(parseInt(pagoId), sessionId);
    }
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Cargar trabajadores
      const trabajadoresRes = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/trabajador', { headers });
      if (trabajadoresRes.ok) {
        setTrabajadores(await trabajadoresRes.json());
      }

      // Cargar nóminas
      const nominasRes = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/nomina', { headers });
      if (nominasRes.ok) {
        setNominas(await nominasRes.json());
      }

      // Cargar pagos
      const pagosRes = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pagar', { headers });
      if (pagosRes.ok) {
        setPagos(await pagosRes.json());
      }

      // Cargar facturas
      const facturasRes = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/factura', { headers });
      if (facturasRes.ok) {
        setFacturas(await facturasRes.json());
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const crearTrabajador = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Enviando datos del trabajador:', nuevoTrabajador);
      console.log('Token encontrado:', token ? 'Sí' : 'No');
      
      const response = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/trabajador', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoTrabajador)
      });

      const result = await response.json();
      console.log('Respuesta del servidor:', result);

      if (response.ok) {
        alert('Empleado creado exitosamente');
        setShowTrabajadorModal(false);
        setNuevoTrabajador({ nombre: '', sueldo: 0, tipo: 'Empleado' });
        cargarDatos();
      } else {
        alert(`Error: ${result.message || 'No se pudo crear el empleado'}`);
      }
    } catch (error) {
      console.error('Error creando trabajador:', error);
      alert('Error de conexión. Verifique que el microservicio esté ejecutándose.');
    }
  };

  const crearNomina = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/nomina', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...nuevaNomina,
          is_user: user?.id || 'unknown'
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Nómina creada exitosamente');
        setShowNominaModal(false);
        setNuevaNomina({ trabajadorId: 0, cantidad: 0, extra: 0 });
        cargarDatos();
      } else {
        alert(`Error: ${result.message || 'No se pudo crear la nómina'}`);
      }
    } catch (error) {
      console.error('Error creando nómina:', error);
      alert('Error de conexión al crear nómina.');
    }
  };

  const crearPago = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pagar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoPago)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Pago procesado exitosamente');
        setShowPagoModal(false);
        setNuevoPago({ nominaId: 0, monto: 0 });
        cargarDatos();
      } else {
        alert(`Error: ${result.message || 'No se pudo procesar el pago'}`);
      }
    } catch (error) {
      console.error('Error creando pago:', error);
      alert('Error de conexión al procesar pago.');
    }
  };

  // Funciones para editar trabajador
  const editarTrabajador = (trabajador: Trabajador) => {
    setEditandoTrabajador(trabajador);
    setNuevoTrabajador({
      nombre: trabajador.nombre,
      sueldo: trabajador.sueldo,
      tipo: trabajador.tipo
    });
    setShowEditModal(true);
  };

  const actualizarTrabajador = async () => {
    if (!editandoTrabajador) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`https://citylights-gateway-production.up.railway.app/api/proxy/nomina/trabajador/${editandoTrabajador.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoTrabajador)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Empleado actualizado exitosamente');
        setShowEditModal(false);
        setEditandoTrabajador(null);
        setNuevoTrabajador({ nombre: '', sueldo: 0, tipo: 'Empleado' });
        cargarDatos();
      } else {
        alert(`Error: ${result.message || 'No se pudo actualizar el empleado'}`);
      }
    } catch (error) {
      console.error('Error actualizando trabajador:', error);
      alert('Error de conexión al actualizar empleado.');
    }
  };

  // Función para eliminar trabajador
  const eliminarTrabajador = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este empleado?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`https://citylights-gateway-production.up.railway.app/api/proxy/nomina/trabajador/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Empleado eliminado exitosamente');
        cargarDatos();
      } else {
        const result = await response.json();
        alert(`Error: ${result.message || 'No se pudo eliminar el empleado'}`);
      }
    } catch (error) {
      console.error('Error eliminando trabajador:', error);
      alert('Error de conexión al eliminar empleado.');
    }
  };

  // Función para pagar a un trabajador usando Stripe
  const pagarTrabajador = async (trabajador: Trabajador) => {
    try {
      // Primero crear una nómina automáticamente
      const token = localStorage.getItem('access_token');
      const nominaResponse = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/nomina', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trabajadorId: trabajador.id,
          cantidad: trabajador.sueldo,
          extra: 0,
          is_user: user?.id || 'unknown'
        })
      });

      if (!nominaResponse.ok) {
        throw new Error('Error creando nómina automática');
      }

      const nomina = await nominaResponse.json();

      // Crear sesión de pago con Stripe
      const pagoResponse = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago/stripe/session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trabajadorId: trabajador.id,
          nominaId: nomina.id,
          monto: trabajador.sueldo
        })
      });

      const pagoResult = await pagoResponse.json();

      if (pagoResponse.ok && pagoResult.url) {
        // Redirigir a Stripe Checkout
        window.location.href = pagoResult.url;
      } else {
        alert(`Error: ${pagoResult.message || 'No se pudo iniciar el pago'}`);
      }

    } catch (error) {
      console.error('Error iniciando pago:', error);
      alert('Error al iniciar el pago con Stripe.');
    }
  };

  // Función para confirmar pago después del éxito en Stripe
  const confirmarPagoStripe = async (pagoId: number, sessionId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago/confirmar/${pagoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        console.log('Pago confirmado exitosamente');
        // Limpiar los parámetros de la URL
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        url.searchParams.delete('pago_id');
        url.searchParams.delete('session_id');
        window.history.replaceState({}, document.title, url.toString());
        
        // Recargar los datos para mostrar el estado actualizado
        cargarDatos();
        alert('¡Pago completado exitosamente!');
      } else {
        const error = await response.json();
        console.error('Error confirmando pago:', error);
        alert(`Error confirmando pago: ${error.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error confirmando pago:', error);
      alert('Error al confirmar el pago.');
    }
  };

  // Función para generar PDF de comprobante
  const generarComprobantePDF = async (pagoId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pdf/comprobante/${pagoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        // Descargar el PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprobante_pago_${pagoId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error generando el comprobante PDF');
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el comprobante PDF.');
    }
  };

  // Función para descargar factura PDF
  const descargarFacturaPDF = async (facturaId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`https://citylights-gateway-production.up.railway.app/api/proxy/nomina/factura/pdf/${facturaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura_nomina_${facturaId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error descargando la factura PDF');
      }
    } catch (error) {
      console.error('Error descargando factura:', error);
      alert('Error al descargar la factura.');
    }
  };

  const generarReporte = async (tipo: 'general' | 'mensual') => {
    try {
      const token = localStorage.getItem('access_token');
      let url = 'https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pagar/reporte-egresos';
      
      if (tipo === 'mensual') {
        const mes = new Date().getMonth() + 1;
        const anio = new Date().getFullYear();
        url = `https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pagar/reporte-egresos/${mes}/${anio}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Reporte generado: ${result.reportePDF}`);
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
    }
  };

  // Debug: Ver el usuario y rol actual
  console.log('Usuario actual:', user);
  console.log('Rol del usuario:', user?.role);

  // Verificar permisos
  if (!user || (user.role !== 'SUPER_USER' && user.role !== 'USER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Acceso Denegado</h2>
          <p className="text-gray-600">Solo los super usuarios y administradores pueden acceder a esta página.</p>
          <p className="text-sm text-gray-400 mt-2">Tu rol actual: {user?.role || 'No definido'}</p>
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
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b ${
        user?.role === 'SUPER_USER' ? 'from-purple-900 to-purple-800' : 'from-blue-900 to-blue-800'
      } transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className={`flex items-center justify-between h-16 px-4 ${
          user?.role === 'SUPER_USER' ? 'bg-purple-950' : 'bg-blue-950'
        }`}>
          <div className="flex items-center">
            {user?.role === 'SUPER_USER' ? (
              <Crown className="h-8 w-8 text-yellow-400 mr-2" />
            ) : (
              <Shield className="h-8 w-8 text-blue-400 mr-2" />
            )}
            <span className="text-white text-lg font-semibold">
              {user?.role === 'SUPER_USER' ? 'CityLights Master' : 'CityLights Admin'}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className={`p-4 border-b ${
          user?.role === 'SUPER_USER' ? 'border-purple-700' : 'border-blue-700'
        }`}>
          <div className="flex items-center">
            <div className={`h-10 w-10 ${
              user?.role === 'SUPER_USER' 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                : 'bg-gradient-to-br from-blue-400 to-blue-500'
            } rounded-full flex items-center justify-center`}>
              {user?.role === 'SUPER_USER' ? (
                <Crown className="h-6 w-6 text-white" />
              ) : (
                <Shield className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="ml-3">
              <div className="text-white text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className={`text-xs ${
                user?.role === 'SUPER_USER' ? 'text-yellow-300' : 'text-blue-300'
              }`}>
                {user?.role === 'SUPER_USER' ? 'Super Usuario' : 'Administrador'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-4">
          <ul className="space-y-2">
            {getMenuItems().map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigateTo(item.path)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.path === '/pagos'
                      ? `${user?.role === 'SUPER_USER' ? 'bg-purple-700' : 'bg-blue-700'} text-white`
                      : `text-${user?.role === 'SUPER_USER' ? 'purple' : 'blue'}-100 hover:bg-${user?.role === 'SUPER_USER' ? 'purple' : 'blue'}-700 hover:text-white`
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
            className={`w-full flex items-center px-3 py-2 text-sm font-medium text-${user?.role === 'SUPER_USER' ? 'purple' : 'blue'}-100 rounded-md hover:bg-${user?.role === 'SUPER_USER' ? 'purple' : 'blue'}-700 hover:text-white transition-colors`}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Sistema de Nómina</h1>
          <div className="flex items-center space-x-4">
            <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
            <DollarSign className="h-6 w-6 text-emerald-500" />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Empleados, Nóminas y Pagos</h2>
            <p className="text-gray-600">Control completo del sistema de nómina empresarial</p>
          </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
            <div className="flex items-center">
              <Users className="h-8 w-8 mr-4" />
              <div>
                <p className="text-blue-100">Total Empleados</p>
                <p className="text-2xl font-bold">{trabajadores.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 mr-4" />
              <div>
                <p className="text-green-100">Total Pagos</p>
                <p className="text-2xl font-bold">{pagos.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
            <div className="flex items-center">
              <FileText className="h-8 w-8 mr-4" />
              <div>
                <p className="text-purple-100">Nóminas Activas</p>
                <p className="text-2xl font-bold">{nominas.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('trabajadores')}
                className={`px-6 py-3 font-medium ${activeTab === 'trabajadores' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Empleados
              </button>
              <button
                onClick={() => setActiveTab('nominas')}
                className={`px-6 py-3 font-medium ${activeTab === 'nominas' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Nóminas
              </button>
              <button
                onClick={() => setActiveTab('pagos')}
                className={`px-6 py-3 font-medium ${activeTab === 'pagos' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Pagos
              </button>
              <button
                onClick={() => setActiveTab('facturas')}
                className={`px-6 py-3 font-medium ${activeTab === 'facturas' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Facturas
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab Trabajadores */}
            {activeTab === 'trabajadores' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Empleados</h2>
                  <button
                    onClick={() => setShowTrabajadorModal(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Empleado
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sueldo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {trabajadores.map((trabajador) => (
                        <tr key={trabajador.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">{trabajador.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{trabajador.nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">${trabajador.sueldo}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{trabajador.tipo}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => pagarTrabajador(trabajador)}
                                className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 flex items-center"
                                title="Pagar con Stripe"
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pagar
                              </button>
                              <button 
                                onClick={() => editarTrabajador(trabajador)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar empleado"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => eliminarTrabajador(trabajador.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Eliminar empleado"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Nóminas */}
            {activeTab === 'nominas' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Nóminas</h2>
                  <button
                    onClick={() => setShowNominaModal(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Nómina
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extra</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generado por</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {nominas.map((nomina) => (
                        <tr key={nomina.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">{nomina.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{nomina.trabajador?.nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">${nomina.cantidad}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">${nomina.extra}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{nomina.is_user}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(nomina.fecha).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Pagos */}
            {activeTab === 'pagos' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Pagos</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => generarReporte('general')}
                      className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Reporte General
                    </button>
                    <button
                      onClick={() => generarReporte('mensual')}
                      className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Reporte Mensual
                    </button>
                    <button
                      onClick={() => setShowPagoModal(true)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Pago
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procesado por</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pagos.map((pago) => (
                        <tr key={pago.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">{pago.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{pago.nomina?.trabajador?.nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">${pago.monto}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{pago.is_user}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(pago.fecha).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <button
                              onClick={() => generarComprobantePDF(pago.id)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 flex items-center"
                              title="Descargar comprobante PDF"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Facturas */}
            {activeTab === 'facturas' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Facturas de Nómina</h2>
                  <div className="text-sm text-gray-600">
                    Las facturas se generan automáticamente al confirmar pagos con Stripe
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Factura</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabajador</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {facturas.map((factura) => (
                        <tr key={factura.id}>
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">{factura.numeroFactura}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{factura.trabajadorNombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">Bs. {factura.total.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              factura.estado === 'GENERADA' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {factura.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(factura.fechaCreacion).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <button
                              onClick={() => descargarFacturaPDF(factura.id)}
                              className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 flex items-center"
                              title="Descargar factura fiscal PDF"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Descargar Factura
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {facturas.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>No hay facturas generadas aún</p>
                      <p className="text-sm">Las facturas se generan automáticamente al confirmar pagos</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nuevo Trabajador */}
      {showTrabajadorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nuevo Empleado</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre completo"
                value={nuevoTrabajador.nombre}
                onChange={(e) => setNuevoTrabajador({...nuevoTrabajador, nombre: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Sueldo"
                value={nuevoTrabajador.sueldo}
                onChange={(e) => setNuevoTrabajador({...nuevoTrabajador, sueldo: Number(e.target.value)})}
                className="w-full p-2 border rounded-lg"
              />
              <select
                value={nuevoTrabajador.tipo}
                onChange={(e) => setNuevoTrabajador({...nuevoTrabajador, tipo: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="Empleado">Empleado</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Gerente">Gerente</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowTrabajadorModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={crearTrabajador}
                disabled={!nuevoTrabajador.nombre || nuevoTrabajador.sueldo <= 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Nómina */}
      {showNominaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nueva Nómina</h3>
            <div className="space-y-4">
              <select
                value={nuevaNomina.trabajadorId}
                onChange={(e) => setNuevaNomina({...nuevaNomina, trabajadorId: Number(e.target.value)})}
                className="w-full p-2 border rounded-lg"
              >
                <option value={0}>Seleccionar empleado</option>
                {trabajadores.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Cantidad"
                value={nuevaNomina.cantidad}
                onChange={(e) => setNuevaNomina({...nuevaNomina, cantidad: Number(e.target.value)})}
                className="w-full p-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Horas extra"
                value={nuevaNomina.extra}
                onChange={(e) => setNuevaNomina({...nuevaNomina, extra: Number(e.target.value)})}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowNominaModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={crearNomina}
                disabled={nuevaNomina.trabajadorId === 0 || nuevaNomina.cantidad <= 0}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Pago */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nuevo Pago</h3>
            <div className="space-y-4">
              <select
                value={nuevoPago.nominaId}
                onChange={(e) => setNuevoPago({...nuevoPago, nominaId: Number(e.target.value)})}
                className="w-full p-2 border rounded-lg"
              >
                <option value={0}>Seleccionar nómina</option>
                {nominas.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.trabajador?.nombre} - ${n.cantidad + n.extra}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Monto"
                value={nuevoPago.monto}
                onChange={(e) => setNuevoPago({...nuevoPago, monto: Number(e.target.value)})}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowPagoModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={crearPago}
                disabled={nuevoPago.nominaId === 0 || nuevoPago.monto <= 0}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Crear Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Trabajador */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Empleado</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre completo"
                value={nuevoTrabajador.nombre}
                onChange={(e) => setNuevoTrabajador({...nuevoTrabajador, nombre: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Sueldo"
                value={nuevoTrabajador.sueldo}
                onChange={(e) => setNuevoTrabajador({...nuevoTrabajador, sueldo: Number(e.target.value)})}
                className="w-full p-2 border rounded-lg"
              />
              <select
                value={nuevoTrabajador.tipo}
                onChange={(e) => setNuevoTrabajador({...nuevoTrabajador, tipo: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="Empleado">Empleado</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Gerente">Gerente</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditandoTrabajador(null);
                  setNuevoTrabajador({ nombre: '', sueldo: 0, tipo: 'Empleado' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={actualizarTrabajador}
                disabled={!nuevoTrabajador.nombre || nuevoTrabajador.sueldo <= 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PagosPage;