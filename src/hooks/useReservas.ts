// TEMPORALLY DISABLED - SERVICE NOT IMPLEMENTED YET
/*
import { useState, useEffect } from 'react';
import { reservasService, type Reserva } from '../services/reservas';

// Función simple para mostrar notificaciones
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`${type.toUpperCase()}: ${message}`);
  // Aquí puedes implementar tu sistema de notificaciones preferido
};

export const useReservas = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reservasService.getMisReservas();
      setReservas(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cargar las reservas';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReservas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reservasService.getAll();
      setReservas(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cargar todas las reservas';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createReserva = async (reservaData: any) => {
    setLoading(true);
    try {
      const newReserva = await reservasService.create(reservaData);
      setReservas(prev => [...prev, newReserva]);
      showNotification('Reserva creada exitosamente');
      return newReserva;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al crear la reserva';
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReserva = async (id: number, reservaData: any) => {
    setLoading(true);
    try {
      const updatedReserva = await reservasService.update(id, reservaData);
      setReservas(prev => prev.map(reserva => reserva.id === id ? updatedReserva : reserva));
      showNotification('Reserva actualizada exitosamente');
      return updatedReserva;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar la reserva';
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelReserva = async (id: number) => {
    setLoading(true);
    try {
      const cancelledReserva = await reservasService.cancel(id);
      setReservas(prev => prev.map(reserva => reserva.id === id ? cancelledReserva : reserva));
      showNotification('Reserva cancelada exitosamente');
      return cancelledReserva;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cancelar la reserva';
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmReserva = async (id: number) => {
    setLoading(true);
    try {
      const confirmedReserva = await reservasService.confirm(id);
      setReservas(prev => prev.map(reserva => reserva.id === id ? confirmedReserva : reserva));
      showNotification('Reserva confirmada exitosamente');
      return confirmedReserva;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al confirmar la reserva';
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteReserva = async (id: number) => {
    setLoading(true);
    try {
      await reservasService.delete(id);
      setReservas(prev => prev.filter(reserva => reserva.id !== id));
      showNotification('Reserva eliminada exitosamente');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar la reserva';
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (areaId: number, fecha: string, horaInicio: string, horaFin: string) => {
    try {
      return await reservasService.isTimeSlotAvailable(areaId, fecha, horaInicio, horaFin);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al verificar disponibilidad';
      showNotification(errorMessage, 'error');
      return false;
    }
  };

  const getOccupiedSlots = async (areaId: number, fecha: string) => {
    try {
      return await reservasService.getOccupiedSlots(areaId, fecha);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al obtener horarios ocupados';
      showNotification(errorMessage, 'error');
      return [];
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  return {
    reservas,
    loading,
    error,
    fetchReservas,
    fetchAllReservas,
    createReserva,
    updateReserva,
    cancelReserva,
    confirmReserva,
    deleteReserva,
    checkAvailability,
    getOccupiedSlots,
    refetch: fetchReservas
  };
};
*/

// Placeholder export para evitar errores de importación
export const useReservas = () => ({
  reservas: [],
  loading: false,
  error: null,
  fetchReservas: () => {},
  createReserva: () => Promise.resolve(),
  updateReserva: () => Promise.resolve(),
  deleteReserva: () => Promise.resolve(),
  checkAvailability: () => Promise.resolve(true),
  getOccupiedSlots: () => Promise.resolve([]),
  refetch: () => {}
});