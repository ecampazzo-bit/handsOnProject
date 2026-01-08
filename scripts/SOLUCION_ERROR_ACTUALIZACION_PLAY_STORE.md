# Solución: Error de Actualización en Google Play Store

## Error

```
No puedes lanzar esta versión porque no permite que los usuarios actualicen 
a los app bundles añadidos recientemente.
```

## Causas Comunes

Este error generalmente ocurre por una de estas razones:

1. **versionCode no es mayor** que la versión anterior en Play Store
2. **Problema con la firma** de la app (keystore diferente)
3. **Configuración de actualización gradual** incorrecta
4. **Problema de compatibilidad** con versiones anteriores

---

## Soluciones

### Solución 1: Verificar y Aumentar versionCode

**Tu configuración actual:**
- `versionCode: 3`
- `versionName: "1.3.0"`

**Pasos:**

1. **Verificar la versión en Play Console:**
   - Ve a **Play Console** → Tu app → **Versiones** → **Producción**
   - Revisa el `versionCode` de la última versión publicada
   - Debe ser **menor** que 3 para que puedas publicar

2. **Si la versión en Play Store es >= 3:**
   - Necesitas aumentar el `versionCode` en `build.gradle`
   - Edita `mobile/android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId 'com.ofisi.app'
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 4  // ← Aumentar este número
    versionName "1.3.0"  // Puede ser la misma o cambiar
}
```

3. **Recompilar el AAB:**
   ```bash
   cd mobile/android
   ./gradlew clean
   ./gradlew bundleRelease
   ```

4. **Subir el nuevo AAB** a Play Console

---

### Solución 2: Verificar la Firma (Keystore)

Si cambiaste el keystore recientemente, esto puede causar el error.

**Verificar:**

1. **¿Cambiaste el keystore?**
   - Si es la primera vez que publicas, esto no aplica
   - Si ya tenías una versión publicada y cambiaste el keystore, **NO podrás actualizar**

2. **Si cambiaste el keystore:**
   - ⚠️ **Problema crítico**: No puedes actualizar apps existentes con un keystore diferente
   - Los usuarios tendrán que desinstalar e instalar de nuevo
   - Google Play considera que es una app diferente

3. **Solución si cambiaste el keystore:**
   - Usa el keystore original que usaste para la primera versión
   - O publica como una app completamente nueva (no recomendado)

**Verificar keystore actual:**
```bash
cd mobile/android/app
keytool -list -v -keystore my-release-key-new.keystore -alias my-key-alias-new
```

---

### Solución 3: Verificar Configuración de Actualización Gradual

Si tienes **actualización gradual** habilitada:

1. Ve a **Play Console** → Tu app → **Versiones** → **Producción**
2. Busca si hay una **actualización gradual** activa
3. Si hay una, tienes dos opciones:
   - **Esperar** a que la actualización gradual termine
   - **Cancelar** la actualización gradual y publicar directamente

**Para cancelar actualización gradual:**
- Play Console → Versiones → Producción → [Tu versión] → **Detener actualización gradual**

---

### Solución 4: Verificar Compatibilidad de Versiones

**Problema:** El nuevo AAB puede tener problemas de compatibilidad.

**Solución:**

1. **Verificar minSdkVersion:**
   ```gradle
   minSdkVersion rootProject.ext.minSdkVersion
   ```
   - Asegúrate de que no hayas aumentado el `minSdkVersion` sin avisar
   - Si aumentaste el `minSdkVersion`, algunos usuarios no podrán actualizar

2. **Verificar targetSdkVersion:**
   - Asegúrate de que sea compatible con versiones anteriores

---

## Pasos Recomendados (Checklist)

### 1. Verificar Versión en Play Console

```
Play Console → Tu app → Versiones → Producción
```

Anota:
- `versionCode` de la última versión publicada: _______
- `versionName` de la última versión publicada: _______

### 2. Comparar con tu build.gradle

```gradle
versionCode 3        // ← Debe ser MAYOR que el de Play Store
versionName "1.3.0"  // ← Puede ser igual o diferente
```

### 3. Si versionCode necesita aumentar

**Edita `mobile/android/app/build.gradle`:**

```gradle
defaultConfig {
    // ...
    versionCode 4  // ← Aumentar (debe ser mayor que Play Store)
    versionName "1.3.1"  // ← Opcional: cambiar versión
}
```

**También actualiza `mobile/app.json`:**

```json
{
  "expo": {
    "version": "1.3.1"  // ← Debe coincidir con versionName
  }
}
```

### 4. Recompilar

```bash
cd mobile/android
./gradlew clean
./gradlew bundleRelease
```

### 5. Verificar el AAB generado

```bash
# Verificar que el AAB se generó correctamente
ls -lh app/build/outputs/bundle/release/app-release.aab

# Verificar información del AAB (opcional)
bundletool build-apks --bundle=app-release.aab --output=app.apks
```

### 6. Subir a Play Console

1. Ve a **Play Console** → Tu app → **Versiones** → **Producción**
2. Haz clic en **Crear nueva versión**
3. Sube el nuevo AAB
4. Completa las notas de versión
5. Revisa que no haya errores

---

## Solución Rápida (Si es primera vez)

Si es la **primera vez** que publicas y recibes este error:

1. **Verifica que el versionCode sea >= 1:**
   ```gradle
   versionCode 3  // ← Debe ser >= 1
   ```

2. **Asegúrate de que no haya versiones en borrador:**
   - Play Console → Versiones → Borradores
   - Elimina cualquier borrador que pueda estar causando conflicto

3. **Verifica que estés en la pestaña correcta:**
   - Asegúrate de estar en **Producción** o **Testing** (no en borradores)

---

## Verificar Estado de la App en Play Console

### Checklist de Verificación

- [ ] ¿Cuál es el `versionCode` de la última versión publicada?
- [ ] ¿Tu nuevo `versionCode` es mayor?
- [ ] ¿Estás usando el mismo keystore que la versión anterior?
- [ ] ¿Hay actualizaciones graduales activas?
- [ ] ¿El `minSdkVersion` es compatible?
- [ ] ¿Hay borradores que puedan estar causando conflicto?

---

## Comandos Útiles

### Ver información del AAB

```bash
cd mobile/android
bundletool dump manifest --bundle=app/build/outputs/bundle/release/app-release.aab
```

### Verificar versionCode en el AAB

```bash
# Instalar bundletool si no lo tienes
# https://github.com/google/bundletool/releases

bundletool dump manifest \
  --bundle=app/build/outputs/bundle/release/app-release.aab \
  | grep -i "versionCode"
```

### Limpiar y recompilar

```bash
cd mobile/android
./gradlew clean
./gradlew bundleRelease
```

---

## Errores Relacionados

### "No se puede actualizar porque el versionCode es menor"

**Solución:** Aumenta el `versionCode` en `build.gradle`

### "No se puede actualizar porque la firma es diferente"

**Solución:** Usa el mismo keystore que la versión anterior

### "Hay una actualización gradual en progreso"

**Solución:** Espera o cancela la actualización gradual

---

## Ejemplo de Actualización Correcta

**Versión anterior en Play Store:**
- versionCode: 2
- versionName: "1.2.0"

**Nueva versión (build.gradle):**
```gradle
versionCode 3        // ✅ Mayor que 2
versionName "1.3.0"  // ✅ Puede cambiar
```

**Resultado:** ✅ Puede actualizar

---

## Si Nada Funciona

1. **Contacta a Google Play Support:**
   - Play Console → Ayuda → Contactar con el equipo de Play Console

2. **Verifica logs de Play Console:**
   - Revisa si hay más detalles del error
   - Busca mensajes adicionales en la sección de errores

3. **Considera publicar como nueva versión:**
   - Si es absolutamente necesario, puedes crear una nueva versión desde cero
   - ⚠️ Esto puede afectar a usuarios existentes

---

## Resumen Rápido

**Lo más probable es que necesites:**

1. ✅ **Aumentar el `versionCode`** en `build.gradle` (debe ser mayor que Play Store)
2. ✅ **Recompilar el AAB** con el nuevo versionCode
3. ✅ **Subir el nuevo AAB** a Play Console

**Tu configuración actual:**
- versionCode: 3
- versionName: "1.3.0"

**Acción:** Verifica en Play Console cuál es el versionCode de la última versión publicada y asegúrate de que tu nuevo versionCode sea mayor.

---

**¿Necesitas ayuda específica?** Comparte:
- El `versionCode` de la última versión en Play Store
- Si cambiaste el keystore recientemente
- Si hay actualizaciones graduales activas
