document.addEventListener("DOMContentLoaded", function () {
  // Función para cambiar de sección
  function mostrarSeccion(id) {
    document.querySelectorAll('.seccion').forEach(section => {
      section.classList.remove('visible');
    });
    const selected = document.getElementById(id);
    if (selected) {
      selected.classList.add('visible');

      // Si se muestra la sección con un mapa, recalculamos su tamaño
      setTimeout(() => {
        if (id === 'registro' && typeof map !== "undefined") {
          map.invalidateSize();
        }
        if (id === 'mapaSeccion' && typeof mapIncidentes !== "undefined") {
          mapIncidentes.invalidateSize();
          cargarDatosMapaCalor();
        }
      }, 300);
    }
  }
  window.mostrarSeccion = mostrarSeccion;

  ////////////////////////////////////////////////////////////////
  // INICIALIZAR EL MAPA DEL FORMULARIO
  const map = L.map('mapa').setView([16.75, -93.12], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  let marker = null;
  map.on('click', async function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);

    // Actualiza los campos de Longitud, Latitud y Coordenadas_Geograficas
    const campoLongitud = document.getElementById('longitud');
    const campoLatitud = document.getElementById('latitud');
    const campoCoordenadas = document.getElementById('coordenadas');

    if (campoLongitud) campoLongitud.value = lng;
    if (campoLatitud) campoLatitud.value = lat;
    if (campoCoordenadas) campoCoordenadas.value = `${lat}, ${lng}`;

    // Coloca o mueve el marcador
    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      const addressInput = document.getElementById('direccion');
      if (addressInput) {
        addressInput.value = data.display_name || '';
      }
    } catch (err) {
      console.warn("No se pudo obtener la dirección:", err);
    }
  });

  ////////////////////////////////////////////////////////////////
  // INICIALIZAR EL MAPA DE INCIDENTES (HEATMAP)
  const mapIncidentes = L.map('mapaIncidentes').setView([16.75, -93.12], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapIncidentes);

  function cargarDatosMapaCalor() {
    const url = "https://script.google.com/macros/s/AKfycbwD2giXeOAVSvjeaYA4HLw_rq5pXigkVcpqU8Nu_S1hYzDl3bQMfXHv-5BxkTXAbCxN/exec";

    fetch(url)
    .then(response => response.json())
    .then(data => {
      const heatPoints = [];
      data.forEach(row => {
        const coordStr = row[11]; // Columna L: Coordenadas_Geograficas
        if (coordStr) {
          const parts = coordStr.split(",");
          if (parts.length === 2) {
            const lat = parseFloat(parts[0].trim()); // AHORA latitud primero
            const lng = parseFloat(parts[1].trim()); // luego longitud
            if (!isNaN(lat) && !isNaN(lng)) {
              heatPoints.push([lat, lng, 1]);
            }
          }
        }
      });

      console.log("🔥 Puntos de calor generados:", heatPoints);

      L.heatLayer(heatPoints, {
        radius: 30,
        blur: 18,
        maxZoom: 16,
        gradient: {
          0.1: '#007bff',
          0.3: '#00ff00',
          0.5: '#ffff00',
          0.7: '#ff7f00',
          1.0: '#ff0000'
        }
      }).addTo(mapIncidentes);
    })
    .catch(error => console.error("❌ Error al cargar el mapa de calor:", error));
}

  ////////////////////////////////////////////////////////////////
  // ENVÍO DEL FORMULARIO A Apps Script
  const form = document.getElementById("formIncidente");
  if (form) {
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      const datos = new FormData(form);

      for (let pair of datos.entries()) {
        console.log(pair[0], pair[1]);
      }

      const url = "https://script.google.com/macros/s/AKfycbwD2giXeOAVSvjeaYA4HLw_rq5pXigkVcpqU8Nu_S1hYzDl3bQMfXHv-5BxkTXAbCxN/exec";
      fetch(url, {
        method: "POST",
        body: datos
      })
      .then(res => res.text())
      .then(responseText => {
        console.log("Respuesta del script:", responseText);
        const mensaje = document.getElementById("respuesta");
        if (responseText.includes("OK")) {
          mensaje.textContent = "✅ Registro enviado correctamente.";
          form.reset();
          if (marker) {
            map.removeLayer(marker);
            marker = null;
          }
          cargarDatosMapaCalor(); // Recarga el mapa de calor con el nuevo punto
        } else {
          mensaje.textContent = "❌ Error al enviar el registro.";
        }
      })
      .catch(error => {
        console.error("Error:", error);
        document.getElementById("respuesta").textContent = "❌ Error al enviar el registro.";
      });
    });
  }
});
