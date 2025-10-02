import { useState, useEffect } from 'react';
import { areasComunesService } from '../services/areasComunes';
import type { AreaComun } from '../types';

// Función simple para mostrar notificaciones
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`${type.toUpperCase()}: ${message}`);
  
  // Mostrar un alert temporal mientras implementamos un sistema de notificaciones mejor
  if (type === 'success') {
    setTimeout(() => {
      alert(`✅ ${message}`);
    }, 100);
  } else {
    setTimeout(() => {
      alert(`❌ ${message}`);
    }, 100);
  }
};

export const useAreasComunes = () => {
  const [areas, setAreas] = useState<AreaComun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAreas = async () => {
    console.log('🔄 useAreasComunes - fetchAreas called');
    console.log('🔄 useAreasComunes - areasComunesService:', areasComunesService);
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 useAreasComunes - calling areasComunesService.getAll()');
      const data = await areasComunesService.getAll();
      console.log('📊 Raw data from backend:', data);
      console.log('📊 Number of areas received:', data?.length || 0);
      setAreas(data);
      console.log('✅ Areas state updated');
    } catch (err: any) {
      console.error('❌ Error fetching areas:', err);
      const errorMessage = err.response?.data?.message || 'Error al cargar las áreas comunes';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAreas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await areasComunesService.getAvailable();
      setAreas(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cargar las áreas disponibles';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createArea = async (areaData: any) => {
    console.log('🔄 Iniciando creación de área:', areaData);
    setLoading(true);
    try {
      console.log('📤 Enviando datos al servidor...');
      const newArea = await areasComunesService.create(areaData);
      console.log('✅ Área creada exitosamente:', newArea);
      
      console.log('🔄 Recargando lista de áreas...');
      await fetchAreas();
      console.log('✅ Lista de áreas actualizada');
      
      showNotification('Área común creada exitosamente');
      return newArea;
    } catch (err: any) {
      console.error('❌ Error al crear área:', err);
      const errorMessage = err.response?.data?.message || 'Error al crear el área común';
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateArea = async (id: number, areaData: any) => {
    setLoading(true);
    try {
      const updatedArea = await areasComunesService.update(id, areaData);
      // Recargar todas las áreas para asegurar sincronización
      await fetchAreas();
      showNotification('Área común actualizada exitosamente');
      return updatedArea;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar el área común';
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteArea = async (id: number) => {
    setLoading(true);
    try {
      await areasComunesService.delete(id);
      // Recargar todas las áreas para asegurar sincronización
      await fetchAreas();
      showNotification('Área común eliminada exitosamente');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar el área común';
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 useAreasComunes useEffect triggered - about to call fetchAreas');
    console.log('🚀 useAreasComunes useEffect - fetchAreas function:', fetchAreas);
    
    // Llamar fetchAreas inmediatamente
    fetchAreas().catch(error => {
      console.error('🚀 useAreasComunes useEffect - Error in fetchAreas:', error);
    });
    
    console.log('🚀 useAreasComunes useEffect - fetchAreas called');
  }, []);

  return {
    areas,
    loading,
    error,
    fetchAreas,
    fetchAvailableAreas,
    createArea,
    updateArea,
    deleteArea,
    refetch: fetchAreas
  };
};