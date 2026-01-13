#!/bin/bash

# Script simplificado para generar APK - Solo usa Gradle
# Ejecutar desde la carpeta mobile/

echo "🚀 Generando APK Release (método simple)..."
echo ""

if [ ! -d "android" ]; then
    echo "❌ Error: No se encuentra la carpeta android/"
    echo "   Ejecuta primero: npx expo prebuild --platform android"
    exit 1
fi

echo "🧹 Limpiando cache problemático..."
rm -rf android/app/.cxx android/app/build/.cxx 2>/dev/null || true

echo ""
echo "🔨 Compilando APK..."
echo "   ⏱️  Esto puede tardar 5-15 minutos..."
echo ""

cd android

# Intentar generar APK
if ./gradlew assembleRelease --no-daemon; then
    cd ..
    
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    
    if [ -f "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo ""
        echo "✅ ¡APK generado exitosamente!"
        echo ""
        echo "📱 Ubicación: $(pwd)/$APK_PATH"
        echo "📦 Tamaño: $APK_SIZE"
        echo ""
        echo "📲 Para instalar:"
        echo "   adb install $APK_PATH"
        echo ""
    else
        echo ""
        echo "⚠️  Compilación completada pero no se encontró el APK"
        echo "   Busca en: android/app/build/outputs/apk/release/"
    fi
else
    cd ..
    echo ""
    echo "❌ Error en la compilación"
    echo ""
    echo "💡 Soluciones alternativas:"
    echo "   1. Limpia completamente:"
    echo "      cd android && ./gradlew clean && cd .."
    echo ""
    echo "   2. Usa EAS Build (en la nube):"
    echo "      eas build --platform android --profile preview --local"
    echo ""
    echo "   3. Genera APK Debug (más rápido):"
    echo "      cd android && ./gradlew assembleDebug && cd .."
    exit 1
fi
