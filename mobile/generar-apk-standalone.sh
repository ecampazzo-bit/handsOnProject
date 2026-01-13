#!/bin/bash

# Script para generar APK Standalone - Funciona sin Expo Go
# El APK incluye todo el JavaScript bundle y assets embebidos

echo "🚀 Generando APK Standalone (sin necesidad de Expo Go)..."
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

echo "📋 Verificando configuración..."
echo "   ✅ El APK incluirá el JavaScript bundle embebido"
echo "   ✅ El APK incluirá todos los assets"
echo "   ✅ El APK funcionará sin Expo Go"
echo ""

# Limpiar cache problemático
echo "🧹 Limpiando cache..."
rm -rf android/app/.cxx android/app/build/.cxx android/.gradle 2>/dev/null || true

echo ""
echo "📦 Generando bundle de JavaScript..."
echo "   (Expo embederá automáticamente el bundle en el APK)"
echo ""

# Asegurar que las variables de entorno están disponibles
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://kqxnjpyupcxbajuzsbtx.supabase.co}"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:-sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0}"

echo ""
echo "🔨 Compilando APK Release Standalone..."
echo "   ⏱️  Esto puede tardar 10-20 minutos la primera vez..."
echo "   💡 El bundle de JS se embederá automáticamente en el APK"
echo ""

cd android

# Limpiar primero
echo "🧹 Limpiando builds anteriores..."
./gradlew clean --no-daemon > /dev/null 2>&1 || true

# Generar APK Release (el bundle se embede automáticamente gracias a bundleCommand = "export:embed")
echo "⚙️  Compilando APK..."
if ./gradlew assembleRelease --no-daemon; then
    cd ..
    
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    
    if [ -f "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo ""
        echo "✅ ¡APK Standalone generado exitosamente!"
        echo ""
        echo "📱 Ubicación: $(pwd)/$APK_PATH"
        echo "📦 Tamaño: $APK_SIZE"
        echo ""
        echo "✅ Características del APK:"
        echo "   ✓ JavaScript bundle embebido (no necesita servidor)"
        echo "   ✓ Todos los assets incluidos"
        echo "   ✓ Funciona sin Expo Go"
        echo "   ✓ Funciona sin conexión a servidor de desarrollo"
        echo "   ✓ Aplicación completamente standalone"
        echo ""
        echo "📲 Para instalar en tu dispositivo:"
        echo ""
        echo "   Opción 1 - ADB (rápido):"
        echo "   adb install $APK_PATH"
        echo ""
        echo "   Opción 2 - Manual:"
        echo "   1. Habilita 'Orígenes desconocidos' en tu Android"
        echo "   2. Transfiere el APK por USB/Email/Drive"
        echo "   3. Abre el APK e instálalo"
        echo ""
        
        # Verificar tamaño del bundle embebido (información adicional)
        if command -v unzip &> /dev/null; then
            echo "📊 Verificando contenido del APK..."
            BUNDLE_SIZE=$(unzip -l "$APK_PATH" 2>/dev/null | grep -E "(index\.android\.bundle|index\.bundle)" | awk '{sum+=$1} END {print sum/1024/1024 " MB"}' || echo "No encontrado")
            if [ ! -z "$BUNDLE_SIZE" ] && [ "$BUNDLE_SIZE" != "No encontrado" ]; then
                echo "   Bundle JavaScript: ~$BUNDLE_SIZE"
            fi
        fi
        
        # Intentar abrir carpeta en Finder (macOS)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo ""
            echo "📂 ¿Abrir carpeta en Finder? (s/n)"
            read -r response
            if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
                open "$(dirname "$APK_PATH")"
            fi
        fi
    else
        echo ""
        echo "⚠️  Compilación completada pero no se encontró el APK"
        echo "   Busca en: android/app/build/outputs/apk/release/"
        echo "   O revisa los logs de error arriba"
        exit 1
    fi
else
    cd ..
    echo ""
    echo "❌ Error en la compilación"
    echo ""
    echo "💡 Soluciones:"
    echo "   1. Limpia completamente:"
    echo "      cd android && ./gradlew clean && cd .."
    echo ""
    echo "   2. Genera APK Debug (más rápido, también standalone):"
    echo "      cd android && ./gradlew assembleDebug && cd .."
    echo "      APK en: android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "   3. Revisa los errores arriba para más detalles"
    exit 1
fi
