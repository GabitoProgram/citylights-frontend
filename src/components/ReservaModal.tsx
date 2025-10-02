import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Clock, Calendar, MapPin } from 'lucide-react';
import type { AreaComun } from '../types';

// Definición temporal inline
interface CreateReservaDto {
  areaId: number;
  inicio: string;
  fin: string;
  costo: number;
}

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateReservaDto) => Promise<void>;
  area: AreaComun;
}

export const ReservaModal: React.FC<ReservaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  area
}) => {
  const { checkAvailability, getOccupiedSlots } = useReservas();
  
  const [formData, setFormData] = useState<CreateReservaDto>({
    areaId: area.id,
    fechaReserva: '',
    horaInicio: '',
    horaFin: '',
    observaciones: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [occupiedSlots, setOccupiedSlots] = useState<{ inicio: string; fin: string }[]>([]);
  const [calculatedCost, setCalculatedCost] = useState<number>(0);

  useEffect(() => {
    if (isOpen && area) {
      setFormData(prev => ({
        ...prev,
        areaId: area.id
      }));
      
      // Set minimum date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        fechaReserva: today
      }));
    }
  }, [isOpen, area]);

  useEffect(() => {
    if (formData.fechaReserva && area.id) {
      loadOccupiedSlots();
    }
  }, [formData.fechaReserva, area.id]);

  useEffect(() => {
    if (formData.horaInicio && formData.horaFin) {
      calculateCost();
    }
  }, [formData.horaInicio, formData.horaFin, area.tarifaPorHora]);

  const loadOccupiedSlots = async () => {
    try {
      const slots = await getOccupiedSlots(area.id, formData.fechaReserva);
      setOccupiedSlots(slots);
    } catch (error) {
      console.error('Error loading occupied slots:', error);
    }
  };

  const calculateCost = () => {
    if (!formData.horaInicio || !formData.horaFin) {
      setCalculatedCost(0);
      return;
    }

    const inicio = new Date(`2000-01-01 ${formData.horaInicio}`);
    const fin = new Date(`2000-01-01 ${formData.horaFin}`);
    const duracionMs = fin.getTime() - inicio.getTime();
    const duracionHoras = duracionMs / (1000 * 60 * 60);

    if (duracionHoras > 0) {
      setCalculatedCost(duracionHoras * area.tarifaPorHora);
    } else {
      setCalculatedCost(0);
    }
  };

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fechaReserva) {
      newErrors.fechaReserva = 'La fecha es requerida';
    } else {
      const selectedDate = new Date(formData.fechaReserva);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.fechaReserva = 'No se pueden hacer reservas en fechas pasadas';
      }
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = 'La hora de inicio es requerida';
    }

    if (!formData.horaFin) {
      newErrors.horaFin = 'La hora de fin es requerida';
    }

    if (formData.horaInicio && formData.horaFin) {
      if (formData.horaInicio >= formData.horaFin) {
        newErrors.horaFin = 'La hora de fin debe ser posterior a la de inicio';
      }

      // Validar horarios del área
      if (formData.horaInicio < area.horarioApertura) {
        newErrors.horaInicio = `El área abre a las ${area.horarioApertura}`;
      }

      if (formData.horaFin > area.horarioCierre) {
        newErrors.horaFin = `El área cierra a las ${area.horarioCierre}`;
      }

      // Validar disponibilidad
      if (formData.fechaReserva) {
        try {
          const isAvailable = await checkAvailability(
            area.id,
            formData.fechaReserva,
            formData.horaInicio,
            formData.horaFin
          );

          if (!isAvailable) {
            newErrors.horaInicio = 'Este horario ya está ocupado';
          }
        } catch (error) {
          newErrors.horaInicio = 'Error al verificar disponibilidad';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
      // Reset form
      setFormData({
        areaId: area.id,
        fechaReserva: '',
        horaInicio: '',
        horaFin: '',
        observaciones: ''
      });
    } catch (error) {
      console.error('Error al crear reserva:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    const start = new Date(`2000-01-01 ${area.horarioApertura}`);
    const end = new Date(`2000-01-01 ${area.horarioCierre}`);
    
    const current = new Date(start);
    while (current <= end) {
      const timeStr = current.toTimeString().substr(0, 5);
      options.push(timeStr);
      current.setMinutes(current.getMinutes() + 30); // 30 minute intervals
    }
    
    return options;
  };

  const isTimeSlotOccupied = (time: string) => {
    return occupiedSlots.some(slot => 
      time >= slot.inicio && time < slot.fin
    );
  };

  if (!isOpen) return null;

  const timeOptions = generateTimeOptions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Reservar Área Común
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Area Info */}
        <div className="p-6 bg-primary-50 border-b border-primary-100">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-primary-600" />
            <div>
              <h3 className="font-medium text-primary-900">{area.nombre}</h3>
              <p className="text-sm text-primary-600">
                Capacidad: {area.capacidad} personas • ${area.tarifaPorHora}/hora
              </p>
              <p className="text-sm text-primary-600">
                Horario: {area.horarioApertura} - {area.horarioCierre}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha de Reserva *
            </label>
            <input
              type="date"
              name="fechaReserva"
              value={formData.fechaReserva}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.fechaReserva ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.fechaReserva && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.fechaReserva}
              </p>
            )}
          </div>

          {/* Horarios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora Inicio *
              </label>
              <select
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.horaInicio ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar...</option>
                {timeOptions.map(time => (
                  <option 
                    key={time} 
                    value={time}
                    disabled={isTimeSlotOccupied(time)}
                    className={isTimeSlotOccupied(time) ? 'text-gray-400' : ''}
                  >
                    {time} {isTimeSlotOccupied(time) ? '(Ocupado)' : ''}
                  </option>
                ))}
              </select>
              {errors.horaInicio && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.horaInicio}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora Fin *
              </label>
              <select
                name="horaFin"
                value={formData.horaFin}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.horaFin ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar...</option>
                {timeOptions.map(time => (
                  <option 
                    key={time} 
                    value={time}
                    disabled={formData.horaInicio ? time <= formData.horaInicio : false}
                  >
                    {time}
                  </option>
                ))}
              </select>
              {errors.horaFin && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.horaFin}
                </p>
              )}
            </div>
          </div>

          {/* Costo calculado */}
          {calculatedCost > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">$</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    Costo Total: ${calculatedCost.toFixed(2)}
                  </h4>
                  <p className="text-sm text-green-600">
                    {((new Date(`2000-01-01 ${formData.horaFin}`).getTime() - 
                       new Date(`2000-01-01 ${formData.horaInicio}`).getTime()) / (1000 * 60 * 60)).toFixed(1)} horas × ${area.tarifaPorHora}/hora
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Información adicional sobre la reserva..."
            />
          </div>

          {/* Horarios ocupados */}
          {occupiedSlots.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Horarios ya ocupados para esta fecha:
              </h4>
              <div className="space-y-1">
                {occupiedSlots.map((slot, index) => (
                  <p key={index} className="text-sm text-yellow-700">
                    {slot.inicio} - {slot.fin}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || calculatedCost === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Reservar (${calculatedCost.toFixed(2)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};