# Configuración de HandsOn Web

## Variables de Entorno

Crea un archivo `.env.local` en la raíz de `web/` con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
NEXT_PUBLIC_SITE_URL=https://ofisi.ar
```

**Nota:** `NEXT_PUBLIC_SITE_URL` es necesario para la funcionalidad de recuperación de contraseña. En desarrollo local, usa `http://localhost:3000`.

### Dónde encontrar las credenciales:

1. Ve a tu proyecto en Supabase Dashboard
2. Settings → API
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (secret) → `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Importante**: El `service_role_key` es secreto y tiene acceso total a tu base de datos. No lo commitees al repositorio.

