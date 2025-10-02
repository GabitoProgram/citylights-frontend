import React, { useState } from 'react';
import { X, DollarSign, User } from 'lucide-react';
import type { AreaComun, CreateReservaDto } from '../types';

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
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [costo, setCosto] = useState(0);

  // Calcular costo automáticamente
  React.useEffect(() => {
    if (fecha && horaInicio && horaFin) {
      const inicio = new Date(`${fecha}T${horaInicio}`);
      const fin = new Date(`${fecha}T${horaFin}`);
      const duracionHoras = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
      const costoCalculado = Math.ceil(duracionHoras * area.costoHora);
      setCosto(costoCalculado);
    }
  }, [fecha, horaInicio, horaFin, area.costoHora]);

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
                    disabled={loading || costo <= 0}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400"
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