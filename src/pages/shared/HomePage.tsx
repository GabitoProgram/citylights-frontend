import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Calendar, Shield, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-white mr-3" />
              <span className="text-2xl font-bold text-white">CityLights</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#servicios" className="text-white/80 hover:text-white transition-colors">
                Servicios
              </a>
              <a href="#tecnologia" className="text-white/80 hover:text-white transition-colors">
                Tecnología
              </a>
              <a href="#contacto" className="text-white/80 hover:text-white transition-colors">
                Contacto
              </a>
            </nav>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="text-white/80 hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              CityLights
            </h1>
            <p className="text-xl text-primary-100 mb-4 max-w-2xl mx-auto">
              Sistema Integral de Gestión de Edificios
            </p>
            <p className="text-lg text-primary-200 mb-8 max-w-3xl mx-auto">
              Plataforma completa para la administración inteligente de edificios residenciales y comerciales. 
              Control total de departamentos, usuarios, áreas comunes y comunicación interna.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center bg-white text-primary-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary-50 transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Acceder al Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Gestión de Usuarios
              </h3>
              <p className="text-primary-100">
                Control completo de residentes, administradores y personal. Sistema de roles y permisos avanzado.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Reserva de Áreas Comunes
              </h3>
              <p className="text-primary-100">
                Sistema inteligente de reservas para salones, gimnasios, piscinas y espacios recreativos.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Seguridad Avanzada
              </h3>
              <p className="text-primary-100">
                Autenticación JWT, control de acceso por roles y monitoreo en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            ¿Listo para modernizar tu edificio?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Únete a los cientos de edificios que ya confían en CityLights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Comenzar Gratis
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Ya soy Cliente
            </Link>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full"></div>
          <div className="absolute top-40 -left-40 w-60 h-60 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-40 right-20 w-72 h-72 bg-white/5 rounded-full"></div>
        </div>
      </main>
    </div>
  );
}