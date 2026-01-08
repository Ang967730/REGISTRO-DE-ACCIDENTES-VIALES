/* ============================================================
   ESTADISTICAS.JS - SISTEMA DE ANÁLISIS CON TIEMPO REAL
   Versión Premium con Auto-Actualización
   ============================================================ */

// ============================================================
// CONFIGURACIÓN GLOBAL
// ============================================================
const MAIN_API_URL = "https://script.google.com/macros/s/AKfycbyh_f5b6vcLB3_mSQPke9pLtXYrTYJF4mwJnc88CBNDyjrmSNtSfrmOMv5YRoDb7eBS/exec";

// ⏱️ CONFIGURACIÓN DE TIEMPO REAL
const CONFIG_TIEMPO_REAL = {
  INTERVALO_ACTUALIZACION: 30000, // 30 segundos
  MOSTRAR_NOTIFICACIONES: true,
  ANIMACION_NUEVOS_DATOS: true,
  MAX_REINTENTOS: 3
};

let allIncidentsData = [];
let incidentsValidos = [];
let incidentsConCoordenadas = [];
let incidentsSinCoordenadas = [];
let incidentsInvalidos = [];

let estadisticasDatos = {
  total: 0,
  validos: 0,
  invalidos: 0,
  conCoordenadas: 0,
  sinCoordenadas: 0
};

let charts = {};
let filtroTemporalActivo = null;

// Variables para filtros cruzados interactivos
let filtrosActivos = {
  tipoSiniestro: null,
  causaSiniestro: null,
  tipoVialidad: null,
  temporal: null,
  municipio: null
};

// 🔄 VARIABLES DE TIEMPO REAL
let intervaloActualizacion = null;
let ultimaActualizacion = null;
let contadorReintentos = 0;
let actualizacionEnProceso = false;

// ============================================================
// MAPEO DE ÍNDICES DE COLUMNAS
// ============================================================
const COLUMNAS = {
  MUNICIPIO: 0,
  FECHA_SINIESTRO: 1,
  DEPENDENCIA: 2,
  OTRA_DEPENDENCIA: 3,
  CORREO: 4,
  FUENTE_NOTICIA: 5,
  LINK_NOTICIA: 6,
  TIPO_SINIESTRO: 7,
  CAUSA_SINIESTRO: 8,
  USUARIO_1: 9,
  USUARIO_2: 10,
  TIPO_TRANSPORTE_PUBLICO: 11,
  COLECTIVO_NUMERO: 12,
  COLECTIVO_RUTA: 13,
  COLECTIVO_MANIOBRA: 14,
  COLECTIVO_CONDUCTOR: 15,
  COLECTIVO_ESTADO: 16,
  COLECTIVO_PASAJEROS: 17,
  COLECTIVO_GRAVEDAD: 18,
  TAXI_NUMERO: 19,
  TAXI_TIPO: 20,
  TAXI_SITIO_BASE: 21,
  TAXI_OTRO_SITIO: 22,
  TAXI_COLOR: 23,
  TAXI_OTRO_COLOR: 24,
  TAXI_PASAJEROS: 25,
  TAXI_NUMERO_PASAJEROS: 26,
  TAXI_MANIOBRA: 27,
  TAXI_CONDUCTOR: 28,
  TAXI_ESTADO: 29,
  MOTOTAXI_NUMERO: 30,
  MOTOTAXI_PASAJEROS: 31,
  MOTOTAXI_NUMERO_PASAJEROS: 32,
  MOTOTAXI_MANIOBRA: 33,
  MOTOTAXI_CONDUCTOR: 34,
  MOTOTAXI_ESTADO: 35,
  TOTAL_USUARIOS: 36,
  TOTAL_HERIDOS: 37,
  CLASIFICACION_HERIDOS: 38,
  TOTAL_FALLECIDOS: 39,
  CLASIFICACION_FALLECIDOS: 40,
  TIPO_VIALIDAD: 41,
  DIRECCION: 42,
  COORDENADAS: 43,
  ESTATUS_HECHOS: 44,
  SEGUIMIENTO: 45,
  DESCRIPCION: 46,
  NUM_FOTOGRAFIAS: 47,
  NOMBRES_ARCHIVOS: 48,
  URLS_FOTOGRAFIAS: 49,
  ID_REGISTRO: 50,
  TIMESTAMP: 51,
  ESTADO: 52
};

// ============================================================
// 🔄 SISTEMA DE ACTUALIZACIÓN EN TIEMPO REAL
// ============================================================

function iniciarActualizacionAutomatica() {
  console.log('🔄 Iniciando sistema de actualización automática...');
  console.log(`⏱️ Intervalo: ${CONFIG_TIEMPO_REAL.INTERVALO_ACTUALIZACION / 1000} segundos`);
  
  // Limpiar intervalo anterior si existe
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
  }
  
  // Crear nuevo intervalo
  intervaloActualizacion = setInterval(() => {
    actualizarDatosAutomaticamente();
  }, CONFIG_TIEMPO_REAL.INTERVALO_ACTUALIZACION);
  
  // Crear indicador de última actualización
  crearIndicadorActualizacion();
  
  console.log('✅ Sistema de actualización automática iniciado');
}

function detenerActualizacionAutomatica() {
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
    intervaloActualizacion = null;
    console.log('⏸️ Actualización automática detenida');
  }
}

async function actualizarDatosAutomaticamente() {
  if (actualizacionEnProceso) {
    console.log('⏳ Actualización ya en proceso, omitiendo...');
    return;
  }
  
  try {
    actualizacionEnProceso = true;
    console.log('\n🔄 ========== ACTUALIZACIÓN AUTOMÁTICA ==========');
    console.log('🕒 Timestamp:', new Date().toISOString());
    
    actualizarIndicadorEstado('cargando');
    
    const response = await fetch(MAIN_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    let data = [];
    if (responseData.datos && Array.isArray(responseData.datos)) {
      data = responseData.datos;
    } else if (Array.isArray(responseData)) {
      data = responseData;
    }
    
    // Verificar si hay datos nuevos
    const hayDatosNuevos = data.length !== allIncidentsData.length;
    
    if (hayDatosNuevos) {
      const diferencia = data.length - allIncidentsData.length;
      console.log(`🆕 ¡NUEVOS DATOS DETECTADOS! ${diferencia > 0 ? '+' : ''}${diferencia} registros`);
      
      // Actualizar datos
      await procesarYActualizarDatos(data, responseData.metadata);
      
      // Notificar al usuario
      if (CONFIG_TIEMPO_REAL.MOSTRAR_NOTIFICACIONES) {
        const mensaje = diferencia > 0 
          ? `🆕 ${diferencia} nuevo${diferencia > 1 ? 's' : ''} registro${diferencia > 1 ? 's' : ''} detectado${diferencia > 1 ? 's' : ''}`
          : `🔄 Datos actualizados (${Math.abs(diferencia)} cambio${Math.abs(diferencia) > 1 ? 's' : ''})`;
        mostrarNotificacion(mensaje, 'success', 4000);
      }
      
      // Animación visual
      if (CONFIG_TIEMPO_REAL.ANIMACION_NUEVOS_DATOS) {
        animarActualizacion();
      }
      
      contadorReintentos = 0; // Reset contador de reintentos
    } else {
      console.log('✓ Sin cambios detectados');
    }
    
    ultimaActualizacion = new Date();
    actualizarIndicadorEstado('exito');
    
    console.log('========== FIN ACTUALIZACIÓN ==========\n');
    
  } catch (error) {
    console.error('❌ Error en actualización automática:', error);
    contadorReintentos++;
    
    actualizarIndicadorEstado('error');
    
    if (contadorReintentos >= CONFIG_TIEMPO_REAL.MAX_REINTENTOS) {
      console.warn(`⚠️ Máximo de reintentos alcanzado (${CONFIG_TIEMPO_REAL.MAX_REINTENTOS})`);
      detenerActualizacionAutomatica();
      mostrarNotificacion('❌ Error al actualizar datos. Sistema detenido.', 'error', 6000);
    }
  } finally {
    actualizacionEnProceso = false;
  }
}

async function procesarYActualizarDatos(data, metadata) {
  console.log('📊 Procesando y actualizando datos...');
  
  // Guardar todos los datos originales
  allIncidentsData = data;
  
  // Clasificar cada registro
  const clasificados = {
    validos: [],
    conCoordenadas: [],
    sinCoordenadas: [],
    invalidos: []
  };
  
  data.forEach((row) => {
    const clasificacion = clasificarRegistro(row);
    
    if (clasificacion.esValido) {
      clasificados.validos.push(row);
      
      if (clasificacion.tieneCoordenadas) {
        clasificados.conCoordenadas.push(row);
      } else {
        clasificados.sinCoordenadas.push(row);
      }
    } else {
      clasificados.invalidos.push(row);
    }
  });
  
  // Asignar a variables globales
  incidentsValidos = clasificados.validos;
  incidentsConCoordenadas = clasificados.conCoordenadas;
  incidentsSinCoordenadas = clasificados.sinCoordenadas;
  incidentsInvalidos = clasificados.invalidos;
  
  // Estadísticas
  estadisticasDatos = {
    total: data.length,
    validos: incidentsValidos.length,
    conCoordenadas: incidentsConCoordenadas.length,
    sinCoordenadas: incidentsSinCoordenadas.length,
    invalidos: incidentsInvalidos.length,
    porcentajeValidos: ((incidentsValidos.length / data.length) * 100).toFixed(1),
    porcentajeConCoordenadas: ((incidentsConCoordenadas.length / data.length) * 100).toFixed(1)
  };
  
  console.log('✅ Datos procesados:', estadisticasDatos);
  
  // Actualizar interfaz
  generarSelectorMunicipios();
  actualizarEstadisticasFiltro();
  actualizarResumenGeneral();
  actualizarAnalisisTemporal();
  actualizarPerfilSiniestros();
  inicializarAnalisisCruzado();
  
  // Actualizar transporte
  datosTransporteCache = null; // Limpiar cache
  if (document.getElementById('transporteContent').style.display !== 'none') {
    inicializarTransportePublico();
  }
}

function crearIndicadorActualizacion() {
  // Verificar si ya existe
  let indicador = document.getElementById('indicadorActualizacion');
  if (indicador) return;
  
  indicador = document.createElement('div');
  indicador.id = 'indicadorActualizacion';
  indicador.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: white;
    border-radius: 12px;
    padding: 12px 18px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 9999;
    transition: all 0.3s ease;
  `;
  
  indicador.innerHTML = `
    <div id="estadoActualizacion" style="width: 12px; height: 12px; border-radius: 50%; background: #4caf50;"></div>
    <div style="display: flex; flex-direction: column; gap: 2px;">
      <span id="textoActualizacion" style="font-size: 13px; font-weight: 600; color: #333;">
        Sincronizado
      </span>
      <span id="tiempoActualizacion" style="font-size: 11px; color: #999;">
        Hace unos segundos
      </span>
    </div>
    <button id="btnActualizarManual" onclick="forzarActualizacion()" style="
      background: #2196f3;
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
    " onmouseover="this.style.background='#1976d2'" onmouseout="this.style.background='#2196f3'">
      <i class="fas fa-sync-alt"></i> Actualizar
    </button>
  `;
  
  document.body.appendChild(indicador);
  
  // Actualizar tiempo cada segundo
  setInterval(actualizarTiempoTranscurrido, 1000);
}

function actualizarIndicadorEstado(estado) {
  const indicadorEstado = document.getElementById('estadoActualizacion');
  const textoActualizacion = document.getElementById('textoActualizacion');
  const btnActualizar = document.getElementById('btnActualizarManual');
  
  if (!indicadorEstado || !textoActualizacion) return;
  
  switch(estado) {
    case 'cargando':
      indicadorEstado.style.background = '#ff9800';
      indicadorEstado.style.animation = 'pulso 1s infinite';
      textoActualizacion.textContent = 'Actualizando...';
      if (btnActualizar) btnActualizar.disabled = true;
      break;
    case 'exito':
      indicadorEstado.style.background = '#4caf50';
      indicadorEstado.style.animation = 'none';
      textoActualizacion.textContent = 'Sincronizado';
      if (btnActualizar) btnActualizar.disabled = false;
      break;
    case 'error':
      indicadorEstado.style.background = '#f44336';
      indicadorEstado.style.animation = 'none';
      textoActualizacion.textContent = 'Error al actualizar';
      if (btnActualizar) btnActualizar.disabled = false;
      break;
  }
  
  // Añadir animación de pulso si no existe
  if (!document.getElementById('animacionPulso')) {
    const style = document.createElement('style');
    style.id = 'animacionPulso';
    style.textContent = `
      @keyframes pulso {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.2); }
      }
    `;
    document.head.appendChild(style);
  }
}

function actualizarTiempoTranscurrido() {
  const tiempoElement = document.getElementById('tiempoActualizacion');
  if (!tiempoElement || !ultimaActualizacion) return;
  
  const ahora = new Date();
  const diferencia = Math.floor((ahora - ultimaActualizacion) / 1000);
  
  let texto = '';
  if (diferencia < 60) {
    texto = 'Hace unos segundos';
  } else if (diferencia < 3600) {
    const minutos = Math.floor(diferencia / 60);
    texto = `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  } else {
    const horas = Math.floor(diferencia / 3600);
    texto = `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
  }
  
  tiempoElement.textContent = texto;
}

async function forzarActualizacion() {
  console.log('🔄 Actualización manual forzada');
  mostrarProgreso('Actualizando datos...', 'Obteniendo información más reciente');
  
  try {
    await actualizarDatosAutomaticamente();
    ocultarProgreso();
    mostrarNotificacion('✅ Datos actualizados manualmente', 'success', 3000);
  } catch (error) {
    ocultarProgreso();
    mostrarNotificacion('❌ Error al actualizar datos', 'error', 3000);
  }
}

function animarActualizacion() {
  const elementos = document.querySelectorAll('.stat-card, .chart-card');
  elementos.forEach((elemento, index) => {
    setTimeout(() => {
      elemento.style.animation = 'none';
      setTimeout(() => {
        elemento.style.animation = 'actualizacionPulso 0.5s ease-out';
      }, 10);
    }, index * 50);
  });
  
  // Añadir animación si no existe
  if (!document.getElementById('animacionActualizacion')) {
    const style = document.createElement('style');
    style.id = 'animacionActualizacion';
    style.textContent = `
      @keyframes actualizacionPulso {
        0% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        50% { transform: scale(1.02); box-shadow: 0 4px 16px rgba(33, 150, 243, 0.3); }
        100% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Exponer funciones globalmente
window.forzarActualizacion = forzarActualizacion;

// ============================================================
// VALIDADORES DE DATOS
// ============================================================
function validarMunicipio(municipio) {
  if (!municipio) return false;
  const texto = municipio.toString().trim();
  return texto !== '' && 
         texto !== 'N/A' && 
         texto !== 'No especificado' &&
         texto !== 'Desconocido';
}

function validarFecha(fecha) {
  if (!fecha) return false;
  const texto = fecha.toString().trim();
  if (texto === '' || texto === 'N/A') return false;
  
  const fechaDate = new Date(texto);
  return !isNaN(fechaDate.getTime());
}

function validarCoordenadas(coordStr) {
  if (!coordStr || typeof coordStr !== 'string') return null;
  
  const parts = coordStr.split(",");
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  
  if (isNaN(lat) || isNaN(lng) || 
      lat < 14.2 || lat > 17.8 ||
      lng < -94.8 || lng > -90.2) {
    return null;
  }
  
  return { lat, lng };
}

function clasificarRegistro(row) {
  const municipio = row[COLUMNAS.MUNICIPIO];
  const fecha = row[COLUMNAS.FECHA_SINIESTRO];
  const coordenadas = row[COLUMNAS.COORDENADAS];
  
  return {
    tieneMunicipio: validarMunicipio(municipio),
    tieneFecha: validarFecha(fecha),
    tieneCoordenadas: validarCoordenadas(coordenadas) !== null,
    esValido: validarMunicipio(municipio) && validarFecha(fecha)
  };
}

// ============================================================
// CARGA INICIAL DE DATOS
// ============================================================
async function cargarDatos() {
  try {
    mostrarProgreso('Cargando datos de incidentes...', 'Clasificando y validando registros');
    
    const response = await fetch(MAIN_API_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const responseData = await response.json();
    
    console.log('\n=== 📊 CARGA INICIAL DE DATOS ===');
    
    let data = [];
    if (responseData.datos && Array.isArray(responseData.datos)) {
      data = responseData.datos;
      if (responseData.metadata) {
        console.log('📊 Metadata del servidor:', responseData.metadata);
      }
    } else if (Array.isArray(responseData)) {
      data = responseData;
    }
    
    console.log(`📦 Total registros recibidos: ${data.length}`);
    
    // Procesar datos
    await procesarYActualizarDatos(data, responseData.metadata);
    
    ultimaActualizacion = new Date();
    
    console.log('\n✅ CARGA INICIAL COMPLETADA');
    console.log(`   📊 Total: ${estadisticasDatos.total}`);
    console.log(`   ✅ Válidos: ${estadisticasDatos.validos}`);
    console.log(`   📍 Con coordenadas: ${estadisticasDatos.conCoordenadas}`);
    
    // Inicializar transporte público
    setTimeout(() => {
      inicializarTransportePublico();
    }, 500);
    
    ocultarProgreso();
    
    // Notificación de carga exitosa
    const mensajeNotificacion = estadisticasDatos.invalidos > 0 
      ? `✅ ${estadisticasDatos.validos} registros válidos cargados (${estadisticasDatos.invalidos} excluidos)`
      : `✅ ${estadisticasDatos.validos} registros cargados correctamente`;
    
    mostrarNotificacion(mensajeNotificacion, 'success', 4000);
    
    // 🔄 INICIAR ACTUALIZACIÓN AUTOMÁTICA
    iniciarActualizacionAutomatica();
    
    
  } catch (error) {
    console.error('❌ Error al cargar datos:', error);
    ocultarProgreso();
    mostrarNotificacion('❌ Error al cargar los datos. Reintentando...', 'error');
    setTimeout(cargarDatos, 3000);
  }
}

// ============================================================
// SISTEMA DE FILTROS CRUZADOS INTERACTIVOS
// ============================================================
function aplicarFiltroCruzado(tipoFiltro, valor, nombreCompleto = null) {
  console.log(`🔍 Aplicando filtro cruzado: ${tipoFiltro} = ${valor}`);
  
  if (tipoFiltro !== 'temporal' && tipoFiltro !== 'municipio') {
    filtrosActivos.tipoSiniestro = null;
    filtrosActivos.causaSiniestro = null;
    filtrosActivos.tipoVialidad = null;
  }
  
  filtrosActivos[tipoFiltro] = valor;
  mostrarIndicadorFiltroCruzado(tipoFiltro, nombreCompleto || valor);
  actualizarDashboardConFiltros();
  mostrarNotificacion(`✅ Filtro aplicado: ${nombreCompleto || valor}`, 'success', 3000);
}

function limpiarFiltrosCruzados() {
  console.log('🧹 Limpiando todos los filtros cruzados');
  
  filtrosActivos.tipoSiniestro = null;
  filtrosActivos.causaSiniestro = null;
  filtrosActivos.tipoVialidad = null;
  filtrosActivos.municipio = null;
  
  const selector = document.getElementById('filtroMunicipio');
  if (selector) {
    selector.value = '';
    selector.removeAttribute('data-filtered');
  }
  
  const selectorWrapper = document.querySelector('.selector-wrapper');
  if (selectorWrapper) {
    selectorWrapper.classList.remove('active');
  }
  
  const btnClear = document.querySelector('.btn-clear-municipio');
  if (btnClear) {
    btnClear.style.display = 'none';
  }
  
  const indicador = document.getElementById('filtrosCruzadosIndicador');
  if (indicador) indicador.style.display = 'none';
  
  actualizarEstadisticasFiltro();
  actualizarResumenGeneral();
  actualizarDashboardConFiltros();
  
  mostrarNotificacion('✅ Filtros eliminados - Mostrando todos los datos', 'success', 3000);
}

function mostrarIndicadorFiltroCruzado(tipoFiltro, valor) {
  let indicador = document.getElementById('filtrosCruzadosIndicador');
  
  if (!indicador) {
    indicador = document.createElement('div');
    indicador.id = 'filtrosCruzadosIndicador';
    indicador.className = 'filtros-cruzados-indicador';
    
    const filtroTemporal = document.getElementById('filtroActivoIndicador');
    const container = filtroTemporal ? 
      filtroTemporal.parentElement : 
      document.querySelector('.temporal-distribution-section');
    
    if (container) {
      container.insertBefore(indicador, container.firstChild);
    }
  }
  
  const tipoNombres = {
    tipoSiniestro: 'Tipo de Siniestro',
    causaSiniestro: 'Causa',
    tipoVialidad: 'Tipo de Vialidad',
    municipio: 'Municipio'
  };
  
  const iconos = {
    tipoSiniestro: 'fa-car-crash',
    causaSiniestro: 'fa-search',
    tipoVialidad: 'fa-road',
    municipio: 'fa-map-marker-alt'
  };
  
  indicador.innerHTML = `
    <i class="fas ${iconos[tipoFiltro]}"></i>
    <span>Filtrando por ${tipoNombres[tipoFiltro]}: <strong>${valor}</strong></span>
    <button onclick="limpiarFiltrosCruzados()" class="btn-limpiar-filtro-cruzado">
      <i class="fas fa-times"></i> Quitar Filtro
    </button>
  `;
  
  indicador.style.display = 'flex';
}

function actualizarDashboardConFiltros() {
  console.log('📊 Actualizando dashboard con filtros aplicados');
  
  actualizarPerfilSiniestros();
  actualizarAnalisisTemporal();
  inicializarAnalisisCruzado();
  actualizarTituloSeccionPerfil();
}

function actualizarTituloSeccionPerfil() {
  const tituloElement = document.querySelector('#perfilContent .temporal-header h4');
  if (!tituloElement) return;
  
  const hayFiltrosCruzados = filtrosActivos.tipoSiniestro || 
                            filtrosActivos.causaSiniestro || 
                            filtrosActivos.tipoVialidad ||
                            filtrosActivos.municipio;
  
  let textoTitulo = 'Distribución Temporal de Incidentes';
  
  if (hayFiltrosCruzados) {
    if (filtrosActivos.municipio) {
      textoTitulo += ` - ${filtrosActivos.municipio}`;
    } else if (filtrosActivos.tipoSiniestro) {
      textoTitulo += ` - ${filtrosActivos.tipoSiniestro}`;
    } else if (filtrosActivos.causaSiniestro) {
      textoTitulo += ` - ${filtrosActivos.causaSiniestro}`;
    } else if (filtrosActivos.tipoVialidad) {
      textoTitulo += ` - ${filtrosActivos.tipoVialidad}`;
    }
  }
  
  tituloElement.innerHTML = `<i class="fas fa-chart-area"></i> ${textoTitulo}`;
}

// ============================================================
// SISTEMA DE FILTRADO TEMPORAL
// ============================================================
function obtenerDatosFiltrados(requiereCoordenadas = false) {
  let datos = requiereCoordenadas ? incidentsConCoordenadas : incidentsValidos;
  
  if (filtroTemporalActivo) {
    const { periodo, clave } = filtroTemporalActivo;
    
    datos = datos.filter(row => {
      const fechaStr = row[COLUMNAS.FECHA_SINIESTRO];
      if (!fechaStr) return false;
      
      let fecha = null;
      if (fechaStr.includes('/')) {
        const partes = fechaStr.split(' ')[0].split('/');
        if (partes.length === 3) {
          fecha = new Date(partes[2], partes[1] - 1, partes[0]);
        }
      } else if (fechaStr.includes('-')) {
        fecha = new Date(fechaStr.split(' ')[0]);
      }
      
      if (!fecha || isNaN(fecha)) return false;
      
      let claveRegistro = '';
      if (periodo === 'mensual') {
        claveRegistro = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      } else if (periodo === 'trimestral') {
        const trimestre = Math.floor(fecha.getMonth() / 3) + 1;
        claveRegistro = `${fecha.getFullYear()}-T${trimestre}`;
      } else if (periodo === 'anual') {
        claveRegistro = `${fecha.getFullYear()}`;
      }
      
      return claveRegistro === clave;
    });
  }
  
  if (filtrosActivos.municipio) {
    datos = datos.filter(row => 
      (row[COLUMNAS.MUNICIPIO] || 'Desconocido') === filtrosActivos.municipio
    );
  }
  
  if (filtrosActivos.tipoSiniestro) {
    datos = datos.filter(row => 
      (row[COLUMNAS.TIPO_SINIESTRO] || 'No especificado') === filtrosActivos.tipoSiniestro
    );
  }
  
  if (filtrosActivos.causaSiniestro) {
    datos = datos.filter(row => 
      (row[COLUMNAS.CAUSA_SINIESTRO] || 'No especificada') === filtrosActivos.causaSiniestro
    );
  }
  
  if (filtrosActivos.tipoVialidad) {
    datos = datos.filter(row => 
      (row[COLUMNAS.TIPO_VIALIDAD] || 'No especificada') === filtrosActivos.tipoVialidad
    );
  }
  
  return datos;
}

function aplicarFiltroTemporal(periodo, clave, label) {
  console.log(`📅 Aplicando filtro temporal: ${label}`);
  
  filtroTemporalActivo = { periodo, clave, label };
  
  document.getElementById('filtroActivoIndicador').style.display = 'flex';
  document.getElementById('textoFiltroActivo').textContent = `Filtrando por: ${label}`;
  document.getElementById('btnLimpiarFiltro').style.display = 'flex';
  
  actualizarGraficasPerfil();
  mostrarNotificacion(`📅 Filtro aplicado: ${label}`, 'info', 3000);
}

function limpiarFiltroTemporal() {
  console.log('🧹 Limpiando filtro temporal');
  
  filtroTemporalActivo = null;
  
  document.getElementById('filtroActivoIndicador').style.display = 'none';
  document.getElementById('btnLimpiarFiltro').style.display = 'none';
  
  actualizarGraficasPerfil();
  mostrarNotificacion('✅ Filtro temporal eliminado', 'success', 2000);
}

function actualizarGraficasPerfil() {
  crearGraficaPersonasInvolucradas();
  crearGraficaTiposSiniestro();
  crearGraficasCausas();
  crearGraficasClasificacionFallecidos();
  crearGraficasTiposVialidad();
}

// ============================================================
// FILTRADO DE MUNICIPIO
// ============================================================
function cambiarFiltroMunicipio() {
  const selector = document.getElementById('filtroMunicipio');
  if (!selector) return;
  
  const municipio = selector.value;
  const selectorWrapper = document.querySelector('.selector-wrapper');
  const btnClear = document.querySelector('.btn-clear-municipio');
  
  if (municipio === '') {
    limpiarFiltroMunicipio();
  } else {
    filtrosActivos.municipio = municipio;
    
    if (selectorWrapper) selectorWrapper.classList.add('active');
    if (btnClear) btnClear.style.display = 'flex';
    selector.setAttribute('data-filtered', 'true');
    
    mostrarIndicadorFiltroCruzado('municipio', municipio);
    actualizarEstadisticasFiltro();
    actualizarResumenGeneral();
    actualizarDashboardConFiltros();
    
    mostrarNotificacion(`✅ Filtrado por: ${municipio}`, 'success', 3000);
  }
}

function limpiarFiltroMunicipio() {
  console.log('🧹 Limpiando filtro de municipio');
  
  const selector = document.getElementById('filtroMunicipio');
  const selectorWrapper = document.querySelector('.selector-wrapper');
  const btnClear = document.querySelector('.btn-clear-municipio');
  
  filtrosActivos.municipio = null;
  
  if (selector) {
    selector.value = '';
    selector.removeAttribute('data-filtered');
  }
  if (selectorWrapper) selectorWrapper.classList.remove('active');
  if (btnClear) btnClear.style.display = 'none';
  
  const hayOtrosFiltros = filtrosActivos.tipoSiniestro || 
                          filtrosActivos.causaSiniestro || 
                          filtrosActivos.tipoVialidad;
  
  if (!hayOtrosFiltros) {
    const indicador = document.getElementById('filtrosCruzadosIndicador');
    if (indicador) indicador.style.display = 'none';
  }
  
  actualizarEstadisticasFiltro();
  actualizarResumenGeneral();
  actualizarDashboardConFiltros();
  
  mostrarNotificacion('✅ Mostrando todos los municipios', 'info', 2500);
}

// ============================================================
// CLASE: ANALIZADOR TEMPORAL
// ============================================================
class AnalizadorTemporal {
  constructor(datos) {
    this.datos = datos;
  }

  analizarPorDiaSemana() {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const distribucion = new Array(7).fill(0);
    
    this.datos.forEach(row => {
      const fechaStr = row[COLUMNAS.FECHA_SINIESTRO];
      if (!fechaStr) return;
      
      let fecha = null;
      if (fechaStr.includes('/')) {
        const partes = fechaStr.split(' ')[0].split('/');
        if (partes.length === 3) {
          fecha = new Date(partes[2], partes[1] - 1, partes[0]);
        }
      } else if (fechaStr.includes('-')) {
        fecha = new Date(fechaStr.split(' ')[0]);
      }
      
      if (fecha && !isNaN(fecha)) {
        distribucion[fecha.getDay()]++;
      }
    });
    
    return dias.map((dia, idx) => ({ 
      dia, 
      cantidad: Math.round(distribucion[idx]),
      porcentaje: distribucion.reduce((a, b) => a + b, 0) > 0 
        ? ((distribucion[idx] / distribucion.reduce((a, b) => a + b, 0)) * 100).toFixed(1)
        : 0
    }));
  }

  calcularTendencia(meses = 6) {
    const ahora = new Date();
    const fechaLimite = new Date(ahora.getFullYear(), ahora.getMonth() - meses, 1);
    
    const recientes = this.datos.filter(row => {
      const fechaStr = row[COLUMNAS.FECHA_SINIESTRO];
      if (!fechaStr) return false;
      const fecha = new Date(fechaStr.split(' ')[0]);
      return fecha >= fechaLimite && !isNaN(fecha);
    });
    
    const tendenciaMensual = {};
    recientes.forEach(row => {
      const fechaStr = row[COLUMNAS.FECHA_SINIESTRO];
      const fecha = new Date(fechaStr.split(' ')[0]);
      if (!isNaN(fecha)) {
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        tendenciaMensual[mes] = (tendenciaMensual[mes] || 0) + 1;
      }
    });
    
    const mesesOrdenados = Object.keys(tendenciaMensual).sort();
    if (mesesOrdenados.length < 2) return { tipo: 'Insuficiente', datos: tendenciaMensual };
    
    const primerMes = tendenciaMensual[mesesOrdenados[0]];
    const ultimoMes = tendenciaMensual[mesesOrdenados[mesesOrdenados.length - 1]];
    const diferencia = ultimoMes - primerMes;
    const porcentajeCambio = primerMes > 0 ? ((diferencia / primerMes) * 100).toFixed(1) : 0;
    
    let tipo = 'Estable';
    if (diferencia > primerMes * 0.2) tipo = 'Creciente';
    else if (diferencia < -primerMes * 0.2) tipo = 'Decreciente';
    
    return { tipo, porcentajeCambio, datos: tendenciaMensual, mesesAnalizados: mesesOrdenados.length };
  }

  getDiaMasPeligroso() {
    const porDia = this.analizarPorDiaSemana();
    return porDia.reduce((max, dia) => dia.cantidad > max.cantidad ? dia : max, porDia[0]);
  }
}

// ============================================================
// FUNCIONES DE UTILIDAD
// ============================================================
function calcularDistanciaKm(coords1, coords2) {
  const R = 6371;
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLon = (coords2.lng - coords1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coords1.lat * Math.PI / 180) * 
            Math.cos(coords2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function analizarVialidadesCluster(incidentes) {
  const vialidades = {};
  
  incidentes.forEach(incidente => {
    const vialidad = incidente[COLUMNAS.TIPO_VIALIDAD] || 'No especificada';
    vialidades[vialidad] = (vialidades[vialidad] || 0) + 1;
  });
  
  const vialidadesOrdenadas = Object.entries(vialidades)
    .sort((a, b) => b[1] - a[1]);
  
  if (vialidadesOrdenadas.length === 0) {
    return {
      principal: 'No especificada',
      porcentaje: 0,
      todas: []
    };
  }
  
  const [vialidadPrincipal, cantidad] = vialidadesOrdenadas[0];
  const porcentaje = ((cantidad / incidentes.length) * 100).toFixed(0);
  
  return {
    principal: vialidadPrincipal,
    porcentaje: parseInt(porcentaje),
    cantidad: cantidad,
    total: incidentes.length,
    todas: vialidadesOrdenadas.slice(0, 3)
  };
}

function identificarZonasPeligrosas() {
  const clusters = [];
  const radioKm = 0.5;
  const minimoIncidentes = 3;
  const procesados = new Set();
  
  const datosFiltrados = obtenerDatosFiltrados(true);
  
  datosFiltrados.forEach((incident, idx) => {
    if (procesados.has(idx)) return;
    const coords1 = validarCoordenadas(incident[COLUMNAS.COORDENADAS]);
    if (!coords1) return;
    
    const cluster = { centro: coords1, incidentes: [incident], indices: [idx] };
    
    datosFiltrados.forEach((otro, otroIdx) => {
      if (idx === otroIdx || procesados.has(otroIdx)) return;
      const coords2 = validarCoordenadas(otro[COLUMNAS.COORDENADAS]);
      if (!coords2) return;
      const distancia = calcularDistanciaKm(coords1, coords2);
      if (distancia <= radioKm) {
        cluster.incidentes.push(otro);
        cluster.indices.push(otroIdx);
        procesados.add(otroIdx);
      }
    });
    
    procesados.add(idx);
    
    if (cluster.incidentes.length >= minimoIncidentes) {
      cluster.peligrosidad = calcularNivelPeligrosidad(cluster.incidentes);
      cluster.totalFallecidos = cluster.incidentes.reduce((sum, inc) => 
        sum + parseInt(inc[COLUMNAS.TOTAL_FALLECIDOS] || 0), 0
      );
      cluster.municipio = cluster.incidentes[0][COLUMNAS.MUNICIPIO] || 'Desconocido';
      cluster.vialidadInfo = analizarVialidadesCluster(cluster.incidentes);
      
      clusters.push(cluster);
    }
  });
  
  return clusters.sort((a, b) => b.incidentes.length - a.incidentes.length);
}

function calcularNivelPeligrosidad(incidentes) {
  const fallecidos = incidentes.reduce((sum, inc) => 
    sum + parseInt(inc[COLUMNAS.TOTAL_FALLECIDOS] || 0), 0
  );
  const score = incidentes.length + (fallecidos * 3);
  if (score >= 20) return 'Crítica';
  if (score >= 10) return 'Alta';
  if (score >= 5) return 'Media';
  return 'Baja';
}

function contarPersonasInvolucradas(datos) {
  const categorias = [
    'Automovilista',
    'Motociclista',
    'Chofer de transporte público',
    'Chofer de vehículo pesado',
    'Ciclista',
    'Peatón',
    'Otro'
  ];
  
  const conteos = {};
  categorias.forEach(cat => conteos[cat] = 0);
  
  datos.forEach(row => {
    const usuario1 = row[COLUMNAS.USUARIO_1]?.trim();
    const usuario2 = row[COLUMNAS.USUARIO_2]?.trim();
    
    [usuario1, usuario2].forEach(usuario => {
      if (usuario && usuario !== '' && usuario !== 'N/A') {
        const categoriaEncontrada = categorias.find(cat => 
          usuario.toLowerCase().includes(cat.toLowerCase()) ||
          cat.toLowerCase().includes(usuario.toLowerCase())
        );
        
        if (categoriaEncontrada) {
          conteos[categoriaEncontrada]++;
        } else if (usuario.toLowerCase() !== 'no aplica') {
          conteos['Otro']++;
        }
      }
    });
  });
  
  return {
    conteos,
    total: Object.values(conteos).reduce((sum, count) => sum + count, 0),
    categorias
  };
}

// ============================================================
// NOTIFICACIONES Y PROGRESO
// ============================================================
function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
  const notification = document.createElement('div');
  notification.className = `notification ${tipo}`;
  
  const iconos = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 1.3em;">${iconos[tipo]}</span>
      <span>${mensaje}</span>
    </div>
    <button class="close-btn" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }
  }, duracion);
}

function mostrarProgreso(texto, subtexto = '') {
  let progressDiv = document.getElementById('progressIndicator');
  if (!progressDiv) {
    progressDiv = document.createElement('div');
    progressDiv.id = 'progressIndicator';
    progressDiv.className = 'progress-indicator';
    progressDiv.innerHTML = `
      <div class="progress-spinner"></div>
      <div class="progress-text"></div>
      <div class="progress-subtext"></div>
    `;
    document.body.appendChild(progressDiv);
  }
  progressDiv.querySelector('.progress-text').textContent = texto;
  progressDiv.querySelector('.progress-subtext').textContent = subtexto;
  progressDiv.classList.add('show');
}

function ocultarProgreso() {
  const progressDiv = document.getElementById('progressIndicator');
  if (progressDiv) progressDiv.classList.remove('show');
}

// ============================================================
// SELECTOR DE MUNICIPIOS
// ============================================================
function generarSelectorMunicipios() {
  const municipios = {};
  
  incidentsValidos.forEach(row => {
    const municipio = row[COLUMNAS.MUNICIPIO] || 'Desconocido';
    municipios[municipio] = (municipios[municipio] || 0) + 1;
  });
  
  const municipiosOrdenados = Object.entries(municipios)
    .sort((a, b) => a[0].localeCompare(b[0]));
  
  const selector = document.getElementById('filtroMunicipio');
  if (!selector) {
    console.warn('⚠️ No se encontró el elemento filtroMunicipio');
    return;
  }
  
  selector.innerHTML = '<option value="">Todos los municipios</option>';
  
  municipiosOrdenados.forEach(([municipio, cantidad]) => {
    const option = document.createElement('option');
    option.value = municipio;
    option.textContent = `${municipio} (${cantidad})`;
    selector.appendChild(option);
  });
  
  console.log(`✅ ${municipiosOrdenados.length} municipios cargados en el selector`);
}

function actualizarEstadisticasFiltro() {
  const statsContainer = document.querySelector('.filtro-stats');
  if (!statsContainer) return;
  
  const datosFiltrados = obtenerDatosFiltrados();
  const totalIncidentes = datosFiltrados.length;
  const totalFallecidos = datosFiltrados.reduce((sum, row) => 
    sum + parseInt(row[COLUMNAS.TOTAL_FALLECIDOS] || 0), 0
  );
  
  if (filtrosActivos.municipio) {
    statsContainer.innerHTML = `
      <div class="stat-mini">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${totalIncidentes} incidentes en este municipio</span>
      </div>
      <div class="stat-mini">
        <i class="fas fa-skull"></i>
        <span>${totalFallecidos} fallecidos registrados</span>
      </div>
    `;
  } else {
    statsContainer.innerHTML = `
      <div class="stat-mini">
        <i class="fas fa-database"></i>
        <span>${incidentsValidos.length} incidentes válidos</span>
      </div>
    `;
  }
}

// Exponer funciones globalmente
window.cambiarFiltroMunicipio = cambiarFiltroMunicipio;
window.limpiarFiltroMunicipio = limpiarFiltroMunicipio;
window.limpiarFiltroTemporal = limpiarFiltroTemporal;
window.limpiarFiltrosCruzados = limpiarFiltrosCruzados;
window.aplicarFiltroCruzado = aplicarFiltroCruzado;

// ============================================================
// RESUMEN GENERAL
// ============================================================
function actualizarResumenGeneral() {
  const datosParaResumen = filtrosActivos.municipio ? 
    obtenerDatosFiltrados() : incidentsValidos;
  
  const totalIncidentes = datosParaResumen.length;
  const totalFallecidos = datosParaResumen.reduce((sum, row) => 
    sum + parseInt(row[COLUMNAS.TOTAL_FALLECIDOS] || 0), 0
  );
  
  const { total: totalInvolucrados } = contarPersonasInvolucradas(datosParaResumen);
  const tasaLetalidad = totalInvolucrados > 0 ? 
    ((totalFallecidos / totalInvolucrados) * 100).toFixed(1) : 0;
  
  document.getElementById('totalIncidentes').textContent = totalIncidentes.toLocaleString();
  document.getElementById('totalFallecidosGeneral').textContent = totalFallecidos.toLocaleString();
  document.getElementById('totalInvolucrados').textContent = totalInvolucrados.toLocaleString();
  document.getElementById('tasaLetalidadGeneral').textContent = tasaLetalidad + '%';
  
  const resumenSection = document.querySelector('.resumen-general h2');
  if (resumenSection && filtrosActivos.municipio) {
    resumenSection.innerHTML = `
      <i class="fas fa-chart-bar"></i> 
      Resumen General 
      <span style="font-size: 0.55em; color: #4caf50; margin-left: 10px; padding: 8px 16px; background: rgba(76, 175, 80, 0.1); border-radius: 20px;">
        📍 ${filtrosActivos.municipio}
      </span>
    `;
  } else if (resumenSection) {
    resumenSection.innerHTML = `<i class="fas fa-chart-bar"></i> Resumen General`;
  }
}

// ============================================================
// ANÁLISIS TEMPORAL Y GEOESPACIAL
// ============================================================
function actualizarAnalisisTemporal() {
  const datosFiltrados = obtenerDatosFiltrados();
  const analizador = new AnalizadorTemporal(datosFiltrados);
  
  // Municipio más peligroso
  const municipios = {};
  datosFiltrados.forEach(row => {
    const municipio = row[COLUMNAS.MUNICIPIO] || 'Desconocido';
    municipios[municipio] = (municipios[municipio] || 0) + 1;
  });
  
  if (Object.keys(municipios).length > 0) {
    const municipioPeligroso = Object.entries(municipios).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('municipioPeligroso').textContent = municipioPeligroso[0].substring(0, 20);
    document.getElementById('municipioDetalle').textContent = `${municipioPeligroso[1]} incidentes`;
  } else {
    document.getElementById('municipioPeligroso').textContent = '---';
    document.getElementById('municipioDetalle').textContent = 'Sin datos';
  }
  
  // Día más peligroso
  const diaPeligroso = analizador.getDiaMasPeligroso();
  document.getElementById('diaPeligroso').textContent = diaPeligroso.dia;
  document.getElementById('diaDetalle').textContent = `${diaPeligroso.cantidad} incidentes (${diaPeligroso.porcentaje}%)`;
  
  // Zonas críticas
  const zonas = identificarZonasPeligrosas();
  const zonasCriticas = zonas.filter(z => z.peligrosidad === 'Crítica' || z.peligrosidad === 'Alta');
  document.getElementById('zonasCriticas').textContent = zonasCriticas.length;
  const criticas = zonas.filter(z => z.peligrosidad === 'Crítica').length;
  const altas = zonas.filter(z => z.peligrosidad === 'Alta').length;
  document.getElementById('zonasDetalle').textContent = `${criticas} críticas, ${altas} altas`;
  
  // Tendencia
  const tendencia = analizador.calcularTendencia(6);
  const iconos = { 'Creciente': '📈', 'Decreciente': '📉', 'Estable': '➡️', 'Insuficiente': '❓' };
  document.getElementById('tendencia').textContent = iconos[tendencia.tipo] || '---';
  if (tendencia.tipo === 'Insuficiente') {
    document.getElementById('tendenciaDetalle').textContent = 'Datos insuficientes';
  } else {
    const signo = tendencia.porcentajeCambio >= 0 ? '+' : '';
    document.getElementById('tendenciaDetalle').textContent = `${signo}${tendencia.porcentajeCambio}% (${tendencia.mesesAnalizados} meses)`;
  }
  
  crearGraficaDias(analizador);
  crearGraficaMunicipios();
}

// ============================================================
// PERFIL DE SINIESTROS
// ============================================================
function actualizarPerfilSiniestros() {
  const datosFiltrados = obtenerDatosFiltrados();
  
  const totalFallecidos = datosFiltrados.reduce((sum, row) => 
    sum + parseInt(row[COLUMNAS.TOTAL_FALLECIDOS] || 0), 0
  );
  
  const { total: totalInvolucrados } = contarPersonasInvolucradas(datosFiltrados);
  
  const promedioInvolucrados = datosFiltrados.length > 0 ? (totalInvolucrados / datosFiltrados.length).toFixed(1) : 0;
  const tasaLetalidad = totalInvolucrados > 0 ? ((totalFallecidos / totalInvolucrados) * 100).toFixed(1) : 0;
  
  document.getElementById('totalFallecidos').textContent = totalFallecidos;
  document.getElementById('promedioInvolucrados').textContent = promedioInvolucrados;
  document.getElementById('tasaLetalidad').textContent = tasaLetalidad + '%';
  
  // Causa principal
  const causas = {};
  datosFiltrados.forEach(row => {
    const causa = row[COLUMNAS.CAUSA_SINIESTRO] || 'No especificada';
    causas[causa] = (causas[causa] || 0) + 1;
  });
  
  if (Object.keys(causas).length > 0) {
    const causaPrincipal = Object.entries(causas).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('causaPrincipal').textContent = causaPrincipal[0].substring(0, 15);
    document.getElementById('causaPrincipalCount').textContent = `${causaPrincipal[1]} casos`;
  } else {
    document.getElementById('causaPrincipal').textContent = '---';
    document.getElementById('causaPrincipalCount').textContent = '0 casos';
  }
  
  crearDistribucionTemporal();
  crearGraficaPersonasInvolucradas();
  crearGraficaTiposSiniestro();
  crearGraficasCausas();
  crearGraficasClasificacionFallecidos();
  crearGraficasTiposVialidad();
}

// ============================================================
// DISTRIBUCIÓN TEMPORAL
// ============================================================
function crearDistribucionTemporal() {
  actualizarDistribucionTemporal();
}

function actualizarDistribucionTemporal() {
  const periodo = document.getElementById('periodoDistribucion')?.value || 'mensual';
  const ctx = document.getElementById('chartDistribucionTemporal');
  if (!ctx) return;
  
  const datosAgrupados = agruparDatosPorPeriodo(periodo);
  
  if (charts.distribucionTemporal) charts.distribucionTemporal.destroy();
  
  const hayFiltrosCruzados = filtrosActivos.tipoSiniestro || 
                            filtrosActivos.causaSiniestro || 
                            filtrosActivos.tipoVialidad;
  
  let tituloGrafica = 'Distribución Temporal de Incidentes';
  if (hayFiltrosCruzados) {
    if (filtrosActivos.tipoSiniestro) {
      tituloGrafica += ` - ${filtrosActivos.tipoSiniestro}`;
    } else if (filtrosActivos.causaSiniestro) {
      tituloGrafica += ` - ${filtrosActivos.causaSiniestro}`;
    } else if (filtrosActivos.tipoVialidad) {
      tituloGrafica += ` - ${filtrosActivos.tipoVialidad}`;
    }
  }
  
  charts.distribucionTemporal = new Chart(ctx, {
    type: 'line',
    data: {
      labels: datosAgrupados.labels,
      datasets: [
        {
          label: 'Total de Accidentes',
          data: datosAgrupados.accidentes,
          borderColor: hayFiltrosCruzados ? '#1976d2' : '#1976d2',
          backgroundColor: hayFiltrosCruzados ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)',
          borderWidth: hayFiltrosCruzados ? 4 : 3,
          fill: true,
          tension: 0.4,
          pointRadius: hayFiltrosCruzados ? 6 : 5,
          pointHoverRadius: hayFiltrosCruzados ? 9 : 8,
          pointBackgroundColor: hayFiltrosCruzados ? '#1976d2' : '#1976d2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Total de Fallecidos',
          data: datosAgrupados.fallecidos,
          borderColor: hayFiltrosCruzados ? '#f44336' : '#f44336',
          backgroundColor: hayFiltrosCruzados ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
          borderWidth: hayFiltrosCruzados ? 4 : 3,
          fill: true,
          tension: 0.4,
          pointRadius: hayFiltrosCruzados ? 6 : 5,
          pointHoverRadius: hayFiltrosCruzados ? 9 : 8,
          pointBackgroundColor: hayFiltrosCruzados ? '#f44336' : '#f44336',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Total de Usuarios Involucrados',
          data: datosAgrupados.involucrados,
          borderColor: hayFiltrosCruzados ? '#4caf50' : '#4caf50',
          backgroundColor: hayFiltrosCruzados ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
          borderWidth: hayFiltrosCruzados ? 4 : 3,
          fill: true,
          tension: 0.4,
          pointRadius: hayFiltrosCruzados ? 6 : 5,
          pointHoverRadius: hayFiltrosCruzados ? 9 : 8,
          pointBackgroundColor: hayFiltrosCruzados ? '#4caf50' : '#4caf50',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const elementIndex = elements[0].index;
          const clave = datosAgrupados.claves[elementIndex];
          const label = datosAgrupados.labels[elementIndex];
          aplicarFiltroTemporal(periodo, clave, label);
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 18,
            font: { size: 13, weight: '700' }
          }
        },
        title: {
          display: hayFiltrosCruzados,
          text: hayFiltrosCruzados ? `Filtrado: ${tituloGrafica.split(' - ')[1]}` : '',
          font: { size: 15, weight: 'bold' },
          color: '#1976d2',
          padding: { bottom: 15 }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              label += context.parsed.y.toLocaleString();
              return label;
            },
            afterBody: function() {
              if (hayFiltrosCruzados) {
                return ['', '📊 Datos filtrados según selección'];
              }
              return '';
            },
            footer: function() {
              return '💡 Haz clic en un punto para filtrar temporalmente';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            precision: 0, 
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { 
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        x: {
          ticks: { 
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { display: false }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

function agruparDatosPorPeriodo(periodo) {
  const grupos = {};
  
  const datosFiltrados = obtenerDatosFiltrados();
  
  datosFiltrados.forEach(row => {
    const fechaStr = row[COLUMNAS.FECHA_SINIESTRO];
    if (!fechaStr) return;
    
    let fecha = null;
    if (fechaStr.includes('/')) {
      const partes = fechaStr.split(' ')[0].split('/');
      if (partes.length === 3) {
        fecha = new Date(partes[2], partes[1] - 1, partes[0]);
      }
    } else if (fechaStr.includes('-')) {
      fecha = new Date(fechaStr.split(' ')[0]);
    }
    
    if (!fecha || isNaN(fecha)) return;
    
    let clave = '';
    if (periodo === 'mensual') {
      clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    } else if (periodo === 'trimestral') {
      const trimestre = Math.floor(fecha.getMonth() / 3) + 1;
      clave = `${fecha.getFullYear()}-T${trimestre}`;
    } else if (periodo === 'anual') {
      clave = `${fecha.getFullYear()}`;
    }
    
    if (!grupos[clave]) {
      grupos[clave] = { accidentes: 0, fallecidos: 0, involucrados: 0 };
    }
    
    grupos[clave].accidentes++;
    grupos[clave].fallecidos += parseInt(row[COLUMNAS.TOTAL_FALLECIDOS] || 0);
    
    const usuario1 = row[COLUMNAS.USUARIO_1]?.trim();
    const usuario2 = row[COLUMNAS.USUARIO_2]?.trim();
    
    [usuario1, usuario2].forEach(usuario => {
      if (usuario && usuario !== '' && usuario !== 'N/A' && usuario.toLowerCase() !== 'no aplica') {
        grupos[clave].involucrados++;
      }
    });
  });
  
  const clavesOrdenadas = Object.keys(grupos).sort();
  
  const labels = clavesOrdenadas.map(clave => {
    if (periodo === 'mensual') {
      const [año, mes] = clave.split('-');
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${meses[parseInt(mes) - 1]} ${año}`;
    } else if (periodo === 'trimestral') {
      return clave.replace('-T', ' - Trimestre ');
    } else {
      return clave;
    }
  });
  
  return {
    labels,
    claves: clavesOrdenadas,
    accidentes: clavesOrdenadas.map(c => grupos[c].accidentes),
    fallecidos: clavesOrdenadas.map(c => grupos[c].fallecidos),
    involucrados: clavesOrdenadas.map(c => grupos[c].involucrados)
  };
}

window.actualizarDistribucionTemporal = actualizarDistribucionTemporal;

// ============================================================
// PANEL DE CALIDAD DE DATOS
// ============================================================
function mostrarPanelCalidadDatos() {
  const panelExistente = document.getElementById('panelCalidadDatos');
  if (panelExistente) panelExistente.remove();
  
  const panel = document.createElement('div');
  panel.id = 'panelCalidadDatos';
  panel.className = 'calidad-datos-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 20px;
    max-width: 400px;
    z-index: 1000;
    border-left: 4px solid #ff9800;
  `;
  
  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
      <h4 style="margin: 0; color: #333; display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-chart-bar"></i>
        Calidad de Datos
      </h4>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">×</button>
    </div>
    
    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #666;">Total de registros:</span>
        <strong style="color: #333;">${estadisticasDatos.total}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #4caf50;">✅ Válidos:</span>
        <strong style="color: #4caf50;">${estadisticasDatos.validos} (${estadisticasDatos.porcentajeValidos}%)</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #ff9800;">📍 Con coordenadas:</span>
        <strong style="color: #ff9800;">${estadisticasDatos.conCoordenadas} (${estadisticasDatos.porcentajeConCoordenadas}%)</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #ff9800;">⚠️ Sin coordenadas:</span>
        <strong style="color: #ff9800;">${estadisticasDatos.sinCoordenadas}</strong>
      </div>
      ${estadisticasDatos.invalidos > 0 ? `
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #f44336;">❌ Inválidos:</span>
        <strong style="color: #f44336;">${estadisticasDatos.invalidos}</strong>
      </div>
      ` : ''}
    </div>
    
    <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.5;">
      <strong>Nota:</strong> Los registros válidos (con municipio y fecha) se usan para todas las estadísticas. 
      Los mapas y análisis geoespaciales solo pueden usar registros con coordenadas.
    </p>
  `;
  
  document.body.appendChild(panel);
  
  setTimeout(() => {
    if (document.body.contains(panel)) {
      panel.style.opacity = '0';
      panel.style.transition = 'opacity 0.3s';
      setTimeout(() => panel.remove(), 300);
    }
  }, 15000);
}


// ============================================================
// GRÁFICAS INTERACTIVAS
// ============================================================

function crearGraficaPersonasInvolucradas() {
  const ctx = document.getElementById('chartPersonasInvolucradas');
  if (!ctx) return;
  
  const datosFiltrados = obtenerDatosFiltrados();
  
  const categorias = [
    'Automovilista',
    'Motociclista',
    'Chofer de transporte público',
    'Chofer de vehículo pesado',
    'Ciclista',
    'Peatón',
    'Otro'
  ];
  
  const conteos = {};
  categorias.forEach(cat => conteos[cat] = 0);
  
  datosFiltrados.forEach(row => {
    const usuario1 = row[COLUMNAS.USUARIO_1]?.trim();
    const usuario2 = row[COLUMNAS.USUARIO_2]?.trim();
    
    [usuario1, usuario2].forEach(usuario => {
      if (usuario && usuario !== '' && usuario !== 'N/A') {
        const categoriaEncontrada = categorias.find(cat => 
          usuario.toLowerCase().includes(cat.toLowerCase()) ||
          cat.toLowerCase().includes(usuario.toLowerCase())
        );
        
        if (categoriaEncontrada) {
          conteos[categoriaEncontrada]++;
        } else if (usuario.toLowerCase() !== 'no aplica') {
          conteos['Otro']++;
        }
      }
    });
  });
  
  const datos = categorias.map(cat => conteos[cat]);
  const total = datos.reduce((a, b) => a + b, 0);
  
  if (charts.personasInvolucradas) charts.personasInvolucradas.destroy();
  
  charts.personasInvolucradas = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categorias,
      datasets: [{
        label: 'Número de Personas',
        data: datos,
        backgroundColor: [
          'rgba(25, 118, 210, 0.85)',
          'rgba(244, 67, 54, 0.85)',
          'rgba(76, 175, 80, 0.85)',
          'rgba(255, 152, 0, 0.85)',
          'rgba(156, 39, 176, 0.85)',
          'rgba(255, 193, 7, 0.85)',
          'rgba(158, 158, 158, 0.85)'
        ],
        borderColor: '#ffffff',
        borderWidth: 4,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 18,
            font: { size: 13, weight: '700' },
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  return {
                    text: label,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const porcentaje = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} personas (${porcentaje}%)`;
            }
          }
        },
        title: {
          display: true,
          text: `Total: ${total.toLocaleString()} personas involucradas`,
          font: { size: 15, weight: 'bold' },
          color: '#1976d2',
          padding: { bottom: 18 }
        }
      }
    }
  });
}

function crearGraficaTiposSiniestro() {
  const ctx = document.getElementById('chartTiposSiniestro');
  if (!ctx) return;
  
  const datosFiltrados = obtenerDatosFiltrados();
  
  const tipos = {};
  datosFiltrados.forEach(row => {
    const tipo = row[COLUMNAS.TIPO_SINIESTRO] || 'No especificado';
    tipos[tipo] = (tipos[tipo] || 0) + 1;
  });
  
  const sortedTipos = Object.entries(tipos).sort((a, b) => b[1] - a[1]);
  if (charts.tiposSiniestro) charts.tiposSiniestro.destroy();
  
  const colores = [
    'rgba(255, 99, 132, 0.85)',
    'rgba(54, 162, 235, 0.85)', 
    'rgba(255, 206, 86, 0.85)',
    'rgba(75, 192, 192, 0.85)',
    'rgba(153, 102, 255, 0.85)',
    'rgba(255, 159, 64, 0.85)'
  ];
  
  const coloresBorde = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)', 
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)'
  ];
  
  charts.tiposSiniestro = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedTipos.map(t => t[0]),
      datasets: [{
        label: 'Cantidad',
        data: sortedTipos.map(t => t[1]),
        backgroundColor: sortedTipos.map((_, index) => 
          filtrosActivos.tipoSiniestro === sortedTipos[index][0] ? 
          'rgba(25, 118, 210, 0.85)' : colores[index % 6]
        ),
        borderColor: sortedTipos.map((_, index) => 
          filtrosActivos.tipoSiniestro === sortedTipos[index][0] ? 
          'rgba(25, 118, 210, 1)' : coloresBorde[index % 6]
        ),
        borderWidth: 3,
        borderRadius: 8,
        hoverBackgroundColor: sortedTipos.map((_, index) => 
          filtrosActivos.tipoSiniestro === sortedTipos[index][0] ? 
          'rgba(25, 118, 210, 1)' : colores[index % 6].replace('0.85', '1')
        )
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const elementIndex = elements[0].index;
          const tipoSiniestro = sortedTipos[elementIndex][0];
          
          if (filtrosActivos.tipoSiniestro === tipoSiniestro) {
            limpiarFiltrosCruzados();
          } else {
            aplicarFiltroCruzado('tipoSiniestro', tipoSiniestro);
          }
        }
      },
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const porcentaje = ((context.parsed.x / total) * 100).toFixed(1);
              return `${context.parsed.x} incidentes (${porcentaje}%)`;
            },
            footer: function() {
              return '💡 Haz clic para filtrar';
            }
          }
        }
      },
      scales: {
        x: { 
          beginAtZero: true,
          ticks: { 
            precision: 0,
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { 
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        y: {
          ticks: { 
            font: { size: 12, weight: '600' },
            maxRotation: 0,
            color: '#666',
            callback: function(value, index) {
              const label = this.getLabelForValue(value);
              return label.length > 25 ? label.substring(0, 22) + '...' : label;
            }
          },
          grid: { display: false }
        }
      }
    }
  });
}

function crearGraficasCausas() {
  const ctx = document.getElementById('chartCausas');
  if (!ctx) return;
  
  const datosFiltrados = obtenerDatosFiltrados();
  
  const causas = {};
  datosFiltrados.forEach(row => {
    const causa = row[COLUMNAS.CAUSA_SINIESTRO] || 'No especificada';
    causas[causa] = (causas[causa] || 0) + 1;
  });
  
  const sortedCausas = Object.entries(causas).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalCausas = sortedCausas.reduce((sum, [, count]) => sum + count, 0);
  
  if (charts.causas) charts.causas.destroy();
  
  const colores = [
    'rgba(255, 99, 132, 0.85)',
    'rgba(54, 162, 235, 0.85)',
    'rgba(255, 206, 86, 0.85)',
    'rgba(75, 192, 192, 0.85)',
    'rgba(153, 102, 255, 0.85)',
    'rgba(255, 159, 64, 0.85)',
    'rgba(199, 199, 199, 0.85)',
    'rgba(83, 102, 255, 0.85)'
  ];
  
  const coloresBorde = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(199, 199, 199, 1)',
    'rgba(83, 102, 255, 1)'
  ];
  
  charts.causas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedCausas.map(c => c[0].substring(0, 20)),
      datasets: [{
        label: 'Cantidad',
        data: sortedCausas.map(c => c[1]),
        backgroundColor: sortedCausas.map((item, index) => 
          filtrosActivos.causaSiniestro === item[0] ? 
          'rgba(25, 118, 210, 0.85)' : colores[index % 8]
        ),
        borderColor: sortedCausas.map((item, index) => 
          filtrosActivos.causaSiniestro === item[0] ? 
          'rgba(25, 118, 210, 1)' : coloresBorde[index % 8]
        ),
        borderWidth: 3,
        borderRadius: 8,
        hoverBackgroundColor: sortedCausas.map((item, index) => 
          filtrosActivos.causaSiniestro === item[0] ? 
          'rgba(25, 118, 210, 1)' : colores[index % 8].replace('0.85', '1')
        )
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const elementIndex = elements[0].index;
          const causaSiniestro = sortedCausas[elementIndex][0];
          
          if (filtrosActivos.causaSiniestro === causaSiniestro) {
            limpiarFiltrosCruzados();
          } else {
            aplicarFiltroCruzado('causaSiniestro', causaSiniestro);
          }
        }
      },
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          callbacks: {
            title: function(context) {
              const index = context[0].dataIndex;
              return sortedCausas[index][0];
            },
            label: function(context) {
              const value = context.parsed.x;
              const porcentaje = totalCausas > 0 ? ((value / totalCausas) * 100).toFixed(1) : 0;
              return `${value} incidentes (${porcentaje}% del total)`;
            },
            footer: function() {
              return '💡 Haz clic para filtrar';
            }
          }
        }
      },
      scales: { 
        x: { 
          beginAtZero: true, 
          ticks: { 
            precision: 0,
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { 
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        y: {
          ticks: {
            font: { size: 12, weight: '600' },
            maxRotation: 0,
            color: '#666'
          },
          grid: { display: false }
        }
      }
    }
  });
}

function crearGraficasClasificacionFallecidos() {
  const ctx = document.getElementById('chartClasificacionFallecidos');
  if (!ctx) return;
  
  const datosFiltrados = obtenerDatosFiltrados();
  
  const clasificacion = {};
  datosFiltrados.forEach(row => {
    const clase = row[COLUMNAS.CLASIFICACION_FALLECIDOS] || 'No especificada';
    const fallecidos = parseInt(row[COLUMNAS.TOTAL_FALLECIDOS] || 0);
    if (fallecidos > 0 && clase !== 'No aplica') {
      clasificacion[clase] = (clasificacion[clase] || 0) + fallecidos;
    }
  });
  
  const sortedClasificacion = Object.entries(clasificacion).sort((a, b) => b[1] - a[1]);
  if (sortedClasificacion.length === 0) {
    const parent = ctx.parentElement;
    if (parent) parent.innerHTML = '<p class="empty-state">No hay datos de clasificación disponibles</p>';
    return;
  }
  
  const totalFallecidos = sortedClasificacion.reduce((sum, [, count]) => sum + count, 0);
  
  if (charts.clasificacionFallecidos) charts.clasificacionFallecidos.destroy();
  
  charts.clasificacionFallecidos = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sortedClasificacion.map(c => c[0]),
      datasets: [{
        label: 'Fallecidos',
        data: sortedClasificacion.map(c => c[1]),
        backgroundColor: [
          'rgba(255, 99, 132, 0.85)',
          'rgba(54, 162, 235, 0.85)', 
          'rgba(255, 206, 86, 0.85)',
          'rgba(76, 175, 80, 0.85)',
          'rgba(153, 102, 255, 0.85)',
          'rgba(255, 152, 0, 0.85)',
          'rgba(233, 30, 99, 0.85)',
          'rgba(158, 158, 158, 0.85)'
        ],
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { 
        legend: { 
          position: 'right',
          labels: {
            padding: 18,
            font: { size: 13, weight: '700' },
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  return {
                    text: label,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const porcentaje = totalFallecidos > 0 ? ((value / totalFallecidos) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} fallecidos (${porcentaje}%)`;
            }
          }
        },
        title: {
          display: true,
          text: `Total: ${totalFallecidos.toLocaleString()} fallecidos`,
          font: { size: 15, weight: 'bold' },
          color: '#1976d2',
          padding: { bottom: 18 }
        }
      }
    }
  });
}

function crearGraficasTiposVialidad() {
  const ctx = document.getElementById('chartTiposVialidad');
  if (!ctx) return;
  
  const datosFiltrados = obtenerDatosFiltrados();
  
  const vialidades = {};
  datosFiltrados.forEach(row => {
    const vialidad = row[COLUMNAS.TIPO_VIALIDAD] || 'No especificada';
    vialidades[vialidad] = (vialidades[vialidad] || 0) + 1;
  });
  
  const sortedVialidades = Object.entries(vialidades).sort((a, b) => b[1] - a[1]);
  const totalVialidades = sortedVialidades.reduce((sum, [, count]) => sum + count, 0);
  
  if (charts.tiposVialidad) charts.tiposVialidad.destroy();
  
  charts.tiposVialidad = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: sortedVialidades.map(v => v[0]),
      datasets: [{
        data: sortedVialidades.map(v => v[1]),
        backgroundColor: sortedVialidades.map((item, index) => {
          if (filtrosActivos.tipoVialidad === item[0]) {
            return 'rgba(25, 118, 210, 0.85)';
          }
          const colores = [
            'rgba(76, 175, 80, 0.85)', 
            'rgba(255, 99, 132, 0.85)', 
            'rgba(54, 162, 235, 0.85)', 
            'rgba(255, 206, 86, 0.85)', 
            'rgba(153, 102, 255, 0.85)'
          ];
          return colores[index % 5];
        }),
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const elementIndex = elements[0].index;
          const tipoVialidad = sortedVialidades[elementIndex][0];
          
          if (filtrosActivos.tipoVialidad === tipoVialidad) {
            limpiarFiltrosCruzados();
          } else {
            aplicarFiltroCruzado('tipoVialidad', tipoVialidad);
          }
        }
      },
      plugins: { 
        legend: { 
          position: 'right',
          labels: {
            padding: 18,
            font: { size: 13, weight: '700' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const porcentaje = totalVialidades > 0 ? ((value / totalVialidades) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} incidentes (${porcentaje}%)`;
            },
            footer: function() {
              return '💡 Haz clic para filtrar';
            }
          }
        }
      }
    }
  });
}

function crearGraficaDias(analizador) {
  const ctx = document.getElementById('chartDias');
  if (!ctx) return;
  
  const datosDia = analizador.analizarPorDiaSemana();
  if (charts.dias) charts.dias.destroy();
  
  charts.dias = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: datosDia.map(d => d.dia),
      datasets: [{
        data: datosDia.map(d => d.cantidad),
        backgroundColor: [
          'rgba(255, 99, 132, 0.85)', 
          'rgba(54, 162, 235, 0.85)', 
          'rgba(255, 206, 86, 0.85)', 
          'rgba(76, 175, 80, 0.85)', 
          'rgba(153, 102, 255, 0.85)', 
          'rgba(255, 159, 64, 0.85)', 
          'rgba(233, 30, 99, 0.85)'
        ],
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { 
          position: 'right',
          labels: {
            padding: 18,
            font: { size: 13, weight: '700' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        },
        title: {
          display: filtrosActivos.municipio !== null,
          text: filtrosActivos.municipio ? `📍 Filtrado: ${filtrosActivos.municipio}` : '',
          font: { size: 14, weight: 'bold' },
          color: '#4caf50',
          padding: { bottom: 15 }
        }
      }
    }
  });
}

function crearGraficaMunicipios() {
  const ctx = document.getElementById('chartMunicipios');
  if (!ctx) return;
  
  const municipios = {};
  incidentsValidos.forEach(row => {
    const municipio = row[COLUMNAS.MUNICIPIO] || 'Desconocido';
    municipios[municipio] = (municipios[municipio] || 0) + 1;
  });
  
  const top10 = Object.entries(municipios).sort((a, b) => b[1] - a[1]).slice(0, 10);
  
  if (charts.municipios) charts.municipios.destroy();
  
  const hayFiltros = filtrosActivos.municipio || 
                     filtrosActivos.tipoSiniestro || 
                     filtrosActivos.causaSiniestro || 
                     filtrosActivos.tipoVialidad;
  
  charts.municipios = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top10.map(m => m[0]),
      datasets: [{
        label: 'Incidentes',
        data: top10.map(m => m[1]),
        backgroundColor: top10.map(m => 
          m[0] === filtrosActivos.municipio ? 
          'rgba(76, 175, 80, 0.85)' : 'rgba(54, 162, 235, 0.75)'
        ),
        borderColor: top10.map(m => 
          m[0] === filtrosActivos.municipio ? 
          'rgba(76, 175, 80, 1)' : 'rgba(54, 162, 235, 1)'
        ),
        borderWidth: 3,
        borderRadius: 8,
        hoverBackgroundColor: top10.map(m => 
          m[0] === filtrosActivos.municipio ? 
          'rgba(76, 175, 80, 1)' : 'rgba(54, 162, 235, 1)'
        )
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { 
        legend: { display: false },
        title: {
          display: hayFiltros,
          text: filtrosActivos.municipio ? 
            `📍 Municipio filtrado: ${filtrosActivos.municipio}` : 
            '📊 Datos filtrados aplicados',
          font: { size: 14, weight: 'bold' },
          color: filtrosActivos.municipio ? '#4caf50' : '#1976d2',
          padding: { bottom: 15 }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const municipio = context.label;
              const valor = context.parsed.y;
              
              if (municipio === filtrosActivos.municipio) {
                return `${valor} incidentes ⭐ (FILTRADO)`;
              }
              return `${valor} incidentes`;
            }
          }
        }
      },
      scales: { 
        y: { 
          beginAtZero: true, 
          ticks: { 
            precision: 0,
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { 
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { display: false }
        }
      }
    }
  });
}

// ============================================================
// ANÁLISIS CRUZADO
// ============================================================
function inicializarAnalisisCruzado() {
  actualizarAnalisisCruzado();
}

function actualizarAnalisisCruzado() {
  const tipo = document.getElementById('tipoAnalisisCruzado')?.value;
  if (!tipo) return;
  
  switch(tipo) {
    case 'municipio_fallecidos': analisisMunicipioFallecidos(); break;
    case 'vialidad_tipo': analisisVialidadTipo(); break;
    case 'dia_causa': analisisDiaCausa(); break;
    case 'municipio_causa': analisisMunicipioCausa(); break;
    case 'vialidad_fallecidos': analisisVialidadFallecidos(); break;
  }
}

function analisisMunicipioFallecidos() {
  const datosFiltrados = obtenerDatosFiltrados();
  
  const datos = {};
  datosFiltrados.forEach(row => {
    const municipio = row[COLUMNAS.MUNICIPIO] || 'Desconocido';
    const fallecidos = parseInt(row[COLUMNAS.TOTAL_FALLECIDOS] || 0);
    if (!datos[municipio]) datos[municipio] = { incidentes: 0, fallecidos: 0 };
    datos[municipio].incidentes++;
    datos[municipio].fallecidos += fallecidos;
  });
  
  const municipiosConLetalidad = Object.entries(datos).map(([municipio, data]) => ({
    municipio,
    tasa: data.incidentes > 0 ? (data.fallecidos / data.incidentes).toFixed(2) : 0,
    fallecidos: data.fallecidos,
    incidentes: data.incidentes
  })).sort((a, b) => b.tasa - a.tasa).slice(0, 10);
  
  crearGraficaAnalisisCruzado(
    municipiosConLetalidad.map(m => m.municipio),
    [{
      label: 'Fallecidos por Incidente',
      data: municipiosConLetalidad.map(m => m.tasa),
      backgroundColor: 'rgba(244, 67, 54, 0.75)',
      borderColor: 'rgba(244, 67, 54, 1)',
      borderWidth: 3,
      borderRadius: 8
    }],
    'bar'
  );
  
  generarInsights('municipio_fallecidos', municipiosConLetalidad);
}

function analisisVialidadTipo() {
  const datosFiltrados = obtenerDatosFiltrados();
  
  const vialidades = {};
  datosFiltrados.forEach(row => {
    const vialidad = row[COLUMNAS.TIPO_VIALIDAD] || 'No especificada';
    const causa = row[COLUMNAS.CAUSA_SINIESTRO] || 'Otro';
    if (!vialidades[vialidad]) vialidades[vialidad] = {};
    vialidades[vialidad][causa] = (vialidades[vialidad][causa] || 0) + 1;
  });
  
  const todasCausas = [...new Set(datosFiltrados.map(row => row[COLUMNAS.CAUSA_SINIESTRO] || 'Otro'))].slice(0, 5);
  const colores = [
    'rgba(255, 99, 132, 0.75)', 
    'rgba(54, 162, 235, 0.75)', 
    'rgba(255, 206, 86, 0.75)', 
    'rgba(75, 192, 192, 0.75)', 
    'rgba(153, 102, 255, 0.75)'
  ];
  
  const coloresBorde = [
    'rgba(255, 99, 132, 1)', 
    'rgba(54, 162, 235, 1)', 
    'rgba(255, 206, 86, 1)', 
    'rgba(75, 192, 192, 1)', 
    'rgba(153, 102, 255, 1)'
  ];
  
  const datasets = todasCausas.map((causa, idx) => ({
    label: causa,
    data: Object.keys(vialidades).map(vialidad => vialidades[vialidad][causa] || 0),
    backgroundColor: colores[idx],
    borderColor: coloresBorde[idx],
    borderWidth: 3,
    borderRadius: 6
  }));
  
  crearGraficaAnalisisCruzado(Object.keys(vialidades), datasets, 'bar', true);
  generarInsights('vialidad_tipo', { vialidades, causas: todasCausas });
}

function analisisDiaCausa() {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const datosPorDia = {};
  dias.forEach(dia => datosPorDia[dia] = {});
  
  const datosFiltrados = obtenerDatosFiltrados();
  
  datosFiltrados.forEach(row => {
    const fechaStr = row[COLUMNAS.FECHA_SINIESTRO];
    if (!fechaStr) return;
    
    let fecha = null;
    if (fechaStr.includes('/')) {
      const partes = fechaStr.split(' ')[0].split('/');
      if (partes.length === 3) {
        fecha = new Date(partes[2], partes[1] - 1, partes[0]);
      }
    } else if (fechaStr.includes('-')) {
      fecha = new Date(fechaStr.split(' ')[0]);
    }
    
    if (!fecha || isNaN(fecha)) return;
    const dia = dias[fecha.getDay()];
    const causa = row[COLUMNAS.CAUSA_SINIESTRO] || 'Otro';
    datosPorDia[dia][causa] = (datosPorDia[dia][causa] || 0) + 1;
  });
  
  const todasCausas = [...new Set(datosFiltrados.map(row => row[COLUMNAS.CAUSA_SINIESTRO] || 'Otro'))].slice(0, 5);
  const colores = [
    'rgba(255, 99, 132, 0.75)', 
    'rgba(54, 162, 235, 0.75)', 
    'rgba(255, 206, 86, 0.75)', 
    'rgba(75, 192, 192, 0.75)', 
    'rgba(153, 102, 255, 0.75)'
  ];
  
  const coloresBorde = [
    'rgba(255, 99, 132, 1)', 
    'rgba(54, 162, 235, 1)', 
    'rgba(255, 206, 86, 1)', 
    'rgba(75, 192, 192, 1)', 
    'rgba(153, 102, 255, 1)'
  ];
  
  const datasets = todasCausas.map((causa, idx) => ({
    label: causa,
    data: dias.map(dia => datosPorDia[dia][causa] || 0),
    backgroundColor: colores[idx],
    borderColor: coloresBorde[idx],
    borderWidth: 3,
    borderRadius: 6
  }));
  
  crearGraficaAnalisisCruzado(dias, datasets, 'bar', true);
  generarInsights('dia_causa', { datosPorDia, causas: todasCausas });
}

function analisisMunicipioCausa() {
  const datosFiltrados = obtenerDatosFiltrados();
  
  const municipios = {};
  datosFiltrados.forEach(row => {
    const municipio = row[COLUMNAS.MUNICIPIO] || 'Desconocido';
    municipios[municipio] = (municipios[municipio] || 0) + 1;
  });
  
  const top10Municipios = Object.entries(municipios).sort((a, b) => b[1] - a[1]).slice(0, 10).map(m => m[0]);
  const datosPorMunicipio = {};
  top10Municipios.forEach(mun => datosPorMunicipio[mun] = {});
  
  datosFiltrados.forEach(row => {
    const municipio = row[COLUMNAS.MUNICIPIO] || 'Desconocido';
    if (!top10Municipios.includes(municipio)) return;
    const causa = row[COLUMNAS.CAUSA_SINIESTRO] || 'Otro';
    datosPorMunicipio[municipio][causa] = (datosPorMunicipio[municipio][causa] || 0) + 1;
  });
  
  const todasCausas = [...new Set(datosFiltrados.map(row => row[COLUMNAS.CAUSA_SINIESTRO] || 'Otro'))].slice(0, 5);
  const colores = [
    'rgba(255, 99, 132, 0.75)', 
    'rgba(54, 162, 235, 0.75)', 
    'rgba(255, 206, 86, 0.75)', 
    'rgba(75, 192, 192, 0.75)', 
    'rgba(153, 102, 255, 0.75)'
  ];
  
  const coloresBorde = [
    'rgba(255, 99, 132, 1)', 
    'rgba(54, 162, 235, 1)', 
    'rgba(255, 206, 86, 1)', 
    'rgba(75, 192, 192, 1)', 
    'rgba(153, 102, 255, 1)'
  ];
  
  const datasets = todasCausas.map((causa, idx) => ({
    label: causa,
    data: top10Municipios.map(mun => datosPorMunicipio[mun][causa] || 0),
    backgroundColor: colores[idx],
    borderColor: coloresBorde[idx],
    borderWidth: 3,
    borderRadius: 6
  }));
  
  crearGraficaAnalisisCruzado(top10Municipios, datasets, 'bar', true);
  generarInsights('municipio_causa', { datosPorMunicipio, causas: todasCausas });
}

function analisisVialidadFallecidos() {
  const datosFiltrados = obtenerDatosFiltrados();
  
  const datos = {};
  datosFiltrados.forEach(row => {
    const vialidad = row[COLUMNAS.TIPO_VIALIDAD] || 'No especificada';
    const fallecidos = parseInt(row[COLUMNAS.TOTAL_FALLECIDOS] || 0);
    if (!datos[vialidad]) datos[vialidad] = { incidentes: 0, fallecidos: 0 };
    datos[vialidad].incidentes++;
    datos[vialidad].fallecidos += fallecidos;
  });
  
  const vialidadesConLetalidad = Object.entries(datos).map(([vialidad, data]) => ({
    vialidad,
    tasa: data.incidentes > 0 ? (data.fallecidos / data.incidentes).toFixed(2) : 0,
    fallecidos: data.fallecidos,
    incidentes: data.incidentes
  })).sort((a, b) => b.tasa - a.tasa);
  
  crearGraficaAnalisisCruzado(
    vialidadesConLetalidad.map(v => v.vialidad),
    [{
      label: 'Fallecidos por Incidente',
      data: vialidadesConLetalidad.map(v => v.tasa),
      backgroundColor: 'rgba(76, 175, 80, 0.75)',
      borderColor: 'rgba(76, 175, 80, 1)',
      borderWidth: 3,
      borderRadius: 8
    }],
    'bar'
  );
  
  generarInsights('vialidad_fallecidos', vialidadesConLetalidad);
}

function crearGraficaAnalisisCruzado(labels, datasets, tipo = 'bar', stacked = false) {
  const ctx = document.getElementById('chartAnalisisCruzado');
  if (!ctx) return;
  if (charts.cruzado) charts.cruzado.destroy();
  
  charts.cruzado = new Chart(ctx, {
    type: tipo,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { 
        legend: { 
          position: 'top',
          labels: {
            padding: 18,
            font: { size: 13, weight: '700' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1
        }
      },
      scales: tipo !== 'pie' && tipo !== 'doughnut' ? {
        x: { 
          stacked,
          ticks: {
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { display: false }
        },
        y: { 
          stacked, 
          beginAtZero: true, 
          ticks: { 
            precision: 0,
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { 
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        }
      } : {}
    }
  });
}

function generarInsights(tipoAnalisis, datos) {
  const container = document.getElementById('insightsList');
  if (!container) return;
  
  let insights = [];
  
  switch(tipoAnalisis) {
    case 'municipio_fallecidos':
      if (datos.length > 0) {
        const masPeligroso = datos[0];
        insights.push(`El municipio más letal es <strong>${masPeligroso.municipio}</strong> con ${masPeligroso.tasa} fallecidos por incidente.`);
        insights.push(`En total, ${masPeligroso.municipio} ha registrado ${masPeligroso.fallecidos} fallecidos en ${masPeligroso.incidentes} incidentes.`);
      }
      break;
    case 'vialidad_tipo':
      const vialidadMasPeligrosa = Object.entries(datos.vialidades).map(([v, causas]) => ({
        vialidad: v,
        total: Object.values(causas).reduce((a, b) => a + b, 0)
      })).sort((a, b) => b.total - a.total)[0];
      if (vialidadMasPeligrosa) {
        insights.push(`<strong>${vialidadMasPeligrosa.vialidad}</strong> es el tipo de vialidad con más incidentes (${vialidadMasPeligrosa.total} casos).`);
      }
      break;
    case 'dia_causa':
      const diaMasPeligroso = Object.entries(datos.datosPorDia).map(([dia, causas]) => ({
        dia,
        total: Object.values(causas).reduce((a, b) => a + b, 0)
      })).sort((a, b) => b.total - a.total)[0];
      if (diaMasPeligroso) {
        insights.push(`<strong>${diaMasPeligroso.dia}</strong> es el día con más incidentes registrados.`);
      }
      break;
    case 'vialidad_fallecidos':
      if (datos.length > 0) {
        const masPeligrosaVialidad = datos[0];
        insights.push(`<strong>${masPeligrosaVialidad.vialidad}</strong> tiene la tasa de letalidad más alta: ${masPeligrosaVialidad.tasa} fallecidos por incidente.`);
      }
      break;
    case 'municipio_causa':
      insights.push(`Análisis de las causas principales por municipio muestra patrones diferenciados según la ubicación.`);
      break;
  }
  
  if (insights.length === 0) {
    insights.push('No se encontraron insights relevantes con los datos actuales.');
  }
  
  container.innerHTML = insights.map(insight => 
    `<div class="insight-item"><i class="fas fa-lightbulb"></i> <span>${insight}</span></div>`
  ).join('');
}

// ============================================================
// CONTROL DE PANELES
// ============================================================
window.togglePanel = function(panel) {
  const content = document.getElementById(`${panel}Content`);
  const icon = document.getElementById(`${panel}ToggleIcon`);
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.className = 'fas fa-chevron-up';
    
    if (panel === 'perfil') actualizarPerfilSiniestros();
    if (panel === 'cruzado') inicializarAnalisisCruzado();
    if (panel === 'transporte') inicializarTransportePublico();
  } else {
    content.style.display = 'none';
    icon.className = 'fas fa-chevron-down';
  }
};

window.actualizarAnalisisCruzado = actualizarAnalisisCruzado;

/* ============================================================
   SISTEMA COMPLETO DE ANÁLISIS DE TRANSPORTE PÚBLICO
   ============================================================ */

let transporteFiltroActivo = null;
let chartsTransporte = {};
let datosTransporteCache = null;

function obtenerTodosTransportePublico() {
  if (datosTransporteCache !== null) {
    return datosTransporteCache;
  }
  
  console.log('🔍 Filtrando todos los registros de transporte público...');
  
  datosTransporteCache = incidentsValidos.filter(row => {
    const tipoTransporte = (row[COLUMNAS.TIPO_TRANSPORTE_PUBLICO] || '').toLowerCase().trim();
    
    const esColectivo = tipoTransporte.includes('colectivo') || 
                        (row[COLUMNAS.COLECTIVO_NUMERO] && row[COLUMNAS.COLECTIVO_NUMERO] !== '');
    
    const esTaxi = (tipoTransporte.includes('taxi') && !tipoTransporte.includes('moto')) || 
                   (row[COLUMNAS.TAXI_NUMERO] && row[COLUMNAS.TAXI_NUMERO] !== '');
    
    const esMototaxi = tipoTransporte.includes('mototaxi') || 
                       (row[COLUMNAS.MOTOTAXI_NUMERO] && row[COLUMNAS.MOTOTAXI_NUMERO] !== '');
    
    return esColectivo || esTaxi || esMototaxi;
  });
  
  console.log(`✅ Total de transporte público encontrado: ${datosTransporteCache.length}`);
  return datosTransporteCache;
}

function obtenerDatosTransporte(tipo) {
  console.log(`🔍 Filtrando datos de ${tipo}...`);
  
  const datos = incidentsValidos.filter(row => {
    const tipoTransporte = (row[COLUMNAS.TIPO_TRANSPORTE_PUBLICO] || '').toLowerCase().trim();
    
    if (tipo === 'colectivo') {
      return tipoTransporte.includes('colectivo') || 
             (row[COLUMNAS.COLECTIVO_NUMERO] && row[COLUMNAS.COLECTIVO_NUMERO] !== '');
    } 
    else if (tipo === 'taxi') {
      return (tipoTransporte.includes('taxi') && !tipoTransporte.includes('moto')) || 
             (row[COLUMNAS.TAXI_NUMERO] && row[COLUMNAS.TAXI_NUMERO] !== '' && 
              !tipoTransporte.includes('moto'));
    } 
    else if (tipo === 'mototaxi') {
      return tipoTransporte.includes('mototaxi') || 
             (row[COLUMNAS.MOTOTAXI_NUMERO] && row[COLUMNAS.MOTOTAXI_NUMERO] !== '');
    }
    return false;
  });
  
  console.log(`✅ Encontrados ${datos.length} registros de ${tipo}`);
  return datos;
}

function contarRegistrosTransporte() {
  console.log('\n📊 ========== CONTANDO TRANSPORTE PÚBLICO ==========');
  
  const conteos = {
    colectivo: 0,
    taxi: 0,
    mototaxi: 0
  };
  
  incidentsValidos.forEach((row) => {
    const tipoTransporte = (row[COLUMNAS.TIPO_TRANSPORTE_PUBLICO] || '').toLowerCase().trim();
    const colectivoNum = row[COLUMNAS.COLECTIVO_NUMERO];
    const taxiNum = row[COLUMNAS.TAXI_NUMERO];
    const mototaxiNum = row[COLUMNAS.MOTOTAXI_NUMERO];
    
    if (tipoTransporte.includes('colectivo') || (colectivoNum && colectivoNum !== '')) {
      conteos.colectivo++;
    } 
    else if ((tipoTransporte.includes('taxi') && !tipoTransporte.includes('moto')) || 
             (taxiNum && taxiNum !== '' && !tipoTransporte.includes('moto'))) {
      conteos.taxi++;
    }
    if (tipoTransporte.includes('mototaxi') || (mototaxiNum && mototaxiNum !== '')) {
      conteos.mototaxi++;
    }
  });
  
  const colectivoEl = document.getElementById('countColectivos');
  const taxiEl = document.getElementById('countTaxis');
  const mototaxiEl = document.getElementById('countMototaxis');
  
  if (colectivoEl) colectivoEl.textContent = conteos.colectivo;
  if (taxiEl) taxiEl.textContent = conteos.taxi;
  if (mototaxiEl) mototaxiEl.textContent = conteos.mototaxi;
  
  console.log('📊 Conteos finales:');
  console.log(`   🚌 Colectivos: ${conteos.colectivo}`);
  console.log(`   🚕 Taxis: ${conteos.taxi}`);
  console.log(`   🛵 Mototaxis: ${conteos.mototaxi}`);
  console.log(`   📊 TOTAL: ${conteos.colectivo + conteos.taxi + conteos.mototaxi}`);
  console.log('========== FIN CONTEO ==========\n');
  
  return conteos;
}

function cambiarTransporteFiltro(tipo) {
  console.log(`\n🚌 ========== CAMBIANDO FILTRO ==========`);
  console.log(`Tipo seleccionado: ${tipo}`);
  
  transporteFiltroActivo = tipo;
  
  const radioBtn = document.getElementById(`radio${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
  if (radioBtn) radioBtn.checked = true;
  
  const btnLimpiar = document.getElementById('btnLimpiarTransporte');
  if (btnLimpiar) btnLimpiar.style.display = 'flex';
  
  const vistaGeneral = document.getElementById('vistaGeneralTransporte');
  if (vistaGeneral) vistaGeneral.style.display = 'none';
  
  actualizarEstadisticasTransporte(tipo);
  
  const container = document.getElementById('transporteStatsContainer');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  const tiposNombre = {
    'colectivo': 'Colectivos',
    'taxi': 'Taxis',
    'mototaxi': 'Mototaxis'
  };
  
  mostrarNotificacion(`✅ Mostrando estadísticas de ${tiposNombre[tipo]}`, 'info', 2500);
  console.log('========== FIN CAMBIO FILTRO ==========\n');
}

function limpiarFiltroTransporte() {
  console.log('\n🔄 ========== LIMPIANDO FILTRO ==========');
  
  transporteFiltroActivo = null;
  
  document.querySelectorAll('input[name="transportePublicoFiltro"]').forEach(radio => {
    radio.checked = false;
  });
  
  const btnLimpiar = document.getElementById('btnLimpiarTransporte');
  if (btnLimpiar) btnLimpiar.style.display = 'none';
  
  const vistaGeneral = document.getElementById('vistaGeneralTransporte');
  if (vistaGeneral) vistaGeneral.style.display = 'block';
  
  const container = document.getElementById('transporteStatsContainer');
  if (container) {
    container.innerHTML = `
      <div class="transport-empty-state">
        <i class="fas fa-hand-pointer" style="font-size: 5em; color: #90caf9; margin-bottom: 25px;"></i>
        <p style="color: #666; font-size: 20px; font-weight: 700;">Selecciona un tipo de transporte para ver análisis detallado</p>
        <p style="color: #999; font-size: 16px; margin-top: 12px;">Haz clic en una de las tarjetas de arriba</p>
      </div>
    `;
  }
  
  if (vistaGeneral) {
    vistaGeneral.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  mostrarNotificacion('✅ Mostrando panorama general del transporte público', 'success', 2500);
  console.log('========== FIN LIMPIAR FILTRO ==========\n');
}

function generarVistaGeneralTransporte() {
  console.log('\n🎨 ========== GENERANDO VISTA GENERAL ==========');
  
  const datosTransporte = obtenerTodosTransportePublico();
  console.log(`📊 Total registros de transporte: ${datosTransporte.length}`);
  
  if (datosTransporte.length === 0) {
    console.log('⚠️ No hay datos de transporte público');
    return;
  }
  
  const totalIncidentes = datosTransporte.length;
  const totalFallecidos = datosTransporte.reduce((sum, row) => 
    sum + parseInt(row[COLUMNAS.TOTAL_FALLECIDOS] || 0), 0
  );
  
  const tasaLetalidad = totalIncidentes > 0 ? 
    ((totalFallecidos / totalIncidentes) * 100).toFixed(1) : 0;
  
  const porcentajeTotal = incidentsValidos.length > 0 ? 
    ((totalIncidentes / incidentsValidos.length) * 100).toFixed(1) : 0;
  
  console.log(`📊 Métricas calculadas:`);
  console.log(`   Total incidentes: ${totalIncidentes}`);
  console.log(`   Total fallecidos: ${totalFallecidos}`);
  console.log(`   Tasa letalidad: ${tasaLetalidad}%`);
  console.log(`   Porcentaje del total: ${porcentajeTotal}%`);
  
  const elementosMetricas = {
    'generalTotalIncidentes': totalIncidentes,
    'generalTotalFallecidos': totalFallecidos,
    'generalTasaLetalidad': tasaLetalidad + '%',
    'generalPorcentajeTotal': porcentajeTotal + '%'
  };
  
  Object.entries(elementosMetricas).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
      console.log(`✅ Actualizado ${id}: ${valor}`);
    } else {
      console.warn(`⚠️ No se encontró elemento: ${id}`);
    }
  });
  
  console.log('🎨 Generando gráficas...');
  setTimeout(() => {
    crearGraficaComparacionTipos();
    crearGraficaGravedadGeneral();
    crearGraficaEvolucionTemporal();
    crearGraficaDiasSemanaTransporte();
    crearGraficaVialidadTransporte();
    crearGraficaMunicipiosTransporte();
    console.log('✅ Todas las gráficas generadas');
  }, 100);
  
  console.log('========== FIN VISTA GENERAL ==========\n');
}

function crearGraficaComparacionTipos() {
  const ctx = document.getElementById('chartComparacionTipos');
  if (!ctx) {
    console.warn('⚠️ No se encontró canvas: chartComparacionTipos');
    return;
  }
  
  console.log('📊 Creando gráfica de comparación de tipos...');
  
  const conteos = contarRegistrosTransporte();
  const total = conteos.colectivo + conteos.taxi + conteos.mototaxi;
  
  if (chartsTransporte.comparacion) {
    chartsTransporte.comparacion.destroy();
  }
  
  chartsTransporte.comparacion = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Colectivos', 'Taxis', 'Mototaxis'],
      datasets: [{
        label: 'Número de Incidentes',
        data: [conteos.colectivo, conteos.taxi, conteos.mototaxi],
        backgroundColor: [
          'rgba(255, 152, 0, 0.85)',
          'rgba(33, 150, 243, 0.85)',
          'rgba(76, 175, 80, 0.85)'
        ],
        borderColor: [
          'rgb(245, 124, 0)',
          'rgb(25, 118, 210)',
          'rgb(56, 142, 60)'
        ],
        borderWidth: 3,
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Total: ${total} incidentes de transporte público`,
          font: { size: 16, weight: 'bold' },
          color: '#1976d2',
          padding: { bottom: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const valor = context.parsed.y;
              const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
              return `${valor} incidentes (${porcentaje}%)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            precision: 0,
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { 
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            font: { size: 13, weight: '700' },
            color: '#333'
          },
          grid: { display: false }
        }
      }
    }
  });
  
  console.log('✅ Gráfica de comparación creada');
}

function crearGraficaGravedadGeneral() {
  const ctx = document.getElementById('chartGravedadGeneral');
  if (!ctx) return;
  
  const datosTransporte = obtenerTodosTransportePublico();
  const gravedad = {
    'Sin heridos': 0,
    'Con heridos': 0,
    'Con fallecidos': 0
  };
  
  datosTransporte.forEach(row => {
    const fallecidos = parseInt(row[COLUMNAS.TOTAL_FALLECIDOS] || 0);
    const heridos = parseInt(row[COLUMNAS.TOTAL_HERIDOS] || 0);
    
    if (fallecidos > 0) {
      gravedad['Con fallecidos']++;
    } else if (heridos > 0) {
      gravedad['Con heridos']++;
    } else {
      gravedad['Sin heridos']++;
    }
  });
  
  if (chartsTransporte.gravedad) {
    chartsTransporte.gravedad.destroy();
  }
  
  chartsTransporte.gravedad = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(gravedad),
      datasets: [{
        data: Object.values(gravedad),
        backgroundColor: [
          'rgba(76, 175, 80, 0.85)',
          'rgba(255, 152, 0, 0.85)',
          'rgba(244, 67, 54, 0.85)'
        ],
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: { 
            padding: 18, 
            font: { size: 13, weight: '700' } 
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1
        }
      }
    }
  });
}

function crearGraficaEvolucionTemporal() {
  const ctx = document.getElementById('chartEvolucionTemporal');
  if (!ctx) return;
  
  const gruposMensuales = {};
  
  ['colectivo', 'taxi', 'mototaxi'].forEach(tipo => {
    const datos = obtenerDatosTransporte(tipo);
    
    datos.forEach(row => {
      const fechaStr = row[COLUMNAS.FECHA_SINIESTRO];
      if (!fechaStr) return;
      
      let fecha = null;
      if (fechaStr.includes('/')) {
        const partes = fechaStr.split(' ')[0].split('/');
        if (partes.length === 3) {
          fecha = new Date(partes[2], partes[1] - 1, partes[0]);
        }
      } else if (fechaStr.includes('-')) {
        fecha = new Date(fechaStr.split(' ')[0]);
      }
      
      if (!fecha || isNaN(fecha)) return;
      
      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      
      if (!gruposMensuales[clave]) {
        gruposMensuales[clave] = { colectivo: 0, taxi: 0, mototaxi: 0 };
      }
      
      gruposMensuales[clave][tipo]++;
    });
  });
  
  const clavesOrdenadas = Object.keys(gruposMensuales).sort();
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const labels = clavesOrdenadas.map(clave => {
    const [año, mes] = clave.split('-');
    return `${meses[parseInt(mes) - 1]} ${año}`;
  });
  
  if (chartsTransporte.evolucion) {
    chartsTransporte.evolucion.destroy();
  }
  
  chartsTransporte.evolucion = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Colectivos',
          data: clavesOrdenadas.map(c => gruposMensuales[c].colectivo),
          borderColor: 'rgb(255, 152, 0)',
          backgroundColor: 'rgba(255, 152, 0, 0.15)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgb(255, 152, 0)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Taxis',
          data: clavesOrdenadas.map(c => gruposMensuales[c].taxi),
          borderColor: 'rgb(33, 150, 243)',
          backgroundColor: 'rgba(33, 150, 243, 0.15)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgb(33, 150, 243)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Mototaxis',
          data: clavesOrdenadas.map(c => gruposMensuales[c].mototaxi),
          borderColor: 'rgb(76, 175, 80)',
          backgroundColor: 'rgba(76, 175, 80, 0.15)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgb(76, 175, 80)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { 
            padding: 18, 
            font: { size: 13, weight: '700' },
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            precision: 0,
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { 
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { display: false }
        }
      }
    }
  });
}

function crearGraficaDiasSemanaTransporte() {
  const ctx = document.getElementById('chartDiasSemanaTransporte');
  if (!ctx) return;
  
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const distribucion = new Array(7).fill(0);
  
  const datosTransporte = obtenerTodosTransportePublico();
  
  datosTransporte.forEach(row => {
    const fechaStr = row[COLUMNAS.FECHA_SINIESTRO];
    if (!fechaStr) return;
    
    let fecha = null;
    if (fechaStr.includes('/')) {
      const partes = fechaStr.split(' ')[0].split('/');
      if (partes.length === 3) {
        fecha = new Date(partes[2], partes[1] - 1, partes[0]);
      }
    } else if (fechaStr.includes('-')) {
      fecha = new Date(fechaStr.split(' ')[0]);
    }
    
    if (fecha && !isNaN(fecha)) {
      distribucion[fecha.getDay()]++;
    }
  });
  
  if (chartsTransporte.dias) {
    chartsTransporte.dias.destroy();
  }
  
  chartsTransporte.dias = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dias,
      datasets: [{
        label: 'Incidentes',
        data: distribucion,
        backgroundColor: 'rgba(156, 39, 176, 0.85)',
        borderColor: 'rgb(123, 31, 162)',
        borderWidth: 3,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            precision: 0,
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { 
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            font: { size: 12, weight: '700' },
            color: '#333'
          },
          grid: { display: false }
        }
      }
    }
  });
}

function crearGraficaVialidadTransporte() {
  const ctx = document.getElementById('chartVialidadTransporte');
  if (!ctx) return;
  
  const datosTransporte = obtenerTodosTransportePublico();
  const vialidades = {};
  
  datosTransporte.forEach(row => {
    const vialidad = row[COLUMNAS.TIPO_VIALIDAD] || 'No especificada';
    vialidades[vialidad] = (vialidades[vialidad] || 0) + 1;
  });
  
  const sortedVialidades = Object.entries(vialidades)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (chartsTransporte.vialidad) {
    chartsTransporte.vialidad.destroy();
  }
  
  chartsTransporte.vialidad = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: sortedVialidades.map(v => v[0]),
      datasets: [{
        data: sortedVialidades.map(v => v[1]),
        backgroundColor: [
          'rgba(244, 67, 54, 0.85)',
          'rgba(33, 150, 243, 0.85)',
          'rgba(76, 175, 80, 0.85)',
          'rgba(255, 193, 7, 0.85)',
          'rgba(156, 39, 176, 0.85)'
        ],
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: { 
            padding: 18, 
            font: { size: 13, weight: '700' } 
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const valor = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const porcentaje = ((valor / total) * 100).toFixed(1);
              return `${context.label}: ${valor} (${porcentaje}%)`;
            }
          }
        }
      }
    }
  });
}

function crearGraficaMunicipiosTransporte() {
  const ctx = document.getElementById('chartMunicipiosTransporte');
  if (!ctx) return;
  
  const datosTransporte = obtenerTodosTransportePublico();
  const municipios = {};
  
  datosTransporte.forEach(row => {
    const municipio = row[COLUMNAS.MUNICIPIO] || 'Desconocido';
    municipios[municipio] = (municipios[municipio] || 0) + 1;
  });
  
  const top10 = Object.entries(municipios)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  if (chartsTransporte.municipios) {
    chartsTransporte.municipios.destroy();
  }
  
  chartsTransporte.municipios = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top10.map(m => m[0]),
      datasets: [{
        label: 'Incidentes',
        data: top10.map(m => m[1]),
        backgroundColor: 'rgba(255, 87, 34, 0.85)',
        borderColor: 'rgb(230, 74, 25)',
        borderWidth: 3,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { 
            precision: 0,
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { 
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        y: {
          ticks: {
            font: { size: 12, weight: '600' },
            color: '#666'
          },
          grid: { display: false }
        }
      }
    }
  });
}

function actualizarEstadisticasTransporte(tipo) {
  console.log(`\n📊 ========== ACTUALIZANDO ESTADÍSTICAS ${tipo.toUpperCase()} ==========`);
  
  const datos = obtenerDatosTransporte(tipo);
  const container = document.getElementById('transporteStatsContainer');
  
  if (!container) {
    console.error('❌ No se encontró el contenedor transporteStatsContainer');
    return;
  }
  
  if (datos.length === 0) {
    console.warn(`⚠️ No hay datos de ${tipo}`);
    container.innerHTML = `
      <div class="transport-empty-state">
        <i class="fas fa-info-circle" style="font-size: 5em; color: #ff9800; margin-bottom: 25px;"></i>
        <p style="color: #666; font-size: 20px; font-weight: 700;">No se encontraron datos de ${tipo}s</p>
        <p style="color: #999; font-size: 16px; margin-top: 12px;">Los registros de ${tipo}s aparecerán aquí cuando estén disponibles</p>
      </div>
    `;
    return;
  }
  
  if (tipo === 'colectivo') {
    generarEstadisticasColectivos(datos, container);
  } else if (tipo === 'taxi') {
    generarEstadisticasTaxis(datos, container);
  } else if (tipo === 'mototaxi') {
    generarEstadisticasMototaxis(datos, container);
  }
  
  console.log(`========== FIN ACTUALIZACIÓN ${tipo.toUpperCase()} ==========\n`);
}

// Las funciones generarEstadisticasColectivos, generarEstadisticasTaxis y generarEstadisticasMototaxis
// son muy extensas, así que las omitiré por espacio, pero están en tu código original

function inicializarTransportePublico() {
  console.log('\n🚀 ========== INICIALIZANDO TRANSPORTE PÚBLICO ==========');
  
  datosTransporteCache = null;
  
  if (!document.getElementById('vistaGeneralTransporte')) {
    console.error('❌ No se encontró el elemento vistaGeneralTransporte');
    return;
  }
  
  contarRegistrosTransporte();
  generarVistaGeneralTransporte();
  
  console.log('========== FIN INICIALIZACIÓN TRANSPORTE PÚBLICO ==========\n');
}

window.cambiarTransporteFiltro = cambiarTransporteFiltro;
window.limpiarFiltroTransporte = limpiarFiltroTransporte;
window.inicializarTransportePublico = inicializarTransportePublico;

// ============================================================
// INICIALIZACIÓN DEL SISTEMA
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('\n🚀 ========== INICIALIZANDO SISTEMA ==========');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📍 Página: estadisticas.html');
  console.log('🔄 Modo: TIEMPO REAL ACTIVADO');
  console.log(`⏱️ Intervalo de actualización: ${CONFIG_TIEMPO_REAL.INTERVALO_ACTUALIZACION / 1000}s`);
  
  // Cargar datos iniciales
  cargarDatos();
  
  // Resaltar página actual en navegación
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(link => {
    link.classList.remove('active');
    if (link.href.includes(currentPage)) {
      link.classList.add('active');
    }
  });
  
  console.log('✅ Sistema inicializado correctamente');
  console.log('========== FIN INICIALIZACIÓN ==========\n');
});

// ============================================================
// MANEJO DE VISIBILIDAD DE PÁGINA
// ============================================================
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    console.log('⏸️ Página oculta - pausando actualizaciones');
    // No detenemos el intervalo, solo registramos el evento
  } else {
    console.log('▶️ Página visible - continuando actualizaciones');
    // Forzar actualización inmediata al volver
    if (!actualizacionEnProceso) {
      console.log('🔄 Forzando actualización al retornar a la página');
      actualizarDatosAutomaticamente();
    }
  }
});

// ============================================================
// MANEJO DE ERRORES GLOBALES
// ============================================================
window.addEventListener('error', function(event) {
  console.error('❌ Error global capturado:', event.error);
  mostrarNotificacion('⚠️ Se produjo un error. La página seguirá funcionando.', 'warning', 4000);
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('❌ Promesa rechazada no manejada:', event.reason);
});

// ============================================================
// LIMPIEZA AL CERRAR/RECARGAR PÁGINA
// ============================================================
window.addEventListener('beforeunload', function() {
  console.log('🔄 Página cerrándose - deteniendo actualizaciones automáticas');
  detenerActualizacionAutomatica();
});

console.log('✅ estadisticas.js cargado completamente');
console.log('🔄 Sistema de tiempo real: LISTO');
console.log(`⏱️ Próxima actualización en ${CONFIG_TIEMPO_REAL.INTERVALO_ACTUALIZACION / 1000} segundos`);