#!/bin/bash

# Script para verificar el SHA1 de un keystore
# Uso: ./verificar_sha1_keystore.sh [ruta-al-keystore] [alias]

echo "🔍 Verificador de SHA1 de Keystore"
echo "=================================="
echo ""

# SHA1 esperado (el correcto según Google Play)
SHA1_ESPERADO="AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5"
# SHA1 incorrectos detectados (puede haber múltiples si EAS generó nuevos keystores)
SHA1_INCORRECTO_1="5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25"
SHA1_INCORRECTO_2="44:C5:11:9F:F1:A6:3E:A6:4F:A6:5C:F2:25:83:4E:0B:B0:0D:D9:58"

# Verificar si se proporcionaron argumentos
if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la ruta al keystore"
    echo ""
    echo "Uso:"
    echo "  ./verificar_sha1_keystore.sh [ruta-al-keystore] [alias]"
    echo ""
    echo "Ejemplo:"
    echo "  ./verificar_sha1_keystore.sh ./my-release-key.keystore my-key-alias"
    echo ""
    exit 1
fi

KEYSTORE_PATH="$1"
ALIAS="${2:-my-key-alias}"

# Verificar si el archivo existe
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "❌ Error: El archivo '$KEYSTORE_PATH' no existe"
    exit 1
fi

echo "📁 Keystore: $KEYSTORE_PATH"
echo "🔑 Alias: $ALIAS"
echo ""
echo "Por favor, ingresa la contraseña del keystore cuando se solicite:"
echo ""

# Verificar si keytool está disponible
if ! command -v keytool &> /dev/null; then
    echo "❌ Error: 'keytool' no está instalado"
    echo ""
    echo "keytool viene con Java JDK. Instálalo con:"
    echo "  - macOS: brew install openjdk"
    echo "  - Linux: sudo apt-get install default-jdk"
    echo "  - Windows: Descarga JDK desde oracle.com"
    exit 1
fi

# Obtener información del keystore
echo "🔍 Analizando keystore..."
KEYTOOL_OUTPUT=$(keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$ALIAS" 2>&1)

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error al leer el keystore"
    echo ""
    echo "Posibles causas:"
    echo "  - Contraseña incorrecta"
    echo "  - Alias incorrecto"
    echo "  - Archivo keystore corrupto"
    exit 1
fi

# Extraer SHA1
SHA1=$(echo "$KEYTOOL_OUTPUT" | grep -i "SHA1:" | head -1 | sed 's/.*SHA1: //' | tr -d ' ')

if [ -z "$SHA1" ]; then
    echo "❌ No se pudo extraer el SHA1 del keystore"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 RESULTADO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🔑 SHA1 del keystore:"
echo "   $SHA1"
echo ""
echo "✅ SHA1 esperado (correcto):"
echo "   $SHA1_ESPERADO"
echo ""
echo "❌ SHA1 incorrectos detectados:"
echo "   $SHA1_INCORRECTO_1"
echo "   $SHA1_INCORRECTO_2"
echo ""

# Comparar SHA1
SHA1_NORMALIZED=$(echo "$SHA1" | tr '[:lower:]' '[:upper:]')
SHA1_ESPERADO_NORMALIZED=$(echo "$SHA1_ESPERADO" | tr '[:lower:]' '[:upper:]')
SHA1_INCORRECTO_1_NORMALIZED=$(echo "$SHA1_INCORRECTO_1" | tr '[:lower:]' '[:upper:]')
SHA1_INCORRECTO_2_NORMALIZED=$(echo "$SHA1_INCORRECTO_2" | tr '[:lower:]' '[:upper:]')

if [ "$SHA1_NORMALIZED" = "$SHA1_ESPERADO_NORMALIZED" ]; then
    echo "🎉 ¡ÉXITO! Este es el keystore CORRECTO"
    echo ""
    echo "✅ El SHA1 coincide con el esperado por Google Play"
    echo "✅ Puedes usar este keystore para firmar tus builds"
    echo ""
    echo "📝 Próximos pasos:"
    echo "   1. Sube este keystore a EAS: eas credentials"
    echo "   2. Genera un nuevo build: eas build --platform android --profile production"
    exit 0
elif [ "$SHA1_NORMALIZED" = "$SHA1_INCORRECTO_1_NORMALIZED" ] || [ "$SHA1_NORMALIZED" = "$SHA1_INCORRECTO_2_NORMALIZED" ]; then
    echo "⚠️  ADVERTENCIA: Este es el keystore INCORRECTO"
    echo ""
    echo "❌ El SHA1 coincide con uno de los que está causando el error"
    echo "❌ NO uses este keystore para builds de producción"
    echo ""
    echo "📝 Necesitas encontrar el keystore con SHA1: $SHA1_ESPERADO"
    exit 1
else
    echo "⚠️  Este keystore NO es el correcto ni coincide con los incorrectos conocidos"
    echo ""
    echo "❌ El SHA1 no coincide con ninguno de los esperados"
    echo "❌ Este keystore no es el que necesitas"
    echo ""
    echo "📝 Necesitas encontrar el keystore con SHA1: $SHA1_ESPERADO"
    exit 1
fi
