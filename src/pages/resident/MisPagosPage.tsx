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
import { jsPDF } from 'jspdf';

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

  const response = await fetch(`http://localhost:3000/api/proxy/nomina/pago-mensual/residente/${user.id}/cuotas`, {
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
  const response = await fetch('http://localhost:3000/api/proxy/nomina/pago-mensual/residente/cuota', {
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
  const response = await fetch('http://localhost:3000/api/proxy/nomina/pago-mensual/confirmar-pago-cuota', {
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
        
        // Recargar las cuotas para mostrar el estado actualizado
        await cargarCuotasUsuario();
        
        // Limpiar los parámetros de la URL
        window.history.replaceState({}, document.title, '/mis-pagos');
        
        // 🆕 MOSTRAR MENSAJE CON OPCIÓN DE DESCARGAR FACTURA
        if (resultado.factura || resultado.cuota) {
          const descargarFactura = window.confirm(
            `✅ ¡Pago realizado exitosamente!\n\n` +
            `📋 Cuota: ${resultado.cuota ? `${resultado.cuota.mes}/${resultado.cuota.anio}` : 'N/A'}\n` +
            `💰 Total pagado: $${resultado.cuota?.montoTotal || 'N/A'}\n\n` +
            `¿Deseas descargar tu factura ahora?`
          );
          
          if (descargarFactura && resultado.cuota) {
            // Usar la función local para generar el PDF
            descargarFacturaCuota(resultado.cuota);
          }
        } else {
          // Mensaje normal si no se generó factura
          alert('✅ ¡Pago realizado exitosamente! Tu cuota ha sido marcada como pagada.');
        }
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

  // 🆕 FUNCIÓN PARA GENERAR Y DESCARGAR FACTURA PDF DESDE EL FRONTEND
  const descargarFacturaCuota = async (cuota: CuotaResidente) => {
    try {
      console.log('🔄 Generando PDF desde el frontend para cuota:', cuota.id);
      
      // 🆕 OBTENER CONFIGURACIÓN DE CONCEPTOS DE CUOTA Y METADATA
      let conceptosDetalle: Array<{descripcion: string, cantidad: number, precio: number, total: number}> = [];
      
      try {
        const token = localStorage.getItem('access_token');
        
        // Obtener configuración de cuota
  const responseConfig = await fetch('http://localhost:3000/api/proxy/nomina/cuota-config', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Obtener metadata de conceptos
  const responseMetadata = await fetch('http://localhost:3000/api/proxy/nomina/cuota-config/conceptos', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (responseConfig.ok && responseMetadata.ok) {
          const configData = await responseConfig.json();
          const metadataData = await responseMetadata.json();
          
          console.log('✅ Configuración de conceptos obtenida:', configData);
          console.log('✅ Metadata de conceptos obtenida:', metadataData);
          
          if (configData.success && configData.data && configData.data.conceptos) {
            const conceptos = configData.data.conceptos;
            const conceptosMetadata = metadataData.success ? metadataData.data : [];
            
            // Crear un mapa de metadata por key para búsqueda rápida
            const metadataMap = conceptosMetadata.reduce((map, concepto) => {
              map[concepto.key] = concepto;
              return map;
            }, {});
            
            // Recorrer todos los conceptos dinámicamente
            Object.entries(conceptos).forEach(([key, valor]) => {
              const metadata = metadataMap[key];
              // Usar el monto real de la metadata si existe
              const montoReal = metadata?.monto ?? valor;
              const descripcion = metadata?.label || key.charAt(0).toUpperCase() + key.slice(1);
              if (typeof montoReal === 'number' && montoReal > 0) {
                conceptosDetalle.push({
                  descripcion: descripcion,
                  cantidad: 1,
                  precio: montoReal,
                  total: montoReal
                });
              }
            });
            
            console.log(`✅ Desglose de conceptos preparado: ${conceptosDetalle.length} items`);
          }
        }
      } catch (configError) {
        console.warn('⚠️ No se pudo obtener configuración de conceptos:', configError);
        // Continuar con el formato original si hay error
      }
      
      // Si no hay conceptos específicos, usar el formato original
      if (conceptosDetalle.length === 0) {
        conceptosDetalle = [{
          descripcion: `Cuota mensual ${cuota.mes}/${cuota.anio}`,
          cantidad: 1,
          precio: cuota.monto,
          total: cuota.monto
        }];
      }
      
      // Crear nuevo documento PDF con formato más largo para evitar desbordamiento
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, 350] // Ancho: 210mm (A4), Alto: 350mm (más largo que A4 estándar de 297mm)
      });
      
      // ENCABEZADO DE LA EMPRESA
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // azul
      doc.text('CITYLIGHTS', 20, 25);
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('FACTURA DE CUOTA MENSUAL', 20, 35);
      
      // INFORMACIÓN DE LA FACTURA
      const numeroFactura = `CUOTA-${cuota.id.toString().padStart(8, '0')}`;
      doc.setFontSize(12);
      doc.text(`Número de Factura: ${numeroFactura}`, 20, 50);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, 20, 60);
      doc.text(`Período: ${cuota.mes}/${cuota.anio}`, 20, 70);
      // Agregar fecha de pago si existe
      if (cuota.fechaPago) {
        doc.text(`Fecha de Pago: ${new Date(cuota.fechaPago).toLocaleDateString('es-ES')}`, 20, 80);
      }
      
      // LÍNEA SEPARADORA
  // Ajustar la posición de la línea separadora si se agregó fecha de pago
  let lineaY = cuota.fechaPago ? 90 : 80;
  doc.setLineWidth(0.5);
  doc.line(20, lineaY, 190, lineaY);
      
      // DATOS DEL CLIENTE
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55); // gris oscuro
      doc.text('DATOS DEL RESIDENTE', 20, 95);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const nombreCompleto = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Residente';
      doc.text(`Nombre: ${nombreCompleto}`, 20, 110);
      doc.text(`Email: ${user?.email || 'N/A'}`, 20, 120);
      doc.text(`Concepto: Cuota mensual ${cuota.mes}/${cuota.anio}`, 20, 130);
      
      // DETALLES DE LA FACTURA
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('DETALLE DE LA FACTURA', 20, 150);
      
      // Encabezados de tabla
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // gris
      doc.text('DESCRIPCIÓN', 20, 165);
      doc.text('CANT.', 120, 165);
      doc.text('PRECIO', 140, 165);
      doc.text('TOTAL', 170, 165);
      
      // Línea bajo encabezados
      doc.line(20, 170, 190, 170);
      
      // 🆕 MOSTRAR DESGLOSE DE CONCEPTOS
      let yPosition = 180;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Iterar sobre cada concepto
      conceptosDetalle.forEach((concepto) => {
        doc.text(concepto.descripcion, 20, yPosition);
        doc.text(concepto.cantidad.toString(), 120, yPosition);
        doc.text(`$${concepto.precio.toFixed(2)}`, 140, yPosition);
        doc.text(`$${concepto.total.toFixed(2)}`, 170, yPosition);
        yPosition += 10;
      });
      
      // Morosidad si aplica
      if (cuota.montoMorosidad > 0) {
        doc.text(`Recargo por morosidad (${cuota.diasMorosidad} días)`, 20, yPosition);
        doc.text('1', 120, yPosition);
        doc.text(`$${cuota.montoMorosidad.toFixed(2)}`, 140, yPosition);
        doc.text(`$${cuota.montoMorosidad.toFixed(2)}`, 170, yPosition);
        yPosition += 10;
      }
      
      // Línea antes del total
      yPosition += 5;
      doc.line(120, yPosition, 190, yPosition);
      
      // TOTAL
      yPosition += 15;
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('TOTAL A PAGAR:', 120, yPosition);
      doc.setFontSize(16);
      doc.setTextColor(220, 38, 38); // rojo
      doc.text(`$${cuota.montoTotal.toFixed(2)}`, 170, yPosition);
      
      // Agregar más espacio antes del pie de página
      yPosition += 30;
      
      // PIE DE PÁGINA (posicionado dinámicamente)
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('CitiLights - Sistema de Gestión de Cuotas Residenciales', 20, yPosition + 20);
      doc.text(`Factura generada el ${new Date().toLocaleString('es-ES')}`, 20, yPosition + 30);
      doc.text('Esta es una factura digital generada automáticamente.', 20, yPosition + 40);
      
      // Línea decorativa en el pie
      doc.setLineWidth(0.3);
      doc.line(20, yPosition + 10, 190, yPosition + 10);
      
      // Descargar el PDF
      const fileName = `factura_cuota_${numeroFactura}.pdf`;
      doc.save(fileName);
      
      console.log('✅ PDF generado y descargado exitosamente');
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert('Error al generar la factura. Intenta nuevamente.');
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
                      
                      {cuota.estado === 'PAGADO' && (
                        <button
                          onClick={() => descargarFacturaCuota(cuota)}
                          className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 flex items-center"
                          title="Descargar factura de la cuota"
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          Factura PDF
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