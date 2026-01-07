#!/bin/bash

# Script para generar APK standalone para pruebas
# Ejecutar desde la carpeta mobile/

echo "🚀 Generando APK standalone para pruebas..."
echo ""

# Verificar que estamos en la carpeta correcta
if [ ! -f "app.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde la carpeta mobile/"
    exit 1
fi

# Verificar que EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI no está instalado. Instalando..."
    npm install -g eas-cli
fi

# Verificar login
echo "📋 Verificando sesión de Expo..."
if ! eas whoami &> /dev/null; then
    echo "⚠️  No estás logueado. Iniciando sesión..."
    eas login
fi

echo ""
echo "🔨 Iniciando build de APK..."
echo "   Perfil: preview (APK para pruebas)"
echo "   Plataforma: Android"
echo ""

# Generar el build
eas build --platform android --profile preview

echo ""
echo "✅ Build iniciado. Puedes ver el progreso en:"
echo "   https://expo.dev/accounts/ecampazzo/projects/handson-app/builds"
echo ""
echo "📱 Una vez completado, recibirás un enlace para descargar el APK."

