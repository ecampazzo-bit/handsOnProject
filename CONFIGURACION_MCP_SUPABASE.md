# Configuración del MCP de Supabase

Este documento explica cómo conectar el servidor MCP (Model Context Protocol) de Supabase con Cursor.

## Pasos para Configurar

### 1. Crear el archivo de configuración

Crea un archivo `.cursor/mcp.json` en la raíz de tu proyecto con el siguiente contenido:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

### 2. Ubicación del archivo

El archivo debe estar en:
```
.handsOnProject/.cursor/mcp.json
```

O si estás usando la configuración global de Cursor, en:
```
~/.cursor/mcp.json
```

### 3. Autenticación

#### Opción A: Autenticación Automática (OAuth)

1. Cuando uses el MCP por primera vez, Cursor debería solicitarte iniciar sesión en tu cuenta de Supabase
2. Si no aparece automáticamente, intenta usar el MCP ejecutando alguna acción relacionada con Supabase
3. Autoriza el acceso del cliente MCP cuando se te solicite
4. El proceso de autenticación se puede hacer mediante OAuth directamente desde Cursor

#### Opción B: Autenticación Manual con Token (PAT)

Si la autenticación automática no funciona, puedes usar un token de acceso personal:

1. **Genera un Token de Acceso Personal (PAT):**
   - Ve a tu [panel de Supabase](https://supabase.com/dashboard)
   - Navega a "Access Tokens" en la configuración de tu cuenta
   - Crea un nuevo token con un nombre descriptivo (ej: "MCP Cursor Token")
   - Copia el token generado

2. **Actualiza la configuración del MCP:**
   
   Si usas la configuración basada en comando (recomendada), el servidor MCP debería pedirte el token al iniciar. Si necesitas configurarlo manualmente, actualiza `~/.cursor/mcp.json`:

   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": [
           "-y",
           "@supabase/mcp-server-supabase"
         ],
         "env": {
           "SUPABASE_ACCESS_TOKEN": "TU_TOKEN_AQUI"
         }
       }
     }
   }
   ```

   **⚠️ IMPORTANTE**: Nunca compartas tu token ni lo subas a un repositorio público.

### 4. Consideraciones de Seguridad

⚠️ **IMPORTANTE**: 
- No conectes el servidor MCP a datos de producción
- Úsalo solo en entornos de desarrollo
- Revisa las [mejores prácticas de seguridad](https://supabase.com/mcp) de Supabase

### 5. Verificar la conexión

Después de configurar, reinicia Cursor y deberías poder:
- Acceder a tus proyectos de Supabase
- Consultar información de tus bases de datos
- Interactuar con tus recursos de Supabase desde Cursor

## Instancias Autoalojadas

Si estás usando una instancia autoalojada de Supabase, el servidor MCP se ejecuta internamente y no debe exponerse a Internet. Para acceder:
- Usa una conexión VPN al servidor que ejecuta Studio
- O configura un túnel SSH desde tu máquina local

## Recursos Adicionales

- [Documentación oficial de Supabase MCP](https://supabase.com/mcp)
- [Guía de autenticación OAuth para MCP](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication)


