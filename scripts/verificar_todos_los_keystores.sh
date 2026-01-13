#!/bin/bash

# Script para verificar todos los keystores encontrados
# Intenta diferentes aliases comunes para cada keystore

echo "🔍 Verificador de Todos los Keystores"
echo "====================================="
echo ""

SHA1_ESPERADO="AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5"
TEMP_DIR="temp_keystores"

# Aliases comunes a probar
ALIASES=(
    "@ecampazzo__handson-app"
    "@ecampazzo__handson-app_OLD_1"
    "527d7a6ec1a63abd37b1ad3cd6b8407e"
    "upload"
    "my-key-alias"
    "key0"
    "release"
    "android-release-key"
)

echo "📁 Buscando keystores en $TEMP_DIR/..."
echo ""

# Buscar todos los archivos .jks
KEYSTORES=$(find "$TEMP_DIR" -type f \( -name "*.jks" -o -name "*.keystore" \) 2>/dev/null)

if [ -z "$KEYSTORES" ]; then
    echo "❌ No se encontraron keystores en $TEMP_DIR/"
    exit 1
fi

echo "✅ Keystores encontrados:"
echo "$KEYSTORES" | while IFS= read -r KEYSTORE; do
    echo "   - $KEYSTORE"
done
echo ""

# Verificar si keytool está disponible
if ! command -v keytool &> /dev/null; then
    echo "❌ Error: 'keytool' no está instalado"
    echo ""
    echo "Instala Java JDK:"
    echo "  macOS: brew install openjdk"
    echo "  Linux: sudo apt-get install default-jdk"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verificando cada keystore..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ENCONTRADO_CORRECTO=false

# Procesar cada keystore
echo "$KEYSTORES" | while IFS= read -r KEYSTORE; do
    KEYSTORE_NAME=$(basename "$KEYSTORE")
    echo "📦 Verificando: $KEYSTORE_NAME"
    echo "────────────────────────────────────────────────────────────────────"
    
    # Intentar con cada alias
    for ALIAS in "${ALIASES[@]}"; do
        echo -n "   Probando alias '$ALIAS'... "
        
        # Intentar leer el keystore (sin contraseña primero, luego pedirá)
        SHA1=$(keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" 2>&1 | grep -i "SHA1:" | head -1 | sed 's/.*SHA1: //' | tr -d ' ')
        
        # Verificar si se obtuvo un SHA1 válido
        if [ -n "$SHA1" ] && [ ${#SHA1} -gt 10 ]; then
            SHA1_NORMALIZED=$(echo "$SHA1" | tr '[:lower:]' '[:upper:]')
            SHA1_ESPERADO_NORMALIZED=$(echo "$SHA1_ESPERADO" | tr '[:lower:]' '[:upper:]')
            
            echo "✅ SHA1 encontrado: $SHA1"
            
            if [ "$SHA1_NORMALIZED" = "$SHA1_ESPERADO_NORMALIZED" ]; then
                echo ""
                echo "   🎉 ¡ÉXITO! Este es el keystore CORRECTO"
                echo "   ✅ SHA1 coincide: $SHA1"
                echo "   ✅ Alias correcto: $ALIAS"
                echo "   ✅ Archivo: $KEYSTORE"
                echo ""
                echo "   📝 Próximos pasos:"
                echo "      1. Asegúrate de tener la contraseña de este keystore"
                echo "      2. Súbelo a EAS:"
                echo "         ./scripts/subir_keystore_a_eas.sh $KEYSTORE $ALIAS"
                echo ""
                ENCONTRADO_CORRECTO=true
                break
            else
                echo "   ⚠️  SHA1 no coincide (este no es el keystore correcto)"
            fi
        else
            echo "   ❌ No se pudo leer (alias incorrecto o contraseña requerida)"
        fi
    done
    
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$ENCONTRADO_CORRECTO" = false ]; then
    echo "⚠️  No se encontró ningún keystore con el SHA1 correcto"
    echo ""
    echo "Posibles razones:"
    echo "  - Los keystores requieren contraseña (el script no puede probarlas automáticamente)"
    echo "  - El alias es diferente a los probados"
    echo "  - El keystore correcto no está en esta carpeta"
    echo ""
    echo "💡 Próximos pasos:"
    echo "  1. Verifica manualmente cada keystore con la contraseña:"
    echo "     ./scripts/verificar_sha1_keystore.sh temp_keystores/[keystore].jks [alias]"
    echo ""
    echo "  2. Busca en otros lugares:"
    echo "     ./scripts/buscar_keystores.sh"
    echo ""
    echo "  3. Si no encuentras el keystore correcto, contacta a Google Play Support"
else
    echo "✅ Se encontró el keystore correcto (ver arriba)"
fi

echo ""
echo "🔑 SHA1 esperado (correcto): $SHA1_ESPERADO"
echo ""
