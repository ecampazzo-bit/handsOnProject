# Solución de Warnings del Build Android

## Warnings Encontrados

### 1. Warning: NODE_ENV no especificado

```
The NODE_ENV environment variable is required but was not specified. 
Ensure the project is bundled with Expo CLI or NODE_ENV is set. 
Using only .env.local and .env
```

**Estado:** ⚠️ Warning informativo, no es un error

**Explicación:**
- `expo-constants` está buscando la variable `NODE_ENV` pero no la encuentra
- El build funciona correctamente usando `.env` y `.env.local`
- Este warning es informativo y no afecta la funcionalidad

**Solución (Opcional):**

Puedes agregar `NODE_ENV` al build de Gradle editando `mobile/android/app/build.gradle`:

```gradle
android {
    // ... configuración existente ...
    
    defaultConfig {
        // ... configuración existente ...
        
        // Agregar NODE_ENV para builds de release
        buildConfigField "String", "NODE_ENV", "\"production\""
    }
    
    buildTypes {
        debug {
            // ... configuración existente ...
            buildConfigField "String", "NODE_ENV", "\"development\""
        }
        release {
            // ... configuración existente ...
            buildConfigField "String", "NODE_ENV", "\"production\""
        }
    }
}
```

O establecer la variable de entorno antes de compilar:

```bash
export NODE_ENV=production
cd mobile/android
./gradlew assembleRelease
```

**Recomendación:** Este warning es seguro ignorar. El build funciona correctamente sin él.

### 2. Warning: Deprecated Gradle Features

```
Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.
```

**Estado:** ⚠️ Warning informativo sobre futuras versiones

**Explicación:**
- Gradle está advirtiendo que algunas características usadas serán removidas en Gradle 9.0
- El build actual funciona perfectamente con Gradle 8.14.3
- Este es un aviso preventivo para futuras actualizaciones

**Solución:**

Para ver qué características están deprecadas:

```bash
cd mobile/android
./gradlew assembleRelease --warning-mode all
```

**Recomendación:** Este warning es seguro ignorar por ahora. Cuando actualices a Gradle 9.0, necesitarás actualizar las dependencias que usan características deprecadas.

## Resumen

Ambos warnings son **informativos y no afectan la funcionalidad** del build:

1. ✅ **NODE_ENV warning:** El build funciona correctamente usando `.env` y `.env.local`. Este warning aparece porque `expo-constants` ejecuta scripts de Node.js que no tienen acceso directo a las variables de Gradle, pero el build funciona perfectamente.
2. ✅ **Gradle deprecation warning:** Solo afectará cuando actualices a Gradle 9.0 (aún no disponible). Es un aviso preventivo sobre características que serán removidas en futuras versiones.

**Acción recomendada:** **Ninguna acción inmediata necesaria.** Estos warnings son normales en proyectos React Native/Expo y no requieren corrección urgente. El build funciona correctamente y genera APKs válidos.

### Estado Actual

✅ **Build funciona correctamente**  
✅ **APK se genera sin errores**  
⚠️ **Warnings informativos (pueden ignorarse)**

## Si Quieres Eliminar los Warnings (Opcional)

**Nota:** Estos warnings no afectan la funcionalidad. Solo elimínalos si realmente te molestan.

### Opción 1: Establecer NODE_ENV como variable de entorno

La forma más simple es establecer la variable antes de compilar:

```bash
export NODE_ENV=production
cd mobile/android
./gradlew assembleRelease
```

O crear un script wrapper:

```bash
#!/bin/bash
# mobile/android/build-release.sh
export NODE_ENV=production
./gradlew assembleRelease
```

### Opción 2: Establecer NODE_ENV en el build (más complejo)

Agrega al inicio de `mobile/android/app/build.gradle`:

```gradle
// Establecer NODE_ENV para el proceso de build
def nodeEnv = findProperty('NODE_ENV') ?: 'production'
project.ext.env = [
    NODE_ENV: nodeEnv
]
```

Y luego en `defaultConfig`:

```gradle
defaultConfig {
    // ... configuración existente ...
    project.ext.env.each { key, value ->
        buildConfigField "String", key, "\"${value}\""
    }
}
```

### Opción 2: Usar gradle.properties

Agrega a `mobile/android/gradle.properties`:

```properties
# Establecer NODE_ENV para builds
NODE_ENV=production
```

Luego en `build.gradle`:

```gradle
android {
    defaultConfig {
        // ... configuración existente ...
        if (project.hasProperty('NODE_ENV')) {
            buildConfigField "String", "NODE_ENV", "\"${NODE_ENV}\""
        }
    }
}
```

## Nota Final

Estos warnings son comunes en proyectos React Native/Expo y no indican problemas. El build está funcionando correctamente y el APK se genera sin errores.
