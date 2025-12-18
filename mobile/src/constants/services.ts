export const SERVICIOS: Record<string, string[]> = {
  'Construcción y Albañilería': [
    'Albañil',
    'Constructor',
    'Maestro mayor de obras',
    'Oficial de construcción',
    'Yesero',
    'Revocador',
    'Colocador de revestimientos',
    'Demoliciones',
  ],
  'Electricidad': [
    'Electricista matriculado',
    'Electricista domiciliario',
    'Electricista industrial',
    'Instalador de tableros eléctricos',
    'Instalador de sistemas de iluminación',
    'Reparación de electrodomésticos',
  ],
  'Plomería y Gas': [
    'Plomero',
    'Gasista matriculado',
    'Destapador de cañerías',
    'Instalador de termotanques',
    'Instalador de calefones',
    'Reparación de bombas de agua',
    'Instalador de sistemas de riego',
  ],
  'Climatización': [
    'Técnico en aire acondicionado',
    'Instalador de split',
    'Técnico en refrigeración',
    'Instalador de calefacción',
    'Mantenimiento de sistemas HVAC',
  ],
  'Pintura y Revestimientos': [
    'Pintor',
    'Pintor de obra',
    'Durlock / Yeso',
    'Colocador de papel tapiz',
    'Colocador de vinilos decorativos',
    'Microcemento / Cemento alisado',
    'Venecitas',
  ],
  'Pisos y Cerámicas': [
    'Colocador de cerámicos',
    'Colocador de porcelanatos',
    'Pulidor de pisos',
    'Plastificador de pisos',
    'Colocador de pisos flotantes',
    'Parquetista',
    'Instalador de alfombras',
  ],
  'Carpintería': [
    'Carpintero',
    'Ebanista',
    'Restaurador de muebles',
    'Fabricante de muebles a medida',
    'Instalador de muebles de cocina',
    'Tapicero',
  ],
  'Herrería y Metalurgia': [
    'Herrero',
    'Soldador',
    'Instalador de rejas',
    'Fabricante de portones',
    'Cerrajero',
    'Afilador',
  ],
  'Techos e Impermeabilización': [
    'Techista',
    'Instalador de membranas',
    'Impermeabilizador',
    'Instalador de canaletas',
    'Reparación de techos',
    'Instalador de tejas',
  ],
  'Vidrios y Aberturas': [
    'Vidriero',
    'Instalador de ventanas',
    'Instalador de mamparas',
    'Reparación de aberturas de aluminio',
    'Mosquiteros',
  ],
  'Jardinería y Paisajismo': [
    'Jardinero',
    'Paisajista',
    'Podador de árboles',
    'Fumigador',
    'Mantenimiento de piscinas',
    'Instalador de césped sintético',
    'Limpieza de terrenos',
  ],
  'Tecnología e Informática': [
    'Técnico en computación',
    'Instalador de redes',
    'Técnico en celulares',
    'Reparación de notebooks',
    'Instalador de cámaras de seguridad',
    'Configuración de Smart TV',
    'Soporte técnico remoto',
  ],
  'Electrodomésticos': [
    'Técnico en heladeras',
    'Técnico en lavarropas',
    'Técnico en microondas',
    'Reparación de cocinas',
    'Técnico en aspiradoras',
    'Service de línea blanca',
  ],
  'Automotor': [
    'Mecánico',
    'Electricista del automotor',
    'Chapista',
    'Pintor automotor',
    'Gomería',
    'Lavadero de autos',
    'Instalador de alarmas',
    'Polarizado de vidrios',
  ],
  'Limpieza': [
    'Limpieza de casas/departamentos',
    'Limpieza profunda / post obra',
    'Limpieza de oficinas',
    'Limpieza de tapizados',
    'Limpieza de vidrios',
    'Limpieza de tanques de agua',
    'Desinfección y sanitización',
  ],
  'Mudanzas y Transporte': [
    'Mudanzas',
    'Flete',
    'Guardamuebles',
    'Armado y desarmado de muebles',
  ],
  'Eventos y Catering': [
    'Chef a domicilio',
    'Catering',
    'Servicio de mozos',
    'Barman',
    'DJ',
    'Fotógrafo',
    'Organizador de eventos',
  ],
  'Estética y Belleza': [
    'Peluquero/a a domicilio',
    'Manicura/Pedicura',
    'Maquillador/a',
    'Masajista',
    'Barbero',
    'Depilación',
  ],
  'Salud y Bienestar': [
    'Enfermero/a',
    'Cuidador/a de adultos mayores',
    'Cuidador/a de niños (niñera)',
    'Fisioterapeuta a domicilio',
    'Nutricionista',
    'Entrenador personal',
  ],
  'Educación': [
    'Profesor particular (matemática, física, etc.)',
    'Profesor de idiomas',
    'Profesor de música',
    'Apoyo escolar',
    'Clases de computación',
  ],
  'Mascotas': [
    'Veterinario a domicilio',
    'Paseador de perros',
    'Peluquería canina',
    'Adiestrador',
    'Cuidador de mascotas',
  ],
  'Seguridad': [
    'Instalador de alarmas',
    'Cerrajería 24hs',
    'Instalador de cámaras',
    'Portero eléctrico',
    'Control de accesos',
  ],
  'Otros Servicios': [
    'Tapicero de autos',
    'Afinador de instrumentos',
    'Costurero/a',
    'Modista',
    'Zapatero',
    'Lustrador de calzado',
  ],
};

export interface Service {
  id: string;
  name: string;
  category: string;
}

export const getAllServices = (): Service[] => {
  const services: Service[] = [];
  Object.keys(SERVICIOS).forEach((category) => {
    SERVICIOS[category].forEach((service) => {
      services.push({
        id: `${category}-${service}`,
        name: service,
        category,
      });
    });
  });
  return services;
};

export const searchServices = (query: string): Service[] => {
  const queryLower = query.toLowerCase();
  const results: Service[] = [];

  Object.keys(SERVICIOS).forEach((category) => {
    SERVICIOS[category].forEach((service) => {
      if (
        service.toLowerCase().includes(queryLower) ||
        category.toLowerCase().includes(queryLower)
      ) {
        results.push({
          id: `${category}-${service}`,
          name: service,
          category,
        });
      }
    });
  });

  return results;
};





