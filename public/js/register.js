const CATEGORY_MAP = {
  "Gastronomía": [
    { id: 1, name: "Restaurante" },
    { id: 2, name: "Pizzería" },
    { id: 3, name: "Bar" },
    { id: 4, name: "Cafetería" },
    { id: 5, name: "Heladería" }
  ],
  "Comercio": [
    { id: 6, name: "Ropa" },
    { id: 7, name: "Electrónica" },
    { id: 8, name: "Ferretería" },
    { id: 9, name: "Librería" }
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
  ]
};

document.addEventListener("DOMContentLoaded", function(){

  // =============================
  // MAPA
  // =============================

  let selectedLat = -32.9442;
  let selectedLng = -60.6505;

  const map = L.map('mapSelector').setView([selectedLat, selectedLng], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & Carto',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

  let marker = L.marker([selectedLat, selectedLng], {
      draggable: true
  }).addTo(map);

  // =============================
  // CATEGORÍAS
  // =============================

  const categorySelect = document.getElementById("category");
  const subcategorySelect = document.getElementById("subcategory");

  // cargar categorías
  Object.keys(CATEGORY_MAP).forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  // cargar subcategorías
  function loadSubcategories(category){
    subcategorySelect.innerHTML = "";

    const subs = CATEGORY_MAP[category] || [];

    subs.forEach(sub => {
      const option = document.createElement("option");
      option.value = sub.id; // 🔥 ID real
      option.textContent = sub.name;
      subcategorySelect.appendChild(option);
    });
  }

  // cambio de categoría
  categorySelect.addEventListener("change", () => {
    loadSubcategories(categorySelect.value);
  });

  // carga inicial
  const firstCategory = Object.keys(CATEGORY_MAP)[0];
  categorySelect.value = firstCategory;
  loadSubcategories(firstCategory);

  // =============================
  // REVERSE GEOCODING
  // =============================

  async function reverseGeocode(lat, lng){
      try{
          const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );

          const data = await response.json();

          if(data.address){

              const streetInput = document.querySelector("input[name='street']");
              const cityInput = document.querySelector("input[name='city']");

              streetInput.value =
                  (data.address.road || "") + " " + (data.address.house_number || "");

              cityInput.value =
                  data.address.city || data.address.town || data.address.village || "";
          }

      }catch(error){
          console.error(error);
      }
  }

  marker.on('dragend', function(){
      const position = marker.getLatLng();
      selectedLat = position.lat;
      selectedLng = position.lng;
      reverseGeocode(selectedLat, selectedLng);
  });

  // =============================
  // BUSCAR DIRECCIÓN
  // =============================

  document.getElementById("searchAddress").addEventListener("click", async function(){

      const street = document.querySelector("input[name='street']").value;
      const city = document.querySelector("input[name='city']").value;

      if(!street || !city){
          alert("Completa dirección y ciudad");
          return;
      }

      try{
          const query = `${street}, ${city}`;
          const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
          );

          const data = await response.json();

          if(!data.length){
              alert("Dirección no encontrada");
              return;
          }

          selectedLat = parseFloat(data[0].lat);
          selectedLng = parseFloat(data[0].lon);

          map.setView([selectedLat, selectedLng], 16);
          marker.setLatLng([selectedLat, selectedLng]);

      }catch(error){
          console.error(error);
      }
  });

  // =============================
  // SUBMIT
  // =============================

  document.getElementById("storeForm").addEventListener("submit", async function(e){

      e.preventDefault();

      const form = e.target;

      const password = form.querySelector("input[name='password']").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if(password !== confirmPassword){
          alert("Las contraseñas no coinciden");
          return;
      }

      if(!selectedLat || !selectedLng){
          alert("Selecciona ubicación en el mapa");
          return;
      }

      try{

          const formData = new FormData(form);

          formData.append("lat", selectedLat);
          formData.append("lng", selectedLng);

          const response = await fetch('/api/stores/register', {
              method:'POST',
              body: formData
          });

          const data = await response.json();

          if(!response.ok){
              alert(data.error || "Error registrando tienda");
              return;
          }

          alert("Perfil creado correctamente 🚀");
          window.location.href = "/";

      }catch(error){
          console.error(error);
          alert("Error registrando tienda");
      }

  });

});