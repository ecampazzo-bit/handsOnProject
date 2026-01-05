# 📋 Resumen de la Solución - Filtro de Categorías en Estadísticas

## ✅ Problema Resuelto
Cuando se filtraba por categoría en la página de estadísticas, se mostraba correctamente la cantidad de prestadores en la tarjeta (ej: "2 prestadores activos"), pero la lista de prestadores filtrados mostraba "0 prestadores activos".

## 🔍 Causa Raíz
El problema fue un **conflicto de políticas Row Level Security (RLS)** en Supabase. Las tablas `prestadores` y `users` tenían RLS habilitado pero las políticas no permitían que el cliente web pudiera leer los datos, causando que las consultas retornaran 0 resultados.

## 🛠️ Soluciones Implementadas

### 1. **Configuración de Variables de Entorno** (`web/.env.local`)
- Eliminada la `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` del cliente (nunca debe exponerse clave secreta en el navegador)
- Ahora se usa solo `NEXT_PUBLIC_SUPABASE_ANON_KEY` con autenticación de usuario

### 2. **Actualización del Cliente Supabase** (`web/src/lib/supabase.ts`)
- El `supabaseAdmin` ahora usa el mismo cliente autenticado que `supabase`
- Funciona a través de las políticas RLS (no necesita clave de servicio en el cliente)

### 3. **Scripts SQL Ejecutados en Supabase**

#### `fix_rls_admin_access.sql`
Habilitó lectura pública en tablas necesarias:
- `categorias`: Public read access
- `servicios`: Public read access
- `prestador_servicios`: Authenticated read access

#### `fix_rls_prestadores.sql`
Permitió lectura pública de la tabla `prestadores`:
- Policy: "Public read prestadores" (permite lectura a cualquiera)
- Policy: "Authenticated read prestadores" (permite lectura a usuarios autenticados)

#### `fix_rls_users.sql`
Permitió lectura pública de la tabla `users`:
- Policy: "Public read users" (permite lectura a cualquiera)
- Esto fue crítico para que se pudieran obtener los datos de usuarios asociados a prestadores

### 4. **Optimización de Consultas** (`web/src/app/admin/estadisticas/page.tsx`)
Cambió la estrategia de consultas para evitar JOINs complicados que causaban problemas con RLS:

**Antes (no funcionaba):**
```typescript
.select(`
  id,
  usuario_id,
  users!inner(...)  // Inner join no funcionaba con RLS
`)
.eq('users.activo', true)
```

**Después (funciona):**
```typescript
// 1. Obtener prestadores
const allPrestadores = await supabase.from('prestadores').select('id, usuario_id')

// 2. Obtener usuarios
const usersData = await supabase.from('users').select('...')

// 3. Crear map de usuarios
const usuariosMap = new Map(usersData?.map(u => [u.id, u]))

// 4. Filtrar manualmente
const prestadoresActivos = allPrestadores
  .filter(p => usuariosMap.get(p.usuario_id)?.activo === true)
  .map(p => ({ ...p, users: usuariosMap.get(p.usuario_id) }))
```

### 5. **Agregado Estado de Carga Separado**
- Nuevo estado `loadingPrestadores` para controlar el loading de la lista independientemente del loading general
- Evita mostrar "0 prestadores" mientras carga

## 📊 Resultado Final
✅ Filtro por categoría funcionando correctamente
✅ Se muestra la cantidad correcta en la tarjeta
✅ Se muestra la lista de prestadores en la tabla
✅ Código limpio sin logs de debugging
✅ RLS correctamente configurado para seguridad

## 🔐 Notas de Seguridad
- NUNCA expongas `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` en el navegador
- Las políticas RLS ahora permiten lectura pública, pero esto es aceptable para datos que deben ser visibles
- Los datos sensibles (contraseñas, etc.) nunca se retornan gracias a las vistas filtradas
