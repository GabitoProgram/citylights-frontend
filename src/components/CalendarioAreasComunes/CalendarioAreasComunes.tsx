import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAreasComunes } from '../../hooks/useAreasComunes';
import { apiService } from '../../services/api';

// Tipos para el calendario
interface ReservaCalendario {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  areaId: string;
  areaNombre: string;
  usuarioNombre: string;
  usuarioId: string;
  estado: 'confirmada' | 'pendiente' | 'cancelada';
  tipo: 'propia' | 'ocupado' | 'disponible';
}

interface AreaDisponible {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  capacidad: number;
  descripcion: string;
}

interface Props {
  onNuevaReserva?: (fecha: string, hora: string, areaId: string) => void;
  mostrarSoloCalendario?: boolean;
}

const CalendarioAreasComunes: React.FC<Props> = ({ 
  onNuevaReserva, 
  mostrarSoloCalendario = false 
}) => {
  const { user } = useAuth();
  const { areas } = useAreasComunes();
  const [fechaActual, setFechaActual] = useState(new Date());
  const [areaSeleccionada, setAreaSeleccionada] = useState('');
  const [reservas, setReservas] = useState<ReservaCalendario[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('');
  const [, setReservaSeleccionada] = useState<ReservaCalendario | null>(null);
  const [loadingReservas, setLoadingReservas] = useState(false);

  // Función para obtener emoji según el nombre del área
  const getEmojiPorArea = (nombre: string): string => {
    const nombreLower = nombre.toLowerCase();
    if (nombreLower.includes('piscina')) return '🏊';
    if (nombreLower.includes('salon') || nombreLower.includes('evento')) return '🎉';
    if (nombreLower.includes('gimnasio') || nombreLower.includes('gym')) return '💪';
    if (nombreLower.includes('cancha') || nombreLower.includes('deporte')) return '⚽';
    if (nombreLower.includes('parrilla') || nombreLower.includes('asado')) return '🔥';
    if (nombreLower.includes('salon') || nombreLower.includes('reunion')) return '🏢';
    return '🏢'; // Default
  };

  // Función para obtener color según el nombre del área
  const getColorPorArea = (nombre: string): string => {
    const nombreLower = nombre.toLowerCase();
    if (nombreLower.includes('piscina')) return '#3B82F6';
    if (nombreLower.includes('salon') || nombreLower.includes('evento')) return '#8B5CF6';
    if (nombreLower.includes('gimnasio') || nombreLower.includes('gym')) return '#EF4444';
    if (nombreLower.includes('cancha') || nombreLower.includes('deporte')) return '#10B981';
    if (nombreLower.includes('parrilla') || nombreLower.includes('asado')) return '#F59E0B';
    return '#6B7280'; // Default gray
  };

  // Áreas disponibles - convertir áreas reales a formato del calendario
  const areasDisponibles: AreaDisponible[] = areas.filter(area => area.activa).map(area => ({
    id: area.id.toString(), // Convertir a string
    nombre: area.nombre,
    emoji: getEmojiPorArea(area.nombre),
    color: getColorPorArea(area.nombre),
    capacidad: area.capacidad,
    descripcion: area.descripcion || `Área ${area.nombre}`
  }));

  // Cargar reservas del backend
  const cargarReservas = async () => {
    console.log('🔄 INICIANDO cargarReservas() - PASO 1');
    console.log('👤 DEBUGGING ROL DE USUARIO:', {
      userEmail: user?.email,
      userRole: user?.role,
      userId: user?.id,
      userObject: user
    });
    
    try {
      setLoadingReservas(true);
      console.log('🔄 Cargando reservas... - PASO 2');
      console.log('🔑 Usuario actual:', user);
      
      // SOLUCIÓN ANTI-DUPLICADOS: USER_CASUAL necesita ver TODAS las reservas para validaciones
      console.log('📞 Determinando endpoint según rol de usuario - PASO 3');
      let response;
      if (user?.role === 'USER_CASUAL') {
        console.log('👤 USER_CASUAL detectado: usando método especial para obtener TODAS las reservas');
        response = await apiService.getAllReservasForVisualization(); // Método específico para obtener todas las reservas
      } else {
        console.log('👤 Usuario ADMIN/SUPER: usando endpoint normal');
        response = await apiService.getReservas();
      }
      
      console.log('🚨 DEBUGGING RESPUESTA POR ROL:');
      console.log('  👤 Rol actual:', user?.role);
      console.log('  📊 Status de respuesta:', response.status);
      console.log('  📊 Headers de respuesta:', response.headers);
      console.log('  📊 Data recibida:', response.data);
      console.log('  📊 Longitud de data:', response.data?.length);
      
      if (response.status !== 200) {
        console.error('❌ RESPUESTA NO EXITOSA:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
      }
      console.log('📊 RESPUESTA DEL API:', JSON.stringify(response, null, 2));
      console.log('📊 response.data:', response.data);
      console.log('📊 Tipo de response.data:', typeof response.data);
      console.log('📊 ¿Es array?:', Array.isArray(response.data));
      console.log('📊 Longitud:', response.data?.length);
      
      // Verificar estructura completa de la respuesta
      console.log('🔍 Claves de response:', Object.keys(response));
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log('🔍 Primera reserva completa:', JSON.stringify(response.data[0], null, 2));
      }
      
      // Verificar si response.data existe y es un array
      if (!response.data) {
        console.error('❌ response.data es null o undefined');
        return;
      }
      
      if (!Array.isArray(response.data)) {
        console.error('❌ response.data no es un array:', response.data);
        return;
      }
      
      // Convertir reservas del backend al formato del calendario
      // Filtrar reservas con fechas válidas
      const reservasFormateadas: ReservaCalendario[] = response.data
        .filter((reserva: any) => {
          // Verificar que la fecha existe y es válida (el backend usa 'inicio')
          if (!reserva.inicio) {
            console.warn('⚠️ Reserva sin fecha inicio:', reserva.id);
            return false;
          }
          
          // Intentar crear la fecha y verificar que es válida
          const fecha = new Date(reserva.inicio);
          if (isNaN(fecha.getTime())) {
            console.warn('⚠️ Fecha inválida en reserva:', reserva.id, reserva.inicio);
            return false;
          }
          
          return true;
        })
        .map((reserva: any) => {
          const fechaInicio = new Date(reserva.inicio);
          const fechaFin = new Date(reserva.fin);
          
          // 🕐 CORRECCIÓN DE ZONA HORARIA: Usar hora local en lugar de UTC
          const formatoFecha = (fecha: Date) => {
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            return `${año}-${mes}-${dia}`;
          };
          
          const formatoHora = (fecha: Date) => {
            const horas = String(fecha.getHours()).padStart(2, '0');
            const minutos = String(fecha.getMinutes()).padStart(2, '0');
            return `${horas}:${minutos}`;
          };
          
          const reservaFormateada = {
            id: reserva.id,
            fecha: formatoFecha(fechaInicio), // Usar hora local
            horaInicio: formatoHora(fechaInicio), // Usar hora local
            horaFin: formatoHora(fechaFin), // Usar hora local
            areaId: (reserva.area?.id || reserva.areaId)?.toString(), // Usar 'area' del backend
            areaNombre: reserva.area?.nombre || 'Área',
            usuarioNombre: reserva.usuario?.email || 'Usuario',
            usuarioId: reserva.usuario?.id || reserva.usuarioId,
            estado: reserva.estado?.toLowerCase() || 'confirmada',
            tipo: (reserva.usuario?.id === user?.id ? 'propia' : 'ocupado') as 'propia' | 'ocupado' | 'disponible'
          };
          
          // 🕐 Debug para verificar corrección de zona horaria
          console.log('🔍 Reserva formateada (con corrección de zona horaria):', {
            id: reservaFormateada.id,
            fecha: reservaFormateada.fecha,
            areaId: reservaFormateada.areaId,
            areaNombre: reservaFormateada.areaNombre,
            hora: `${reservaFormateada.horaInicio}-${reservaFormateada.horaFin}`,
            original: {
              areaId: reserva.areaId,
              area: reserva.area,
              inicio: reserva.inicio,
              fin: reserva.fin
            },
            zonHoraria: {
              inicioUTC: new Date(reserva.inicio).toISOString(),
              inicioLocal: new Date(reserva.inicio).toString(),
              horaExtraida: reservaFormateada.horaInicio
            }
          });
          
          return reservaFormateada;
        });

      setReservas(reservasFormateadas);
      console.log('✅ Reservas formateadas:', reservasFormateadas);
      
      // 🔍 DEBUG ESPECÍFICO PARA USER_CASUAL: Verificar visualización de reservas de otros usuarios
      if (user?.role === 'USER_CASUAL') {
        const reservasPropias = reservasFormateadas.filter(r => r.usuarioId === user?.id);
        const reservasOtros = reservasFormateadas.filter(r => r.usuarioId !== user?.id);
        console.log('👤 DEBUG USER_CASUAL - Visualización de reservas:');
        console.log('  📝 Reservas propias:', reservasPropias.length, reservasPropias);
        console.log('  👥 Reservas de otros usuarios:', reservasOtros.length, reservasOtros);
        console.log('  📊 Total de reservas visibles:', reservasFormateadas.length);
        
        if (reservasOtros.length > 0) {
          console.log('✅ USER_CASUAL puede ver reservas de otros usuarios en el calendario');
        } else {
          console.log('⚠️ USER_CASUAL NO está viendo reservas de otros usuarios');
        }
      }
      
      // Debug adicional: verificar fechas de hoy y mañana
      const hoy = new Date().toISOString().split('T')[0];
      const mañana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log('📅 Debug fechas:');
      console.log('  - Hoy:', hoy);
      console.log('  - Mañana:', mañana);
      console.log('  - Reservas para hoy:', reservasFormateadas.filter(r => r.fecha === hoy));
      console.log('  - Reservas para mañana:', reservasFormateadas.filter(r => r.fecha === mañana));
      
      // Debug de áreas ID
      console.log('🏢 Debug áreas ID:');
      reservasFormateadas.forEach(reserva => {
        console.log(`  - Reserva ${reserva.id}: areaId="${reserva.areaId}" (tipo: ${typeof reserva.areaId})`);
      });
    } catch (error: any) {
      console.error('❌ ERROR CRÍTICO al cargar reservas:', error);
      console.error('❌ Stack trace:', error?.stack);
      console.error('❌ Tipo de error:', typeof error);
      console.error('❌ Error completo:', JSON.stringify(error, null, 2));
      
      // Debug específico para problemas de autorización
      if (error.response?.status === 401) {
        console.error('🚫 ERROR 401: No autorizado - problema de autenticación');
        console.error('🔑 Token actual:', localStorage.getItem('token'));
        console.error('👤 Usuario actual:', user);
      } else if (error.response?.status === 403) {
        console.error('🚫 ERROR 403: Prohibido - problema de permisos por rol');
        console.error('👤 Rol de usuario:', user?.role);
        console.error('🔐 Este rol no tiene permisos para ver reservas');
      } else if (error.response?.status === 404) {
        console.error('🚫 ERROR 404: Endpoint no encontrado');
      }
      
      // Re-lanzar el error para que sea manejado por el useEffect
      throw error;
    } finally {
      console.log('🏁 Finalizando cargarReservas() - PASO FINAL');
      setLoadingReservas(false);
    }
  };

  // Horarios disponibles (cada 2 horas)
  const horariosDisponibles = [
    '08:00-10:00',
    '10:00-12:00',
    '12:00-14:00',
    '14:00-16:00',
    '16:00-18:00',
    '18:00-20:00',
    '20:00-22:00'
  ];

  // 🔒 VALIDACIONES PARA PREVENIR DUPLICADOS
  
  // Verificar si la fecha es pasada
  const esFechaPasada = (fecha: string): boolean => {
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    return fechaSeleccionada < hoy;
  };

  // Verificar solapamiento de horarios y reservas duplicadas exactas
  const verificarSolapamiento = (fecha: string, horaInicio: string, horaFin: string): { 
    hayConflicto: boolean; 
    conflicto?: ReservaCalendario;
    esDuplicadoExacto: boolean;
  } => {
    const horaInicioNum = parseInt(horaInicio.replace(':', ''));
    const horaFinNum = parseInt(horaFin.replace(':', ''));
    
    const conflicto = reservas.find(reserva => {
      if (reserva.fecha !== fecha || reserva.areaId !== areaSeleccionada) return false;
      
      const reservaInicioNum = parseInt(reserva.horaInicio.replace(':', ''));
      const reservaFinNum = parseInt(reserva.horaFin.replace(':', ''));
      
      // 🚫 VERIFICAR DUPLICADO EXACTO: misma fecha, área, hora inicio y hora fin
      const esDuplicadoExacto = (
        reserva.fecha === fecha &&
        reserva.areaId === areaSeleccionada &&
        reserva.horaInicio === horaInicio &&
        reserva.horaFin === horaFin &&
        reserva.estado !== 'cancelada'
      );
      
      if (esDuplicadoExacto) {
        console.log('🚫 DUPLICADO EXACTO DETECTADO:', {
          fecha,
          areaId: areaSeleccionada,
          horaInicio,
          horaFin,
          reservaExistente: reserva
        });
        return true;
      }
      
      // Verificar solapamiento: nueva reserva inicia antes de que termine otra, o termina después de que inicie otra
      return (horaInicioNum < reservaFinNum && horaFinNum > reservaInicioNum);
    });
    
    // Verificar si es duplicado exacto
    const esDuplicadoExacto = conflicto ? (
      conflicto.fecha === fecha &&
      conflicto.areaId === areaSeleccionada &&
      conflicto.horaInicio === horaInicio &&
      conflicto.horaFin === horaFin &&
      conflicto.estado !== 'cancelada'
    ) : false;
    
    return {
      hayConflicto: !!conflicto,
      conflicto: conflicto,
      esDuplicadoExacto: esDuplicadoExacto
    };
  };

  // Verificar límite de reservas por usuario (máximo 3 por mes)
  const verificarLimiteReservas = (fecha: string): { 
    excedeLimite: boolean; 
    reservasDelMes: number 
  } => {
    const fechaObj = new Date(fecha);
    const mesActual = fechaObj.getMonth();
    const añoActual = fechaObj.getFullYear();
    
    const reservasDelMes = reservas.filter(reserva => {
      if (reserva.usuarioId !== user?.id) return false;
      const fechaReserva = new Date(reserva.fecha);
      return fechaReserva.getMonth() === mesActual && fechaReserva.getFullYear() === añoActual;
    }).length;
    
    return {
      excedeLimite: reservasDelMes >= 3,
      reservasDelMes: reservasDelMes
    };
  };

  // Verificar si el usuario ya tiene una reserva en la misma fecha
  const tieneReservaEnFecha = (fecha: string): boolean => {
    return reservas.some(reserva => 
      reserva.fecha === fecha && 
      reserva.usuarioId === user?.id &&
      reserva.estado !== 'cancelada'
    );
  };

  // Datos de ejemplo para el calendario
  // COMENTADO: Este useEffect causaba llamadas duplicadas
  // useEffect(() => {
  //   cargarReservas();
  // }, []);

  // Seleccionar la primera área disponible automáticamente
  useEffect(() => {
    if (areasDisponibles.length > 0 && !areaSeleccionada) {
      const primeraArea = areasDisponibles[0];
      console.log('🎯 Seleccionando área automáticamente:', primeraArea);
      setAreaSeleccionada(primeraArea.id);
    }
  }, [areasDisponibles, areaSeleccionada]);
  
  // Debug cuando cambia el área seleccionada
  useEffect(() => {
    if (areaSeleccionada) {
      console.log('🔄 Área seleccionada cambiada a:', areaSeleccionada);
      console.log('📋 Todas las reservas disponibles:', reservas);
      console.log('🏢 Todas las áreas disponibles:', areasDisponibles);
      
      // Verificar si hay reservas para esta área específica
      const reservasParaArea = reservas.filter(r => r.areaId === areaSeleccionada);
      console.log(`🎯 Reservas específicas para área ${areaSeleccionada}:`, reservasParaArea);
    }
  }, [areaSeleccionada, reservas, areasDisponibles]);

  // Cargar datos reales cuando las áreas estén disponibles - SOLO UNA VEZ
  useEffect(() => {
    let executed = false; // Flag para evitar ejecución múltiple
    
    // Solo ejecutar cuando tengamos áreas y no se haya ejecutado antes
    if (areasDisponibles.length > 0 && !loadingReservas && !executed) {
      executed = true;
      console.log('🔄 INICIANDO CARGA DE DATOS REALES ÚNICO...');
      console.log('🧪 Usuario actual:', user?.email);
      console.log('🧪 Areas disponibles:', areasDisponibles.length);
      
      // Delay para evitar rate limiting
      const timeoutId = setTimeout(() => {
        cargarReservas().catch(error => {
          console.error('❌ Error al cargar datos reales:', error);
          
          // Si es error de rate limiting o cualquier otro error, usar datos de ejemplo
          if (error.status === 429 || error.response?.status === 429) {
            console.log('⚠️ Rate limiting detectado, usando datos de ejemplo como fallback...');
          } else {
            console.log('🧪 Error en API, usando datos de ejemplo como fallback...');
          }
          
          const reservasEjemplo: ReservaCalendario[] = [
            {
              id: 'ejemplo-1',
              fecha: '2025-10-03',
              horaInicio: '18:00',
              horaFin: '19:00',
              areaId: '1', // Área 1 del Salon de Fiestas
              areaNombre: 'Salon de Fiestas',
              usuarioNombre: 'gabriel',
              usuarioId: '5',
              estado: 'confirmada',
              tipo: 'propia'
            }
          ];
          
          setReservas(reservasEjemplo);
          console.log('✅ Datos de ejemplo como fallback agregados:', reservasEjemplo);
        });
      }, 1000); // Delay de 1 segundo para evitar rate limiting
      
      return () => clearTimeout(timeoutId);
    }
  }, [areas.length]); // Solo depender del número de áreas originales, no del procesado

  // Nombres de los meses y días
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Obtener días del mes
  const obtenerDiasDelMes = () => {
    const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
    const diasDelMes = ultimoDia.getDate();
    const diaSemanaPrimerDia = primerDia.getDay();

    const dias = [];

    // Días vacíos del mes anterior
    for (let i = 0; i < diaSemanaPrimerDia; i++) {
      dias.push(null);
    }

    // Días del mes actual
    for (let dia = 1; dia <= diasDelMes; dia++) {
      dias.push(dia);
    }

    return dias;
  };

  // Obtener reservas para una fecha específica
  const obtenerReservasPorFecha = (fecha: string) => {
    const reservasFiltradas = reservas.filter(reserva => {
      const coincideFecha = reserva.fecha === fecha;
      const coincideArea = reserva.areaId === areaSeleccionada;
      
      // Debug para cada reserva
      if (reserva.fecha === fecha) {
        console.log('🔍 Reserva en fecha', fecha, ':', {
          reservaId: reserva.id,
          reservaAreaId: reserva.areaId,
          areaSeleccionada: areaSeleccionada,
          coincideArea: coincideArea,
          reserva: reserva
        });
      }
      
      return coincideFecha && coincideArea;
    });
    
    console.log(`📅 Reservas para ${fecha} en área ${areaSeleccionada}:`, reservasFiltradas);
    return reservasFiltradas;
  };

  // Obtener estado del día (libre, parcial, ocupado)
  const obtenerEstadoDia = (fecha: string) => {
    const reservasDelDia = obtenerReservasPorFecha(fecha);
    const totalHorarios = horariosDisponibles.length;
    const horariosOcupados = reservasDelDia.length;

    if (horariosOcupados === 0) return 'libre';
    if (horariosOcupados === totalHorarios) return 'completo';
    return 'parcial';
  };

  // Obtener color del día según estado
  const obtenerColorDia = (estado: string) => {
    switch (estado) {
      case 'libre': return 'border-green-200 bg-green-50';
      case 'parcial': return 'border-yellow-200 bg-yellow-50';
      case 'completo': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200';
    }
  };

  // Formatear fecha para comparación
  const formatearFecha = (dia: number) => {
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
    const diaStr = dia.toString().padStart(2, '0');
    return `${fechaActual.getFullYear()}-${mes}-${diaStr}`;
  };

  // Verificar si es hoy
  const esHoy = (dia: number) => {
    const hoy = new Date();
    return dia === hoy.getDate() && 
           fechaActual.getMonth() === hoy.getMonth() && 
           fechaActual.getFullYear() === hoy.getFullYear();
  };

  // Obtener el área actual
  const areaActual = areasDisponibles.find(area => area.id === areaSeleccionada);

  // Manejar clic en día con validaciones
  const manejarClicDia = (dia: number) => {
    const fecha = formatearFecha(dia);
    
    // Verificar si la fecha es pasada
    if (esFechaPasada(fecha)) {
      alert('❌ No se pueden crear reservas en fechas pasadas');
      return;
    }
    
    setFechaSeleccionada(fecha);
    setReservaSeleccionada(null);
    setHoraSeleccionada('');
    setModalAbierto(true);
  };

  // Manejar navegación del mes
  const navegarMes = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaActual);
    if (direccion === 'anterior') {
      nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
    } else {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
    }
    setFechaActual(nuevaFecha);
  };



  // Función mejorada para obtener información de disponibilidad
  const obtenerInfoDisponibilidad = (fecha: string, horario: string) => {
    const [inicio, fin] = horario.split('-');
    
    // Verificar todas las validaciones
    const fechaPasada = esFechaPasada(fecha);
    const solapamiento = verificarSolapamiento(fecha, inicio, fin);
    const limiteReservas = verificarLimiteReservas(fecha);
    const yaReservadoEnFecha = tieneReservaEnFecha(fecha);
    
    let disponible = true;
    let motivo = '';
    
    if (fechaPasada) {
      disponible = false;
      motivo = '❌ No se puede reservar en fechas pasadas';
    } else if (solapamiento.esDuplicadoExacto) {
      disponible = false;
      motivo = `🚫 Ya existe una reserva exacta en ${inicio}-${fin} por ${solapamiento.conflicto?.usuarioNombre}`;
    } else if (solapamiento.hayConflicto) {
      disponible = false;
      motivo = `❌ Conflicto de horarios con reserva de ${solapamiento.conflicto?.usuarioNombre} (${solapamiento.conflicto?.horaInicio}-${solapamiento.conflicto?.horaFin})`;
    } else if (limiteReservas.excedeLimite) {
      disponible = false;
      motivo = `❌ Límite alcanzado: ${limiteReservas.reservasDelMes}/3 reservas este mes`;
    }
    
    return {
      disponible,
      motivo,
      fechaPasada,
      solapamiento: solapamiento.hayConflicto,
      esDuplicadoExacto: solapamiento.esDuplicadoExacto,
      excedeLimite: limiteReservas.excedeLimite,
      reservasDelMes: limiteReservas.reservasDelMes,
      yaReservadoEnFecha
    };
  };

  // Crear nueva reserva con validaciones completas
  const crearReserva = async () => {
    if (!horaSeleccionada || !fechaSeleccionada) {
      alert('❌ Por favor selecciona una fecha y hora');
      return;
    }

    // 🔒 VALIDACIONES ANTES DE ENVIAR AL BACKEND
    const [inicio, fin] = horaSeleccionada.split('-');
    const infoDisponibilidad = obtenerInfoDisponibilidad(fechaSeleccionada, horaSeleccionada);
    
    console.log('🔍 VALIDACIÓN DE RESERVA:', {
      fecha: fechaSeleccionada,
      horario: horaSeleccionada,
      area: areaSeleccionada,
      usuario: user?.email,
      infoDisponibilidad: infoDisponibilidad
    });
    
    if (!infoDisponibilidad.disponible) {
      console.error('🚫 RESERVA BLOQUEADA:', infoDisponibilidad.motivo);
      
      // Mostrar mensaje específico para duplicados exactos
      if (infoDisponibilidad.esDuplicadoExacto) {
        alert(`🚫 DUPLICADO DETECTADO\n\nYa existe una reserva exacta para:\n• Fecha: ${fechaSeleccionada}\n• Horario: ${horaSeleccionada}\n• Área: ${areaActual?.nombre}\n\nNo se pueden crear reservas duplicadas.`);
      } else {
        alert(infoDisponibilidad.motivo);
      }
      return;
    }
    
    // Confirmación adicional para reservas del mismo día
    if (infoDisponibilidad.yaReservadoEnFecha) {
      const confirmar = confirm(
        `⚠️ Ya tienes una reserva para el ${fechaSeleccionada}. ¿Deseas crear otra reserva para la misma fecha?`
      );
      if (!confirmar) return;
    }
    
    // Mostrar información de límite de reservas
    if (infoDisponibilidad.reservasDelMes >= 2) {
      const confirmar = confirm(
        `ℹ️ Esta será tu reserva ${infoDisponibilidad.reservasDelMes + 1}/3 del mes. ¿Continuar?`
      );
      if (!confirmar) return;
    }

    try {
      // Crear objeto de reserva para el backend
      const nuevaReservaData = {
        areaComunId: parseInt(areaSeleccionada), // Convertir a número
        fechaReserva: fechaSeleccionada,
        horaInicio: inicio,
        horaFin: fin,
        numeroPersonas: 1, // Por defecto, se puede hacer configurable
        observaciones: `Reserva desde calendario - ${areaActual?.nombre}`
      };

      console.log('🔄 Creando reserva con validaciones anti-duplicado:', nuevaReservaData);
      console.log('✅ Validaciones pasadas:', infoDisponibilidad);
      
      // Llamar al API para crear la reserva con Stripe
      const response = await apiService.createReservaWithStripe(nuevaReservaData);
      console.log('✅ Reserva creada:', response);

      if (response.stripe?.checkoutUrl) {
        // Cerrar modal antes de redirigir
        setModalAbierto(false);
        
        // Redirigir a Stripe Checkout
        console.log('🚀 Redirigiendo a Stripe Checkout:', response.stripe.checkoutUrl);
        window.location.href = response.stripe.checkoutUrl;
      } else {
        // Si no hay URL de Stripe, la reserva se creó directamente
        alert('✅ Reserva creada exitosamente');
        setModalAbierto(false);
        // Recargar reservas para mostrar la nueva
        cargarReservas();
      }
      
      if (onNuevaReserva) {
        onNuevaReserva(fechaSeleccionada, horaSeleccionada, areaSeleccionada);
      }
    } catch (error: any) {
      console.error('❌ Error al crear reserva:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear la reserva';
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header del calendario */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Calendario de Áreas Comunes
            </h2>
            <p className="text-blue-100 mt-1">Reserva y gestiona los espacios compartidos</p>
          </div>
        </div>
      </div>

      {/* Mostrar loading o contenido */}
      {areasDisponibles.length === 0 ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando áreas comunes...</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row">
        {/* Sidebar con áreas */}
        {!mostrarSoloCalendario && (
          <div className="lg:w-80 bg-gray-50 p-6 border-r border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Áreas Disponibles</h3>
              <div className="space-y-2">
                {areasDisponibles.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => setAreaSeleccionada(area.id)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                      areaSeleccionada === area.id
                        ? 'bg-blue-500 text-white shadow-md transform scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{area.emoji}</span>
                      <div>
                        <div className="font-medium">{area.nombre}</div>
                        <div className={`text-sm ${
                          areaSeleccionada === area.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          Capacidad: {area.capacidad} personas
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Leyenda mejorada */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">Leyenda del Calendario</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
                  <span>Día Libre</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-50 border-2 border-yellow-200 rounded"></div>
                  <span>Parcialmente Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded"></div>
                  <span>Día Completo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-50 border-2 border-purple-500 rounded"></div>
                  <span>Hoy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded opacity-50"></div>
                  <span>Fecha Pasada</span>
                </div>
                <hr className="my-2" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Tu Reserva</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Ocupado por Otros</span>
                </div>
                <hr className="my-2" />
                <div className="text-xs text-gray-600">
                  <p className="mb-1">🔒 <strong>Límites:</strong></p>
                  <p>• Máximo 3 reservas por mes</p>
                  <p>• No solapamiento de horarios</p>
                  <p>• No se permiten fechas pasadas</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Área del calendario */}
        <div className="flex-1 p-6">
          {/* Header de navegación del mes */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              {areaActual?.emoji} {areaActual?.nombre}
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navegarMes('anterior')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-medium text-gray-700">
                {nombresMeses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
              </span>
              <button
                onClick={() => navegarMes('siguiente')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Grid del calendario */}
          <div className="grid grid-cols-7 gap-2">
            {/* Headers de días */}
            {nombresDias.map((dia) => (
              <div key={dia} className="text-center font-medium text-gray-500 py-2">
                {dia}
              </div>
            ))}

            {/* Días del mes */}
            {obtenerDiasDelMes().map((dia, index) => {
              if (!dia) {
                return <div key={`empty-${index}`} className="aspect-square"></div>;
              }

              const fecha = formatearFecha(dia);
              const reservasDelDia = obtenerReservasPorFecha(fecha);
              const estadoDia = obtenerEstadoDia(fecha);
              const colorDia = obtenerColorDia(estadoDia);
              const esHoyDia = esHoy(dia);
              const fechaPasada = esFechaPasada(fecha);
              const limiteInfo = verificarLimiteReservas(fecha);

              return (
                <div
                  key={`dia-${fechaActual.getMonth()}-${dia}`}
                  onClick={() => manejarClicDia(dia)}
                  className={`aspect-square border-2 rounded-lg p-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${
                    fechaPasada
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                      : esHoyDia
                      ? 'border-purple-500 border-4 bg-purple-50 cursor-pointer'
                      : `${colorDia} cursor-pointer`
                  }`}
                  title={fechaPasada ? 'Fecha pasada - No disponible' : `${reservasDelDia.length} reservas`}
                >
                  <div className="h-full flex flex-col">
                    <div className={`font-medium text-sm ${
                      fechaPasada 
                        ? 'text-gray-400' 
                        : esHoyDia 
                        ? 'text-purple-600' 
                        : 'text-gray-700'
                    }`}>
                      {dia}
                      {limiteInfo.excedeLimite && !fechaPasada && (
                        <span className="text-xs block text-red-500">Límite</span>
                      )}
                    </div>
                    
                    {!fechaPasada && (
                      <div className="flex-1 mt-1">
                        {/* Indicador de estado del día */}
                        {estadoDia !== 'libre' && (
                          <div className="text-center mb-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              estadoDia === 'completo' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></span>
                          </div>
                        )}
                        
                        {/* Lista de reservas del día */}
                        {reservasDelDia.slice(0, 2).map((reserva, idx) => (
                          <div
                            key={`reserva-${reserva.id}-${idx}`}
                            className={`text-xs p-1 rounded mb-1 truncate ${
                              reserva.tipo === 'propia'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                            title={`${reserva.horaInicio}-${reserva.horaFin} - ${reserva.usuarioNombre}`}
                          >
                            {reserva.horaInicio} {reserva.tipo === 'propia' ? '(Tuya)' : reserva.usuarioNombre}
                          </div>
                        ))}
                        
                        {/* Mostrar "+ más" si hay más reservas */}
                        {reservasDelDia.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{reservasDelDia.length - 2} más
                          </div>
                        )}
                        
                        {/* Mostrar estado si no hay reservas */}
                        {reservasDelDia.length === 0 && (
                          <div className="text-xs text-green-600 text-center mt-2">
                            Libre
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Mostrar indicador para fechas pasadas */}
                    {fechaPasada && (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-xs text-gray-400">Pasada</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      )}

      {/* Modal para crear/ver reservas */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Reservas para {fechaSeleccionada}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Área: <span className="font-medium">{areaActual?.nombre}</span>
                </p>
                
                {/* Estado del día */}
                {(() => {
                  const estadoDia = obtenerEstadoDia(fechaSeleccionada);
                  const reservasDelDia = obtenerReservasPorFecha(fechaSeleccionada);
                  const horariosLibres = horariosDisponibles.length - reservasDelDia.length;
                  
                  return (
                    <div className={`p-3 rounded-lg border-2 mb-4 ${
                      estadoDia === 'libre' ? 'border-green-200 bg-green-50' :
                      estadoDia === 'parcial' ? 'border-yellow-200 bg-yellow-50' :
                      'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {estadoDia === 'libre' ? '✅ Día Libre' :
                           estadoDia === 'parcial' ? '🟡 Parcialmente Ocupado' :
                           '🔴 Día Completo'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {horariosLibres} de {horariosDisponibles.length} horarios libres
                        </span>
                      </div>
                    </div>
                  );
                })()}</div>

              {/* Lista de horarios con validaciones mejoradas */}
              <div className="space-y-2 mb-6">
                <h4 className="font-medium text-gray-700">Horarios disponibles:</h4>
                
                {/* Mostrar advertencias si es necesario */}
                {esFechaPasada(fechaSeleccionada) && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                    ⚠️ No se pueden crear reservas en fechas pasadas
                  </div>
                )}
                
                {(() => {
                  const limiteInfo = verificarLimiteReservas(fechaSeleccionada);
                  if (limiteInfo.excedeLimite) {
                    return (
                      <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-700 text-sm">
                        ⚠️ Has alcanzado el límite de {limiteInfo.reservasDelMes}/3 reservas este mes
                      </div>
                    );
                  } else if (limiteInfo.reservasDelMes >= 2) {
                    return (
                      <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-700 text-sm">
                        ℹ️ Tienes {limiteInfo.reservasDelMes}/3 reservas este mes
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {horariosDisponibles.map((horario) => {
                  const infoDisponibilidad = obtenerInfoDisponibilidad(fechaSeleccionada, horario);
                  const reservaEnHorario = reservas.find(r => 
                    r.fecha === fechaSeleccionada && 
                    r.areaId === areaSeleccionada && 
                    r.horaInicio === horario.split('-')[0]
                  );

                  return (
                    <div
                      key={horario}
                      onClick={() => infoDisponibilidad.disponible && setHoraSeleccionada(horario)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        horaSeleccionada === horario
                          ? 'border-blue-500 bg-blue-50 cursor-pointer'
                          : infoDisponibilidad.disponible
                          ? 'border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer'
                          : 'border-red-500 bg-red-50 cursor-not-allowed'
                      }`}
                      title={!infoDisponibilidad.disponible ? infoDisponibilidad.motivo : 'Hacer clic para seleccionar'}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{horario}</span>
                        
                        {/* Mostrar información de estado */}
                        {!infoDisponibilidad.disponible ? (
                          <div className="text-right">
                            {reservaEnHorario ? (
                              <span className="text-sm text-red-600">
                                {reservaEnHorario.tipo === 'propia' ? '🔒 Tu reserva' : `👤 ${reservaEnHorario.usuarioNombre}`}
                              </span>
                            ) : (
                              <span className="text-sm text-red-600">
                                {infoDisponibilidad.esDuplicadoExacto ? '🚫 Duplicado exacto' :
                                 infoDisponibilidad.fechaPasada ? '📅 Fecha pasada' :
                                 infoDisponibilidad.excedeLimite ? '🚫 Límite alcanzado' :
                                 infoDisponibilidad.yaReservadoEnFecha ? '⚠️ Ya reservado hoy' :
                                 infoDisponibilidad.solapamiento ? '⚡ Conflicto de horarios' :
                                 '❌ No disponible'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            ✅ Disponible
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                {(() => {
                  if (!horaSeleccionada) return null;
                  
                  const infoDisponibilidad = obtenerInfoDisponibilidad(fechaSeleccionada, horaSeleccionada);
                  
                  if (infoDisponibilidad.disponible) {
                    return (
                      <button
                        onClick={crearReserva}
                        className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                      >
                        <Plus className="h-4 w-4" />
                        Reservar {horaSeleccionada}
                      </button>
                    );
                  } else {
                    return (
                      <button
                        disabled
                        className="flex-1 py-2 px-4 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                        title={infoDisponibilidad.motivo}
                      >
                        <Plus className="h-4 w-4" />
                        No disponible
                      </button>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioAreasComunes;