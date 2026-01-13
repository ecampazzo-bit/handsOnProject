#!/bin/bash

# Script para generar APK localmente para pruebas en dispositivo físico
# Ejecutar desde la carpeta mobile/

echo "🚀 Generando APK local para pruebas..."
echo ""

# Verificar que estamos en la carpeta correcta
if [ ! -f "app.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde la carpeta mobile/"
    exit 1
fi

# Verificar que Android está configurado
if [ ! -d "android" ]; then
    echo "❌ Error: No se encuentra la carpeta android/"
    echo "   Ejecuta primero: npx expo prebuild --platform android"
    exit 1
fi

# Verificar variables de entorno Android
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME no está configurado"
    echo "   Configúralo en tu ~/.zshrc o ~/.bash_profile:"
    echo "   export ANDROID_HOME=\$HOME/Library/Android/sdk"
    echo "   export PATH=\$PATH:\$ANDROID_HOME/emulator"
    echo "   export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
    echo ""
    echo "   Intentando continuar con configuración por defecto..."
fi

echo "📦 Limpiando builds anteriores..."
cd android
./gradlew clean
cd ..

echo ""
echo "🔨 Compilando APK Release..."
echo "   Esto puede tardar varios minutos la primera vez..."
echo ""

# Limpiar cache de CMake que puede causar problemas
echo "🧹 Limpiando cache de CMake..."
rm -rf android/app/.cxx android/.gradle android/app/build/.cxx 2>/dev/null || true

# Generar APK usando Gradle directamente (más confiable que expo run:android)
cd android
echo ""
echo "⚙️  Ejecutando Gradle assembleRelease..."
echo "   (Esto puede tardar 5-15 minutos la primera vez)"
echo ""
./gradlew assembleRelease --no-daemon

# Volver a la carpeta mobile
cd ..

# Verificar si se generó el APK
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "✅ ¡APK generado exitosamente!"
    echo ""
    echo "📱 Ubicación: $(pwd)/$APK_PATH"
    echo "📦 Tamaño: $APK_SIZE"
    echo ""
    echo "📲 Para instalar en tu dispositivo:"
    echo "   1. Habilita 'Orígenes desconocidos' en Configuración > Seguridad"
    echo "   2. Transfiere el APK a tu dispositivo (USB, email, etc.)"
    echo "   3. Abre el APK en tu dispositivo e instálalo"
    echo ""
    echo "   O usa ADB para instalar directamente:"
    echo "   adb install $APK_PATH"
    echo ""
    
    # Intentar abrir la carpeta en Finder (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "📂 ¿Abrir carpeta en Finder? (s/n)"
        read -r response
        if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
            open "$(dirname "$APK_PATH")"
        fi
    fi
else
    echo ""
    echo "❌ Error: No se pudo generar el APK"
    echo "   Verifica los errores arriba"
    exit 1
fi
