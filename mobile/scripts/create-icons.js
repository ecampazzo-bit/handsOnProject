// Script para crear iconos placeholder básicos usando sharp
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Asegurar que el directorio existe
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Color primario de la app: #4F46E5 (indigo)
const primaryColor = { r: 79, g: 70, b: 229 };

async function createIcon(filename, size) {
  const filePath = path.join(assetsDir, filename);
  
  try {
    // Crear una imagen sólida con el color primario
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b})"/>
        <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.2}" fill="white" text-anchor="middle" dominant-baseline="middle">H</text>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(filePath);
    
    console.log(`✓ Creado: ${filename} (${size}x${size})`);
  } catch (error) {
    console.error(`✗ Error creando ${filename}:`, error.message);
  }
}

async function createSplash(filename, width, height) {
  const filePath = path.join(assetsDir, filename);
  
  try {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b})"/>
        <text x="50%" y="50%" font-family="Arial" font-size="${Math.min(width, height) * 0.15}" fill="white" text-anchor="middle" dominant-baseline="middle">HandsOn</text>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .resize(width, height)
      .png()
      .toFile(filePath);
    
    console.log(`✓ Creado: ${filename} (${width}x${height})`);
  } catch (error) {
    console.error(`✗ Error creando ${filename}:`, error.message);
  }
}

async function main() {
  console.log('Generando iconos placeholder...\n');
  
  // Crear iconos
  await createIcon('icon.png', 1024);
  await createIcon('adaptive-icon.png', 1024);
  await createIcon('favicon.png', 32);
  
  // Crear splash screen (típicamente 2048x2048 o proporción de pantalla)
  await createSplash('splash.png', 2048, 2048);
  
  console.log('\n✓ Todos los iconos han sido creados en ./assets/');
  console.log('Nota: Estos son placeholders. Para producción, reemplázalos con iconos diseñados profesionalmente.');
}

main().catch(console.error);
