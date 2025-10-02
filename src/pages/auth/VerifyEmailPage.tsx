import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { verifyEmail } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (!email) {
      setError('Email no encontrado. Regresa a la página de registro.');
      setIsSubmitting(false);
      return;
    }

    if (!code.trim()) {
      setError('Por favor ingresa el código de verificación.');
      setIsSubmitting(false);
      return;
    }

    try {
      await verifyEmail(email, code.trim());
      setSuccess('¡Email verificado exitosamente! Redirigiendo al login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Error de verificación:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Código de verificación inválido o expirado.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 6) {
      setCode(value);
    }
  };

  const formatEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    const masked = username.substring(0, 2) + '*'.repeat(username.length - 2);
    return `${masked}@${domain}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300 rounded-full opacity-20"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-primary-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <Mail className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Verifica tu email
            </h1>
            <p className="mt-2 text-gray-600 text-sm">
              Hemos enviado un código de 6 dígitos a
            </p>
            <p className="font-medium text-primary-600">
              {formatEmail(email)}
            </p>
          </div>

          {/* Alertas */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center text-sm">
              <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Código de verificación
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={code}
                onChange={handleCodeChange}
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent tracking-widest"
                placeholder="123456"
                maxLength={6}
              />
              <p className="mt-2 text-xs text-gray-500">
                Ingresa el código de 6 dígitos que recibiste
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Verificando...' : 'Verificar email'}
            </button>
          </form>

          {/* Links de ayuda */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              ¿No recibiste el código?
            </p>
            <button
              type="button"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
              onClick={() => {
                // Aquí podrías implementar reenvío de código
                alert('Función de reenvío pendiente de implementar');
              }}
            >
              Reenviar código
            </button>
            
            <div className="border-t border-gray-200 pt-3">
              <Link
                to="/register"
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                ← Volver al registro
              </Link>
            </div>
          </div>

          {/* Logo */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center text-gray-400">
              <Building2 className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">CityLights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}