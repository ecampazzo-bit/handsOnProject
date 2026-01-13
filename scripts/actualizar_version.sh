#!/bin/bash

# Script para actualizar automáticamente la versión del build
# Uso: ./scripts/actualizar_version.sh [tipo]
# Tipos: patch (default), minor, major

set -e

PROJECT_ROOT="/Users/ecampazzo/Documents/Dev/handsOnProject"
APP_JSON="$PROJECT_ROOT/mobile/app.json"
PACKAGE_JSON="$PROJECT_ROOT/mobile/package.json"

cd "$PROJECT_ROOT" || exit 1

echo "📦 Actualizador de Versión del Build"
echo "===================================="
echo ""

# Verificar que los archivos existen
if [ ! -f "$APP_JSON" ]; then
    echo "❌ Error: No se encontró $APP_JSON"
    exit 1
fi

if [ ! -f "$PACKAGE_JSON" ]; then
    echo "❌ Error: No se encontró $PACKAGE_JSON"
    exit 1
fi

# Leer versión actual
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' "$APP_JSON" | cut -d'"' -f4)
CURRENT_VERSION_CODE=$(grep -o '"versionCode": [0-9]*' "$APP_JSON" | grep -o '[0-9]*')
CURRENT_BUILD_NUMBER=$(grep -o '"buildNumber": "[^"]*"' "$APP_JSON" | cut -d'"' -f4)

echo "📋 Versiones actuales:"
echo "   Versión: $CURRENT_VERSION"
echo "   Android versionCode: $CURRENT_VERSION_CODE"
echo "   iOS buildNumber: $CURRENT_BUILD_NUMBER"
echo ""

# Determinar tipo de actualización
UPDATE_TYPE="${1:-patch}"

if [ "$UPDATE_TYPE" != "patch" ] && [ "$UPDATE_TYPE" != "minor" ] && [ "$UPDATE_TYPE" != "major" ]; then
    echo "⚠️  Tipo de actualización inválido: $UPDATE_TYPE"
    echo "   Usando 'patch' por defecto"
    UPDATE_TYPE="patch"
fi

# Incrementar versión
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

case "$UPDATE_TYPE" in
    "major")
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    "minor")
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    "patch")
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# Incrementar versionCode y buildNumber
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))
NEW_BUILD_NUMBER=$((CURRENT_BUILD_NUMBER + 1))

echo "🔄 Actualizando a:"
echo "   Versión: $CURRENT_VERSION → $NEW_VERSION ($UPDATE_TYPE)"
echo "   Android versionCode: $CURRENT_VERSION_CODE → $NEW_VERSION_CODE"
echo "   iOS buildNumber: $CURRENT_BUILD_NUMBER → $NEW_BUILD_NUMBER"
echo ""

# Confirmar
read -p "¿Continuar con la actualización? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "❌ Actualización cancelada"
    exit 0
fi

echo ""
echo "📝 Actualizando archivos..."

# Actualizar app.json
# Actualizar version
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$APP_JSON"

# Actualizar versionCode
sed -i '' "s/\"versionCode\": $CURRENT_VERSION_CODE/\"versionCode\": $NEW_VERSION_CODE/" "$APP_JSON"

# Actualizar buildNumber
sed -i '' "s/\"buildNumber\": \"$CURRENT_BUILD_NUMBER\"/\"buildNumber\": \"$NEW_BUILD_NUMBER\"/" "$APP_JSON"

# Actualizar package.json
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_JSON"

echo "✅ Archivos actualizados"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Versión actualizada:"
echo "   Versión: $NEW_VERSION"
echo "   Android versionCode: $NEW_VERSION_CODE"
echo "   iOS buildNumber: $NEW_BUILD_NUMBER"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Verifica los cambios:"
echo "   git diff mobile/app.json mobile/package.json"
echo ""
echo "2. Genera el build:"
echo "   cd mobile"
echo "   eas build --platform android --profile production"
echo ""
echo "3. (Opcional) Commit los cambios:"
echo "   git add mobile/app.json mobile/package.json"
echo "   git commit -m \"Bump version to $NEW_VERSION (build $NEW_VERSION_CODE)\""
echo ""
