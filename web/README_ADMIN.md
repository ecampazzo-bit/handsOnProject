# Dashboard de Administración - ofiSí

## 📋 Descripción

El dashboard de administración permite gestionar usuarios del sistema, incluyendo la capacidad de activar/desactivar usuarios (prestadores y clientes).

## 🚀 Acceso

1. Navega a: `http://localhost:3000/admin`
2. Serás redirigido automáticamente a `/admin/login` si no estás autenticado
3. Inicia sesión con credenciales de administrador

## 🔐 Autenticación

Por defecto, el sistema reconoce como administrador a usuarios con:
- Email que contenga `@admin.` (ej: `admin@admin.ofisi.com`)
- Email exacto: `admin@ofisi.com`

**Nota**: En producción, deberías implementar un sistema de roles más robusto usando una tabla de roles o un campo `is_admin` en la tabla `users`.

## ✨ Funcionalidades

### 1. Estadísticas
- Total de usuarios
- Usuarios activos/inactivos
- Cantidad de prestadores
- Cantidad de clientes

### 2. Gestión de Usuarios
- **Listar usuarios**: Ver todos los usuarios del sistema
- **Buscar usuarios**: Filtrar por email, nombre o apellido
- **Filtrar por estado**: Activos, inactivos o todos
- **Filtrar por tipo**: Cliente, prestador, ambos o todos
- **Activar/Desactivar usuarios**: Cambiar el estado `activo` de cualquier usuario

### 3. Información Mostrada
Para cada usuario se muestra:
- Nombre completo
- Email
- Teléfono
- Tipo de usuario (cliente/prestador/ambos)
- Estado (activo/inactivo)
- Verificación (sí/no)
- Fecha de registro

## 🗄️ Base de Datos

### Campo `activo`
El campo `activo` ya existe en la tabla `users`:
```sql
activo boolean not null default true
```

### Políticas RLS
Para que los administradores puedan gestionar usuarios, ejecuta el script:
```sql
scripts/crear_politica_admin.sql
```

Este script crea:
- Función `is_admin()` para verificar si un usuario es administrador
- Políticas RLS que permiten a administradores leer y actualizar usuarios

## 🔧 Configuración

### Variables de Entorno
Asegúrate de tener en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

El `SERVICE_ROLE_KEY` es necesario para que el dashboard pueda actualizar usuarios (bypass RLS).

## 📝 Uso

1. **Acceder al dashboard**: `http://localhost:3000/admin`
2. **Iniciar sesión** con credenciales de admin
3. **Ver estadísticas** en la parte superior
4. **Buscar usuarios** usando el campo de búsqueda
5. **Filtrar usuarios** por estado o tipo
6. **Activar/Desactivar** usuarios haciendo clic en el botón correspondiente

## 👤 Crear Usuario Administrador

### Método Recomendado: Desde Supabase Dashboard

1. Ve a **Authentication** → **Users** en Supabase
2. Click en **"Add user"** → **"Create new user"**
3. Completa:
   - **Email**: `admin@ofisi.com` (o cualquier email con `@admin.`)
   - **Password**: (elige una contraseña segura)
   - **Auto Confirm User**: ✅ (marcar)
4. Click en **"Create user"**
5. Copia el **User ID** (UUID)

6. Ejecuta este SQL en Supabase SQL Editor (reemplaza `TU_UUID_AQUI` con el UUID copiado):
```sql
INSERT INTO public.users (
  id,
  email,
  password,
  nombre,
  apellido,
  telefono,
  tipo_usuario,
  verificado,
  activo
) VALUES (
  'TU_UUID_AQUI'::uuid,
  'admin@ofisi.com',
  'dummy',
  'Administrador',
  'Sistema',
  '+5490000000000',
  'cliente',
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  verificado = true,
  activo = true;
```

## ⚠️ Seguridad

- El `SERVICE_ROLE_KEY` tiene acceso total a la base de datos
- No lo expongas en el código del cliente
- En producción, considera implementar:
  - Tabla de roles separada
  - Middleware de autenticación más robusto
  - Logs de acciones administrativas
  - Permisos granulares por acción

## 🚧 Mejoras Futuras

- [ ] Sistema de roles más robusto
- [ ] Logs de acciones administrativas
- [ ] Exportar datos de usuarios
- [ ] Gestión de prestadores (verificar documentos, etc.)
- [ ] Gestión de reportes
- [ ] Estadísticas avanzadas y gráficos

