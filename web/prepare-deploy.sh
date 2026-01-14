#!/bin/bash

# Script para preparar el despliegue en Hostinger
# Este script crea un archivo ZIP con todos los archivos necesarios para desplegar

set -e

echo "🚀 Preparando despliegue para Hostinger..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio actual
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Nombre del archivo ZIP
ZIP_NAME="web-deploy-$(date +%Y%m%d-%H%M%S).zip"

echo -e "${YELLOW}📦 Limpiando builds anteriores...${NC}"
rm -rf .next
rm -f web-deploy-*.zip

echo -e "${YELLOW}🔨 Compilando la aplicación para producción...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error al compilar la aplicación. Revisa los errores arriba."
    exit 1
fi

echo -e "${YELLOW}📝 Creando archivo ZIP para despliegue...${NC}"

# Crear el ZIP excluyendo los archivos en .deployignore
zip -r "$ZIP_NAME" . \
    -x "node_modules/*" \
    -x ".next/*" \
    -x ".env.local" \
    -x ".env" \
    -x "*.log" \
    -x ".DS_Store" \
    -x "*.zip" \
    -x "web-deploy-*.zip" \
    -x "Archivo.zip" \
    -x ".deployignore" \
    -x ".git/*" \
    -x ".gitignore" \
    -x "*.md" \
    -x "prepare-deploy.sh" \
    > /dev/null

if [ $? -eq 0 ]; then
    ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
    echo -e "${GREEN}✅ Archivo de despliegue creado exitosamente!${NC}"
    echo -e "${GREEN}📦 Archivo: $ZIP_NAME (Tamaño: $ZIP_SIZE)${NC}"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Sube el archivo '$ZIP_NAME' a tu servidor Hostinger"
    echo "2. Descomprime el archivo en el directorio raíz (public_html o htdocs)"
    echo "3. Crea el archivo .env.local con tus variables de entorno"
    echo "4. Ejecuta: npm install"
    echo "5. Ejecuta: npm start (o usa PM2 para producción)"
else
    echo "❌ Error al crear el archivo ZIP"
    exit 1
fi
