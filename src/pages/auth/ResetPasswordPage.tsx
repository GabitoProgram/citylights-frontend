import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar que las contraseñas coincidan
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud mínima
    if (formData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiService.resetPassword(
        formData.email,
        formData.code,
        formData.newPassword
      );
      setSuccess(true);
      console.log('Respuesta reset-password:', response);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Error reset-password:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Error al restablecer la contraseña. Verifica el código.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Panel izquierdo */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gradient-to-br from-green-600 to-green-800">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo y título */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Building2 className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                ¡Contraseña Restablecida!
              </h1>
              <p className="mt-2 text-green-100">
                Tu contraseña ha sido actualizada
              </p>
            </div>

            {/* Success message */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-300" />
              </div>
              <h2 className="text-lg font-semibold text-white text-center mb-2">
                ¡Éxito!
              </h2>
              <p className="text-green-100 text-center">
                Tu contraseña ha sido restablecida correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>

            {/* Auto redirect message */}
            <div className="bg-white/5 rounded-lg p-4 mb-6 text-center">
              <p className="text-green-100 text-sm">
                Serás redirigido al login en unos segundos...
              </p>
              <div className="mt-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              </div>
            </div>

            {/* Manual redirect */}
            <div className="text-center">
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Ir al Login Ahora
              </Link>
            </div>
          </div>
        </div>

        {/* Panel derecho - Imagen de fondo */}
        <div className="hidden lg:block relative flex-1">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%2316a34a;stop-opacity:1" /><stop offset="100%" style="stop-color:%2315803d;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(%23bg)"/></svg>')`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white p-8">
                <CheckCircle className="h-24 w-24 mx-auto mb-6 opacity-80" />
                <h2 className="text-4xl font-bold mb-4">¡Listo!</h2>
                <p className="text-xl opacity-90 max-w-md">
                  Tu contraseña ha sido actualizada exitosamente
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
              Restablecer Contraseña
            </h1>
            <p className="mt-2 text-primary-100">
              Ingresa el código y tu nueva contraseña
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
                value={formData.email}
                onChange={handleInputChange}
                className="appearance-none block w-full px-3 py-3 border border-primary-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-primary-100 mb-2">
                Código de verificación
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={6}
                value={formData.code}
                onChange={handleInputChange}
                className="appearance-none block w-full px-3 py-3 border border-primary-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-center text-lg font-mono tracking-widest"
                placeholder="123456"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-primary-100 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-3 pr-10 border border-primary-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-100 mb-2">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-3 pr-10 border border-primary-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                  placeholder="Repite la contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
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
                    Restableciendo...
                  </div>
                ) : (
                  'Restablecer Contraseña'
                )}
              </button>
            </div>

            <div className="space-y-3 text-center">
              <Link
                to="/forgot-password"
                className="text-primary-100 hover:text-white text-sm font-medium"
              >
                ¿No recibiste el código? Reenviar
              </Link>
              <br />
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
              <Lock className="h-24 w-24 mx-auto mb-6 opacity-80" />
              <h2 className="text-4xl font-bold mb-4">Nueva Contraseña</h2>
              <p className="text-xl opacity-90 max-w-md">
                Crea una nueva contraseña segura para tu cuenta
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}