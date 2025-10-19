// Tipos para conceptos dinámicos en el frontend
export interface ConceptoMetadata {
  id: number;
  key: string;
  label: string;
  descripcion?: string;
  monto: number;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Interfaz flexible para conceptos dinámicos
export interface ConceptosCuota {
  [key: string]: number;
}

// Configuración completa con metadata
export interface ConfiguracionCuota {
  id: number;
  conceptos: ConceptosCuota;
  conceptosMetadata: ConceptoMetadata[];
  montoTotal: number;
  fechaActualizacion: string;
}

// DTO para crear nuevo concepto
export interface NuevoConceptoDto {
  key: string;
  label: string;
  descripcion?: string;
  activo?: boolean;
}

// Respuesta de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}