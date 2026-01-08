/* ============================================================
   INDEX.JS PROFESIONAL - ACTUALIZADO CON ÍNDICES CORRECTOS
   Sistema de Siniestros Viales - Estado de Chiapas
   ============================================================ */

// ============================================================
// CONFIGURACIÓN GLOBAL - URL ACTUALIZADA
// ============================================================
const MAIN_API_URL = "https://script.google.com/macros/s/AKfycbyh_f5b6vcLB3_mSQPke9pLtXYrTYJF4mwJnc88CBNDyjrmSNtSfrmOMv5YRoDb7eBS/exec";

let mapaCalor = null;
let heatLayer = null;

// ============================================================
// ÍNDICES DE COLUMNAS - DEBEN COINCIDIR CON APPS SCRIPT
// ============================================================
const COLUMNAS = {
  MUNICIPIO: 0,
  FECHA_SINIESTRO: 1,
  TIPO_SINIESTRO: 7,
  CAUSA_SINIESTRO: 8,
  TOTAL_FALLECIDOS: 39,
  DIRECCION: 42,
  COORDENADAS: 43,
  DESCRIPCION: 46
};

// ============================================================
// ANIMACIÓN DE CONTEO PARA NÚMEROS
// ============================================================
function animarConteo(elemento, valorFinal, duracion = 1500) {
  const elementoDOM = document.getElementById(elemento);
  if (!elementoDOM) return;
  
  const valorInicial = 0;
  const incremento = valorFinal / (duracion / 16);
  let valorActual = valorInicial;
  
  const timer = setInterval(() => {
    valorActual += incremento;
    
    if (valorActual >= valorFinal) {
      elementoDOM.textContent = valorFinal.toLocaleString();
      clearInterval(timer);
    } else {
      elementoDOM.textContent = Math.floor(valorActual).toLocaleString();
    }
  }, 16);
}

// ============================================================
// OBSERVER PARA ANIMACIONES AL SCROLL
// ============================================================
function inicializarAnimacionesScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
  });

  document.querySelectorAll('.tarjeta, .stat-item, .info-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ============================================================
// VALIDACIÓN DE COORDENADAS PARA CHIAPAS
// ============================================================
const CHIAPAS_LIMITS = {
  LAT_MIN: 14.2,
  LAT_MAX: 17.8,
  LNG_MIN: -94.8,
  LNG_MAX: -90.2
};

function validarCoordenadas(coordStr) {
  if (!coordStr || typeof coordStr !== 'string') return null;
  
  const parts = coordStr.split(",");
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  
  if (isNaN(lat) || isNaN(lng) || 
      lat < CHIAPAS_LIMITS.LAT_MIN || lat > CHIAPAS_LIMITS.LAT_MAX || 
      lng < CHIAPAS_LIMITS.LNG_MIN || lng > CHIAPAS_LIMITS.LNG_MAX) {
    return null;
  }
  
  return { lat, lng };
}

// ============================================================
// CARGAR ESTADÍSTICAS RÁPIDAS CON ANIMACIONES
// ============================================================
async function cargarEstadisticasRapidas() {
  try {
    console.log('🔄 Cargando estadísticas del sistema...');
    
    // Mostrar indicador de carga
    document.getElementById('totalIncidentes').textContent = '...';
    document.getElementById('incidentesMes').textContent = '...';
    document.getElementById('ultimaActualizacion').textContent = '...';
    
    const response = await fetch(MAIN_API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📦 Respuesta recibida:', result);
    
    // Verificar que tenemos datos
    if (!result.datos || !Array.isArray(result.datos)) {
      throw new Error('Formato de datos inválido');
    }
    
    const data = result.datos;
    console.log(`📊 Total de registros: ${data.length}`);
    
    // Animar total de incidentes
    setTimeout(() => {
      animarConteo('totalIncidentes', data.length, 1500);
    }, 300);
    
    // Calcular incidentes de este mes
    const mesActual = new Date().getMonth() + 1;
    const añoActual = new Date().getFullYear();
    
    const incidentesMes = data.filter(row => {
      const fechaStr = row[COLUMNAS.FECHA_SINIESTRO];
      if (!fechaStr) return false;
      
      try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return false;
        
        return fecha.getMonth() + 1 === mesActual && fecha.getFullYear() === añoActual;
      } catch (e) {
        return false;
      }
    }).length;
    
    console.log(`📅 Incidentes este mes: ${incidentesMes}`);
    
    // Animar incidentes del mes
    setTimeout(() => {
      animarConteo('incidentesMes', incidentesMes, 1500);
    }, 500);
    
    // Última actualización
    setTimeout(() => {
      const fechaActual = new Date();
      const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
      const fechaFormateada = fechaActual.toLocaleDateString('es-MX', opciones);
      
      const elemento = document.getElementById('ultimaActualizacion');
      if (elemento) {
        elemento.style.opacity = '0';
        elemento.textContent = fechaFormateada;
        
        setTimeout(() => {
          elemento.style.transition = 'opacity 0.4s ease';
          elemento.style.opacity = '1';
        }, 100);
      }
    }, 700);
    
    // Cargar mapa de calor
    cargarMapaCalor(data);
    
    console.log('✅ Estadísticas cargadas correctamente');
    
  } catch (error) {
    console.error('❌ Error cargando estadísticas:', error);
    
    // Mostrar N/A en caso de error
    document.querySelectorAll('.stat-numero').forEach((el, index) => {
      setTimeout(() => {
        el.style.transition = 'all 0.3s ease';
        el.textContent = 'N/A';
        el.style.color = '#f44336';
      }, index * 100);
    });
    
    // Mostrar error en el mapa
    const mapContainer = document.getElementById('mapaCalorPreview');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="text-align: center; color: #f44336; padding: 40px;">
          <i class="fas fa-exclamation-circle" style="font-size: 3em; margin-bottom: 15px;"></i>
          <p style="font-weight: 600; margin: 0; font-size: 18px;">Error al cargar los datos</p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">${error.message}</p>
          <button onclick="location.reload()" style="
            margin-top: 15px;
            padding: 10px 20px;
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">
            <i class="fas fa-redo"></i> Reintentar
          </button>
        </div>
      `;
    }
  }
}

// ============================================================
// CARGAR MAPA DE CALOR
// ============================================================
function cargarMapaCalor(data) {
  try {
    console.log('🗺️ Inicializando mapa de calor...');
    
    // Ocultar indicador de carga
    const loadingDiv = document.querySelector('.mapa-loading');
    if (loadingDiv) {
      loadingDiv.style.transition = 'opacity 0.3s ease';
      loadingDiv.style.opacity = '0';
      setTimeout(() => loadingDiv.style.display = 'none', 300);
    }
    
    // Verificar contenedor
    const mapContainer = document.getElementById('mapaCalorPreview');
    if (!mapContainer) {
      console.error('❌ Contenedor del mapa no encontrado');
      return;
    }
    
    // Limpiar contenedor si ya existe un mapa
    if (mapaCalor) {
      mapaCalor.remove();
      mapaCalor = null;
    }
    
    // Inicializar mapa
    mapaCalor = L.map('mapaCalorPreview', {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: true,
      touchZoom: true,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true
    }).setView([16.75, -93.12], 10);
    
    // Agregar capa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapaCalor);
    
    // Preparar puntos para el mapa de calor
    const heatPoints = [];
    let puntosValidos = 0;
    let puntosInvalidos = 0;
    
    data.forEach((row, index) => {
      const coordsStr = row[COLUMNAS.COORDENADAS];
      const coords = validarCoordenadas(coordsStr);
      
      if (coords) {
        // Calcular intensidad basada en fallecidos
        const fallecidos = parseInt(row[COLUMNAS.TOTAL_FALLECIDOS] || 0);
        const intensidad = 1 + (fallecidos * 0.5);
        
        heatPoints.push([coords.lat, coords.lng, intensidad]);
        puntosValidos++;
      } else {
        puntosInvalidos++;
        if (puntosInvalidos <= 3) {
          console.log(`⚠️ Coordenada inválida en fila ${index + 2}:`, coordsStr);
        }
      }
    });
    
    console.log(`📍 Puntos válidos: ${puntosValidos}`);
    console.log(`❌ Puntos inválidos: ${puntosInvalidos}`);
    
    // Crear capa de calor si hay puntos
    if (heatPoints.length > 0) {
      heatLayer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.4,
        gradient: {
          0.0: '#0000FF',
          0.2: '#00FFFF',
          0.4: '#00FF00',
          0.6: '#FFFF00',
          0.8: '#FF8800',
          1.0: '#FF0000'
        }
      }).addTo(mapaCalor);
      
      console.log(`✅ Mapa de calor cargado con ${heatPoints.length} puntos`);
      
      // Agregar contador de puntos en el mapa
      const infoControl = L.control({ position: 'bottomright' });
      infoControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'info-control');
        div.style.cssText = `
          background: rgba(255,255,255,0.95);
          padding: 10px 15px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          font-size: 13px;
          font-weight: 600;
          color: #333;
        `;
        div.innerHTML = `
          <i class="fas fa-map-marker-alt" style="color: #1976d2;"></i> 
          ${puntosValidos} incidentes
        `;
        return div;
      };
      infoControl.addTo(mapaCalor);
      
    } else {
      console.warn('⚠️ No hay puntos válidos para mostrar');
      
      mapContainer.innerHTML = `
        <div style="text-align: center; color: #ff9800; padding: 40px;">
          <i class="fas fa-info-circle" style="font-size: 3em; margin-bottom: 15px;"></i>
          <p style="font-weight: 600; margin: 0; font-size: 18px;">No hay datos de ubicación</p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">
            ${data.length > 0 ? 'Los registros no tienen coordenadas válidas' : 'Aún no se han registrado incidentes'}
          </p>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('❌ Error al cargar mapa:', error);
    
    const mapContainer = document.getElementById('mapaCalorPreview');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="text-align: center; color: #f44336; padding: 40px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 15px;"></i>
          <p style="font-weight: 600; margin: 0; font-size: 18px;">Error al cargar el mapa</p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">${error.message}</p>
        </div>
      `;
    }
  }
}

// ============================================================
// MARCAR MENÚ ACTIVO
// ============================================================
function marcarMenuActivo() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  document.querySelectorAll('nav a').forEach(link => {
    link.classList.remove('active');
    if (link.href.includes(currentPage)) {
      link.classList.add('active');
    }
  });
}

// ============================================================
// EFECTO RIPPLE EN TARJETAS
// ============================================================
function inicializarEfectosTarjetas() {
  document.querySelectorAll('.tarjeta').forEach(tarjeta => {
    tarjeta.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: rgba(25,118,210,0.4);
        border-radius: 50%;
        pointer-events: none;
        left: ${x}px;
        top: ${y}px;
        transform: translate(-50%, -50%) scale(0);
        transition: transform 0.5s ease, opacity 0.5s ease;
        opacity: 1;
      `;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.style.transform = 'translate(-50%, -50%) scale(50)';
        ripple.style.opacity = '0';
      }, 10);
      
      setTimeout(() => ripple.remove(), 500);
    });
  });
}

// ============================================================
// SMOOTH SCROLL PARA NAVEGACIÓN
// ============================================================
function inicializarSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ============================================================
// MANEJO DE ERRORES GLOBAL
// ============================================================
window.addEventListener('error', function(e) {
  console.error('❌ Error global capturado:', e.message);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('❌ Promesa rechazada:', e.reason);
});

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Inicializando página principal...');
  console.log('📡 URL de API:', MAIN_API_URL);
  
  // Animación inicial
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity = '1';
  }, 100);
  
  // Cargar estadísticas
  cargarEstadisticasRapidas();
  
  // Marcar menú activo
  marcarMenuActivo();
  
  // Inicializar efectos
  setTimeout(() => {
    inicializarAnimacionesScroll();
    inicializarEfectosTarjetas();
    inicializarSmoothScroll();
  }, 300);
  
  console.log('✅ Página principal lista');
});

// ============================================================
// LIMPIEZA AL SALIR
// ============================================================
window.addEventListener('beforeunload', function() {
  if (mapaCalor) {
    mapaCalor.remove();
  }
});
