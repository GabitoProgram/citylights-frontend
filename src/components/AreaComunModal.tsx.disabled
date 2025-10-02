import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import type { AreaComun, CreateAreaComunDto } from '../types';

interface AreaComunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateAreaComunDto) => Promise<void>;
  area?: AreaComun | null;
  mode: 'create' | 'edit';
}

const tiposArea = [
  { value: 'SALON_EVENTOS', label: 'Salón de Eventos' },
  { value: 'PISCINA', label: 'Piscina' },
  { value: 'GYM', label: 'Gimnasio' },
  { value: 'CANCHA_TENIS', label: 'Cancha de Tenis' },
  { value: 'BBQ', label: 'Área BBQ' },
  { value: 'SALON_JUEGOS', label: 'Salón de Juegos' },
];

export const AreaComunModal: React.FC<AreaComunModalProps> = ({
  isOpen,
  onClose,
  onSave,
  area,
  mode
}) => {
  const [formData, setFormData] = useState<CreateAreaComunDto>({
    nombre: '',
    descripcion: '',
    capacidad: 1,
    costoHora: 0,
    activa: true
  });

  const [equipamientoInput, setEquipamientoInput] = useState('');
  const [normasInput, setNormasInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (area && mode === 'edit') {
      setFormData({
        nombre: area.nombre,
        descripcion: area.descripcion || '',
        capacidad: area.capacidad,
        costoHora: area.costoHora,
        activa: area.activa
      });
    } else {
      // Reset form for create mode
      setFormData({
        nombre: '',
        descripcion: '',
        capacidad: 1,
        costoHora: 0,
        activa: true
      });
    }
    setErrors({});
  }, [area, mode, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (formData.descripcion && !formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción no puede estar vacía si se proporciona';
    }

    if (formData.capacidad < 1) {
      newErrors.capacidad = 'La capacidad debe ser mayor a 0';
    }

    if (formData.costoHora < 0) {
      newErrors.costoHora = 'El costo por hora no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        equipamiento: equipamientoInput.split(',').map(item => item.trim()).filter(Boolean),
        normas: normasInput.split(',').map(item => item.trim()).filter(Boolean)
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error al guardar área:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacidad' || name === 'tarifaPorHora' ? Number(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Crear Nueva Área Común' : 'Editar Área Común'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Área *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.nombre ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Salón de Fiestas"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.nombre}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Área *
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {tiposArea.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.descripcion ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe el área común y sus características..."
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.descripcion}
              </p>
            )}
          </div>

          {/* Capacidad y tarifa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad (personas) *
              </label>
              <input
                type="number"
                name="capacidad"
                value={formData.capacidad}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.capacidad ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.capacidad && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.capacidad}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa por Hora (USD) *
              </label>
              <input
                type="number"
                name="tarifaPorHora"
                value={formData.tarifaPorHora}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.tarifaPorHora ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.tarifaPorHora && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.tarifaPorHora}
                </p>
              )}
            </div>
          </div>

          {/* Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horario de Apertura *
              </label>
              <input
                type="time"
                name="horarioApertura"
                value={formData.horarioApertura}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horario de Cierre *
              </label>
              <input
                type="time"
                name="horarioCierre"
                value={formData.horarioCierre}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.horarioCierre ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.horarioCierre && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.horarioCierre}
                </p>
              )}
            </div>
          </div>

          {/* Equipamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipamiento Disponible
            </label>
            <input
              type="text"
              value={equipamientoInput}
              onChange={(e) => setEquipamientoInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Separar elementos con comas: Proyector, Sistema de sonido, Aire acondicionado..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Ejemplo: Proyector, Sistema de sonido, Aire acondicionado
            </p>
          </div>

          {/* Normas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Normas de Uso
            </label>
            <input
              type="text"
              value={normasInput}
              onChange={(e) => setNormasInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Separar normas con comas: No fumar, No mascotas, Limpiar después del uso..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Ejemplo: No fumar, No mascotas, Limpiar después del uso
            </p>
          </div>

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
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {mode === 'create' ? 'Crear Área' : 'Actualizar Área'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};