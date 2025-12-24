# Versión 1.1.1 - Corrección de Visualización de Email

**Fecha**: 2025-01-XX  
**Tipo**: Bug Fix (Patch)

## 📋 Resumen

Corrección del problema donde el email largo se cortaba en dos líneas en la pantalla de Gestión de Cuenta, afectando la experiencia de usuario.

## 🔧 Cambios Realizados

### Corrección en `GestionCuenta.tsx`

**Problema**:  
El email del usuario se mostraba en dos líneas cuando era largo, causando problemas de diseño y lectura.

**Solución**:  
- Agregado `numberOfLines={1}` al componente `Text` del email
- Agregado `ellipsizeMode="tail"` para truncar con "..." al final si es necesario
- Ajustado el estilo `infoValue`:
  - Removido `flexWrap: "nowrap"` y `overflow: "hidden"`
  - Agregado `flexShrink: 1` para mejor manejo del espacio

**Archivos Modificados**:
- `mobile/src/components/GestionCuenta.tsx`

## ✅ Resultado

Ahora el email se muestra siempre en una sola línea, truncándose con "..." al final si es demasiado largo para el espacio disponible. Esto mejora la consistencia visual y la legibilidad de la pantalla.

## 📦 Archivos del Commit

```
mobile/src/components/GestionCuenta.tsx  (corrección del email)
mobile/package.json                      (versión actualizada a 1.1.1)
CHANGELOG.md                             (documentación de cambios)
```

## 🔗 Referencias

- Commit: `38605bf`
- Ver `CHANGELOG.md` para el historial completo de cambios

