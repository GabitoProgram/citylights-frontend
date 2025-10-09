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
  Building,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

interface CuotaResidente {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  anio: number;
  mes: number;
  monto: number;
  montoMorosidad: number;
  montoTotal: number;
  estado: 'PENDIENTE' | 'VENCIDO' | 'MOROSO' | 'PAGADO';
  fechaVencimiento: string;
  fechaVencimientoGracia?: string;
  fechaPago?: string;
  diasMorosidad: number;
  porcentajeMorosidad: number;
  metodoPago?: string;
  referencia?: string;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ResumenMorosidad {
  totalCuotasMorosas: number;
  montoTotalMorosidad: number;
  montoTotalAPagar: number;
  promedioeDiasMorosidad: number;
  cuotasPorMes: { [key: string]: number };
  detallesCuotas: CuotaResidente[];
}

const PagosPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [facturas, setFacturas] = useState<FacturaNomina[]>([]);
  const [cuotasResidentes, setCuotasResidentes] = useState<CuotaResidente[]>([]);
  const [resumenMorosidad, setResumenMorosidad] = useState<ResumenMorosidad | null>(null);
  const [resumenResidentes, setResumenResidentes] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'trabajadores' | 'nominas' | 'pagos' | 'facturas' | 'cuotas' | 'morosidad' | 'residentes'>('trabajadores');
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

      // Cargar cuotas de residentes
      const cuotasRes = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/residentes/historial', { headers });
      if (cuotasRes.ok) {
        setCuotasResidentes(await cuotasRes.json());
      }

      // Cargar resumen de morosidad
      const morosidadRes = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/morosidad/resumen', { headers });
      if (morosidadRes.ok) {
        setResumenMorosidad(await morosidadRes.json());
      }

      // 👥 CARGAR RESIDENTES: Hacer ambas llamadas desde el frontend
      await cargarResumenResidentes(headers);

    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  // Nueva función para cargar residentes combinando ambos microservicios
  const cargarResumenResidentes = async (headers: any) => {
    try {
      console.log('🔍 Cargando residentes desde microservicio de login...');
      
      // 1. Obtener usuarios del microservicio de login usando el endpoint correcto
      let usuarios = [];
      
      try {
        console.log('🔍 Intentando endpoint: /users/list');
        console.log('🔑 Token enviado:', headers.Authorization ? 'Sí' : 'No');
        console.log('👤 Usuario actual:', user);
        
        // Obtener todos los usuarios (pueden requerir paginación)
        let allUsers = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const usuariosRes = await fetch(`https://citylights-gateway-production.up.railway.app/api/proxy/users/list?page=${page}&limit=50`, { headers });
          
          console.log(`📡 Respuesta del servidor:`, {
            status: usuariosRes.status,
            statusText: usuariosRes.statusText,
            headers: Object.fromEntries(usuariosRes.headers.entries())
          });
          
          if (usuariosRes.ok) {
            const data = await usuariosRes.json();
            console.log(`✅ Página ${page} obtenida:`, data);
            
            if (data.success && data.data) {
              allUsers = [...allUsers, ...data.data.users];
              hasMore = page < data.data.pagination.pages;
              page++;
            } else {
              hasMore = false;
            }
          } else {
            const errorText = await usuariosRes.text();
            console.log(`❌ Error ${usuariosRes.status} obteniendo usuarios:`, errorText);
            hasMore = false;
          }
        }
        
        // Filtrar solo usuarios USER_CASUAL
        usuarios = allUsers.filter(user => user.role === 'USER_CASUAL');
        console.log(`✅ Total usuarios obtenidos: ${allUsers.length}`);
        console.log(`✅ Usuarios USER_CASUAL filtrados: ${usuarios.length}`, usuarios);
        
      } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error);
      }

      if (usuarios.length === 0) {
        console.warn('⚠️ No se encontraron usuarios USER_CASUAL. Usando datos de ejemplo...');
        // Crear datos de ejemplo para testing
        usuarios = [
          { id: 'user1', firstName: 'Juan', lastName: 'Pérez', email: 'juan@ejemplo.com', role: 'USER_CASUAL' },
          { id: 'user2', firstName: 'María', lastName: 'García', email: 'maria@ejemplo.com', role: 'USER_CASUAL' },
          { id: 'user3', firstName: 'Carlos', lastName: 'López', email: 'carlos@ejemplo.com', role: 'USER_CASUAL' }
        ];
        console.log('🧪 Usando datos de ejemplo:', usuarios);
      }

      // 2. Obtener cuotas del mes actual del microservicio de nómina
      const cuotasRes = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/residentes/historial', { headers });
      
      const cuotas = cuotasRes.ok ? await cuotasRes.json() : [];
      console.log('📊 Cuotas obtenidas:', cuotas);

      // 3. Combinar datos en el frontend
      const fechaActual = new Date();
      const anio = fechaActual.getFullYear();
      const mes = fechaActual.getMonth() + 1;

      const resumenResidentes = usuarios.map((usuario: any) => {
        // Buscar cuota del mes actual para este usuario
        const cuotaMesActual = cuotas.find((cuota: any) => 
          cuota.userId === usuario.id && cuota.anio === anio && cuota.mes === mes
        );

        const estadoPago = cuotaMesActual ? cuotaMesActual.estado : 'SIN_CUOTA';
        const nombreCompleto = usuario.firstName && usuario.lastName 
          ? `${usuario.firstName} ${usuario.lastName}`
          : usuario.name || `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim();
        
        return {
          usuario: {
            id: usuario.id,
            name: nombreCompleto,
            email: usuario.email,
            role: usuario.role
          },
          cuota: cuotaMesActual,
          estadoPago: estadoPago,
          montoAPagar: cuotaMesActual ? cuotaMesActual.montoTotal : 100.0,
          tieneCuota: !!cuotaMesActual,
          esMoroso: cuotaMesActual?.estado === 'MOROSO',
          diasMorosidad: cuotaMesActual?.diasMorosidad || 0
        };
      });

      // 4. Calcular estadísticas
      const estadisticas = {
        totalResidentes: resumenResidentes.length,
        conCuota: resumenResidentes.filter(r => r.tieneCuota).length,
        sinCuota: resumenResidentes.filter(r => !r.tieneCuota).length,
        pagados: resumenResidentes.filter(r => r.estadoPago === 'PAGADO').length,
        pendientes: resumenResidentes.filter(r => r.estadoPago === 'PENDIENTE').length,
        vencidos: resumenResidentes.filter(r => r.estadoPago === 'VENCIDO').length,
        morosos: resumenResidentes.filter(r => r.estadoPago === 'MOROSO').length,
        montoRecaudado: resumenResidentes
          .filter(r => r.estadoPago === 'PAGADO')
          .reduce((sum, r) => sum + r.montoAPagar, 0),
        montoPendiente: resumenResidentes
          .filter(r => r.estadoPago !== 'PAGADO')
          .reduce((sum, r) => sum + r.montoAPagar, 0)
      };

      // 5. Guardar en el estado
      setResumenResidentes({
        mes: mes,
        anio: anio,
        estadisticas: estadisticas,
        residentes: resumenResidentes
      });

      console.log('✅ Resumen de residentes generado:', { estadisticas, totalResidentes: resumenResidentes.length });

    } catch (error) {
      console.error('❌ Error cargando resumen de residentes:', error);
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

  // 🏠 FUNCIONES PARA CUOTAS DE RESIDENTES
  const verificarMorosidad = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/morosidad/verificar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const resultado = await response.json();
        alert(`Morosidad verificada: ${resultado.morosidadAplicada} cuotas actualizadas con recargos`);
        cargarDatos(); // Recargar los datos
      } else {
        alert('Error verificando morosidad');
      }
    } catch (error) {
      console.error('Error verificando morosidad:', error);
    }
  };

  const crearCuotaResidente = async (userId: string, userName: string, userEmail: string) => {
    try {
      console.log('🔄 Creando cuota para:', { userId, userName, userEmail });
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        alert('❌ No hay token de autenticación. Por favor inicia sesión.');
        return;
      }

      console.log('📡 Enviando solicitud a:', 'https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/residente/crear-cuota');
      
      const response = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/residente/crear-cuota', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, userName, userEmail })
      });

      console.log('📝 Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const resultado = await response.json();
        console.log('✅ Resultado exitoso:', resultado);
        
        // Solo mostrar información de la cuota creada (SIN redirigir a Stripe)
        if (resultado.cuota) {
          alert(`✅ Cuota creada exitosamente para ${userName}!\n\n📊 Detalles:\n💰 Monto: $${resultado.cuota.monto}\n📅 Vencimiento: ${new Date(resultado.cuota.fechaVencimiento).toLocaleDateString()}\n📝 Estado: ${resultado.cuota.estado}`);
        } else {
          alert(`✅ Cuota creada exitosamente para ${userName}!`);
        }
        
        cargarDatos(); // Recargar los datos para mostrar el cambio
      } else {
        const error = await response.json();
        console.error('❌ Error del servidor:', error);
        
        if (error.message && error.message.includes('ya fue pagada')) {
          alert(`ℹ️ ${userName} ya tiene una cuota pagada para este mes.`);
        } else if (error.message && error.message.includes('ya existe')) {
          alert(`ℹ️ ${userName} ya tiene una cuota creada para este mes.`);
        } else {
          alert(`❌ Error: ${error.message || 'No se pudo crear la cuota'}`);
        }
      }
    } catch (error) {
      console.error('💥 Error completo:', error);
      alert('❌ Error de conexión al crear cuota. Revisa la consola para más detalles.');
    }
  };

  const pagarCuotaResidente = async (userId: string, userName: string, userEmail: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/pagar-cuota-residente', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, userName, userEmail })
      });

      if (response.ok) {
        const resultado = await response.json();
        if (resultado.stripeUrl) {
          // Redirigir a Stripe para el pago
          window.location.href = resultado.stripeUrl;
        } else {
          alert('Error: No se pudo generar el enlace de pago');
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      alert('Error de conexión al procesar pago.');
    }
  };

  // Función para verificar si un trabajador ya fue pagado este mes
  const trabajadorYaPagadoEsteMes = (trabajadorId: number): boolean => {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const anioActual = fechaActual.getFullYear();

    // Buscar si existe una nómina de este trabajador para este mes
    const nominaMesActual = nominas.find(nomina => {
      const fechaNomina = new Date(nomina.fecha);
      return nomina.trabajador.id === trabajadorId &&
             fechaNomina.getMonth() + 1 === mesActual &&
             fechaNomina.getFullYear() === anioActual;
    });

    if (!nominaMesActual) {
      return false; // No hay nómina para este mes
    }

    // Verificar si ya existe un pago para esta nómina
    const yaExistePago = pagos.some(pago => 
      pago.nomina.id === nominaMesActual.id
    );

    return yaExistePago;
  };

  const generarCuotasAutomaticas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🚀 Generando cuotas automáticas...');
      
      // Usar los usuarios USER_CASUAL que ya están cargados en resumenResidentes
      let usuarios: any[] = [];
      
      if (resumenResidentes && resumenResidentes.residentes) {
        // Usar los usuarios del resumen ya cargado
        usuarios = resumenResidentes.residentes.map((residente: any) => ({
          id: residente.usuario.id,
          firstName: residente.usuario.name.split(' ')[0] || residente.usuario.name,
          lastName: residente.usuario.name.split(' ').slice(1).join(' ') || '',
          email: residente.usuario.email
        }));
        console.log('📋 Usando usuarios del resumen cargado:', usuarios.length);
      } else {
        // Si no hay resumen cargado, cargar usuarios directamente
        console.log('📡 Cargando usuarios USER_CASUAL...');
        
        let allUsers: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch(`https://citylights-gateway-production.up.railway.app/api/proxy/login/users/list?page=${page}&limit=10`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.users && data.data.users.length > 0) {
              allUsers = [...allUsers, ...data.data.users];
              page++;
              if (data.data.users.length < 10) hasMore = false;
            } else {
              hasMore = false;
            }
          } else {
            console.error('❌ Error obteniendo usuarios:', response.status);
            hasMore = false;
          }
        }
        
        usuarios = allUsers.filter((user: any) => user.role === 'USER_CASUAL');
        console.log(`✅ Usuarios USER_CASUAL obtenidos: ${usuarios.length}`);
      }

      if (usuarios.length === 0) {
        alert('⚠️ No se encontraron usuarios USER_CASUAL para generar cuotas');
        return;
      }

      // Crear las cuotas para cada usuario (solo si no existen)
      let cuotasCreadas = 0;
      let cuotasExistentes = 0;
      const fecha = new Date();
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;

      console.log(`📅 Generando cuotas para ${mes}/${anio}`);

      for (const usuario of usuarios) {
        try {
          const response = await fetch('https://citylights-gateway-production.up.railway.app/api/proxy/nomina/pago-mensual/residente/crear-cuota', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: usuario.id.toString(),
              userName: `${usuario.firstName} ${usuario.lastName}`.trim(),
              userEmail: usuario.email
            })
          });

          if (response.ok) {
            cuotasCreadas++;
            console.log(`✅ Cuota creada para ${usuario.firstName} ${usuario.lastName}`);
          } else {
            const error = await response.json();
            if (error.message && (error.message.includes('ya existe') || error.message.includes('already exists'))) {
              cuotasExistentes++;
              console.log(`ℹ️ Cuota ya existe para ${usuario.firstName} ${usuario.lastName}`);
            } else {
              console.error(`❌ Error creando cuota para ${usuario.firstName} ${usuario.lastName}:`, error);
            }
          }
        } catch (error) {
          console.error(`❌ Error de conexión para ${usuario.firstName} ${usuario.lastName}:`, error);
        }
      }

      // Mostrar resultado
      if (cuotasCreadas === 0 && cuotasExistentes > 0) {
        // Todas las cuotas ya existían
        alert(`ℹ️ Las cuotas del mes ${mes}/${anio} ya fueron generadas anteriormente.\n\n📊 Resumen:\n• ${usuarios.length} residentes\n• ${cuotasExistentes} cuotas ya existían\n• 0 cuotas nuevas creadas`);
      } else if (cuotasCreadas > 0) {
        // Se crearon nuevas cuotas
        alert(`✅ Cuotas generadas exitosamente para ${mes}/${anio}!\n\n📊 Resumen:\n• ${usuarios.length} residentes\n• ${cuotasCreadas} cuotas nuevas creadas\n• ${cuotasExistentes} cuotas ya existían`);
      } else {
        // Caso extraño
        alert(`⚠️ No se pudieron crear cuotas. Revisa la consola para más detalles.`);
      }
        
      // Recargar datos para mostrar las cuotas
      cargarDatos();
      
    } catch (error) {
      console.error('❌ Error de conexión al generar cuotas:', error);
      alert('❌ Error de conexión al generar cuotas. Revisa la consola para más detalles.');
    }
  };

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
              <button
                onClick={() => setActiveTab('cuotas')}
                className={`px-6 py-3 font-medium ${activeTab === 'cuotas' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                🏠 Cuotas Residentes
              </button>
              <button
                onClick={() => setActiveTab('morosidad')}
                className={`px-6 py-3 font-medium ${activeTab === 'morosidad' 
                  ? 'border-b-2 border-red-500 text-red-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                🚨 Morosidad
              </button>
              <button
                onClick={() => setActiveTab('residentes')}
                className={`px-6 py-3 font-medium ${activeTab === 'residentes' 
                  ? 'border-b-2 border-green-500 text-green-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                👥 Residentes
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
                              {trabajadorYaPagadoEsteMes(trabajador.id) ? (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Pagado este mes
                                </span>
                              ) : (
                                <button 
                                  onClick={() => pagarTrabajador(trabajador)}
                                  className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 flex items-center"
                                  title="Pagar con Stripe"
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Pagar
                                </button>
                              )}
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

            {/* Tab Cuotas de Residentes */}
            {activeTab === 'cuotas' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">🏠 Cuotas Mensuales de Residentes</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={generarCuotasAutomaticas}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Generar Cuotas del Mes
                    </button>
                    <button
                      onClick={() => crearCuotaResidente('user1', 'Juan Ejemplo', 'juan@example.com')}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Cuota Ejemplo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Total Cuotas</h3>
                    <p className="text-2xl font-bold text-blue-600">{cuotasResidentes.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Pagadas</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {cuotasResidentes.filter(c => c.estado === 'PAGADO').length}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-800">Pendientes</h3>
                    <p className="text-2xl font-bold text-red-600">
                      {cuotasResidentes.filter(c => c.estado !== 'PAGADO').length}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Residente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota Base</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Morosidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cuotasResidentes.map((cuota) => (
                        <tr key={cuota.id}>
                          <td className="px-6 py-4 text-sm">
                            <div>
                              <div className="font-medium text-gray-900">{cuota.userName}</div>
                              <div className="text-gray-500 text-xs">{cuota.userEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {cuota.mes.toString().padStart(2, '0')}/{cuota.anio}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ${cuota.monto.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {cuota.montoMorosidad > 0 ? (
                              <span className="text-red-600 font-medium">
                                +${cuota.montoMorosidad.toFixed(2)}
                                <br />
                                <span className="text-xs text-gray-500">
                                  ({cuota.diasMorosidad} días)
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            ${cuota.montoTotal.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              cuota.estado === 'PAGADO' 
                                ? 'bg-green-100 text-green-800'
                                : cuota.estado === 'MOROSO'
                                ? 'bg-red-100 text-red-800'
                                : cuota.estado === 'VENCIDO'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {cuota.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(cuota.fechaVencimiento).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm space-x-2">
                            {cuota.estado !== 'PAGADO' && user?.role === 'USER_CASUAL' && (
                              <button
                                onClick={() => pagarCuotaResidente(cuota.userId, cuota.userName, cuota.userEmail)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 flex items-center"
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pagar
                              </button>
                            )}
                            {cuota.estado !== 'PAGADO' && user?.role !== 'USER_CASUAL' && (
                              <span className="text-gray-500 text-xs">Solo residentes pueden pagar</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {cuotasResidentes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>No hay cuotas de residentes registradas</p>
                      <p className="text-sm">Las cuotas se generan automáticamente cada mes</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Morosidad */}
            {activeTab === 'morosidad' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">🚨 Gestión de Morosidad</h2>
                  <button
                    onClick={verificarMorosidad}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Verificar Morosidad
                  </button>
                </div>

                {resumenMorosidad && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-800">Cuotas Morosas</h3>
                      <p className="text-2xl font-bold text-red-600">{resumenMorosidad.totalCuotasMorosas}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-orange-800">Recargos Totales</h3>
                      <p className="text-2xl font-bold text-orange-600">
                        ${resumenMorosidad.montoTotalMorosidad.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-purple-800">Monto Total</h3>
                      <p className="text-2xl font-bold text-purple-600">
                        ${resumenMorosidad.montoTotalAPagar.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800">Promedio Días</h3>
                      <p className="text-2xl font-bold text-gray-600">
                        {resumenMorosidad.promedioeDiasMorosidad} días
                      </p>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Residente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días de Retraso</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota Original</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recargo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total a Pagar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {resumenMorosidad?.detallesCuotas.map((cuota) => (
                        <tr key={cuota.id} className="bg-red-50">
                          <td className="px-6 py-4 text-sm">
                            <div>
                              <div className="font-medium text-gray-900">{cuota.userName}</div>
                              <div className="text-gray-500 text-xs">{cuota.userEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {cuota.mes.toString().padStart(2, '0')}/{cuota.anio}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                              {cuota.diasMorosidad} días
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ${cuota.monto.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="text-red-600 font-semibold">
                              +${cuota.montoMorosidad.toFixed(2)}
                              <br />
                              <span className="text-xs text-gray-500">
                                ({cuota.porcentajeMorosidad}%)
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-red-900">
                            ${cuota.montoTotal.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {user?.role === 'USER_CASUAL' ? (
                              <button
                                onClick={() => pagarCuotaResidente(cuota.userId, cuota.userName, cuota.userEmail)}
                                className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 flex items-center"
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pagar Ahora
                              </button>
                            ) : (
                              <span className="text-gray-500 text-xs">Solo residentes pueden pagar</span>
                            )}
                          </td>
                        </tr>
                      )) || []}
                    </tbody>
                  </table>
                  
                  {!resumenMorosidad || resumenMorosidad.totalCuotasMorosas === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>No hay cuotas con morosidad actualmente</p>
                      <p className="text-sm">¡Excelente! Todos los residentes están al día</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Tab Residentes - Dashboard de Usuarios USER_CASUAL */}
            {activeTab === 'residentes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard de Residentes</h2>
                  <button
                    onClick={() => cargarDatos()}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Actualizar
                  </button>
                </div>

                {/* Estadísticas del Mes Actual */}
                {resumenResidentes && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Total Residentes</p>
                          <p className="text-2xl font-bold text-blue-600">{resumenResidentes.estadisticas.totalResidentes}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Pagados</p>
                          <p className="text-2xl font-bold text-green-600">{resumenResidentes.estadisticas.pagados}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-yellow-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Pendientes</p>
                          <p className="text-2xl font-bold text-yellow-600">{resumenResidentes.estadisticas.pendientes}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Receipt className="h-8 w-8 text-red-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Morosos</p>
                          <p className="text-2xl font-bold text-red-600">{resumenResidentes.estadisticas.morosos}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Residentes */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Residentes y Estado de Pagos - {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Residente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado de Pago</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Morosidad</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {resumenResidentes?.residentes?.map((residente: any, index: number) => (
                          <tr key={residente.usuario.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-gray-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{residente.usuario.name}</div>
                                  <div className="text-sm text-gray-500">ID: {residente.usuario.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {residente.usuario.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                residente.estadoPago === 'PAGADO' ? 'bg-green-100 text-green-800' :
                                residente.estadoPago === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                residente.estadoPago === 'MOROSO' ? 'bg-red-100 text-red-800' :
                                residente.estadoPago === 'SIN_CUOTA' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {residente.estadoPago === 'SIN_CUOTA' ? 'Sin Cuota' : residente.estadoPago}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${residente.montoAPagar.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {residente.esMoroso ? (
                                <span className="text-red-600 font-bold">{residente.diasMorosidad} días</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                              {residente.estadoPago === 'SIN_CUOTA' && (
                                <button
                                  onClick={() => crearCuotaResidente(residente.usuario.id.toString(), residente.usuario.name, residente.usuario.email)}
                                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 flex items-center"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Crear Cuota
                                </button>
                              )}
                              {(residente.estadoPago === 'PENDIENTE' || residente.estadoPago === 'VENCIDO' || residente.estadoPago === 'MOROSO') && (
                                <button
                                  onClick={() => pagarCuotaResidente(residente.usuario.id, residente.usuario.name, residente.usuario.email)}
                                  className={`text-white px-3 py-1 rounded text-xs hover:opacity-90 flex items-center ${
                                    residente.estadoPago === 'MOROSO' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                                  }`}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {residente.estadoPago === 'MOROSO' ? 'Pagar con Recargo' : 'Pagar'}
                                </button>
                              )}
                              {residente.estadoPago === 'PAGADO' && (
                                <span className="text-green-600 font-medium text-xs">✓ Pagado</span>
                              )}
                            </td>
                          </tr>
                        )) || []}
                      </tbody>
                    </table>
                    
                    {(!resumenResidentes || !resumenResidentes.residentes || resumenResidentes.residentes.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>No se encontraron residentes</p>
                        <p className="text-sm">Verifica la conexión con el microservicio de login</p>
                      </div>
                    )}
                  </div>
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