# 🏙️ CityLights Frontend

Frontend moderno para el sistema de gestión integral CityLights, desarrollado con **React + TypeScript + Vite** y conectado a microservicios en Railway.

## 🚀 **¿Qué es CityLights Frontend?**

Es la interfaz de usuario del sistema CityLights que permite:
- 🔐 **Autenticación segura** de usuarios con roles
- 📅 **Reservas de áreas comunes** (piscina, salón, gym, etc.)
- 💰 **Gestión de nómina** y pagos de empleados  
- 📊 **Reportes financieros** en PDF y Excel
- 🏢 **Administración** de condominios y departamentos

## 🏗️ **Arquitectura Frontend**

### **Stack Tecnológico:**
- ⚛️ **React 18** - Biblioteca principal
- 📘 **TypeScript** - Tipado estático
- ⚡ **Vite** - Build tool ultrarrápido
- 🎨 **Tailwind CSS** - Estilos utility-first
- 📡 **Axios** - Cliente HTTP
- 🔀 **React Router** - Navegación SPA
- 📄 **jsPDF + XLSX** - Generación de reportes

### **Conectividad:**
```
Frontend (localhost:5173) 
    ↓ HTTPS
🌐 Railway Gateway 
    ↓ Proxy routing
📦 Microservicios (login, booking, nomina)
    ↓ 
🗄️ Neon PostgreSQL Databases
```

## 📁 **Estructura del Proyecto**

```
src/
├── 📁 pages/                    # Páginas organizadas por módulo
│   ├── 📁 auth/                # 🔐 Autenticación
│   │   ├── LoginPage.tsx       # Inicio de sesión
│   │   ├── RegisterPage.tsx    # Registro de usuarios
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   └── index.ts           # Barrel exports
│   │
│   ├── 📁 booking/            # 📅 Reservas & Áreas Comunes
│   │   ├── ReservasPage.tsx   # Lista de reservas
│   │   ├── AreasComunesUserPage.tsx    # Vista usuario
│   │   ├── AreasComunesAdminPage.tsx   # Vista admin
│   │   ├── AreasComunesSuperPage.tsx   # Vista super admin
│   │   ├── BookingFacturasPage.tsx     # Facturas de reservas
│   │   └── index.ts
│   │
│   ├── 📁 nomina/             # 💰 Nómina & Reportes
│   │   ├── PagosPage.tsx      # Gestión de pagos
│   │   ├── ReportesPage.tsx   # Reportes financieros
│   │   └── index.ts
│   │
│   └── 📁 shared/             # 🏠 Páginas Generales
│       ├── HomePage.tsx       # Landing page
│       ├── DashboardPageNew.tsx # Dashboard principal
│       └── index.ts
│
├── 📁 components/             # Componentes reutilizables
│   ├── 📁 AreasComunes/       # Componentes de áreas comunes
│   ├── 📁 Layout/             # Layouts de página
│   ├── ProtectedRoute.tsx     # Rutas protegidas
│   └── ...
│
├── 📁 context/                # Context API
│   └── AuthContext.tsx        # Estado global de autenticación
│
├── 📁 services/               # Servicios de API
│   └── api.ts                 # Cliente HTTP configurado
│
└── 📁 types/                  # Definiciones TypeScript
    └── ...
```

## 🔧 **Instalación y Desarrollo**

### **Prerrequisitos:**
- 📦 **Node.js** >= 16
- 📦 **npm** o **yarn**

### **Pasos de instalación:**

```bash
# 1. Clonar el repositorio
git clone https://github.com/GabitoProgram/citylights-frontend.git
cd citylights-frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:5173
```

### **Scripts disponibles:**
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Vista previa del build
npm run lint     # Linting con ESLint
```

## 🌐 **Configuración de API**

El frontend se conecta automáticamente a los microservicios desplegados en Railway:

```typescript
// src/services/api.ts
const API_BASE = 'https://citylights-gateway-production.up.railway.app/api/proxy'

// Endpoints disponibles:
// 🔐 Auth:     /auth/*
// 📅 Booking:  /booking/*  
// 💰 Nomina:   /nomina/*
```

## 👥 **Sistema de Roles**

### **Tipos de Usuario:**

1. **👤 Usuario Casual** - Residentes
   - Ver y reservar áreas comunes
   - Ver sus propias reservas
   - Realizar pagos

2. **🛡️ Usuario Admin** - Administradores  
   - Gestionar todas las reservas
   - Administrar áreas comunes
   - Ver reportes básicos

3. **👑 Super Usuario** - Administración Total
   - Gestión completa de nómina
   - Reportes financieros avanzados
   - Administración de usuarios
   - Acceso total al sistema

## 📱 **Características Principales**

### **🔐 Autenticación:**
- ✅ Login/Registro seguro
- ✅ Verificación por email
- ✅ Recuperación de contraseña
- ✅ JWT tokens con refresh automático
- ✅ Roles y permisos granulares

### **📅 Sistema de Reservas:**
- ✅ Calendario interactivo
- ✅ Reserva de áreas comunes (piscina, gym, salón)
- ✅ Pagos integrados con Stripe
- ✅ Facturas automáticas en PDF
- ✅ Notificaciones por email

### **💰 Gestión de Nómina:**
- ✅ Crear y gestionar empleados
- ✅ Generar nóminas automáticas
- ✅ Procesar pagos
- ✅ Historial completo

### **📊 Reportes Financieros:**
- ✅ Reportes por fechas personalizables
- ✅ Exportación a PDF profesional
- ✅ Exportación a Excel con múltiples hojas
- ✅ Gráficos y métricas en tiempo real

## 🎨 **UI/UX Design**

### **Design System:**
- 🎨 **Colores:** Paleta púrpura profesional
- 📱 **Responsive:** Mobile-first design
- ♿ **Accesibilidad:** WCAG guidelines
- 🌙 **Dark mode:** Próximamente

### **Componentes:**
- 📋 **Forms:** Validación en tiempo real
- 📊 **Charts:** Gráficos interactivos
- 🏷️ **Tables:** Paginación y filtros
- 🔔 **Notifications:** Toasts y alertas
- 📑 **Modals:** Confirmaciones elegantes

## 🚀 **Deploy y Producción**

### **Build de Producción:**
```bash
npm run build
```

### **Variables de Entorno:**
```env
VITE_API_BASE_URL=https://citylights-gateway-production.up.railway.app/api/proxy
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### **Hosting Recomendado:**
- ✅ **Vercel** (recomendado)
- ✅ **Netlify** 
- ✅ **Railway** (static sites)

## 🔒 **Seguridad**

- 🛡️ **Autenticación JWT** con refresh tokens
- 🔒 **Rutas protegidas** por rol
- 🌐 **HTTPS** en todas las comunicaciones
- 🚫 **Sanitización** de inputs
- 🔑 **Variables de entorno** para secrets

## 📈 **Performance**

- ⚡ **Vite:** Build ultrarrápido
- 📦 **Code splitting:** Carga lazy por rutas
- 🗜️ **Tree shaking:** Bundle optimizado
- 💾 **Caching:** Estrategias de caché inteligentes
- 📊 **Lighthouse Score:** 90+ en todas las métricas

## 🤝 **Contribuir**

```bash
# 1. Fork del repositorio
# 2. Crear rama feature
git checkout -b feature/nueva-funcionalidad

# 3. Commits descriptivos
git commit -m "feat: agregar nueva funcionalidad X"

# 4. Push y Pull Request
git push origin feature/nueva-funcionalidad
```

## 📞 **API Integration**

### **Consumo desde Apps Externas:**

```javascript
// Ejemplo para developers externos
const API_BASE = 'https://citylights-gateway-production.up.railway.app/api/proxy';

// 1. Autenticación
const response = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});

const { access_token } = await response.json();

// 2. Usar token en requests
const reservas = await fetch(`${API_BASE}/booking/reservas`, {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

## 🐛 **Troubleshooting**

### **Problemas Comunes:**

1. **Error de CORS:**
   - ✅ Verificar que el Gateway esté funcionando
   - ✅ Revisar headers de autorización

2. **Build falla:**
   - ✅ Limpiar node_modules: `rm -rf node_modules && npm install`
   - ✅ Verificar versión de Node >= 16

3. **Rutas no funcionan:**
   - ✅ Limpiar caché: `Ctrl + Shift + R`
   - ✅ Verificar estructura de carpetas

## 📄 **Licencia**

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 **Autor**

**Gabriel (GabitoProgram)**
- 🐙 GitHub: [@GabitoProgram](https://github.com/GabitoProgram)
- 📧 Email: [contacto]

---

⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐