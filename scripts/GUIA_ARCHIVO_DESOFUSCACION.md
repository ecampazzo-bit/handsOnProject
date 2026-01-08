# Guía: Archivo de Desofuscación (Mapping File) para Google Play

## ¿Qué significa este mensaje?

Google Play Console te está informando que:

1. **No hay archivo de desofuscación subido**: Cuando usas R8/ProGuard para ofuscar y minificar tu código, Google Play necesita un archivo de "mapping" para poder traducir los stack traces de errores de vuelta a código legible.

2. **¿Por qué es importante?**: Sin el archivo de mapping, cuando tu app crashea en producción, los reportes de errores mostrarán nombres de clases y métodos ofuscados (como `a.b.c.d()` en lugar de `UserService.login()`), lo que hace muy difícil depurar.

3. **Estado actual**: Tu app probablemente **NO está usando R8/ProGuard** actualmente, por eso no hay archivo de mapping.

---

## ¿Está habilitado R8/ProGuard en tu proyecto?

### Verificar configuración actual

Revisa `mobile/android/gradle.properties`:

```properties
android.enableMinifyInReleaseBuilds=false
```

Si está en `false`, **R8/ProGuard está deshabilitado** y no necesitas el archivo de mapping.

---

## Opciones

### Opción 1: Mantener R8/ProGuard deshabilitado (Actual)

**Ventajas:**
- ✅ No necesitas archivo de mapping
- ✅ Stack traces más fáciles de leer
- ✅ Builds más rápidos

**Desventajas:**
- ❌ APK más grande
- ❌ Código no ofuscado (más fácil de reverse engineer)

**Recomendación**: Si tu app es pequeña/mediana y no contiene información sensible, puedes mantenerlo deshabilitado.

---

### Opción 2: Habilitar R8/ProGuard y generar mapping

**Ventajas:**
- ✅ APK más pequeño (puede reducir 30-50% el tamaño)
- ✅ Código ofuscado (más difícil de reverse engineer)
- ✅ Mejor rendimiento

**Desventajas:**
- ❌ Necesitas subir el archivo de mapping a Play Console
- ❌ Builds un poco más lentos
- ❌ Más complejidad en debugging

**Recomendación**: Si tu app es grande o contiene lógica sensible, habilita R8/ProGuard.

---

## Cómo habilitar R8/ProGuard y generar el mapping

### Paso 1: Habilitar minificación

Edita `mobile/android/gradle.properties`:

```properties
# Cambiar de:
android.enableMinifyInReleaseBuilds=false

# A:
android.enableMinifyInReleaseBuilds=true
```

### Paso 2: Compilar el AAB

```bash
cd mobile/android
./gradlew bundleRelease
```

### Paso 3: Encontrar el archivo de mapping

El archivo se genera automáticamente en:

```
mobile/android/app/build/outputs/mapping/release/mapping.txt
```

### Paso 4: Subir a Google Play Console

1. Ve a **Google Play Console** → Tu app → **Versiones** → **Producción/Testing**
2. Selecciona la versión que acabas de subir
3. En la sección **Archivos de desofuscación**, haz clic en **Subir**
4. Selecciona el archivo `mapping.txt`
5. Guarda los cambios

---

## Configuración automática del mapping

Para que el mapping se genere automáticamente en cada build, puedes agregar esto a `build.gradle`:

```gradle
android {
    buildTypes {
        release {
            // ... configuración existente ...
            minifyEnabled true
            
            // Generar mapping automáticamente
            applicationVariants.all { variant ->
                if (variant.buildType.name == "release") {
                    variant.assembleProvider.get().doLast {
                        def mappingFile = variant.mappingFileProvider.get().get().asFile
                        if (mappingFile.exists()) {
                            copy {
                                from mappingFile
                                into "${rootDir}/mappings"
                                rename { "mapping-${variant.versionName}.txt" }
                            }
                            println "✅ Mapping file copiado a: mappings/mapping-${variant.versionName}.txt"
                        }
                    }
                }
            }
        }
    }
}
```

---

## Script para generar y copiar el mapping

Crea `scripts/generar-mapping.sh`:

```bash
#!/bin/bash

echo "🔨 Compilando AAB con R8/ProGuard..."
cd mobile/android
./gradlew bundleRelease

echo "📋 Buscando archivo de mapping..."
MAPPING_FILE="app/build/outputs/mapping/release/mapping.txt"

if [ -f "$MAPPING_FILE" ]; then
    echo "✅ Mapping encontrado: $MAPPING_FILE"
    echo "📦 Copiando a carpeta mappings..."
    mkdir -p ../../mappings
    cp "$MAPPING_FILE" "../../mappings/mapping-$(date +%Y%m%d-%H%M%S).txt"
    echo "✅ Mapping copiado exitosamente"
    echo ""
    echo "📤 Para subir a Play Console:"
    echo "   - Ve a Play Console → Tu app → Versiones"
    echo "   - Selecciona la versión → Archivos de desofuscación"
    echo "   - Sube el archivo: mappings/mapping-*.txt"
else
    echo "⚠️  No se encontró archivo de mapping"
    echo "   Verifica que R8/ProGuard esté habilitado en gradle.properties"
fi
```

---

## Verificar si R8 está activo

Después de compilar, verifica el tamaño del APK/AAB:

```bash
# Sin R8 (típicamente más grande)
ls -lh mobile/android/app/build/outputs/apk/release/app-release.apk

# Con R8 (típicamente 30-50% más pequeño)
# Si el tamaño es significativamente menor, R8 está activo
```

---

## Reglas ProGuard importantes para React Native

Si habilitas R8/ProGuard, asegúrate de tener estas reglas en `proguard-rules.pro`:

```proguard
# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Expo
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# Supabase
-keep class io.supabase.** { *; }
-dontwarn io.supabase.**
```

---

## Recomendación para tu proyecto

**Estado actual**: R8/ProGuard está **deshabilitado** (`enableMinifyInReleaseBuilds=false`)

**Recomendación**: 

1. **Si tu app es pequeña/mediana (< 50MB)**: Mantén R8 deshabilitado por ahora. El mensaje de Play Console es solo informativo.

2. **Si tu app es grande (> 50MB) o contiene lógica sensible**: 
   - Habilita R8/ProGuard
   - Genera el mapping en cada build
   - Súbelo a Play Console
   - Guarda los mappings en un lugar seguro (son necesarios para depurar crashes)

---

## Checklist

- [ ] Verificar si R8/ProGuard está habilitado (`gradle.properties`)
- [ ] Si está habilitado, compilar AAB y generar mapping
- [ ] Subir mapping a Play Console
- [ ] Guardar mapping en lugar seguro (backup)
- [ ] Verificar que los crashes se reporten correctamente después de subir mapping

---

## Notas importantes

1. **Backup del mapping**: Guarda TODOS los archivos de mapping. Cada versión necesita su propio mapping. Si pierdes el mapping de una versión, no podrás depurar los crashes de esa versión.

2. **Versionado**: Nombra los mappings con la versión:
   ```
   mapping-1.3.0.txt
   mapping-1.3.1.txt
   ```

3. **Seguridad**: Los mappings NO contienen código fuente, pero sí información sobre la estructura de tu app. No los subas a repositorios públicos.

---

## Comandos rápidos

```bash
# Compilar y generar mapping
cd mobile/android
./gradlew bundleRelease

# Encontrar mapping
find . -name "mapping.txt" -path "*/release/*"

# Copiar mapping con versión
cp app/build/outputs/mapping/release/mapping.txt ../mappings/mapping-1.3.0.txt
```

---

**Resumen**: El mensaje de Play Console es informativo. Si R8/ProGuard está deshabilitado (como parece ser tu caso), puedes ignorarlo. Si decides habilitarlo, sigue esta guía para generar y subir el mapping.
