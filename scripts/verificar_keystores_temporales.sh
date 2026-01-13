#!/bin/bash

# Script para verificar todos los keystores en temp_keystores/
# Uso: ./scripts/verificar_keystores_temporales.sh

echo "🔍 Verificador de Keystores Temporales"
echo "======================================="
echo ""

KEYSTORE_DIR="../temp_keystores"
SHA1_ESPERADO="AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5"

# Verificar si existe el directorio
if [ ! -d "$KEYSTORE_DIR" ]; then
    echo "❌ Error: No se encuentra el directorio $KEYSTORE_DIR"
    exit 1
fi

echo "📁 Buscando keystores en: $KEYSTORE_DIR"
echo ""

# Buscar archivos .jks y .keystore (excluyendo debug.keystore)
KEYSTORES=$(find "$KEYSTORE_DIR" -type f \( -name "*.jks" -o -name "*.keystore" \) ! -name "debug.keystore" 2>/dev/null)

if [ -z "$KEYSTORES" ]; then
    echo "❌ No se encontraron keystores en $KEYSTORE_DIR"
    exit 1
fi

echo "📋 Keystores encontrados:"
echo "$KEYSTORES" | while read -r keystore; do
    echo "   - $(basename "$keystore")"
done
echo ""

# Intentar verificar cada keystore
ENCONTRADO_CORRECTO=false

echo "$KEYSTORES" | while read -r KEYSTORE_PATH; do
    KEYSTORE_NAME=$(basename "$KEYSTORE_PATH")
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔍 Verificando: $KEYSTORE_NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Intentar diferentes alias comunes
    ALIASES=(
        "${KEYSTORE_NAME%.*}"  # Nombre sin extensión
        "${KEYSTORE_NAME%.jks}"  # Sin .jks
        "${KEYSTORE_NAME%.keystore}"  # Sin .keystore
        "my-key-alias"
        "upload"
        "key0"
    )
    
    SHA1_ENCONTRADO=""
    ALIAS_CORRECTO=""
    
    for ALIAS in "${ALIASES[@]}"; do
        # Limpiar alias (remover prefijos comunes de EAS)
        CLEAN_ALIAS=$(echo "$ALIAS" | sed 's/^@ecampazzo__handson-app//' | sed 's/_OLD_[0-9]*//' | sed 's/^_//')
        if [ -z "$CLEAN_ALIAS" ]; then
            CLEAN_ALIAS="upload"  # Alias por defecto de EAS
        fi
        
        echo "   Probando alias: $CLEAN_ALIAS"
        
        # Intentar obtener SHA1 (sin mostrar la contraseña)
        SHA1_OUTPUT=$(keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$CLEAN_ALIAS" 2>&1 <<< "")
        
        if echo "$SHA1_OUTPUT" | grep -qi "SHA1:"; then
            SHA1=$(echo "$SHA1_OUTPUT" | grep -i "SHA1:" | head -1 | sed 's/.*SHA1: //' | tr -d ' ' | tr '[:lower:]' '[:upper:]')
            SHA1_ENCONTRADO="$SHA1"
            ALIAS_CORRECTO="$CLEAN_ALIAS"
            echo "   ✅ Alias correcto: $CLEAN_ALIAS"
            break
        fi
    done
    
    if [ -z "$SHA1_ENCONTRADO" ]; then
        echo ""
        echo "   ⚠️  No se pudo leer el keystore automáticamente"
        echo "   💡 Necesitas proporcionar la contraseña manualmente:"
        echo ""
        echo "   ./scripts/verificar_sha1_keystore.sh \"$KEYSTORE_PATH\" [alias]"
        echo ""
        echo "   Prueba estos alias comunes:"
        for ALIAS in "${ALIASES[@]}"; do
            echo "     - $ALIAS"
        done
        echo ""
        continue
    fi
    
    SHA1_ESPERADO_NORM=$(echo "$SHA1_ESPERADO" | tr '[:lower:]' '[:upper:]' | tr -d ' ')
    SHA1_ENCONTRADO_NORM=$(echo "$SHA1_ENCONTRADO" | tr '[:lower:]' '[:upper:]' | tr -d ' ')
    
    echo ""
    echo "   🔑 SHA1 encontrado: $SHA1_ENCONTRADO"
    echo "   ✅ SHA1 esperado:   $SHA1_ESPERADO"
    echo ""
    
    if [ "$SHA1_ENCONTRADO_NORM" = "$SHA1_ESPERADO_NORM" ]; then
        echo "   🎉 ¡ÉXITO! Este es el KEYSTORE CORRECTO"
        echo ""
        echo "   📁 Archivo: $KEYSTORE_PATH"
        echo "   🔑 Alias: $ALIAS_CORRECTO"
        echo ""
        echo "   ✅ Este es el keystore anterior que debes usar"
        echo ""
        ENCONTRADO_CORRECTO=true
    else
        echo "   ❌ Este NO es el keystore correcto"
        echo ""
    fi
    
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Resumen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Si no se encontró automáticamente el keystore correcto, verifica manualmente:"
echo ""
echo "  ./scripts/verificar_sha1_keystore.sh temp_keystores/[nombre].jks [alias]"
echo ""
echo "📖 Lee temp_keystores/README.md para más información sobre cómo usar el keystore correcto."
