import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthDebug() {
  const { user, isAuthenticated, isLoading, permissions } = useAuth();

  const storedToken = localStorage.getItem('access_token');
  const storedUser = localStorage.getItem('user');
  const storedRefreshToken = localStorage.getItem('refresh_token');

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Debug de Autenticación</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estado del contexto */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Estado del Contexto Auth</h2>
          <div className="space-y-2">
            <div>
              <strong>isAuthenticated:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isAuthenticated ? 'Sí' : 'No'}
              </span>
            </div>
            <div>
              <strong>isLoading:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {isLoading ? 'Sí' : 'No'}
              </span>
            </div>
            <div>
              <strong>Usuario:</strong>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                {user ? JSON.stringify(user, null, 2) : 'null'}
              </pre>
            </div>
            <div>
              <strong>Permisos:</strong>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                {JSON.stringify(permissions, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Estado del localStorage */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Estado del LocalStorage</h2>
          <div className="space-y-2">
            <div>
              <strong>Token de acceso:</strong>
              <div className="mt-1 p-2 bg-white rounded text-xs break-all">
                {storedToken || 'No guardado'}
              </div>
            </div>
            <div>
              <strong>Token de refresco:</strong>
              <div className="mt-1 p-2 bg-white rounded text-xs break-all">
                {storedRefreshToken || 'No guardado'}
              </div>
            </div>
            <div>
              <strong>Usuario guardado:</strong>
              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                {storedUser || 'No guardado'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de prueba */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Recargar página
        </button>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Limpiar localStorage
        </button>
      </div>
    </div>
  );
}