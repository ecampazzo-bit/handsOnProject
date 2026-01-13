#!/bin/bash

# Script para verificar TODOS los keystores encontrados en el proyecto
# Este script intenta verificar cada keystore con diferentes aliases

echo "🔍 Verificador Completo de Todos los Keystores"
echo "=============================================="
echo ""

SHA1_ESPERADO="AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5"
PROJECT_ROOT="/Users/ecampazzo/Documents/Dev/handsOnProject"

# Aliases comunes a probar (basados en los nombres de archivos encontrados)
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
    "android-release-key"
    "keystore"
)

cd "$PROJECT_ROOT" || exit 1

# Buscar todos los archivos .jks (excluyendo node_modules y .git)
echo "📁 Buscando keystores en el proyecto..."
echo ""

KEYSTORES=$(find . -type f \( -name "*.jks" -o -name "*.keystore" \) 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v ".expo")

if [ -z "$KEYSTORES" ]; then
    echo "❌ No se encontraron keystores en el proyecto"
    exit 1
fi

echo "✅ Keystores encontrados:"
echo "$KEYSTORES" | nl -w2 -s'. '
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
echo "🔍 SHA1 esperado (correcto): $SHA1_ESPERADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   Este script intentará verificar cada keystore."
echo "   Necesitarás ingresar la contraseña para cada uno."
echo "   Si no tienes la contraseña, puedes presionar Enter para omitirlo."
echo ""
echo "Presiona Enter para comenzar..."
read -r

ENCONTRADO_CORRECTO=false
RESULTADOS=()

# Contador
CONTADOR=1
TOTAL=$(echo "$KEYSTORES" | wc -l | tr -d ' ')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verificando cada keystore..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Procesar cada keystore
echo "$KEYSTORES" | while IFS= read -r KEYSTORE; do
    KEYSTORE_NAME=$(basename "$KEYSTORE")
    KEYSTORE_DIR=$(dirname "$KEYSTORE")
    
    echo "[$CONTADOR/$TOTAL] 📦 Verificando: $KEYSTORE_NAME"
    echo "   📁 Ubicación: $KEYSTORE_DIR/"
    echo ""
    
    VERIFICADO=false
    
    # Intentar con cada alias
    for ALIAS in "${ALIASES[@]}"; do
        echo -n "   🔑 Probando alias '$ALIAS'... "
        
        # Intentar leer el keystore (sin contraseña, pero mostrará error si necesita contraseña)
        # Usamos timeout para evitar que se quede esperando indefinidamente
        SHA1_OUTPUT=$(timeout 5 keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" -storepass "" 2>&1)
        EXIT_CODE=$?
        
        # Si el exit code es 0, significa que encontró el alias (aunque pueda necesitar contraseña)
        if echo "$SHA1_OUTPUT" | grep -qi "SHA1:"; then
            SHA1=$(echo "$SHA1_OUTPUT" | grep -i "SHA1:" | head -1 | sed 's/.*SHA1: //' | tr -d ' ')
            
            if [ -n "$SHA1" ] && [ ${#SHA1} -gt 10 ]; then
                SHA1_NORMALIZED=$(echo "$SHA1" | tr '[:lower:]' '[:upper:]' | tr -d ':')
                SHA1_ESPERADO_NORMALIZED=$(echo "$SHA1_ESPERADO" | tr '[:lower:]' '[:upper:]' | tr -d ':')
                
                echo "✅ SHA1 encontrado: $SHA1"
                
                if [ "$SHA1_NORMALIZED" = "$SHA1_ESPERADO_NORMALIZED" ]; then
                    echo ""
                    echo "   🎉 ¡ÉXITO! Este es el keystore CORRECTO"
                    echo "   ✅ SHA1 coincide: $SHA1"
                    echo "   ✅ Alias correcto: $ALIAS"
                    echo "   ✅ Archivo: $KEYSTORE"
                    echo ""
                    ENCONTRADO_CORRECTO=true
                    VERIFICADO=true
                    RESULTADOS+=("✅ CORRECTO: $KEYSTORE (alias: $ALIAS, SHA1: $SHA1)")
                    break
                else
                    echo "   ⚠️  SHA1 no coincide: $SHA1"
                    RESULTADOS+=("❌ INCORRECTO: $KEYSTORE (alias: $ALIAS, SHA1: $SHA1)")
                fi
            fi
        fi
        
        # Si necesita contraseña, lo indicamos
        if echo "$SHA1_OUTPUT" | grep -qi "password"; then
            echo "🔒 Requiere contraseña"
            RESULTADOS+=("🔒 REQUIERE CONTRASEÑA: $KEYSTORE (alias: $ALIAS)")
        fi
    done
    
    if [ "$VERIFICADO" = false ]; then
        echo "   ⚠️  No se pudo verificar (necesita contraseña o alias incorrecto)"
        echo ""
        echo "   💡 Intenta verificar manualmente:"
        echo "      ./scripts/verificar_sha1_keystore.sh \"$KEYSTORE\" [alias]"
        echo ""
    fi
    
    echo "────────────────────────────────────────────────────────────────────"
    echo ""
    
    CONTADOR=$((CONTADOR + 1))
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Mostrar resultados
for RESULTADO in "${RESULTADOS[@]}"; do
    echo "$RESULTADO"
done

echo ""
echo "🔑 SHA1 esperado (correcto): $SHA1_ESPERADO"
echo ""

if [ "$ENCONTRADO_CORRECTO" = false ]; then
    echo "⚠️  No se encontró ningún keystore con el SHA1 correcto automáticamente"
    echo ""
    echo "Posibles razones:"
    echo "  - Los keystores requieren contraseña (debes verificarlos manualmente)"
    echo "  - El alias es diferente a los probados"
    echo ""
    echo "💡 Próximos pasos:"
    echo "  1. Verifica manualmente cada keystore con su contraseña:"
    echo "     ./scripts/verificar_sha1_keystore.sh [ruta-al-keystore] [alias]"
    echo ""
    echo "  2. Si encuentras el keystore correcto, súbelo a EAS:"
    echo "     ./scripts/subir_keystore_a_eas.sh [ruta-al-keystore] [alias]"
    echo ""
    echo "  3. Si no encuentras el keystore correcto, contacta a Google Play Support"
else
    echo "✅ Se encontró el keystore correcto (ver arriba)"
    echo ""
    echo "📝 Próximos pasos:"
    echo "  1. Asegúrate de tener la contraseña de este keystore"
    echo "  2. Súbelo a EAS usando el script:"
    echo "     ./scripts/subir_keystore_a_eas.sh [ruta-al-keystore] [alias]"
fi

echo ""
