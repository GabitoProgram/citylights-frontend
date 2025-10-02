import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  Filter,
  RefreshCw,
  Building,
  Home,
  CreditCard,
  Receipt,
  Settings,
  Shield,
  UserPlus,
  Crown,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';

interface IngresoAreaComun {
  id: number;
  nombre: string;
  totalIngresos: number;
  cantidadReservas: number;
  ingresoPromedio: number;
}

interface EgresoEmpleado {
  id: number;
  nombre: string;
  tipo: string;
  totalPagado: number;
  cantidadPagos: number;
  sueldoPromedio: number;
}

interface ResumenFinanciero {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  crecimientoIngresos: number;
  crecimientoEgresos: number;
  areasActivas?: number;
}

export default function ReportesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estados para los datos
  const [ingresosAreas, setIngresosAreas] = useState<IngresoAreaComun[]>([]);
  const [egresosEmpleados, setEgresosEmpleados] = useState<EgresoEmpleado[]>([]);
  const [resumenFinanciero, setResumenFinanciero] = useState<ResumenFinanciero>({
    totalIngresos: 0,
    totalEgresos: 0,
    balance: 0,
    crecimientoIngresos: 0,
    crecimientoEgresos: 0,
    areasActivas: 0
  });
  
  // Estados para filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);

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
    { id: 'departamentos', name: 'Gestión de Departamentos', icon: Building, path: '/departamentos' },
    { id: 'reservas', name: 'Todas las Reservas', icon: Calendar, path: '/reservas' },
    { id: 'usuarios', name: 'Gestión de Usuarios', icon: Users, path: '/usuarios' },
    { id: 'crear-admin', name: 'Crear Administradores', icon: UserPlus, path: '/crear-admin' },
    { id: 'roles', name: 'Gestión de Roles', icon: Shield, path: '/roles' },
    { id: 'pagos', name: 'Sistema de Pagos', icon: CreditCard, path: '/pagos' },
    { id: 'facturas', name: 'Todas las Facturas', icon: Receipt, path: '/facturas' },
    { id: 'reportes', name: 'Reportes Avanzados', icon: BarChart3, path: '/reportes' },
    { id: 'configuracion', name: 'Configuración Sistema', icon: Settings, path: '/configuracion' },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      cargarDatos();
    }
  }, [user, navigate]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar datos de ingresos (áreas comunes)
      await cargarIngresosAreas();
      
      // Cargar datos de egresos (empleados)
      await cargarEgresosEmpleados();
      
    } catch (error) {
      console.error('Error cargando datos de reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarIngresosAreas = async () => {
    try {
      console.log('📊 [REPORTES] Cargando ingresos por áreas...');
      
      // Obtener todas las reservas con sus pagos y áreas usando el API service
      const reservas = await apiService.getReportesIngresos();
      console.log('🔍 [REPORTES] Reservas obtenidas:', reservas.length);
      
      // Procesar datos para obtener ingresos REALES por área común
      // Solo incluir reservas CONFIRMADAS con pagos ACEPTADOS
      const ingresosPorArea = reservas
        .filter((reserva: any) => {
          const reservaConfirmada = reserva.estado === 'CONFIRMED';
          const tienePagosAceptados = reserva.pagosReserva && 
            reserva.pagosReserva.some((pago: any) => pago.estado === 'ACCEPTED');
          
          console.log(`📊 Reserva ${reserva.id}: confirmada=${reservaConfirmada}, pagos aceptados=${tienePagosAceptados}`);
          return reservaConfirmada && tienePagosAceptados;
        })
        .reduce((acc: any, reserva: any) => {
          const areaId = reserva.area?.id || reserva.areaId;
          const areaNombre = reserva.area?.nombre || 'Área Desconocida';
          
          // Sumar solo los pagos que están ACCEPTED
          const montosPagados = reserva.pagosReserva
            .filter((pago: any) => pago.estado === 'ACCEPTED')
            .reduce((sum: number, pago: any) => sum + pago.monto, 0);
          
          if (!acc[areaId]) {
            acc[areaId] = {
              id: areaId,
              nombre: areaNombre,
              totalIngresos: 0,
              cantidadReservas: 0,
              ingresoPromedio: 0
            };
          }
          
          acc[areaId].totalIngresos += montosPagados;
          acc[areaId].cantidadReservas += 1;
          
          return acc;
        }, {});
      
      // Calcular promedio y convertir a array
      const ingresosArray = Object.values(ingresosPorArea).map((area: any) => ({
        ...area,
        ingresoPromedio: area.cantidadReservas > 0 ? area.totalIngresos / area.cantidadReservas : 0
      }));
      
      console.log('💰 [REPORTES] Ingresos por área procesados:', ingresosArray);
      setIngresosAreas(ingresosArray);
      
      // Actualizar resumen financiero con el total de ingresos
      const totalIngresos = ingresosArray.reduce((sum: number, area: any) => sum + area.totalIngresos, 0);
      setResumenFinanciero(prev => ({ 
        ...prev, 
        totalIngresos,
        balance: totalIngresos - prev.totalEgresos
      }));
      
      // También actualizar áreas activas
      await cargarAreasActivas();
      
    } catch (error) {
      console.error('❌ [REPORTES] Error cargando ingresos por áreas:', error);
    }
  };

  const cargarEgresosEmpleados = async () => {
    try {
      console.log('📊 [REPORTES] Cargando egresos por empleados...');
      
      // Primero, obtener estadísticas de debug
      try {
        const debugInfo = await apiService.getDebugEstadosPagos();
        console.log('🔍 [REPORTES] INFO DEBUG - Estados de pagos:', debugInfo);
      } catch (debugError) {
        console.log('⚠️ [REPORTES] No se pudo obtener debug info:', debugError);
      }
      
      // Obtener todos los pagos de nómina usando el API service
      const pagos = await apiService.getReportesEgresos();
      console.log('🔍 [REPORTES] Pagos obtenidos:', pagos.length);
      console.log('🔍 [REPORTES] Todos los pagos:', pagos);
      
      if (pagos.length > 0) {
        console.log('🔍 [REPORTES] Primer pago completo:', JSON.stringify(pagos[0], null, 2));
        console.log('🔍 [REPORTES] Estados disponibles:', pagos.map((p: any) => p.estado));
      }
      
      // Procesar datos para obtener egresos REALES por empleado
      // Ampliar los criterios de estado para incluir más opciones
      const egresosPorEmpleado = pagos
        .filter((pago: any) => {
          // Solo incluir pagos realmente completados/confirmados
          const estadosValidos = ['COMPLETADO', 'PAGADO', 'COMPLETADA', 'CONFIRMADO', 'PROCESADO', 'EXITOSO'];
          const pagoCompletado = estadosValidos.includes(pago.estado?.toUpperCase()) || pago.pagado === true;
          
          // Comentar estos logs cuando ya no los necesites
          // console.log(`💸 Pago ${pago.id}:`);
          // console.log(`   - Estado: ${pago.estado}`);
          // console.log(`   - Trabajador: ${pago.nomina?.trabajador?.nombre || 'No disponible'}`);
          
          return pagoCompletado;
        })
        .reduce((acc: any, pago: any) => {
          const empleadoId = pago.nomina?.trabajador?.id || pago.trabajadorId;
          const empleadoNombre = pago.nomina?.trabajador?.nombre || 'Empleado Desconocido';
          const empleadoTipo = pago.nomina?.trabajador?.tipo || 'Empleado';
          const monto = pago.monto || 0;
          
          console.log(`✅ Procesando pago válido: ${empleadoNombre} - $${monto}`);
          
          if (!acc[empleadoId]) {
            acc[empleadoId] = {
              id: empleadoId,
              nombre: empleadoNombre,
              tipo: empleadoTipo,
              totalPagado: 0,
              cantidadPagos: 0,
              sueldoPromedio: 0
            };
          }
          
          acc[empleadoId].totalPagado += monto;
          acc[empleadoId].cantidadPagos += 1;
          
          return acc;
        }, {});
      
      // Calcular promedio y convertir a array
      const egresosArray = Object.values(egresosPorEmpleado).map((empleado: any) => ({
        ...empleado,
        sueldoPromedio: empleado.cantidadPagos > 0 ? empleado.totalPagado / empleado.cantidadPagos : 0
      }));
      
      console.log('💸 [REPORTES] Egresos por empleado procesados:', egresosArray);
      console.log('💸 [REPORTES] Cantidad de empleados con pagos:', egresosArray.length);
      setEgresosEmpleados(egresosArray);
      
      // Actualizar resumen financiero con el total de egresos
      const totalEgresos = egresosArray.reduce((sum: number, empleado: any) => sum + empleado.totalPagado, 0);
      console.log('💰 [REPORTES] Total egresos calculado:', totalEgresos);
      
      setResumenFinanciero(prev => ({ 
        ...prev, 
        totalEgresos,
        balance: prev.totalIngresos - totalEgresos
      }));
      
    } catch (error: any) {
      console.error('❌ [REPORTES] Error cargando egresos por empleados:', error);
      console.error('❌ [REPORTES] Detalles del error:', error.response?.data);
    }
  };

  const cargarAreasActivas = async () => {
    try {
      console.log('📊 [REPORTES] Cargando áreas activas...');
      
      // Obtener todas las áreas comunes usando el API service
      const areas = await apiService.getReportesAreasActivas();
      console.log('🏢 [REPORTES] Áreas obtenidas:', areas.length);
      
      // Contar áreas que tienen al menos una reserva
      const reservas = await apiService.getReportesIngresos();
      const areasConReservas = new Set(reservas.map((reserva: any) => reserva.areaId || reserva.area?.id));
      const areasActivasCount = areas.filter((area: any) => areasConReservas.has(area.id)).length;
      
      console.log('🏢 [REPORTES] Áreas activas:', areasActivasCount);
      
      // Actualizar resumen financiero con áreas activas
      setResumenFinanciero(prev => ({ 
        ...prev, 
        areasActivas: areasActivasCount
      }));
      
    } catch (error) {
      console.error('❌ [REPORTES] Error cargando áreas activas:', error);
    }
  };

  const exportarPDF = async () => {
    try {
      setExportandoPDF(true);
      console.log('📄 [FRONTEND] Iniciando generación de PDF...');
      
      // Obtener datos del backend
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      
      const response = await fetch(`https://citylights-gateway-production.up.railway.app/api/proxy/nomina/reportes/datos?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener datos del reporte');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Error en la respuesta del servidor');
      }

      const datos = result.data;
      console.log('📄 [FRONTEND] Datos obtenidos:', datos);

      // Generar PDF con jsPDF
      const doc = new jsPDF();
      
      // Configurar fuente y título
      doc.setFontSize(20);
      doc.setTextColor(75, 0, 130); // Púrpura
      doc.text('REPORTE FINANCIERO CITYLIGHTS', 20, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Período: ${datos.resumen.periodo}`, 20, 35);
      doc.text(`Generado: ${datos.resumen.fechaGeneracion}`, 20, 42);

      // Resumen financiero
      doc.setFontSize(16);
      doc.setTextColor(75, 0, 130);
      doc.text('RESUMEN FINANCIERO', 20, 58);
      
      const resumenData = [
        ['Total Ingresos', `$${datos.resumen.totalIngresos.toLocaleString()}`],
        ['Total Egresos', `$${datos.resumen.totalEgresos.toLocaleString()}`],
        ['Balance', `$${datos.resumen.balance.toLocaleString()}`]
      ];

      autoTable(doc, {
        startY: 65,
        head: [['Concepto', 'Monto']],
        body: resumenData,
        theme: 'grid',
        headStyles: { fillColor: [147, 51, 234] }, // Púrpura
        margin: { left: 20, right: 20 }
      });

      // Tabla de ingresos (solo si hay datos)
      if (datos.ingresos.length > 0) {
        let currentY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setTextColor(75, 0, 130);
        doc.text('INGRESOS POR ÁREA', 20, currentY);

        const ingresosData = datos.ingresos.map((ing: any) => [
          ing.nombre,
          ing.cantidadReservas.toString(),
          `$${ing.totalIngresos.toLocaleString()}`
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Área Común', 'Reservas', 'Total Ingresos']],
          body: ingresosData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] }, // Verde
          margin: { left: 20, right: 20 }
        });
      }

      // Tabla de egresos
      if (datos.egresos.length > 0) {
        let currentY = datos.ingresos.length > 0 ? (doc as any).lastAutoTable.finalY + 15 : 100;
        doc.setFontSize(14);
        doc.setTextColor(75, 0, 130);
        doc.text('EGRESOS POR EMPLEADO', 20, currentY);

        const egresosData = datos.egresos.map((egr: any) => [
          egr.nomina?.trabajador?.nombre || 'N/A',
          egr.nomina?.trabajador?.tipo || 'N/A',
          new Date(egr.fechaPago).toLocaleDateString('es-ES'),
          `$${egr.monto.toLocaleString()}`
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Empleado', 'Tipo', 'Fecha Pago', 'Monto']],
          body: egresosData,
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68] }, // Rojo
          margin: { left: 20, right: 20 }
        });
      }

      // Descargar PDF
      const filename = `reporte-financiero-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      console.log('✅ [FRONTEND] PDF generado y descargado exitosamente');
      
    } catch (error) {
      console.error('❌ [FRONTEND] Error exportando a PDF:', error);
      alert('Error al generar el reporte PDF. Inténtalo de nuevo.');
    } finally {
      setExportandoPDF(false);
    }
  };

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);
      console.log('📊 [FRONTEND] Iniciando generación de Excel...');
      
      // Obtener datos del backend
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      
      const response = await fetch(`https://citylights-gateway-production.up.railway.app/api/proxy/nomina/reportes/datos?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener datos del reporte');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Error en la respuesta del servidor');
      }

      const datos = result.data;
      console.log('📊 [FRONTEND] Datos obtenidos:', datos);

      // Crear workbook de Excel
      const workbook = XLSX.utils.book_new();

      // Hoja de resumen
      const resumenData = [
        ['REPORTE FINANCIERO CITYLIGHTS'],
        [`Período: ${datos.resumen.periodo}`],
        [`Generado: ${datos.resumen.fechaGeneracion}`],
        [],
        ['RESUMEN FINANCIERO'],
        ['Concepto', 'Monto'],
        ['Total Ingresos', datos.resumen.totalIngresos],
        ['Total Egresos', datos.resumen.totalEgresos],
        ['Balance', datos.resumen.balance]
      ];

      const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

      // Hoja de ingresos (solo si hay datos)
      if (datos.ingresos.length > 0) {
        const ingresosData = [
          ['Área Común', 'Cantidad Reservas', 'Total Ingresos', 'Ingreso Promedio'],
          ...datos.ingresos.map((ing: any) => [
            ing.nombre,
            ing.cantidadReservas,
            ing.totalIngresos,
            ing.ingresoPromedio
          ])
        ];

        const ingresosSheet = XLSX.utils.aoa_to_sheet(ingresosData);
        XLSX.utils.book_append_sheet(workbook, ingresosSheet, 'Ingresos');
      }

      // Hoja de egresos
      if (datos.egresos.length > 0) {
        const egresosData = [
          ['Empleado', 'Tipo', 'Fecha Pago', 'Monto', 'Nómina ID'],
          ...datos.egresos.map((egr: any) => [
            egr.nomina?.trabajador?.nombre || 'N/A',
            egr.nomina?.trabajador?.tipo || 'N/A',
            new Date(egr.fechaPago).toLocaleDateString('es-ES'),
            egr.monto,
            egr.nomina?.id || 'N/A'
          ])
        ];

        const egresosSheet = XLSX.utils.aoa_to_sheet(egresosData);
        XLSX.utils.book_append_sheet(workbook, egresosSheet, 'Egresos');
      }

      // Descargar Excel
      const filename = `reporte-financiero-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      console.log('✅ [FRONTEND] Excel generado y descargado exitosamente');
      
    } catch (error) {
      console.error('❌ [FRONTEND] Error exportando a Excel:', error);
      alert('Error al generar el reporte Excel. Inténtalo de nuevo.');
    } finally {
      setExportandoExcel(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
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
            <div className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
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
                    item.id === 'reportes'
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
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 h-6 w-6 text-purple-600" />
            Reportes Financieros
          </h1>
          <div className="flex items-center space-x-4">
            {/* Botones de exportación */}
            <button
              onClick={exportarPDF}
              disabled={exportandoPDF || loading}
              className={`flex items-center px-4 py-2 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                exportandoPDF || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transform hover:scale-105'
              }`}
            >
              {exportandoPDF ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Descargar PDF
                </>
              )}
            </button>
            <button
              onClick={exportarExcel}
              disabled={exportandoExcel || loading}
              className={`flex items-center px-4 py-2 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                exportandoExcel || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105'
              }`}
            >
              {exportandoExcel ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generando Excel...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Descargar Excel
                </>
              )}
            </button>
            <button
              onClick={cargarDatos}
              disabled={loading}
              className={`flex items-center px-4 py-2 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
              }`}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
            <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Cargando datos financieros...</span>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Análisis Financiero - {user?.firstName}
                </h2>
                <p className="text-gray-600">
                  Reporte completo de ingresos y egresos del sistema CityLights
                </p>
              </div>

              {/* Resumen financiero */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Total Ingresos</h3>
                      <p className="text-2xl font-bold">${resumenFinanciero.totalIngresos.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-lg shadow text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Total Egresos</h3>
                      <p className="text-2xl font-bold">${resumenFinanciero.totalEgresos.toFixed(2)}</p>
                    </div>
                    <TrendingDown className="h-8 w-8" />
                  </div>
                </div>

                <div className={`bg-gradient-to-br ${resumenFinanciero.balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} p-6 rounded-lg shadow text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Balance</h3>
                      <p className="text-2xl font-bold">${resumenFinanciero.balance.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Áreas Activas</h3>
                      <p className="text-2xl font-bold">{resumenFinanciero.areasActivas || 0}</p>
                    </div>
                    <Building2 className="h-8 w-8" />
                  </div>
                </div>
              </div>

              {/* Sección de Ingresos */}
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="mr-2 h-6 w-6 text-green-600" />
                    Ingresos por Área Común
                  </h2>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Área Común
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Ingresos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad Reservas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ingreso Promedio
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ingresosAreas.map((area) => (
                          <tr key={area.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{area.nombre}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-green-600 font-semibold">${area.totalIngresos.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{area.cantidadReservas}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">${area.ingresoPromedio.toFixed(2)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sección de Egresos */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <TrendingDown className="mr-2 h-6 w-6 text-red-600" />
                    Egresos por Empleado
                  </h2>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Empleado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Pagado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad Pagos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Promedio por Pago
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {egresosEmpleados.map((empleado) => (
                          <tr key={empleado.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Users className="h-5 w-5 text-gray-400 mr-2" />
                                <div className="text-sm font-medium text-gray-900">{empleado.nombre}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                {empleado.tipo}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-red-600 font-semibold">${empleado.totalPagado.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{empleado.cantidadPagos}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">${empleado.sueldoPromedio.toFixed(2)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}