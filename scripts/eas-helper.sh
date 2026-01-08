#!/bin/bash

# Helper script para ejecutar comandos EAS desde cualquier ubicación
# Uso: ./scripts/eas-helper.sh <comando>
# Ejemplo: ./scripts/eas-helper.sh "submit --platform android"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$SCRIPT_DIR/../mobile"

if [ ! -f "$MOBILE_DIR/eas.json" ]; then
    echo "❌ Error: No se encontró eas.json en $MOBILE_DIR"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Uso: $0 <comando-eas>"
    echo ""
    echo "Ejemplos:"
    echo "  $0 'submit --platform android'"
    echo "  $0 'build --platform android'"
    echo "  $0 'build:list'"
    echo "  $0 'config'"
    exit 1
fi

echo "📱 Ejecutando: eas $1"
echo "📂 Desde: $MOBILE_DIR"
echo ""

cd "$MOBILE_DIR"
eas $1
