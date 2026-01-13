#!/bin/bash

# Script simplificado para verificar los keystores encontrados
# Este script te guía para verificar el SHA1 de cada keystore

echo "🔍 Verificador de Keystores Encontrados"
echo "========================================"
echo ""

SHA1_ESPERADO="AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5"
ALIAS="527d7a6ec1a63abd37b1ad3cd6b8407e"

echo "📋 Keystores encontrados en temp_keystores/:"
echo "   1. @ecampazzo__handson-app.jks (keystore actual)"
echo "   2. @ecampazzo__handson-app_OLD_1.jks (keystore anterior/backup)"
echo ""
echo "🔑 Alias: $ALIAS"
echo "✅ SHA1 esperado (correcto): $SHA1_ESPERADO"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Para verificar cada keystore, ejecuta:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Verificar keystore actual:"
echo "   ./scripts/verificar_sha1_keystore.sh temp_keystores/@ecampazzo__handson-app.jks $ALIAS"
echo ""
echo "2️⃣  Verificar keystore anterior/backup:"
echo "   ./scripts/verificar_sha1_keystore.sh temp_keystores/@ecampazzo__handson-app_OLD_1.jks $ALIAS"
echo ""
echo "💡 El script te pedirá la contraseña del keystore."
echo "   El keystore que tenga el SHA1 $SHA1_ESPERADO es el CORRECTO (anterior)."
echo ""
echo "📖 Una vez identificado, lee temp_keystores/README.md para saber cómo usarlo."
