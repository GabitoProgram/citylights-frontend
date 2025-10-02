import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { AreaComun, CreateAreaComunDto } from '../types';

interface SimpleAreaComunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateAreaComunDto) => Promise<void>;
  area?: AreaComun | null;
  mode: 'create' | 'edit';
}

export const SimpleAreaComunModal: React.FC<SimpleAreaComunModalProps> = ({
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
    console.log('🔄 Modal: Iniciando envío del formulario');

    if (!validateForm()) {
      console.log('❌ Modal: Validación fallida');
      return;
    }

    console.log('📤 Modal: Enviando datos:', formData);
    setLoading(true);
    try {
      await onSave(formData);
      console.log('✅ Modal: Datos guardados exitosamente');
      // Cerrar el modal después de guardar exitosamente
      onClose();
      console.log('✅ Modal: Modal cerrado');
    } catch (error) {
      console.error('❌ Modal: Error al guardar área:', error);
      // No cerrar el modal si hay error para que el usuario vea qué pasó
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateAreaComunDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {mode === 'create' ? 'Nueva Área Común' : 'Editar Área Común'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Salón de Eventos Principal"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Descripción del área común..."
              />
            </div>

            {/* Capacidad */}
            <div>
              <label htmlFor="capacidad" className="block text-sm font-medium text-gray-700 mb-1">
                Capacidad *
              </label>
              <input
                type="number"
                id="capacidad"
                value={formData.capacidad}
                onChange={(e) => handleInputChange('capacidad', parseInt(e.target.value) || 0)}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.capacidad ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.capacidad && (
                <p className="mt-1 text-sm text-red-600">{errors.capacidad}</p>
              )}
            </div>

            {/* Costo por hora */}
            <div>
              <label htmlFor="costoHora" className="block text-sm font-medium text-gray-700 mb-1">
                Costo por hora (Bs.) *
              </label>
              <input
                type="number"
                id="costoHora"
                value={formData.costoHora}
                onChange={(e) => handleInputChange('costoHora', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.costoHora ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.costoHora && (
                <p className="mt-1 text-sm text-red-600">{errors.costoHora}</p>
              )}
            </div>

            {/* Estado activa */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.activa}
                  onChange={(e) => handleInputChange('activa', e.target.checked)}
                  className="mr-2 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Área activa</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};