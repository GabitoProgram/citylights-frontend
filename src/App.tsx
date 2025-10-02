import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages - Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import TestLoginPage from './pages/auth/TestLoginPage';

// Pages - Shared
import HomePage from './pages/shared/HomePage';
import DashboardPageNew from './pages/shared/DashboardPageNew';

// Pages - Booking
import ReservaExitosaPage from './pages/booking/ReservaExitosaPage';
import ReservasPage from './pages/booking/ReservasPage';

// Pages - Nomina
import PagosPage from './pages/nomina/PagosPage';
import ReportesPage from './pages/nomina/ReportesPage';

// Components
import AreasComunes from './components/AreasComunes/AreasComunes';
import Departamentos from './components/Departamentos/Departamentos';
import Facturas from './components/Facturas/Facturas';
import Layout from './components/Layout/Layout';
import AuthDebug from './components/AuthDebug';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rutas públicas */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/test-login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <TestLoginPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/register" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <RegisterPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/verify-email" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <VerifyEmailPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/forgot-password" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <ForgotPasswordPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reset-password" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <ResetPasswordPage />
                </ProtectedRoute>
              } 
            />

            {/* Rutas protegidas del sistema de reservas */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPageNew />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/areas-comunes" 
              element={
                <ProtectedRoute>
                  <AreasComunes />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reserva-exitosa" 
              element={
                <ProtectedRoute>
                  <ReservaExitosaPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/departamentos" 
              element={
                <ProtectedRoute roles={['SUPER_USER']}>
                  <Layout>
                    <Departamentos />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reservas" 
              element={
                <ProtectedRoute>
                  <ReservasPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/pagos" 
              element={
                <ProtectedRoute roles={['SUPER_USER', 'USER_ADMIN']}>
                  <PagosPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reportes" 
              element={
                <ProtectedRoute roles={['SUPER_USER', 'USER_ADMIN']}>
                  <ReportesPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/facturas" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Facturas />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Rutas de admin (solo USER_ADMIN y SUPER_USER) */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute roles={['USER_ADMIN', 'SUPER_USER']}>
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold mb-4">Panel de Administración</h1>
                      <p className="text-gray-600">Funcionalidad en desarrollo</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } 
            />

            {/* Rutas de super usuario (solo SUPER_USER) */}
            <Route 
              path="/super-admin/*" 
              element={
                <ProtectedRoute roles={['SUPER_USER']}>
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold mb-4">Panel de Super Administrador</h1>
                      <p className="text-gray-600">Funcionalidad en desarrollo</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } 
            />

            {/* Páginas de error y ayuda */}
            <Route 
              path="/help" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="max-w-md w-full mx-4">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                      <div className="text-6xl mb-4">🆘</div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Centro de Ayuda</h1>
                      <div className="space-y-3 text-left">
                        <p><strong>📧 Email:</strong> soporte@citylights.com</p>
                        <p><strong>📞 Teléfono:</strong> +1 (555) 123-4567</p>
                        <p><strong>🕐 Horario:</strong> Lun-Vie 9:00-18:00</p>
                      </div>
                      <button
                        onClick={() => window.history.back()}
                        className="mt-6 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Volver
                      </button>
                    </div>
                  </div>
                </div>
              } 
            />

            <Route 
              path="/forgot-password" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="max-w-md w-full mx-4">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                      <div className="text-6xl mb-4">🔐</div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Recuperar Contraseña</h1>
                      <p className="text-gray-600 mb-6">
                        Funcionalidad en desarrollo. Por favor contacta al administrador.
                      </p>
                      <button
                        onClick={() => window.history.back()}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Volver
                      </button>
                    </div>
                  </div>
                </div>
              } 
            />

            {/* Ruta de debug temporal */}
            <Route 
              path="/debug" 
              element={<AuthDebug />} 
            />

            {/* 404 - Página no encontrada */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="max-w-md w-full mx-4">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                      <div className="text-6xl mb-4">🔍</div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
                      <p className="text-gray-600 mb-6">
                        La página que buscas no existe.
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => window.history.back()}
                          className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Volver
                        </button>
                        <button
                          onClick={() => window.location.href = '/'}
                          className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Ir al Inicio
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
