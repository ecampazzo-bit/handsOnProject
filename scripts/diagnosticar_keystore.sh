#!/bin/bash

# Script para diagnosticar problemas con el keystore
# Prueba diferentes aliases y métodos para acceder al keystore

KEYSTORE_PATH="$1"

if [ -z "$KEYSTORE_PATH" ]; then
    echo "❌ Error: Debes proporcionar la ruta al keystore"
    echo ""
    echo "Uso: ./scripts/diagnosticar_keystore.sh [ruta-al-keystore]"
    echo ""
    echo "Ejemplo:"
    echo "  ./scripts/diagnosticar_keystore.sh temp_keystores/@ecampazzo__handson-app.jks"
    exit 1
fi

if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "❌ Error: El archivo '$KEYSTORE_PATH' no existe"
    exit 1
fi

echo "🔍 Diagnosticando keystore: $KEYSTORE_PATH"
echo "=========================================="
echo ""

# Verificar tipo de archivo
echo "📋 Información del archivo:"
file "$KEYSTORE_PATH"
ls -lh "$KEYSTORE_PATH"
echo ""

# Intentar listar aliases sin contraseña (puede mostrar algunos alias)
echo "🔑 Intentando listar aliases (sin contraseña):"
keytool -list -keystore "$KEYSTORE_PATH" -storepass "" 2>&1 | head -15
echo ""

# Intentar con contraseña vacía o común
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Aliases a probar:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Basado en el nombre del archivo, prueba estos aliases:"
echo ""

# Extraer posibles aliases del nombre del archivo
BASENAME=$(basename "$KEYSTORE_PATH" .jks)
BASENAME_CLEAN=$(echo "$BASENAME" | sed 's/@ecampazzo__handson-app//' | sed 's/_OLD_[0-9]*//' | sed 's/^_//')

ALIASES=(
    "527d7a6ec1a63abd37b1ad3cd6b8407e"  # El que encontramos antes
    "upload"                             # Alias común de EAS
    "key0"                               # Alias común de EAS
    "$BASENAME"                          # Nombre completo del archivo
    "$BASENAME_CLEAN"                    # Nombre limpio
    "my-key-alias"                       # Alias genérico
    "androidkey"                         # Alias común
    "release"                            # Alias común
)

for ALIAS in "${ALIASES[@]}"; do
    if [ -n "$ALIAS" ]; then
        echo "   - $ALIAS"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Instrucciones:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Prueba cada alias con el script de verificación:"
echo "   ./scripts/verificar_sha1_keystore.sh \"$KEYSTORE_PATH\" [alias]"
echo ""
echo "2. La contraseña de los keystores de EAS suele ser:"
echo "   - La que configuraste cuando creaste el keystore"
echo "   - O una contraseña que EAS generó automáticamente"
echo ""
echo "3. Si no recuerdas la contraseña, puedes verificar desde EAS:"
echo "   cd mobile && eas credentials"
echo "   Selecciona: View credentials > Android"
echo ""
echo "4. Alternativa: Ver el SHA1 directamente desde Google Play Console:"
echo "   - Ve a Google Play Console"
echo "   - Tu app > Configuración de la app > Integridad de la app"
echo "   - Ahí verás el SHA1 correcto que debe coincidir"
