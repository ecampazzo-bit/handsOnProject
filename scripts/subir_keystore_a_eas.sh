#!/bin/bash

# Script para ayudar a subir un keystore .jks a EAS
# Uso: ./scripts/subir_keystore_a_eas.sh [ruta-al-keystore.jks] [alias]

echo "🔧 Configurador de Keystore para EAS"
echo "====================================="
echo ""

# Verificar si se proporcionó la ruta al keystore
if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la ruta al archivo .jks"
    echo ""
    echo "Uso:"
    echo "  ./scripts/subir_keystore_a_eas.sh [ruta-al-keystore.jks] [alias]"
    echo ""
    echo "Ejemplo:"
    echo "  ./scripts/subir_keystore_a_eas.sh temp_keystores/@ecampazzo__handson-app_OLD_1.jks @ecampazzo__handson-app_OLD_1"
    echo ""
    echo "📋 Keystores disponibles en temp_keystores/:"
    ls -1 temp_keystores/*.jks 2>/dev/null | sed 's/^/   - /'
    echo ""
    exit 1
fi

KEYSTORE_PATH="$1"
ALIAS="${2:-@ecampazzo__handson-app_OLD_1}"

# Verificar si el archivo existe
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "❌ Error: El archivo '$KEYSTORE_PATH' no existe"
    echo ""
    echo "Verifica la ruta y vuelve a intentar."
    exit 1
fi

# Convertir a ruta absoluta si es relativa
if [[ ! "$KEYSTORE_PATH" = /* ]]; then
    KEYSTORE_PATH="$(pwd)/$KEYSTORE_PATH"
fi

echo "📁 Keystore: $KEYSTORE_PATH"
echo "🔑 Alias: $ALIAS"
echo ""

# SHA1 esperado
SHA1_ESPERADO="AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 PASO 1: Verificar SHA1 del Keystore"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Antes de subir el keystore a EAS, vamos a verificar su SHA1..."
echo ""

# Verificar si keytool está disponible
if ! command -v keytool &> /dev/null; then
    echo "⚠️  'keytool' no está instalado. Saltando verificación de SHA1."
    echo "   Puedes instalar Java JDK para verificar el SHA1."
    echo ""
    SKIP_VERIFY=true
else
    SKIP_VERIFY=false
fi

if [ "$SKIP_VERIFY" = false ]; then
    echo "Por favor, ingresa la contraseña del keystore cuando se solicite:"
    echo ""
    
    SHA1=$(keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$ALIAS" 2>&1 | grep -i "SHA1:" | head -1 | sed 's/.*SHA1: //' | tr -d ' ')
    
    if [ -z "$SHA1" ]; then
        echo "⚠️  No se pudo extraer el SHA1. Puede ser que:"
        echo "   - La contraseña sea incorrecta"
        echo "   - El alias sea incorrecto"
        echo "   - El archivo esté corrupto"
        echo ""
        echo "Continuando de todas formas..."
        echo ""
    else
        SHA1_NORMALIZED=$(echo "$SHA1" | tr '[:lower:]' '[:upper:]')
        SHA1_ESPERADO_NORMALIZED=$(echo "$SHA1_ESPERADO" | tr '[:lower:]' '[:upper:]')
        
        echo "🔑 SHA1 del keystore: $SHA1"
        echo "✅ SHA1 esperado: $SHA1_ESPERADO"
        echo ""
        
        if [ "$SHA1_NORMALIZED" = "$SHA1_ESPERADO_NORMALIZED" ]; then
            echo "✅ ¡Perfecto! Este es el keystore CORRECTO"
            echo ""
        else
            echo "⚠️  ADVERTENCIA: El SHA1 NO coincide con el esperado"
            echo "   Este keystore puede no ser el correcto para actualizar tu app."
            echo "   ¿Deseas continuar de todas formas? (s/n)"
            read -r CONTINUAR
            if [ "$CONTINUAR" != "s" ] && [ "$CONTINUAR" != "S" ]; then
                echo "Operación cancelada."
                exit 1
            fi
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 PASO 2: Subir Keystore a EAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ahora vamos a subir el keystore a EAS."
echo ""
echo "📋 Información que necesitarás:"
echo "   - Ruta al keystore: $KEYSTORE_PATH"
echo "   - Alias: $ALIAS"
echo "   - Contraseña del keystore"
echo "   - Contraseña de la clave (puede ser la misma)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Asegúrate de tener la contraseña del keystore"
echo "   - EAS no permite descargar el keystore después de subirlo"
echo "   - Guarda una copia de seguridad del keystore antes de continuar"
echo ""
echo "¿Tienes todo listo? (s/n)"
read -r LISTO

if [ "$LISTO" != "s" ] && [ "$LISTO" != "S" ]; then
    echo "Operación cancelada."
    exit 0
fi

echo ""
echo "🚀 Iniciando EAS credentials..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 INSTRUCCIONES PARA EAS CREDENTIALS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Cuando EAS te pregunte, selecciona:"
echo ""
echo "1. Platform: Android"
echo "2. Project: handson-app"
echo "3. Action: Update credentials"
echo "4. Keystore: Upload existing keystore"
echo ""
echo "5. Path to keystore file:"
echo "   $KEYSTORE_PATH"
echo ""
echo "   O si prefieres usar ruta relativa desde mobile/:"
echo "   $(realpath --relative-to="mobile" "$KEYSTORE_PATH" 2>/dev/null || echo "../$(basename "$KEYSTORE_PATH")")"
echo ""
echo "6. Keystore alias: $ALIAS"
echo ""
echo "7. Keystore password: [ingresa tu contraseña]"
echo ""
echo "8. Key password: [ingresa la contraseña de la clave o deja en blanco]"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Navegar al directorio mobile
if [ ! -d "mobile" ]; then
    echo "❌ Error: No se encontró el directorio 'mobile'"
    echo "   Asegúrate de ejecutar este script desde la raíz del proyecto."
    exit 1
fi

cd mobile

# Verificar que EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "❌ Error: EAS CLI no está instalado"
    echo ""
    echo "Instálalo con:"
    echo "  npm install -g eas-cli"
    exit 1
fi

echo "Presiona Enter para iniciar 'eas credentials'..."
read -r

echo ""
echo "🚀 Ejecutando: eas credentials"
echo ""

# Ejecutar eas credentials
eas credentials

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Proceso completado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Verifica que el keystore se configuró correctamente:"
echo "   eas credentials"
echo "   (Selecciona: View credentials)"
echo ""
echo "2. Genera un build de prueba:"
echo "   eas build --platform android --profile production --local"
echo ""
echo "3. Verifica el SHA1 del build generado:"
echo "   keytool -printcert -jarfile build-*.aab | grep SHA1"
echo ""
echo "El SHA1 debe ser: $SHA1_ESPERADO"
echo ""
