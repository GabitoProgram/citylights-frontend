import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiService.forgotPassword(email);
      setSuccess(true);
      console.log('Respuesta forgot-password:', response);
    } catch (err: any) {
      console.error('Error forgot-password:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Error al enviar el código. Inténtalo de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Panel izquierdo */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gradient-to-br from-primary-600 to-primary-800">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo y título */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Building2 className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                ¡Código Enviado!
              </h1>
              <p className="mt-2 text-primary-100">
                Revisa tu email
              </p>
            </div>

            {/* Success message */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-300 mr-3" />
                <h2 className="text-lg font-semibold text-white">
                  Email Enviado
                </h2>
              </div>
              <p className="text-primary-100 mb-4">
                Hemos enviado un código de verificación de 6 dígitos a:
              </p>
              <p className="text-white font-medium bg-white/20 rounded px-3 py-2 text-center">
                {email}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <h3 className="text-white font-medium mb-2">Instrucciones:</h3>
              <ul className="text-primary-100 text-sm space-y-1">
                <li>• El código es válido por 15 minutos</li>
                <li>• Revisa también tu carpeta de spam</li>
                <li>• Usa el código en la página de restablecer contraseña</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Link
                to="/reset-password"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Ir a Restablecer Contraseña
              </Link>
              
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-white/20 rounded-md shadow-sm text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Login
              </Link>
            </div>
          </div>
        </div>

        {/* Panel derecho - Imagen de fondo */}
        <div className="hidden lg:block relative flex-1">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%234f46e5;stop-opacity:1" /><stop offset="100%" style="stop-color:%237c3aed;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(%23bg)"/></svg>')`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white p-8">
                <Mail className="h-24 w-24 mx-auto mb-6 opacity-80" />
                <h2 className="text-4xl font-bold mb-4">Revisa tu Email</h2>
                <p className="text-xl opacity-90 max-w-md">
                  Te hemos enviado las instrucciones para restablecer tu contraseña
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo con formulario */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="mt-2 text-primary-100">
              Ingresa tu email y te enviaremos un código
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-100 mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-3 border border-primary-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    Enviando...
                  </div>
                ) : (
                  'Enviar Código'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="text-primary-100 hover:text-white text-sm font-medium flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Panel derecho - Imagen de fondo */}
      <div className="hidden lg:block relative flex-1">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%234f46e5;stop-opacity:1" /><stop offset="100%" style="stop-color:%237c3aed;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(%23bg)"/></svg>')`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <Mail className="h-24 w-24 mx-auto mb-6 opacity-80" />
              <h2 className="text-4xl font-bold mb-4">Recupera tu Acceso</h2>
              <p className="text-xl opacity-90 max-w-md">
                Te ayudamos a recuperar el acceso a tu cuenta de manera segura
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}