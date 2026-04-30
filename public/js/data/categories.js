export const CATEGORIES = {

  "Gastronomía": [
    { id: 1, name: "Restaurante" },
    { id: 2, name: "Pizzería" },
    { id: 3, name: "Bar" },
    { id: 4, name: "Cafetería" },
     { id: 98, name: "Rotiseria" },
    { id: 5, name: "Heladería" }
    
  ],

  "Alimentos": [
    { id: 46, name: "Verdulería" },
    { id: 50, name: "Carnicería" },
    { id: 51, name: "Panadería" },
    { id: 52, name: "Fiambrería" },
    { id: 53, name: "Dietética" },
    { id: 54, name: "Bebidas" },
    { id: 55, name: "Mayorista" },
    { id: 49, name: "Supermercado" },
    { id: 47, name: "Almacén" },
    { id: 48, name: "Kiosco" }
  ],

  "Comercio": [
  { id: 6, name: "Ropa" },

  { id: 80, name: "Bazar" },

     { id: 81, name: "Deco" },
    { id: 82, name: "Minorista" },
    { id: 83, name: "Mayorista" },
    
  { id: 7, name: "Electrónica general" },
  { id: 62, name: "Celulares" },
  { id: 63, name: "Accesorios para celulares" },
  { id: 64, name: "Computación" },
  { id: 65, name: "TV y Smart TV" },
  { id: 66, name: "Audio" },
  { id: 67, name: "Gaming" },

  { id: 8, name: "Ferretería" },
  { id: 9, name: "Librería" }
],

  "Belleza": [
    { id: 10, name: "Peluquería" },
    { id: 11, name: "Barbería" },
    { id: 12, name: "Estética" },
    { id: 83, name: "Cosmeticos" },
    { id: 13, name: "Spa" }
  ],

  "Indumentarias": [
    { id: 89, name: "Zapatillas" },
     { id: 90, name: "Remeras" },
     { id: 91, name: "Camisetas de Futbol" },
    { id: 92, name: "Camperas" },
    { id: 93, name: "Buzos" },
    { id: 94, name: "Ropa Interior" },
    { id: 95, name: "Ropa Deportiva" },
    { id: 96, name: "Gorras" }
  ],

  "Marroquineria": [
    { id: 85, name: "Bolsos" },
    { id: 86, name: "Billeteras" },
    { id: 87, name: "Mochilas" },
    { id: 88, name: "Neceser" }
  ],
  

  "Salud": [
    { id: 14, name: "Clínica" },
    { id: 15, name: "Odontología" },
    { id: 16, name: "Farmacia" },
    { id: 17, name: "Psicología" }
  ],

  "Servicios": [
  { id: 18, name: "Electricista" },
  { id: 19, name: "Plomería" },
  { id: 20, name: "Gasista" },
  { id: 21, name: "Técnico PC" },
  { id: 22, name: "Reparaciones" },
  { id: 61, name: "Cerrajeria" },

  // 🔥 NUEVAS
  { id: 56, name: "Refrigeración" },
  { id: 57, name: "Aire acondicionado" },
  { id: 58, name: "Instalaciones" },
  { id: 59, name: "Mantenimiento" },
  { id: 60, name: "Service técnico" },
  { id: 68, name: "Lavandería" }  
],

  "Automotor": [
    { id: 23, name: "Taller mecánico" },
    { id: 24, name: "Lavadero" },
    { id: 25, name: "Gomería" },
    { id: 26, name: "Repuestos" }
  ],

  "Educación": [
    { id: 27, name: "Instituto" },
    { id: 28, name: "Clases particulares" },
    { id: 29, name: "Academia" }
  ],

  "Deportes": [
    { id: 30, name: "Gimnasio" },
    { id: 31, name: "Escuela deportiva" },
    { id: 32, name: "Club" }
  ],

  "Mascotas": [
    { id: 33, name: "Veterinaria" },
    { id: 34, name: "Pet Shop" },
    { id: 35, name: "Peluquería canina" }
  ],

  "Hogar": [
    { id: 36, name: "Mueblería" },
    { id: 37, name: "Decoración" },
    { id: 84, name: "Accesorios de Baño" },
    { id: 38, name: "Construcción" }
  ],

  "Profesionales": [
    { id: 39, name: "Abogado" },
    { id: 40, name: "Contador" },
    { id: 41, name: "Arquitecto" },
    { id: 42, name: "Marketing" }
  ],

  "Eventos": [
    { id: 43, name: "Salón de eventos" },
         { id: 99, name: "Show en vivo" },
    { id: 44, name: "Catering" },
    { id: 45, name: "Fotografía" }
  ]

};

export const SUBCATEGORY_MAP = Object.values(CATEGORIES)
  .flat()
  .reduce((acc, sub) => {
    acc[sub.id] = sub.name;
    return acc;
  }, {});
