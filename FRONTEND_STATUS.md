# 🏨 CityLights Frontend - Sistema Completo de Gestión

Sistema integral de gestión de edificios y áreas comunes con React, TypeScript, Vite y Tailwind CSS.

## ✅ Funcionalidades Implementadas

### 🔐 Sistema de Autenticación
- ✅ Login/Registro con JWT
- ✅ Verificación por email
- ✅ Sistema de roles jerárquico (SUPER_USER, USER_ADMIN, USER_CASUAL)
- ✅ Rutas protegidas por rol
- ✅ Manejo automático de tokens (refresh token)

### 🏢 Gestión de Áreas Comunes
- ✅ CRUD completo de áreas comunes
- ✅ Información detallada (capacidad, precio, horarios, equipamiento)
- ✅ Estado disponible/no disponible
- ✅ Validación por permisos de rol

### 📅 Sistema de Reservas
- ✅ Crear, editar y eliminar reservas
- ✅ Cálculo automático de precios basado en horas
- ✅ Estados de reserva (PENDIENTE, CONFIRMADA, CANCELADA, COMPLETADA)
- ✅ Información completa del usuario y área
- ✅ Validaciones de horarios y disponibilidad

### 💳 Gestión de Pagos
- ✅ Registro de pagos con múltiples métodos (EFECTIVO, TARJETA, TRANSFERENCIA, OTRO)
- ✅ Estados de pago (PENDIENTE, COMPLETADO, FALLIDO, REEMBOLSADO)
- ✅ Referencias y comprobantes
- ✅ Dashboard con estadísticas de pagos
- ✅ Integración con sistema de facturación

### 🧾 Sistema de Facturas
- ✅ Generación automática de facturas PDF
- ✅ Descarga de facturas
- ✅ Regeneración de PDFs
- ✅ Estados de factura (GENERADA, ENVIADA, PAGADA, ANULADA)
- ✅ Cálculo automático de IVA
- ✅ Información detallada del pago asociado

### 🎨 Interfaz de Usuario
- ✅ Layout responsive con sidebar y navbar
- ✅ Navegación intuitiva entre módulos
- ✅ Indicadores visuales de permisos por rol
- ✅ Modales para creación/edición
- ✅ Tablas con acciones contextuales
- ✅ Dashboards con estadísticas

## 🔧 APIs Integradas

### Gateway Routes (Puerto 3000)
```
POST   /api/proxy/auth/login              - Inicio de sesión
POST   /api/proxy/auth/register           - Registro de usuarios
POST   /api/proxy/auth/verify-email       - Verificación de email
GET    /api/proxy/users/me               - Perfil del usuario
PUT    /api/proxy/users/profile          - Actualizar perfil
POST   /api/proxy/upload/avatar          - Subir avatar
```

### Booking Service Routes (Puerto 3004 via Gateway)
```
# Áreas Comunes
GET    /api/proxy/booking-copia/booking              - Listar áreas
POST   /api/proxy/booking-copia/booking              - Crear área
GET    /api/proxy/booking-copia/booking/{id}         - Obtener área
PUT    /api/proxy/booking-copia/booking/{id}         - Actualizar área
DELETE /api/proxy/booking-copia/booking/{id}         - Eliminar área

# Reservas
GET    /api/proxy/booking-copia/reserva              - Listar reservas
POST   /api/proxy/booking-copia/reserva              - Crear reserva
GET    /api/proxy/booking-copia/reserva/{id}         - Obtener reserva
PUT    /api/proxy/booking-copia/reserva/{id}         - Actualizar reserva
DELETE /api/proxy/booking-copia/reserva/{id}         - Eliminar reserva

# Pagos
GET    /api/proxy/booking-copia/pago-reserva         - Listar pagos
POST   /api/proxy/booking-copia/pago-reserva         - Registrar pago
GET    /api/proxy/booking-copia/pago-reserva/{id}    - Obtener pago
PUT    /api/proxy/booking-copia/pago-reserva/{id}    - Actualizar pago

# Facturas
GET    /api/proxy/booking-copia/factura              - Listar facturas
POST   /api/proxy/booking-copia/factura/generar/{pagoId} - Generar factura
GET    /api/proxy/booking-copia/factura/{id}         - Obtener factura
GET    /api/proxy/booking-copia/factura/{id}/descargar - Descargar PDF
POST   /api/proxy/booking-copia/factura/{id}/regenerar-pdf - Regenerar PDF

# Confirmaciones
GET    /api/proxy/booking-copia/confirmacion         - Listar confirmaciones
POST   /api/proxy/booking-copia/confirmacion         - Crear confirmación
PUT    /api/proxy/booking-copia/confirmacion/{id}/verificar - Verificar
PUT    /api/proxy/booking-copia/confirmacion/{id}/cancelar - Cancelar

# Bloqueos
GET    /api/proxy/booking-copia/bloqueo              - Listar bloqueos
POST   /api/proxy/booking-copia/bloqueo              - Crear bloqueo
PUT    /api/proxy/booking-copia/bloqueo/{id}         - Actualizar bloqueo
DELETE /api/proxy/booking-copia/bloqueo/{id}         - Eliminar bloqueo

# Auditoría
GET    /api/proxy/booking-copia/auditoria            - Logs de auditoría
GET    /api/proxy/logs                              - Logs del sistema
```

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview

# Linting
npm run lint
```

## 🔐 Sistema de Permisos

### SUPER_USER
- ✅ Acceso completo a todas las funcionalidades
- ✅ Crear, leer, editar y eliminar
- ✅ Gestión de usuarios y roles
- ✅ Acceso a reportes y auditoría

### USER_ADMIN
- ✅ Gestión de áreas comunes y reservas
- ✅ Crear, leer y editar (sin eliminar)
- ✅ Gestión de pagos y facturas
- ✅ Reportes básicos

### USER_CASUAL
- ✅ Solo lectura de información
- ✅ Ver sus propias reservas
- ✅ Acceso limitado al dashboard

## 📁 Estructura de Componentes

```
src/
├── components/
│   ├── AreasComunes/
│   │   └── AreasComunes.tsx         # Gestión completa de áreas
│   ├── Reservas/
│   │   └── Reservas.tsx             # Sistema de reservas
│   ├── Pagos/
│   │   └── Pagos.tsx                # Gestión de pagos
│   ├── Facturas/
│   │   └── Facturas.tsx             # Sistema de facturación
│   ├── Layout/
│   │   └── Layout.tsx               # Layout principal con sidebar
│   └── ProtectedRoute.tsx           # Protección de rutas por rol
├── context/
│   └── AuthContext.tsx              # Contexto de autenticación
├── services/
│   └── api.ts                       # Cliente API completo
├── types/
│   └── index.ts                     # Tipos TypeScript
└── pages/
    ├── DashboardPage.tsx           # Dashboard principal
    ├── LoginPage.tsx               # Página de login
    ├── RegisterPage.tsx            # Página de registro
    └── VerifyEmailPage.tsx         # Verificación de email
```

## 🌐 Integración con Microservicios

El frontend está completamente integrado con los microservicios:

- **Gateway** (Puerto 3000): Punto de entrada único con autenticación centralizada
- **Auth Service** (Puerto 3001): Gestión de usuarios y autenticación
- **Booking Service** (Puerto 3004): Todas las funcionalidades de reservas

## 🎯 Próximos Pasos

- [ ] Implementar sistema de notificaciones en tiempo real
- [ ] Agregar reportes y analytics avanzados
- [ ] Crear sistema de chat interno
- [ ] Implementar funcionalidad de bloqueos de horarios
- [ ] Agregar exportación de datos (Excel, CSV)
- [ ] Implementar sistema de notificaciones por email/SMS

## 🔄 Estado del Proyecto

✅ **COMPLETADO**: El frontend está completamente funcional y consume todos los endpoints disponibles en los microservicios. Todas las funcionalidades principales están implementadas con validación de roles y permisos.