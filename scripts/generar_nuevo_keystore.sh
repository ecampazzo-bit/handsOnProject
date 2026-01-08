#!/bin/bash

# Script para generar un nuevo keystore para la app Android
# Uso: ./generar_nuevo_keystore.sh

echo "=========================================="
echo "Generador de Nuevo Keystore Android"
echo "=========================================="
echo ""

# Navegar al directorio de la app
cd "$(dirname "$0")/../mobile/android/app"

# Nombre del nuevo keystore
KEYSTORE_NAME="my-release-key-new.keystore"
ALIAS_NAME="my-key-alias-new"

echo "Este script generará un nuevo keystore con los siguientes valores:"
echo "  - Nombre del keystore: $KEYSTORE_NAME"
echo "  - Alias: $ALIAS_NAME"
echo "  - Algoritmo: RSA"
echo "  - Tamaño de clave: 2048 bits"
echo "  - Validez: 10000 días (~27 años)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Guarda las contraseñas en un lugar seguro"
echo "   - Si ya tienes una app publicada, NO uses este keystore"
echo "   - Este keystore reemplazará el anterior"
echo ""

read -p "¿Continuar? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo "Operación cancelada."
    exit 1
fi

echo ""
echo "Generando nuevo keystore..."
echo ""

# Generar el keystore
keytool -genkeypair -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE_NAME" \
    -alias "$ALIAS_NAME" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore generado exitosamente: $KEYSTORE_NAME"
    echo ""
    echo "📝 Próximos pasos:"
    echo "   1. Actualiza las propiedades en mobile/android/gradle.properties:"
    echo "      MYAPP_RELEASE_STORE_FILE=$KEYSTORE_NAME"
    echo "      MYAPP_RELEASE_KEY_ALIAS=$ALIAS_NAME"
    echo "      MYAPP_RELEASE_STORE_PASSWORD=<tu_contraseña_del_keystore>"
    echo "      MYAPP_RELEASE_KEY_PASSWORD=<tu_contraseña_del_alias>"
    echo ""
    echo "   2. Opcional: Haz backup del keystore anterior:"
    echo "      cp my-release-key.keystore my-release-key.keystore.backup"
    echo ""
    echo "   3. Renombra el nuevo keystore (opcional):"
    echo "      mv $KEYSTORE_NAME my-release-key.keystore"
    echo ""
else
    echo ""
    echo "❌ Error al generar el keystore"
    exit 1
fi
