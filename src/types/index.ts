// Tipos de autenticación
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_USER' | 'USER_ADMIN' | 'USER_CASUAL';
  isActive: boolean;
  isEmailVerified?: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  service?: string;
}

// Tipos de áreas comunes (Booking)
export interface AreaComun {
  id: number;
  nombre: string;
  descripcion?: string;
  capacidad: number;
  costoHora: number;  // Este es el campo correcto de Prisma
  activa: boolean;
  reservas?: Reserva[];  // Relación con Reserva[]
  bloqueos?: any[];      // Relación con Bloqueo[]
}

export interface CreateAreaComunDto {
  nombre: string;
  descripcion?: string;
  capacidad: number;
  costoHora: number;
  activa?: boolean;
}

export interface UpdateAreaComunDto extends Partial<CreateAreaComunDto> {
  activo?: boolean;
  disponible?: boolean;
}

// Tipos de reservas
export interface CreateReservaDto {
  areaId: number;
  inicio: string;
  fin: string;
  costo?: number;
}

export interface Reserva {
  id: number;
  areaId: number;
  usuarioId: string;
  usuarioNombre?: string;
  usuarioRol?: string;
  inicio: string;  // DateTime de Prisma
  fin: string;     // DateTime de Prisma
  costo: number;   // Campo 'costo' de Prisma
  estado: 'PENDING' | 'CONFIRMED' | 'CANCELLED';  // EstadoReserva de Prisma
  creadoEn: string;      // DateTime de Prisma
  actualizadoEn: string; // DateTime de Prisma
  area?: AreaComun;      // Relación con AreaComun
  confirmacion?: any;    // Relación con Confirmacion
  pagosReserva?: any[];  // Relación con PagoReserva[]
}

// Tipos de pagos
export interface PagoReserva {
  id: number;
  reservaId: number;
  monto: number;
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';
  estado: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO' | 'REEMBOLSADO';
  referencia?: string;
  comprobante?: string;
  observaciones?: string;
  fechaPago?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Tipos de facturas
export interface Factura {
  id: number;
  pagoReservaId: number;
  numeroFactura: string;
  fecha: string;
  monto: number;
  iva: number;
  total: number;
  estado: 'GENERADA' | 'ENVIADA' | 'PAGADA' | 'ANULADA';
  rutaArchivo?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Tipos de confirmaciones
export interface Confirmacion {
  id: number;
  reservaId: number;
  tipo: 'EMAIL' | 'SMS' | 'NOTIFICACION';
  estado: 'PENDIENTE' | 'ENVIADA' | 'CONFIRMADA' | 'FALLIDA';
  mensaje?: string;
  fechaEnvio?: string;
  fechaConfirmacion?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Tipos de bloqueos
export interface Bloqueo {
  id: number;
  areaId: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Tipos de auditoría
export interface RegistroAuditoria {
  id: number;
  usuarioId: string;
  usuarioNombre: string;
  usuarioRol: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  tabla: string;
  registroId?: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  metodo?: string;
  fecha: string;
}

// Tipos de logs del sistema
export interface LogSistema {
  id: number;
  nivel: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  mensaje: string;
  contexto?: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  fecha: string;
}

// Permisos por rol
export interface RolePermissions {
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const rolePermissions: Record<User['role'], RolePermissions> = {
  SUPER_USER: {
    canRead: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  USER_ADMIN: {
    canRead: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
  USER_CASUAL: {
    canRead: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
};