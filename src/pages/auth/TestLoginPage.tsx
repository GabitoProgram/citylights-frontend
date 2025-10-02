import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function TestLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setResponse(null);

    try {
      // Prueba directa con fetch
      const res = await fetch('http://127.0.0.1:3000/api/proxy/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      setResponse({ status: res.status, data });

      if (!res.ok) {
        setError(data.message || 'Error en el login');
      } else {
        setError('');
        // Guardar tokens si el login es exitoso
        if (data.data?.access_token) {
          localStorage.setItem('access_token', data.data.access_token);
          localStorage.setItem('refresh_token', data.data.refresh_token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          alert('Login exitoso! Revisa la consola.');
        }
      }
    } catch (err: any) {
      console.error('Error de conexión:', err);
      setError(`Error de conexión: ${err.message}`);
      setResponse({ error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const testConnectivity = async () => {
    try {
      console.log('🔄 Intentando conectar a:', 'http://127.0.0.1:3000/api/proxy/health');
      
      const res = await fetch('http://127.0.0.1:3000/api/proxy/health', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('✅ Respuesta recibida:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      });
      
      const data = await res.json();
      console.log('📦 Datos:', data);
      
      setResponse({ connectivity: true, health: data });
      setError('');
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      console.error('❌ Error name:', err.name);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      
      setError(`Error de conectividad: ${err.message}`);
      setResponse({ connectivity: false, error: err.message });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <Building2 className="h-12 w-12 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white">Test Login</h2>
            <p className="mt-2 text-blue-100">Prueba de conectividad y login</p>
          </div>

          {/* Botón de prueba de conectividad */}
          <button
            onClick={testConnectivity}
            className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Probar Conectividad Gateway
          </button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-blue-600 font-bold py-2 px-4 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-blue-100 hover:text-white">
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>

          {/* Mostrar respuesta para debugging */}
          {response && (
            <div className="mt-6 p-4 bg-white rounded-md">
              <h3 className="font-bold text-gray-800 mb-2">Respuesta del servidor:</h3>
              <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho con información */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h2 className="text-3xl font-bold mb-6">Página de Prueba</h2>
            <div className="space-y-4 text-left">
              <p>✅ Esta es una página de prueba para verificar:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>Conectividad con el Gateway (puerto 3000)</li>
                <li>Funcionalidad del login</li>
                <li>Respuestas del servidor</li>
                <li>Manejo de errores</li>
              </ul>
              <p className="text-yellow-400 mt-4">
                📝 Nota: Revisa la consola del navegador para más detalles
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}