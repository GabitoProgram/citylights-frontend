import { apiService } from './api';
import type { AreaComun, CreateAreaComunDto, UpdateAreaComunDto } from '../types';

class AreasComunesService {
  // Obtener todas las áreas comunes (usando booking endpoint existente)
  async getAll(): Promise<AreaComun[]> {
    console.log('📡 Calling API: getAreaComunes');
    const response = await apiService.getAreaComunes();
    console.log('📡 API Response:', response);
    console.log('📡 Response data:', response.data);
    console.log('📡 Response keys:', Object.keys(response));
    console.log('📡 Response type:', typeof response);
    
    // Si response.data es undefined, probablemente response ya es el array
    if (Array.isArray(response)) {
      console.log('📡 Response is array directly, returning response');
      return response;
    } else if (response.data) {
      console.log('📡 Response.data exists, returning response.data');
      return response.data;
    } else {
      console.log('📡 Neither response nor response.data is array, returning empty array');
      return [];
    }
  }

  // Obtener áreas comunes activas y disponibles (para usuarios)
  async getAvailable(): Promise<AreaComun[]> {
    const response = await apiService.getAreaComunes();
    // Filtrar solo las activas
    return (response.data || []).filter((area: AreaComun) => area.activa);
  }

  // Obtener un área común por ID
  async getById(id: number): Promise<AreaComun> {
    const response = await apiService.getAreaComun(id);
    return response.data;
  }

  // Crear nueva área común (solo admin/super)
  async create(data: CreateAreaComunDto): Promise<AreaComun> {
    const response = await apiService.createAreaComun(data);
    return response.data;
  }

  // Actualizar área común (solo admin/super)
  async update(id: number, data: UpdateAreaComunDto): Promise<AreaComun> {
    const response = await apiService.updateAreaComun(id, data);
    return response.data;
  }

  // Eliminar área común (solo super)
  async delete(id: number): Promise<void> {
    await apiService.deleteAreaComun(id);
  }

  // Obtener reservas de un área para ver ocupación
  async getReservas(): Promise<any[]> {
    const response = await apiService.getReservas();
    return response.data || [];
  }
}

export const areasComunesService = new AreasComunesService();