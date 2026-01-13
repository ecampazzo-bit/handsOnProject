#!/bin/bash

# Script para buscar archivos keystore en el sistema
# Uso: ./buscar_keystores.sh

echo "🔍 Buscando archivos keystore en el sistema..."
echo "=============================================="
echo ""

# SHA1 esperado (el correcto)
SHA1_ESPERADO="AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5"

# Directorios comunes donde buscar
DIRECTORIOS=(
    "$HOME/Documents"
    "$HOME/Desktop"
    "$HOME/Downloads"
    "$HOME/Dropbox"
    "$HOME/Google Drive"
    "$HOME/OneDrive"
    "$HOME/Projects"
    "$HOME/Dev"
    "$HOME/Development"
)

echo "📁 Buscando en directorios comunes..."
echo ""

# Buscar archivos .keystore y .jks
ENCONTRADOS=0

for DIR in "${DIRECTORIOS[@]}"; do
    if [ -d "$DIR" ]; then
        echo "🔍 Buscando en: $DIR"
        RESULTADOS=$(find "$DIR" -type f \( -name "*.keystore" -o -name "*.jks" \) 2>/dev/null)
        
        if [ -n "$RESULTADOS" ]; then
            echo "$RESULTADOS" | while IFS= read -r ARCHIVO; do
                ENCONTRADOS=$((ENCONTRADOS + 1))
                echo "   ✅ Encontrado: $ARCHIVO"
            done
        fi
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 RESUMEN"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Buscar también en el proyecto actual
PROYECTO_DIR="$HOME/Documents/Dev/handsOnProject"
if [ -d "$PROYECTO_DIR" ]; then
    echo "🔍 Buscando en el proyecto actual..."
    RESULTADOS_PROYECTO=$(find "$PROYECTO_DIR" -type f \( -name "*.keystore" -o -name "*.jks" \) 2>/dev/null)
    
    if [ -n "$RESULTADOS_PROYECTO" ]; then
        echo "$RESULTADOS_PROYECTO" | while IFS= read -r ARCHIVO; do
            echo "   ✅ Encontrado: $ARCHIVO"
        done
    fi
fi

echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Para cada keystore encontrado, verifica su SHA1:"
echo "   ./verificar_sha1_keystore.sh [ruta-al-keystore] [alias]"
echo ""
echo "2. El SHA1 correcto debe ser:"
echo "   $SHA1_ESPERADO"
echo ""
echo "3. Una vez encontrado el keystore correcto, súbelo a EAS:"
echo "   cd mobile && eas credentials"
echo ""

# Buscar también en archivos de texto que puedan contener referencias
echo "🔍 Buscando referencias a keystores en archivos de documentación..."
echo ""

DOCS=$(find "$PROYECTO_DIR" -type f \( -name "*.md" -o -name "*.txt" -o -name "*.sh" \) 2>/dev/null | head -20)

if [ -n "$DOCS" ]; then
    echo "$DOCS" | while IFS= read -r ARCHIVO; do
        if grep -qi "keystore\|\.jks\|SHA1.*AB:D6:A8" "$ARCHIVO" 2>/dev/null; then
            echo "   📄 Posible referencia en: $ARCHIVO"
        fi
    done
fi

echo ""
echo "✅ Búsqueda completada"
echo ""
echo "💡 Tip: Si no encuentras el keystore, verifica:"
echo "   - Servicios de backup (Google Drive, Dropbox, iCloud)"
echo "   - Correos electrónicos antiguos"
echo "   - Documentación del proyecto"
echo "   - Contacta a Expo Support si usaste EAS desde el inicio"
