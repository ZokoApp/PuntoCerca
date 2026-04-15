export const CATEGORIES = {

  "Gastronomía": [
    { id: 1, name: "Restaurante" },
    { id: 2, name: "Pizzería" },
    { id: 3, name: "Bar" },
    { id: 4, name: "Cafetería" },
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
    { id: 7, name: "Electrónica" },
    { id: 8, name: "Ferretería" },
    { id: 9, name: "Librería" }
  ],

  "Belleza": [
    { id: 10, name: "Peluquería" },
    { id: 11, name: "Barbería" },
    { id: 12, name: "Estética" },
    { id: 13, name: "Spa" }
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

  // 🔥 NUEVAS
  { id: 56, name: "Refrigeración" },
  { id: 57, name: "Aire acondicionado" },
  { id: 58, name: "Instalaciones" },
  { id: 59, name: "Mantenimiento" },
  { id: 60, name: "Service técnico" }
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
