import React, { useState, useEffect } from 'react';
import { X, DollarSign, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import type { AreaComun, CreateReservaDto, Reserva } from '../types';

interface SimpleReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: AreaComun;
  onSave: (reservaData: CreateReservaDto) => Promise<void>;
}

const SimpleReservaModal: React.FC<SimpleReservaModalProps> = ({
  isOpen,
  onClose,
  area,
  onSave
}) => {
  const { user } = useAuth();
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [costo, setCosto] = useState(0);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [advertenciaVisible, setAdvertenciaVisible] = useState(false);
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState('');

  // Cargar reservas existentes
  useEffect(() => {
    const cargarReservas = async () => {
      try {
        // SOLUCIÓN ANTI-DUPLICADOS: USER_CASUAL necesita ver TODAS las reservas para validaciones
        let response;
        if (user?.role === 'USER_CASUAL') {
          console.log('👤 USER_CASUAL en modal: obteniendo TODAS las reservas para validaciones anti-duplicado');
          response = await apiService.getAllReservasForVisualization(); // Método específico para obtener todas las reservas
        } else {
          response = await apiService.getReservas();
        }
        
        if (response?.data && Array.isArray(response.data)) {
          setReservas(response.data);
        } else if (response && Array.isArray(response)) {
          // Fallback para compatibilidad
          setReservas(response);
        }
      } catch (error) {
        console.error('Error al cargar reservas:', error);
      }
    };

    if (isOpen) {
      cargarReservas();
    }
  }, [isOpen, user?.role]);

  // Limpiar estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setFecha('');
      setHoraInicio('');
      setHoraFin('');
      setCosto(0);
      setAdvertenciaVisible(false);
      setMensajeAdvertencia('');
    }
  }, [isOpen]);

  // Calcular costo automáticamente y verificar conflictos
  React.useEffect(() => {
    if (fecha && horaInicio && horaFin) {
      const inicio = new Date(`${fecha}T${horaInicio}`);
      const fin = new Date(`${fecha}T${horaFin}`);
      const duracionHoras = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
      const costoCalculado = Math.ceil(duracionHoras * area.costoHora);
      setCosto(costoCalculado);

      // Verificar conflictos y límites
      setAdvertenciaVisible(false);
      setMensajeAdvertencia('');

      // Verificar fecha pasada
      if (esFechaPasada(fecha, horaInicio)) {
        setAdvertenciaVisible(true);
        setMensajeAdvertencia('No puedes hacer reservas en fechas y horas pasadas');
        return;
      }

      // Verificar conflictos de reserva
      const conflicto = verificarConflictoReserva(fecha, horaInicio, horaFin, area.id);
      if (conflicto.tieneConflicto) {
        setAdvertenciaVisible(true);
        if (conflicto.tipo === 'exacto') {
          setMensajeAdvertencia('Ya existe una reserva exactamente en este horario y área');
        } else if (conflicto.tipo === 'solapamiento') {
          const reservaConflicto = conflicto.reservaConflicto!;
          const inicioConflicto = new Date(reservaConflicto.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          const finConflicto = new Date(reservaConflicto.fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          setMensajeAdvertencia(`Se solapa con reserva existente (${inicioConflicto} - ${finConflicto})`);
        }
        return;
      }

      // Verificar límite de reservas
      const limite = verificarLimiteReservas(fecha);
      if (limite.excedeLimite) {
        setAdvertenciaVisible(true);
        setMensajeAdvertencia(`Límite alcanzado: ${limite.reservasEnMes}/3 reservas este mes`);
        return;
      }
    }
  }, [fecha, horaInicio, horaFin, area.costoHora, area.id, reservas, user?.id]);

  // Funciones de validación
  const esFechaPasada = (fechaStr: string, horaStr: string): boolean => {
    const fechaHora = new Date(`${fechaStr}T${horaStr}`);
    return fechaHora < new Date();
  };

  const verificarConflictoReserva = (fecha: string, horaInicio: string, horaFin: string, areaId: number): { tieneConflicto: boolean; tipo: 'exacto' | 'solapamiento' | null; reservaConflicto?: Reserva } => {
    const inicioNueva = new Date(`${fecha}T${horaInicio}`);
    const finNueva = new Date(`${fecha}T${horaFin}`);

    for (const reserva of reservas) {
      // Solo verificar reservas activas
      if (reserva.estado === 'CANCELLED') continue;
      
      // Solo verificar reservas de la misma área
      if (reserva.areaId !== areaId) continue;

      const inicioExistente = new Date(reserva.inicio);
      const finExistente = new Date(reserva.fin);

      // Verificar si es exactamente la misma reserva
      if (inicioNueva.getTime() === inicioExistente.getTime() && 
          finNueva.getTime() === finExistente.getTime()) {
        return { tieneConflicto: true, tipo: 'exacto', reservaConflicto: reserva };
      }

      // Verificar solapamiento de horarios
      if (inicioNueva < finExistente && finNueva > inicioExistente) {
        return { tieneConflicto: true, tipo: 'solapamiento', reservaConflicto: reserva };
      }
    }

    return { tieneConflicto: false, tipo: null };
  };

  const verificarLimiteReservas = (fecha: string): { excedeLimite: boolean; reservasEnMes: number } => {
    if (!user?.id) return { excedeLimite: false, reservasEnMes: 0 };

    const fechaSeleccionada = new Date(fecha);
    const inicioMes = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1);
    const finMes = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth() + 1, 0);

    const reservasDelMes = reservas.filter(reserva => {
      if (reserva.estado === 'CANCELLED') return false;
      if (reserva.usuarioId !== user.id) return false;
      
      const fechaReserva = new Date(reserva.inicio);
      return fechaReserva >= inicioMes && fechaReserva <= finMes;
    });

    const LIMITE_RESERVAS = 3;
    return {
      excedeLimite: reservasDelMes.length >= LIMITE_RESERVAS,
      reservasEnMes: reservasDelMes.length
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fecha || !horaInicio || !horaFin) {
      alert('Por favor completa todos los campos');
      return;
    }

    const inicio = new Date(`${fecha}T${horaInicio}`);
    const fin = new Date(`${fecha}T${horaFin}`);

    if (inicio >= fin) {
      alert('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // Validar que la fecha no sea en el pasado
    if (esFechaPasada(fecha, horaInicio)) {
      alert('No puedes hacer reservas en fechas y horas pasadas');
      return;
    }

    // Verificar conflictos de reserva
    const conflicto = verificarConflictoReserva(fecha, horaInicio, horaFin, area.id);
    if (conflicto.tieneConflicto) {
      if (conflicto.tipo === 'exacto') {
        alert('Ya existe una reserva exactamente en la misma fecha, hora y área. Por favor selecciona otro horario.');
        return;
      } else if (conflicto.tipo === 'solapamiento') {
        const reservaConflicto = conflicto.reservaConflicto!;
        const inicioConflicto = new Date(reservaConflicto.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const finConflicto = new Date(reservaConflicto.fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        alert(`El horario seleccionado se solapa con una reserva existente de ${inicioConflicto} a ${finConflicto}. Por favor selecciona otro horario.`);
        return;
      }
    }

    // Verificar límite de reservas por mes
    const limite = verificarLimiteReservas(fecha);
    if (limite.excedeLimite) {
      alert(`Has alcanzado el límite de 3 reservas por mes. Actualmente tienes ${limite.reservasEnMes} reservas este mes.`);
      return;
    }

    if (inicio < new Date()) {
      alert('La fecha y hora de inicio debe ser futura');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        areaId: area.id,
        inicio: inicio.toISOString(),
        fin: fin.toISOString()
      });
      
      // Limpiar formulario
      setFecha('');
      setHoraInicio('');
      setHoraFin('');
      setCosto(0);
      setAdvertenciaVisible(false);
      setMensajeAdvertencia('');
      onClose();
    } catch (error) {
      console.error('Error al crear reserva:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Reservar: {area.nombre}
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Capacidad: {area.capacidad} personas</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Costo por hora: ${area.costoHora}</span>
                </div>
                {area.descripcion && (
                  <p className="text-sm text-gray-600 mt-2">{area.descripcion}</p>
                )}
              </div>

              {/* Advertencia de conflictos */}
              {advertenciaVisible && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Advertencia
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        {mensajeAdvertencia}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
                    Fecha de reserva
                  </label>
                  <input
                    type="date"
                    id="fecha"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700">
                      Hora de inicio
                    </label>
                    <input
                      type="time"
                      id="horaInicio"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700">
                      Hora de fin
                    </label>
                    <input
                      type="time"
                      id="horaFin"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                {costo > 0 && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-primary-600" />
                      <span className="text-sm font-medium text-primary-800">
                        Costo total: ${costo}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading || costo <= 0 || advertenciaVisible}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      loading || costo <= 0 || advertenciaVisible
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                    title={advertenciaVisible ? 'No se puede reservar: ' + mensajeAdvertencia : ''}
                  >
                    {loading ? 'Creando...' : 'Confirmar Reserva'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleReservaModal;