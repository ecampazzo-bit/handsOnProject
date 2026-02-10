# Instrucciones para Desplegar en Hostinger

## Preparar el Despliegue

### Opción 1: Usar el Script Automático (Recomendado)

Ejecuta el script de preparación desde el directorio `web/`:

```bash
cd web
./prepare-deploy.sh
```

Este script:
- Limpia builds anteriores
- Compila la aplicación para producción
- Crea un archivo ZIP (`web-deploy-YYYYMMDD-HHMMSS.zip`) con todos los archivos necesarios

### Opción 2: Preparación Manual

Si prefieres hacerlo manualmente:

```bash
cd web
npm run build
# Luego crea un ZIP excluyendo node_modules, .next, .env.local, etc.
```

## Archivos Incluidos en web-deploy.zip

El archivo `web-deploy.zip` contiene todos los archivos necesarios para desplegar la aplicación Next.js en Hostinger, incluyendo:
- ✅ Código fuente completo
- ✅ Archivos de configuración (next.config.js, package.json, etc.)
- ✅ Build de producción (`.next/` ya compilado)
- ✅ Assets públicos (imágenes, logos, etc.)

**Excluye:**
- `node_modules/` (se instalará en el servidor)
- `.env.local` (debe crearse en el servidor con tus credenciales)
- Archivos temporales y de desarrollo

## Pasos para Desplegar

### 1. Subir el archivo ZIP
- Sube `web-deploy.zip` a tu servidor Hostinger mediante FTP o el panel de control

### 2. Descomprimir
- Descomprime el archivo en el directorio raíz de tu sitio web (generalmente `public_html` o `htdocs`)

### 3. Crear archivo de entorno
- Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 4. Instalar dependencias
En el servidor, ejecuta:
```bash
npm install --production
```

**Nota:** Como el build ya está incluido en el ZIP, puedes usar `--production` para instalar solo las dependencias de producción (más rápido).

### 5. Iniciar la aplicación

**Nota:** Como el build ya está incluido en el ZIP, NO necesitas ejecutar `npm run build` nuevamente. Solo instala las dependencias e inicia la aplicación.

**Opción A: Con PM2 (recomendado para producción)**
```bash
npm install -g pm2
pm2 start npm --name "handson-web" -- start
pm2 save
pm2 startup
```

**Opción B: Con el proceso en segundo plano**
```bash
npm start
```

**Opción C: Si Hostinger tiene soporte para Node.js, configura el comando de inicio:**
- Comando: `npm start`
- Puerto: `3000` (o el que Hostinger asigne)

## Configuración de Dominio

Si Hostinger requiere configuración específica:
- Asegúrate de que el dominio apunte al puerto correcto
- Configura un proxy reverso si es necesario (nginx/Apache)
- Verifica que el puerto 3000 (o el asignado) esté abierto

## Notas Importantes

1. **Variables de entorno**: Nunca subas el archivo `.env.local` real al repositorio. Créalo directamente en el servidor.

2. **Node.js version**: Asegúrate de que Hostinger tenga Node.js 18.x o superior instalado.

3. **Build**: Si el servidor no tiene suficiente memoria para el build, puedes hacer el build localmente y subir la carpeta `.next` también.

4. **Puerto**: Hostinger puede asignar un puerto específico. Verifica en la documentación de Hostinger cómo configurar el puerto para aplicaciones Node.js.

5. **TailwindCSS en producción**: Para que los estilos de Tailwind se generen en el build de producción, asegúrate de que `tailwindcss`, `postcss` y `autoprefixer` estén instalados durante el build. En este proyecto se han movido a `dependencies` en [web/package.json](web/package.json) para que Hostinger los instale incluso con `NODE_ENV=production`. Si no se instalan, la página se verá “sin estilos”.

