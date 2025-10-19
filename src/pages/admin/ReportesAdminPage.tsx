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
  LogOut,
  Menu,
  X,
  Bell,
  User,
  AlertTriangle,
  CheckCircle,
  Clock
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

interface PagoBookingDaño {
  id: number;
  reservaId: number;
  usuarioId: string;
  nombreUsuario: string;
  emailUsuario: string;
  descripcionDaño: string;
  montoDaño: number;
  fechaDaño: string;
  estado: 'PENDIENTE' | 'PAGADO';
  fechaPago?: string;
  areaComun: string;
}

export default function ReportesAdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estados para datos
  const [loading, setLoading] = useState(false);
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
  
  // Estados para las nuevas secciones
  const [cuotasResidentes, setCuotasResidentes] = useState<CuotaResidente[]>([]);
  const [resumenMorosidad, setResumenMorosidad] = useState<ResumenMorosidad | null>(null);
  const [pagosBookingDaños, setPagosBookingDaños] = useState<PagoBookingDaño[]>([]);
  
  // Estados para filtros y exportación
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'areas-comunes', name: 'Gestionar Áreas Comunes', icon: Building2, path: '/areas-comunes' },
    { id: 'reservas', name: 'Todas las Reservas', icon: Calendar, path: '/reservas' },
    { id: 'usuarios-casuales', name: 'Usuarios Casuales', icon: Users, path: '/usuarios' },
    { id: 'pagos', name: 'Gestión de Pagos', icon: CreditCard, path: '/pagos' },
    { id: 'facturas', name: 'Todas las Facturas', icon: Receipt, path: '/facturas' },
    { id: 'reportes', name: 'Reportes', icon: BarChart3, path: '/reportes-admin' },
    { id: 'configuracion', name: 'Configuración', icon: Settings, path: '/configuracion' },
  ];

  // Función para cargar todos los datos
  const cargarDatos = async () => {
    console.log('🚀 [REPORTES ADMIN] Iniciando carga completa de datos...');
    setLoading(true);
    
    try {
      // Cargar ingresos y egresos existentes
      console.log('1️⃣ [REPORTES ADMIN] Cargando ingresos y egresos...');
      const [ingresosResponse, egresosResponse] = await Promise.all([
        apiService.get('/api/proxy/booking-service/reportes/ingresos-areas'),
        apiService.get('/api/proxy/nomina/reportes/egresos-empleados')
      ]);

      if (ingresosResponse.data && egresosResponse.data) {
        setIngresosAreas(ingresosResponse.data);
        setEgresosEmpleados(egresosResponse.data);

        // Calcular resumen financiero
        const totalIngresos = ingresosResponse.data.reduce((sum: number, area: IngresoAreaComun) => sum + area.totalIngresos, 0);
        const totalEgresos = egresosResponse.data.reduce((sum: number, empleado: EgresoEmpleado) => sum + empleado.totalPagado, 0);
        
        setResumenFinanciero({
          totalIngresos,
          totalEgresos,
          balance: totalIngresos - totalEgresos,
          crecimientoIngresos: 0,
          crecimientoEgresos: 0,
          areasActivas: ingresosResponse.data.length
        });

        console.log('✅ [REPORTES ADMIN] Ingresos/Egresos cargados exitosamente');
      }

      // Cargar datos de cuotas de residentes - DIRECTO COMO EN PAGOSPAGE
      console.log('3️⃣ [REPORTES ADMIN] Cargando cuotas de residentes...');
      try {
        const token = localStorage.getItem('access_token');
  const responseCuotas = await fetch('http://localhost:3000/api/proxy/nomina/pago-mensual/residentes/historial', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (responseCuotas.ok) {
          const cuotas = await responseCuotas.json();
          console.log('✅ [REPORTES ADMIN] Cuotas cargadas:', cuotas.length);
          setCuotasResidentes(cuotas);
        } else {
          console.error('❌ [REPORTES ADMIN] Error cargando cuotas:', responseCuotas.status);
          setCuotasResidentes([]);
        }
      } catch (errorCuotas) {
        console.error('❌ [REPORTES ADMIN] Error de conexión cuotas:', errorCuotas);
        setCuotasResidentes([]);
      }
      
      // Cargar resumen de morosidad - DIRECTO COMO EN PAGOSPAGE
      console.log('4️⃣ [REPORTES ADMIN] Cargando resumen de morosidad...');
      try {
        const token = localStorage.getItem('access_token');
  const responseMorosidad = await fetch('http://localhost:3000/api/proxy/nomina/pago-mensual/morosidad/resumen', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (responseMorosidad.ok) {
          const resumen = await responseMorosidad.json();
          console.log('✅ [REPORTES ADMIN] Resumen de morosidad cargado:', resumen);
          setResumenMorosidad(resumen);
        } else {
          console.error('❌ [REPORTES ADMIN] Error cargando morosidad:', responseMorosidad.status);
          setResumenMorosidad(null);
        }
      } catch (errorMorosidad) {
        console.error('❌ [REPORTES ADMIN] Error de conexión morosidad:', errorMorosidad);
        setResumenMorosidad(null);
      }

      // Cargar pagos por daños de booking (simulado por ahora)
      console.log('5️⃣ [REPORTES ADMIN] Cargando pagos por daños de booking...');
      setPagosBookingDaños([]);
      console.log('✅ [REPORTES ADMIN] Pagos por daños cargados (vacío por ahora)');
      
    } catch (error) {
      console.error('❌ [REPORTES ADMIN] Error general cargando datos:', error);
    } finally {
      setLoading(false);
      console.log('🏁 [REPORTES ADMIN] Carga de datos completada');
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Funciones de exportación
  const exportarPDF = async () => {
    setExportandoPDF(true);
    try {
      const doc = new jsPDF();
      doc.text('Reporte Financiero CityLights - Admin', 20, 20);
      
      // Resumen financiero
      doc.text('Resumen Financiero:', 20, 40);
      doc.text(`Total Ingresos: $${resumenFinanciero.totalIngresos.toFixed(2)}`, 20, 50);
      doc.text(`Total Egresos: $${resumenFinanciero.totalEgresos.toFixed(2)}`, 20, 60);
      doc.text(`Balance: $${resumenFinanciero.balance.toFixed(2)}`, 20, 70);

      // Tabla de ingresos
      autoTable(doc, {
        head: [['Área Común', 'Total Ingresos', 'Cantidad Reservas', 'Ingreso Promedio']],
        body: ingresosAreas.map(area => [
          area.nombre,
          `$${area.totalIngresos.toFixed(2)}`,
          area.cantidadReservas.toString(),
          `$${area.ingresoPromedio.toFixed(2)}`
        ]),
        startY: 85
      });

      doc.save('reporte-financiero-admin.pdf');
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setExportandoPDF(false);
    }
  };

  const exportarExcel = async () => {
    setExportandoExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      
      // Hoja de ingresos
      const wsIngresos = XLSX.utils.json_to_sheet(ingresosAreas);
      XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos');
      
      // Hoja de egresos
      const wsEgresos = XLSX.utils.json_to_sheet(egresosEmpleados);
      XLSX.utils.book_append_sheet(wb, wsEgresos, 'Egresos');
      
      // Hoja de cuotas
      const wsCuotas = XLSX.utils.json_to_sheet(cuotasResidentes);
      XLSX.utils.book_append_sheet(wb, wsCuotas, 'Cuotas Residentes');
      
      XLSX.writeFile(wb, 'reporte-financiero-admin.xlsx');
    } catch (error) {
      console.error('Error generando Excel:', error);
    } finally {
      setExportandoExcel(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar - PANEL MORADO IGUAL AL DASHBOARD */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-primary-900">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-white mr-2" />
            <span className="text-white text-lg font-semibold">CityLights Admin</span>
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
            <div className="h-10 w-10 bg-yellow-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <div className="text-white text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-yellow-300 text-xs">Administrador</div>
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
                    location.pathname === item.path
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
        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-primary-100 rounded-md hover:bg-primary-700 hover:text-white transition-colors"
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
            Reportes Financieros - Admin
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
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600 text-lg">Cargando datos financieros...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Header de sección mejorado */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Resumen Financiero</h2>
                    <p className="text-gray-600">Vista general de ingresos, egresos y balance - Panel Admin</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-xl">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Cards de resumen mejoradas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold opacity-90">Total Ingresos</h3>
                      <p className="text-3xl font-bold">${resumenFinanciero.totalIngresos.toFixed(2)}</p>
                      <p className="text-sm opacity-75 mt-1">Sistema completo</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <TrendingUp className="h-8 w-8" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold opacity-90">Total Egresos</h3>
                      <p className="text-3xl font-bold">${resumenFinanciero.totalEgresos.toFixed(2)}</p>
                      <p className="text-sm opacity-75 mt-1">Nómina y gastos</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <TrendingDown className="h-8 w-8" />
                    </div>
                  </div>
                </div>

                <div className={`bg-gradient-to-br ${resumenFinanciero.balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-all duration-200`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold opacity-90">Balance</h3>
                      <p className="text-3xl font-bold">${resumenFinanciero.balance.toFixed(2)}</p>
                      <p className="text-sm opacity-75 mt-1">{resumenFinanciero.balance >= 0 ? 'Positivo' : 'Negativo'}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <DollarSign className="h-8 w-8" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold opacity-90">Áreas Activas</h3>
                      <p className="text-3xl font-bold">{resumenFinanciero.areasActivas || 0}</p>
                      <p className="text-sm opacity-75 mt-1">En operación</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <Building2 className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de Ingresos Mejorada */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <div className="bg-green-500 p-2 rounded-lg mr-3">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    Ingresos por Área Común
                    <span className="ml-3 bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                      {ingresosAreas.length} áreas
                    </span>
                  </h2>
                  <p className="text-gray-600 mt-2">Análisis detallado de ingresos por reservas</p>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Área Común
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Ingresos
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad Reservas
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ingreso Promedio
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ingresosAreas.map((area) => (
                          <tr key={area.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="bg-green-100 p-2 rounded-lg mr-3">
                                  <Building className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="text-sm font-medium text-gray-900">{area.nombre}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-green-600">${area.totalIngresos.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                {area.cantidadReservas} reservas
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">${area.ingresoPromedio.toFixed(2)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sección de Egresos Mejorada */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <div className="bg-red-500 p-2 rounded-lg mr-3">
                      <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                    Egresos por Empleado
                    <span className="ml-3 bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                      {egresosEmpleados.length} empleados
                    </span>
                  </h2>
                  <p className="text-gray-600 mt-2">Nómina y pagos a personal</p>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Empleado
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Pagado
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad Pagos
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Promedio por Pago
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {egresosEmpleados.map((empleado) => (
                          <tr key={empleado.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="bg-red-100 p-2 rounded-lg mr-3">
                                  <Users className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="text-sm font-medium text-gray-900">{empleado.nombre}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                                {empleado.tipo}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-red-600">${empleado.totalPagado.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                {empleado.cantidadPagos} pagos
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">${empleado.sueldoPromedio.toFixed(2)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* NUEVA SECCIÓN: CUOTAS DE RESIDENTES */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <div className="bg-blue-500 p-2 rounded-lg mr-3">
                      <Home className="h-6 w-6 text-white" />
                    </div>
                    Cuotas de Residentes
                    <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {cuotasResidentes.length} cuotas
                    </span>
                  </h2>
                  <p className="text-gray-600 mt-2">Control de pagos mensuales de residentes</p>
                </div>
                
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes/Año</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {cuotasResidentes.length > 0 ? cuotasResidentes.map((cuota, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                  <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="font-medium text-gray-900">{cuota.userName}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{cuota.mes}/{cuota.anio}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-bold text-green-600">${(cuota.monto || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                cuota.estado === 'PAGADO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {cuota.estado === 'PAGADO' ? 'Pagado' : 'Pendiente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {cuota.fechaPago ? new Date(cuota.fechaPago).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <Home className="h-12 w-12 text-gray-300 mb-2" />
                                <span>No hay cuotas de residentes registradas</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* NUEVA SECCIÓN: RESUMEN DE MOROSIDAD */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <div className="bg-orange-500 p-2 rounded-lg mr-3">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    Resumen de Morosidad
                  </h2>
                  <p className="text-gray-600 mt-2">Control de pagos vencidos y pendientes</p>
                </div>
                
                {resumenMorosidad ? (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <div className="flex items-center">
                          <div className="bg-red-500 p-3 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-red-800">Cuotas Morosas</p>
                            <p className="text-2xl font-bold text-red-900">{resumenMorosidad.totalCuotasMorosas || 0}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                        <div className="flex items-center">
                          <div className="bg-yellow-500 p-3 rounded-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-yellow-800">Monto Total a Pagar</p>
                            <p className="text-2xl font-bold text-yellow-900">
                              ${(resumenMorosidad.montoTotalAPagar || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                        <div className="flex items-center">
                          <div className="bg-orange-500 p-3 rounded-lg">
                            <Clock className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-orange-800">Promedio Días Morosidad</p>
                            <p className="text-2xl font-bold text-orange-900">{Math.round(resumenMorosidad.promedioeDiasMorosidad || 0)} días</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <div className="flex flex-col items-center">
                      <RefreshCw className="h-12 w-12 text-gray-300 mb-3 animate-spin" />
                      <span className="text-lg">Cargando resumen de morosidad...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* NUEVA SECCIÓN: PAGOS POR DAÑOS DE BOOKING */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <div className="bg-gray-500 p-2 rounded-lg mr-3">
                      <Receipt className="h-6 w-6 text-white" />
                    </div>
                    Pagos por Daños de Booking
                    <span className="ml-3 bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                      {pagosBookingDaños.length} registros
                    </span>
                  </h2>
                  <p className="text-gray-600 mt-2">Seguimiento de daños reportados en reservas</p>
                </div>
                
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserva</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Daño</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pagosBookingDaños.length > 0 ? pagosBookingDaños.map((pago: PagoBookingDaño, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">#{pago.reservaId}</td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center">
                                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                                  <Users className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="font-medium text-gray-900">{pago.nombreUsuario}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-bold text-red-600">
                              ${(pago.montoDaño || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{pago.descripcionDaño || 'Daño reportado'}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                pago.estado === 'PAGADO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {pago.estado === 'PAGADO' ? 'Pagado' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <Receipt className="h-12 w-12 text-gray-300 mb-2" />
                                <span>No hay pagos por daños registrados</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}