# Solución: Problemas de Caché en la Web

## 🔍 Problema

Los cambios no se reflejan en la web de producción (`ofisi.ar`) aunque funcionan correctamente en local. Esto generalmente se debe a problemas de caché.

## ✅ Soluciones Implementadas

### 1. Headers de No-Cache

Se agregaron headers HTTP para evitar que el navegador y los proxies cacheen el contenido:

```javascript
{
  key: 'Cache-Control',
  value: 'no-cache, no-store, must-revalidate',
}
```

Esto fuerza al navegador a siempre solicitar la versión más reciente del contenido.

### 2. Build Limpio

Se realizó un build completamente limpio eliminando el directorio `.next` antes de construir:

```bash
rm -rf .next
npm run build
```

## 🛠️ Cómo Limpiar el Caché

### En el Navegador

**Chrome/Edge:**
- `Ctrl + Shift + R` (Windows/Linux) o `Cmd + Shift + R` (Mac) - Hard refresh
- O abre las herramientas de desarrollador (F12) → Click derecho en el botón de recargar → "Vaciar caché y volver a cargar de forma forzada"

**Firefox:**
- `Ctrl + F5` (Windows/Linux) o `Cmd + Shift + R` (Mac)
- O `Ctrl + Shift + Delete` → Selecciona "Caché" → "Limpiar ahora"

**Safari:**
- `Cmd + Option + R` - Hard refresh
- O Safari → Preferencias → Avanzado → Marca "Mostrar menú Desarrollo" → Desarrollo → "Vaciar cachés"

### Modo Incógnito

Abre la página en una ventana de incógnito/privada para evitar completamente el caché:
- Chrome/Edge: `Ctrl + Shift + N` (Windows) o `Cmd + Shift + N` (Mac)
- Firefox: `Ctrl + Shift + P` (Windows) o `Cmd + Shift + P` (Mac)
- Safari: `Cmd + Shift + N`

### Limpiar Caché del Servidor/CDN

Si usas un CDN o proxy, puede que también necesites:
1. Invalidar el caché del CDN (si aplica)
2. Esperar unos minutos para que el caché expire
3. Contactar al soporte de Hostinger si el problema persiste

## 📋 Verificación de Cambios

### Comparar Versiones

Para verificar que los cambios están desplegados:

1. **Revisa la consola del navegador:**
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña Console
   - Busca logs específicos como:
     - `=== Cargando usuarios ===`
     - `Hash de URL:`
     - `Sesión de recuperación:`

2. **Verifica el código fuente:**
   - Click derecho en la página → "Ver código fuente"
   - O en las herramientas de desarrollador → Sources → Busca los archivos JS
   - Verifica que contengan los cambios recientes

3. **Revisa los headers HTTP:**
   - En las herramientas de desarrollador → Network
   - Selecciona cualquier petición
   - Verifica que el header `Cache-Control` esté presente

## 🔄 Último Despliegue

**Fecha:** 2026-01-04 14:17:39 UTC  
**UUID:** `019b895e-8264-7083-9adf-fad882280c91`

### Cambios Incluidos en este Despliegue:

1. ✅ Recuperación de contraseña corregida (manejo de hash de URL)
2. ✅ Dashboard de administración con función RPC `get_all_users()`
3. ✅ Headers de no-cache para evitar problemas de caché
4. ✅ Logs de depuración mejorados
5. ✅ Validación de sesión mejorada

## 🆘 Si el Problema Persiste

1. **Espera unos minutos:**
   - A veces el CDN o proxy tarda en actualizar
   - Los cambios pueden tardar 5-10 minutos en propagarse

2. **Verifica que el despliegue se completó:**
   - Revisa los logs del último despliegue
   - Asegúrate de que el build fue exitoso

3. **Prueba desde otro dispositivo/red:**
   - A veces el caché está en el router o ISP
   - Prueba desde datos móviles o otra red

4. **Contacta soporte:**
   - Si nada funciona, puede haber un problema con el servidor
   - Proporciona el UUID del despliegue: `019b895e-8264-7083-9adf-fad882280c91`

## 📝 Notas

- Los headers de no-cache pueden afectar ligeramente el rendimiento
- En producción, considera usar versionado de archivos estáticos en lugar de no-cache completo
- Para archivos estáticos (imágenes, CSS), el caché es beneficioso

