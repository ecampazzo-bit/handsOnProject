# HandsOn - Aplicación Mobile

Aplicación móvil React Native con TypeScript para conectar técnicos/profesionales con clientes que necesitan servicios.

## 🚀 Tecnologías

- **React Native** (0.73.2)
- **Expo** (~50.0.0)
- **TypeScript** (5.3.3)
- **React Navigation** (v6)
- **Supabase** (Auth + Database)
- **React Hook Form** + **Yup** (Validación de formularios)
- **AsyncStorage** (Persistencia local)

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Expo CLI instalado globalmente: `npm install -g expo-cli`
- Cuenta de Supabase con proyecto configurado
- Para desarrollo iOS: macOS con Xcode
- Para desarrollo Android: Android Studio

## ⚙️ Configuración

### 1. Instalar Dependencias

```bash
cd mobile
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto `mobile/` con las siguientes variables:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

**Importante**: Reemplaza los valores con tus credenciales de Supabase. Puedes encontrarlas en tu proyecto de Supabase:
- Dashboard → Settings → API → Project URL y anon/public key

### 3. Configurar Permisos de Ubicación

La aplicación requiere permisos de ubicación para técnicos. Los permisos ya están configurados en `app.json`, pero asegúrate de que:

- **iOS**: El archivo `Info.plist` tiene la descripción de permisos (se genera automáticamente con Expo)
- **Android**: Los permisos están en `app.json` (ya configurados)

## 🏃 Ejecutar la Aplicación

### Desarrollo

```bash
npm start
```

Luego:
- Presiona `i` para abrir en iOS Simulator
- Presiona `a` para abrir en Android Emulator
- Escanea el QR con la app Expo Go en tu dispositivo físico

### Plataformas Específicas

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📁 Estructura del Proyecto

```
mobile/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── ServiceCard.tsx
│   ├── constants/           # Constantes y configuraciones
│   │   ├── colors.ts
│   │   └── services.ts
│   ├── navigation/          # Configuración de navegación
│   │   └── AuthNavigator.tsx
│   ├── screens/             # Pantallas de la aplicación
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── ServiceSelectionScreen.tsx
│   ├── services/            # Servicios y APIs
│   │   ├── supabaseClient.ts
│   │   └── authService.ts
│   ├── types/               # Definiciones de tipos TypeScript
│   │   └── navigation.ts
│   └── utils/               # Utilidades y helpers
│       └── validation.ts
├── App.tsx                  # Componente principal
├── app.json                 # Configuración de Expo
├── package.json
├── tsconfig.json            # Configuración de TypeScript
└── .env                     # Variables de entorno (no commitear)
```

## 📱 Funcionalidades Implementadas

### ✅ Parte 1 - Autenticación y Registro

- [x] **Pantalla de Login**
  - Validación de email y contraseña
  - Integración con Supabase Auth
  - Manejo de errores
  - Persistencia de sesión

- [x] **Pantalla de Registro (Multipaso)**
  - Paso 1: Información personal (nombre, apellido, email, teléfono, contraseña)
  - Paso 2: Selección de tipo de usuario (Cliente/Técnico)
  - Paso 3: Información adicional para técnicos (dirección, ubicación GPS)
  - Validación robusta con Yup
  - Integración con Supabase (users + prestadores)

- [x] **Pantalla de Selección de Servicios**
  - Solo para usuarios tipo "Técnico"
  - Lista de todas las categorías y servicios
  - Búsqueda de servicios
  - Selección múltiple con checkboxes
  - Guardado en tabla `prestador_servicios`

## 🔐 Base de Datos

La aplicación está configurada para trabajar con las siguientes tablas de Supabase:

- `users` - Usuarios del sistema
- `prestadores` - Información de técnicos/prestadores
- `prestador_servicios` - Relación muchos a muchos entre prestadores y servicios
- `servicios` - Catálogo de servicios disponibles
- `categorias` - Categorías de servicios

**Nota**: Asegúrate de que estas tablas estén creadas en tu proyecto de Supabase. Consulta el archivo `database_schema.sql` en la raíz del proyecto para ver el esquema completo.

## 🎨 Componentes Reutilizables

### Button
Props: `title`, `onPress`, `variant` (primary/secondary/outline), `loading`, `disabled`

### Input
Props: `value`, `onChangeText`, `placeholder`, `secureTextEntry`, `error`, `icon`, etc.

### ServiceCard
Props: `serviceName`, `isSelected`, `onToggle`

## 🔄 Flujo de Navegación

```
Login Screen
  ↓ (¿No tienes cuenta?)
Register Screen (Paso 1 → Paso 2 → Paso 3)
  ↓ (Si es técnico)
Service Selection Screen
  ↓ (Guardar servicios)
Home Screen (TODO)
```

## 🐛 Solución de Problemas

### Error: "Missing Supabase credentials"
- Verifica que el archivo `.env` existe y tiene las variables correctas
- Asegúrate de que las variables comienzan con `EXPO_PUBLIC_`

### Error de permisos de ubicación
- En iOS: Verifica que el dispositivo/simulador tenga permisos de ubicación habilitados
- En Android: Verifica que los permisos están en `app.json`

### Error al conectar con Supabase
- Verifica que las credenciales son correctas
- Asegúrate de que el proyecto de Supabase está activo
- Verifica que las tablas necesarias existen en tu base de datos

## 📝 Próximos Pasos (Parte 2)

- [ ] Pantalla principal (Home)
- [ ] Perfil de usuario
- [ ] Búsqueda de servicios/prestadores
- [ ] Creación de solicitudes de servicio
- [ ] Sistema de mensajería
- [ ] Calificaciones
- [ ] Gestión de trabajos

## 📄 Licencia

Este proyecto es privado.

## 👥 Desarrollo

Para más información sobre la estructura de la base de datos, consulta `DOCUMENTACION_BASE_DATOS.md` en la raíz del proyecto.





