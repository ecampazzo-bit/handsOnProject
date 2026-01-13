#!/bin/bash

# Script simplificado para verificar todos los keystores encontrados
# Muestra una lista y permite verificar cada uno manualmente

echo "🔍 Verificador de Todos los Keystores"
echo "====================================="
echo ""

SHA1_ESPERADO="AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5"
PROJECT_ROOT="/Users/ecampazzo/Documents/Dev/handsOnProject"

cd "$PROJECT_ROOT" || exit 1

# Buscar todos los archivos .jks (excluyendo node_modules, .git, debug keystores)
echo "📁 Buscando keystores en el proyecto..."
echo ""

KEYSTORES=$(find . -type f \( -name "*.jks" -o -name "*.keystore" \) 2>/dev/null | \
    grep -v node_modules | \
    grep -v ".git" | \
    grep -v ".expo" | \
    grep -v "debug.keystore" | \
    sort)

if [ -z "$KEYSTORES" ]; then
    echo "❌ No se encontraron keystores en el proyecto"
    exit 1
fi

echo "✅ Keystores encontrados (excluyendo debug keystores):"
echo ""
NUMERO=1
declare -a KEYSTORE_ARRAY

while IFS= read -r KEYSTORE; do
    if [ -n "$KEYSTORE" ]; then
        KEYSTORE_NAME=$(basename "$KEYSTORE")
        KEYSTORE_DIR=$(dirname "$KEYSTORE" | sed 's|^\./||')
        echo "   $NUMERO. $KEYSTORE_NAME"
        echo "      📁 $KEYSTORE_DIR/"
        KEYSTORE_ARRAY[$NUMERO]="$KEYSTORE"
        NUMERO=$((NUMERO + 1))
    fi
done <<< "$KEYSTORES"

TOTAL=$((NUMERO - 1))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 SHA1 esperado (correcto): $SHA1_ESPERADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
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

echo "💡 Puedes verificar cada keystore manualmente con la contraseña."
echo ""
echo "¿Quieres verificar TODOS los keystores automáticamente? (s/n)"
echo "   Esto intentará diferentes aliases pero necesitarás la contraseña para cada uno."
read -r VERIFICAR_TODOS

if [ "$VERIFICAR_TODOS" != "s" ] && [ "$VERIFICAR_TODOS" != "S" ]; then
    echo ""
    echo "📝 Para verificar manualmente cada keystore, usa:"
    echo ""
    NUMERO=1
    while IFS= read -r KEYSTORE; do
        if [ -n "$KEYSTORE" ]; then
            KEYSTORE_NAME=$(basename "$KEYSTORE")
            echo "   $NUMERO. ./scripts/verificar_sha1_keystore.sh \"$KEYSTORE\" [alias]"
            echo "      # Keystore: $KEYSTORE_NAME"
            NUMERO=$((NUMERO + 1))
        fi
    done <<< "$KEYSTORES"
    echo ""
    echo "💡 Aliases comunes a probar:"
    echo "   - @ecampazzo__handson-app"
    echo "   - @ecampazzo__handson-app_OLD_1"
    echo "   - 527d7a6ec1a63abd37b1ad3cd6b8407e"
    echo "   - upload"
    echo "   - my-key-alias"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verificando cada keystore..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  Para cada keystore, se intentarán diferentes aliases."
echo "   Si requiere contraseña, ingrésala cuando se solicite."
echo "   Puedes presionar Enter si no tienes la contraseña para omitirlo."
echo ""

ENCONTRADO_CORRECTO=false
CONTADOR=1

# Aliases comunes a probar
ALIASES=(
    "@ecampazzo__handson-app"
    "@ecampazzo__handson-app_OLD_1"
    "@ecampazzo__handson-app1"
    "@ecampazzo__handson-app2"
    "527d7a6ec1a63abd37b1ad3cd6b8407e"
    "upload"
    "my-key-alias"
    "key0"
    "release"
)

while IFS= read -r KEYSTORE; do
    if [ -z "$KEYSTORE" ]; then
        continue
    fi
    
    KEYSTORE_NAME=$(basename "$KEYSTORE")
    KEYSTORE_DIR=$(dirname "$KEYSTORE" | sed 's|^\./||')
    
    echo "[$CONTADOR/$TOTAL] 📦 Verificando: $KEYSTORE_NAME"
    echo "   📁 $KEYSTORE_DIR/"
    echo ""
    
    VERIFICADO_ESTE=false
    
    # Intentar con cada alias
    for ALIAS in "${ALIASES[@]}"; do
        echo -n "   🔑 Probando alias '$ALIAS'... "
        
        # Intentar leer el keystore (sin contraseña primero)
        SHA1_OUTPUT=$(keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" 2>&1 <<< "")
        EXIT_CODE=$?
        
        # Verificar si se obtuvo un SHA1 válido
        if echo "$SHA1_OUTPUT" | grep -qi "SHA1:"; then
            SHA1=$(echo "$SHA1_OUTPUT" | grep -i "SHA1:" | head -1 | sed 's/.*SHA1: //' | sed 's/^[[:space:]]*//' | head -c 59)
            
            if [ -n "$SHA1" ] && [ ${#SHA1} -gt 10 ]; then
                # Normalizar SHA1 (quitar espacios, convertir a mayúsculas)
                SHA1_NORMALIZED=$(echo "$SHA1" | tr '[:lower:]' '[:upper:]' | tr -d '[:space:]' | tr -d ':')
                SHA1_ESPERADO_NORMALIZED=$(echo "$SHA1_ESPERADO" | tr '[:lower:]' '[:upper:]' | tr -d '[:space:]' | tr -d ':')
                
                echo "✅ SHA1: $SHA1"
                
                if [ "$SHA1_NORMALIZED" = "$SHA1_ESPERADO_NORMALIZED" ]; then
                    echo ""
                    echo "   🎉 ¡ÉXITO! Este es el keystore CORRECTO"
                    echo "   ✅ SHA1 coincide: $SHA1"
                    echo "   ✅ Alias correcto: $ALIAS"
                    echo "   ✅ Archivo: $KEYSTORE"
                    echo ""
                    ENCONTRADO_CORRECTO=true
                    VERIFICADO_ESTE=true
                    echo ""
                    echo "   📝 Próximos pasos:"
                    echo "      1. Asegúrate de tener la contraseña de este keystore"
                    echo "      2. Súbelo a EAS:"
                    echo "         ./scripts/subir_keystore_a_eas.sh \"$KEYSTORE\" \"$ALIAS\""
                    echo ""
                    break
                else
                    echo "   ⚠️  SHA1 no coincide: $SHA1"
                fi
            fi
        elif echo "$SHA1_OUTPUT" | grep -qi "password"; then
            echo "🔒 Requiere contraseña (usa el script de verificación manual)"
        elif echo "$SHA1_OUTPUT" | grep -qi "keytool error"; then
            echo "❌ Error (alias incorrecto o keystore inválido)"
        fi
    done
    
    if [ "$VERIFICADO_ESTE" = false ]; then
        echo ""
        echo "   ⚠️  No se pudo verificar automáticamente"
        echo "   💡 Verifica manualmente:"
        echo "      ./scripts/verificar_sha1_keystore.sh \"$KEYSTORE\" [alias]"
        echo ""
    fi
    
    echo "────────────────────────────────────────────────────────────────────"
    echo ""
    
    CONTADOR=$((CONTADOR + 1))
done <<< "$KEYSTORES"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$ENCONTRADO_CORRECTO" = true ]; then
    echo "✅ ¡Se encontró el keystore correcto! (ver arriba)"
    echo ""
    echo "📝 Próximos pasos:"
    echo "  1. Asegúrate de tener la contraseña de este keystore"
    echo "  2. Súbelo a EAS usando el script de subida"
else
    echo "⚠️  No se encontró ningún keystore con el SHA1 correcto automáticamente"
    echo ""
    echo "Posibles razones:"
    echo "  - Los keystores requieren contraseña (verifica manualmente)"
    echo "  - El alias es diferente a los probados"
    echo ""
    echo "💡 Próximos pasos:"
    echo "  1. Verifica manualmente cada keystore con su contraseña:"
    echo "     ./scripts/verificar_sha1_keystore.sh [ruta-al-keystore] [alias]"
    echo ""
    echo "  2. Si encuentras el keystore correcto, súbelo a EAS:"
    echo "     ./scripts/subir_keystore_a_eas.sh [ruta-al-keystore] [alias]"
fi

echo ""
echo "🔑 SHA1 esperado (correcto): $SHA1_ESPERADO"
echo ""
