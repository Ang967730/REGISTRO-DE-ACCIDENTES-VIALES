/* ============================================================
   MAPA.JS - VERSIÓN CORREGIDA CON COORDENADAS EN COLUMNA 43
   Sistema que muestra el 100% de las noticias con municipio
   ============================================================ */

class MapaIncidentes {
  constructor() {
    this.allIncidentsData = [];
    this.filteredIncidentsData = [];
    this.markersGroup = null;
    this.heatMapLayer = null;
    this.zonasLayer = null;
    this.showHeatmapLayer = true;
    this.showMarkersLayer = true;
    this.showZonasPeligrosas = false;
    this.currentTypeFilter = 'all';
    this.currentMunicipioFilter = '';
    this.currentFallecidosFilter = 0;
    this.tipoPeriodoFilter = 'todos';
    this.periodoSeleccionado = '';
    this.isLoading = false;
    this.map = null;
    this.capasBase = {};
    this.zonasPeligrosas = [];
    
    // ✅ URL CORRECTA DE TU APPS SCRIPT
    this.MAIN_API_URL = "https://script.google.com/macros/s/AKfycbyh_f5b6vcLB3_mSQPke9pLtXYrTYJF4mwJnc88CBNDyjrmSNtSfrmOMv5YRoDb7eBS/exec";
    this.mapboxToken = "pk.eyJ1IjoiYW5nZWxnb256YWxlei0wMiIsImEiOiJjbWRocWE0aWwwNGxvMm1xM2l6NXBteHNvIn0.KPRO-Mr23XK7iIkBXcbZlw";
    
    // 📊 MAPEO CORRECTO DE COLUMNAS (SEGÚN TU APPS SCRIPT)
    this.COLUMNAS = {
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
    
    // 🗺️ BASE DE DATOS DE MUNICIPIOS DE CHIAPAS
    this.MUNICIPIOS_CHIAPAS = {
      'Tuxtla Gutiérrez': [16.7516, -93.1029],
      'Berriozábal': [16.7986, -93.2717],
      'San Fernando': [16.7744, -93.1750],
      'Chiapa de Corzo': [16.7065, -93.0084],
      'Suchiapa': [16.6253, -93.0931],
      'Osumacinta': [17.3500, -92.8833],
      'Ocozocoautla de Espinosa': [16.7583, -93.3750],
      'Jiquipilas': [16.6333, -93.6500],
      'Cintalapa': [16.6833, -94.0000],
      'Tecpatán': [17.2500, -93.5500],
      'Coapilla': [17.1500, -93.1500],
      'Copainalá': [17.1667, -93.2667],
      'Francisco León': [16.9833, -93.4000],
      'Villaflores': [16.2333, -93.2667],
      'Villacorzo': [16.2500, -93.2667],
      'La Concordia': [15.8167, -92.7000],
      'Ángel Albino Corzo': [15.6500, -92.8167],
      'Montecristo de Guerrero': [15.6833, -92.7333],
      'Villa de Acala': [16.5500, -92.8000],
      'San Cristóbal de las Casas': [16.7370, -92.6376],
      'Teopisca': [16.5500, -92.4833],
      'Amatenango del Valle': [16.5333, -92.4333],
      'Aguacatenango': [16.5167, -92.4000],
      'Chanal': [16.6833, -92.3000],
      'Oxchuc': [16.7667, -92.3667],
      'Huixtán': [16.7333, -92.4667],
      'Tenejapa': [16.9333, -92.5000],
      'San Juan Cancuc': [16.9000, -92.4167],
      'Zinacantán': [16.7500, -92.7167],
      'Chamula': [16.7833, -92.6833],
      'Mitontic': [16.6667, -92.5667],
      'Larráinzar': [16.8833, -92.7000],
      'Chenalhó': [16.9500, -92.6667],
      'Pantelhó': [17.0000, -92.4833],
      'Aldama': [16.9167, -92.6833],
      'Santiago el Pinar': [16.8667, -92.6167],
      'Comitán de Domínguez': [16.2500, -92.1333],
      'Las Margaritas': [16.3167, -91.9833],
      'La Trinitaria': [16.1167, -92.0333],
      'Frontera Comalapa': [15.6667, -92.1333],
      'Chicomuselo': [15.7500, -92.2833],
      'Socoltenango': [16.1833, -92.3167],
      'La Independencia': [16.1833, -91.9500],
      'Tzimol': [16.1000, -92.2167],
      'Amatenango de la Frontera': [15.4333, -92.1167],
      'Bejucal de Ocampo': [15.5500, -92.3333],
      'Bella Vista': [15.6333, -92.2500],
      'Mazapa de Madero': [15.4500, -92.1833],
      'Motozintla': [15.3667, -92.2500],
      'Pichucalco': [17.5167, -93.1167],
      'Ostuacán': [17.3833, -93.3500],
      'Reforma': [17.8833, -93.1333],
      'Juárez': [17.5167, -93.2667],
      'Tonalá': [16.0833, -93.7500],
      'Arriaga': [16.2333, -93.9000],
      'Pijijiapan': [15.6833, -93.2167],
      'Mapastepec': [15.4333, -92.9000],
      'Tapachula': [14.9000, -92.2667],
      'Tuxtla Chico': [14.9333, -92.1667],
      'Frontera Hidalgo': [14.6833, -92.1833],
      'Metapa': [14.8333, -92.2000],
      'Huehuetán': [15.0333, -92.4000],
      'Tuzantán': [15.1500, -92.4167],
      'Huixtla': [15.1333, -92.4667],
      'Escuintla': [15.3167, -92.6333],
      'Acacoyagua': [15.3333, -92.6833],
      'Acapetahua': [15.2833, -92.6833],
      'Mazatán': [14.8667, -92.4667],
      'Villa Comaltitlán': [15.2167, -92.6000],
      'Suchiate': [14.7000, -92.1667],
      'Cacahoatán': [15.0333, -92.1667],
      'Unión Juárez': [15.0500, -92.0833],
      'Ocosingo': [16.9000, -92.0833],
      'Altamirano': [16.7333, -92.0333],
      'Maravilla Tenejapa': [16.1333, -91.2500],
      'Palenque': [17.5093, -91.9821],
      'Salto de Agua': [17.5333, -92.3167],
      'Tumbalá': [17.2833, -92.3000],
      'Tila': [17.3167, -92.4333],
      'Sabanilla': [17.2833, -92.5333],
      'Yajalón': [17.1667, -92.3333],
      'Chilón': [17.1000, -92.2000],
      'Sitalá': [17.0333, -92.2667],
      'Benemérito de las Américas': [16.5167, -90.6500],
      'Marqués de Comillas': [16.1333, -90.8667],
      'Catazajá': [17.7333, -92.1333],
      'La Libertad': [17.0667, -92.6500],
      'Bochil': [17.0167, -92.8833],
      'Ixtapa': [17.4333, -92.8667],
      'Jitotol': [17.0667, -92.8500],
      'Rayón': [16.9167, -92.7833],
      'Soyaló': [16.8833, -92.8833],
      'El Bosque': [16.8333, -92.5833],
      'Simojovel': [17.1333, -92.7167],
      'Huitiupán': [17.1833, -92.6500],
      'Amatán': [17.3667, -92.8167],
      'Pueblo Nuevo Solistahuacán': [17.1667, -92.9167],
      'Ixhuatán': [17.3500, -93.1167],
      'Ixtapangajoya': [17.3167, -93.0000],
      'Pantepec': [17.3333, -92.9500],
      'Totolapa': [16.6167, -92.9667],
      'Ixtacomitán': [17.4167, -93.0833]
    };
    
    this.initializeMap();
    this.bindEvents();
  }

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  
  initializeMap() {
    try {
      this.map = L.map('mapaIncidentes').setView([16.75, -93.12], 11);
      
      this.capasBase = {
        osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }),
        hot: L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap HOT',
          maxZoom: 19
        }),
        topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenTopoMap',
          maxZoom: 17
        }),
        traffic: L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/traffic-day-v2/tiles/{z}/{x}/{y}?access_token=${this.mapboxToken}`, {
          tileSize: 512,
          zoomOffset: -1,
          attribution: '© Mapbox',
          maxZoom: 19
        })
      };

      this.capasBase.osm.addTo(this.map);
      this.markersGroup = L.layerGroup().addTo(this.map);
      this.zonasLayer = L.layerGroup();

      console.log("✅ Mapa inicializado");
    } catch (error) {
      console.error("❌ Error al inicializar mapa:", error);
      this.mostrarNotificacion("Error al inicializar el mapa", 'error');
    }
  }

  // ============================================================
  // SISTEMA DE ASIGNACIÓN DE COORDENADAS
  // ============================================================
  
  limpiarNombreMunicipio(municipio) {
    if (!municipio) return null;
    
    let limpio = municipio.toString().trim();
    
    const equivalencias = {
      'Tuxtla Gutierrez': 'Tuxtla Gutiérrez',
      'Tuxtla': 'Tuxtla Gutiérrez',
      'San Cristobal': 'San Cristóbal de las Casas',
      'San Cristóbal': 'San Cristóbal de las Casas',
      'Comitan': 'Comitán de Domínguez',
      'Comitán': 'Comitán de Domínguez',
      'Chiapa': 'Chiapa de Corzo',
      'Ocozocoautla': 'Ocozocoautla de Espinosa',
      'Villa Corzo': 'Villacorzo',
      'Angel Albino Corzo': 'Ángel Albino Corzo'
    };
    
    return equivalencias[limpio] || limpio;
  }
  
  validarCoordenadasExactas(coordStr) {
    if (!coordStr || coordStr.toString().trim() === '') return null;
    
    const cleanCoordStr = coordStr.toString().trim().replace(/["']/g, '');
    
    if (cleanCoordStr === '' || cleanCoordStr.toLowerCase() === 'n/a' || 
        cleanCoordStr.toLowerCase() === 'no aplica' || cleanCoordStr === '0,0' || cleanCoordStr === '0 0') {
      return null;
    }
    
    let parts = [];
    if (cleanCoordStr.includes(',')) parts = cleanCoordStr.split(',');
    else if (cleanCoordStr.includes(' ')) parts = cleanCoordStr.split(/\s+/).filter(p => p !== '');
    else return null;
    
    if (parts.length !== 2) return null;
    
    let lat = parseFloat(parts[0].trim());
    let lng = parseFloat(parts[1].trim());
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    // Detectar coordenadas intercambiadas
    if (lng > 10 && lng < 25 && lat < -80 && lat > -100) {
      [lat, lng] = [lng, lat];
    }
    
    // Rangos muy amplios para Chiapas
    if (lat < 13.0 || lat > 19.0 || lng < -96.0 || lng > -89.0) return null;
    if (lat === 0 && lng === 0) return null;
    
    return { lat, lng };
  }
  
  obtenerCoordenadasParaRegistro(row) {
    // 1️⃣ Intentar coordenadas exactas (COLUMNA 43)
    const coordStr = row[this.COLUMNAS.COORDENADAS];
    const coordsExactas = this.validarCoordenadasExactas(coordStr);
    
    if (coordsExactas) {
      return {
        lat: coordsExactas.lat,
        lng: coordsExactas.lng,
        tipo: 'exactas',
        fuente: 'Coordenadas exactas'
      };
    }
    
    // 2️⃣ Usar centro del municipio
    const municipio = row[this.COLUMNAS.MUNICIPIO];
    const municipioLimpio = this.limpiarNombreMunicipio(municipio);
    
    if (municipioLimpio && this.MUNICIPIOS_CHIAPAS[municipioLimpio]) {
      const coords = this.MUNICIPIOS_CHIAPAS[municipioLimpio];
      return {
        lat: coords[0],
        lng: coords[1],
        tipo: 'municipio',
        fuente: `Centro de ${municipioLimpio}`
      };
    }
    
    // 3️⃣ No se puede mostrar
    return null;
  }
  
  procesarTodosLosDatos(data) {
    console.log(`\n📦 Procesando ${data.length} registros de la base de datos...`);
    
    const stats = {
      total: data.length,
      conCoordenadasExactas: 0,
      conCoordenadasMunicipio: 0,
      sinCoordenadas: 0,
      sinMunicipio: 0
    };
    
    const datosConCoordenadas = [];
    
    data.forEach((row, index) => {
      const coordsInfo = this.obtenerCoordenadasParaRegistro(row);
      
      if (coordsInfo) {
        const rowConCoords = [...row];
        rowConCoords._coordenadas = coordsInfo;
        datosConCoordenadas.push(rowConCoords);
        
        if (coordsInfo.tipo === 'exactas') {
          stats.conCoordenadasExactas++;
        } else {
          stats.conCoordenadasMunicipio++;
        }
      } else {
        const municipio = row[this.COLUMNAS.MUNICIPIO];
        if (!municipio || municipio.toString().trim() === '') {
          stats.sinMunicipio++;
        } else {
          stats.sinCoordenadas++;
        }
      }
    });
    
    console.log('\n📊 ========== RESULTADO DEL PROCESAMIENTO ==========');
    console.log(`Total de registros en BD: ${stats.total}`);
    console.log(`✅ Mostrados en el mapa: ${datosConCoordenadas.length} (${((datosConCoordenadas.length/stats.total)*100).toFixed(1)}%)`);
    console.log(`   📍 Con coordenadas exactas: ${stats.conCoordenadasExactas}`);
    console.log(`   🏛️ Con centro de municipio: ${stats.conCoordenadasMunicipio}`);
    console.log(`❌ No se pueden mostrar: ${stats.sinCoordenadas + stats.sinMunicipio}`);
    console.log(`   Sin municipio: ${stats.sinMunicipio}`);
    console.log(`   Con municipio desconocido: ${stats.sinCoordenadas}`);
    console.log('==================================================\n');
    
    return datosConCoordenadas;
  }

  // ============================================================
  // ICONOS
  // ============================================================
  
  getIconosSiniestros() {
    return {
      'Choque': this.createCustomIcon('#ff4444', 'fas fa-car-crash'),
      'Atropello': this.createCustomIcon('#ff8800', 'fas fa-walking'),
      'Volcadura': this.createCustomIcon('#8844ff', 'fas fa-car-side', 'transform: rotate(90deg);'),
      'Caída': this.createCustomIcon('#44ff44', 'fas fa-motorcycle'),
      'Otro': this.createCustomIcon('#888888', 'fas fa-exclamation')
    };
  }

  createCustomIcon(color, iconClass, extraStyle = '', tipoCoord = 'exactas') {
    const borderStyle = tipoCoord === 'exactas' 
      ? 'border: 2px solid white;' 
      : 'border: 2px dotted white; opacity: 0.9;';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; ${borderStyle} box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><i class="${iconClass}" style="color: white; font-size: 10px; ${extraStyle}"></i></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }

  // ============================================================
  // CARGA DE DATOS
  // ============================================================
  
  async cargarDatosMapaCalor(esActualizacionAutomatica = false) {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      
      if (!esActualizacionAutomatica) {
        console.log('\n🔄 ========== CARGANDO MAPA ==========');
        this.mostrarProgreso('Cargando incidentes...', 'Procesando todos los registros');
      }
      
      const response = await fetch(this.MAIN_API_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const responseData = await response.json();
      
      let data = [];
      if (responseData.datos && Array.isArray(responseData.datos)) {
        data = responseData.datos;
      } else if (Array.isArray(responseData)) {
        data = responseData;
      }
      
      console.log(`📦 Datos recibidos: ${data.length} registros`);
      
      // Procesar TODOS los datos
      this.allIncidentsData = this.procesarTodosLosDatos(data);
      
      this.procesarDatosCargados(esActualizacionAutomatica);
      
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      
      if (!esActualizacionAutomatica) {
        this.mostrarNotificacion('Error al cargar datos. Reintentando...', 'error');
      }
      
      setTimeout(() => this.cargarDatosMapaCalor(esActualizacionAutomatica), 3000);
    } finally {
      this.isLoading = false;
      if (!esActualizacionAutomatica) this.ocultarProgreso();
    }
  }

  procesarDatosCargados(esActualizacionAutomatica = false) {
    const municipioActual = this.currentMunicipioFilter;
    
    this.poblarFiltros();
    this.generarOpcionesPeriodo();
    
    if (municipioActual && esActualizacionAutomatica) {
      const selectMunicipio = document.getElementById('filtroMunicipio');
      if (selectMunicipio) selectMunicipio.value = municipioActual;
    }
    
    if (this.currentTypeFilter !== 'all' || this.currentMunicipioFilter || 
        this.tipoPeriodoFilter !== 'todos' || this.currentFallecidosFilter > 0) {
      this.aplicarFiltros();
    } else {
      this.filteredIncidentsData = [...this.allIncidentsData];
      this.updateMapWithFilteredData();
      this.actualizarEstadisticas();
    }
    
    if (esActualizacionAutomatica) {
      this.mostrarNotificacion(`Mapa actualizado (${this.allIncidentsData.length} incidentes)`, 'info', 2000);
    } else {
      this.mostrarNotificacion(`✅ ${this.allIncidentsData.length} incidentes cargados`, 'success', 4000);
    }
  }

// ============================================================
  // SISTEMA DE PERÍODOS
  // ============================================================
  
  generarOpcionesPeriodo() {
    const periodos = {};
    
    this.allIncidentsData.forEach(row => {
      const fechaStr = row[this.COLUMNAS.FECHA_SINIESTRO];
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
      
      const claveMensual = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      periodos[claveMensual] = periodos[claveMensual] || { tipo: 'mensual', fecha };
      
      const trimestre = Math.floor(fecha.getMonth() / 3) + 1;
      const claveTrimestral = `${fecha.getFullYear()}-T${trimestre}`;
      periodos[claveTrimestral] = periodos[claveTrimestral] || { tipo: 'trimestral', fecha };
    });
    
    this.periodosDisponibles = periodos;
  }

  actualizarSelectorPeriodo() {
    const tipoPeriodo = this.tipoPeriodoFilter;
    const selector = document.getElementById('selectorPeriodo');
    const container = document.getElementById('selectorPeriodoContainer');
    
    if (tipoPeriodo === 'todos') {
      container.style.display = 'none';
      this.periodoSeleccionado = '';
      return;
    }
    
    container.style.display = 'block';
    selector.innerHTML = '<option value="">Todos los períodos</option>';
    
    const periodosOrdenados = Object.keys(this.periodosDisponibles)
      .filter(key => this.periodosDisponibles[key].tipo === tipoPeriodo)
      .sort();
    
    periodosOrdenados.forEach(clave => {
      const option = document.createElement('option');
      option.value = clave;
      
      if (tipoPeriodo === 'mensual') {
        const [año, mes] = clave.split('-');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        option.textContent = `${meses[parseInt(mes) - 1]} ${año}`;
      } else if (tipoPeriodo === 'trimestral') {
        option.textContent = clave.replace('-T', ' - Trimestre ');
      }
      
      selector.appendChild(option);
    });
  }

  // ============================================================
  // ZONAS PELIGROSAS
  // ============================================================
  
  identificarZonasPeligrosas() {
    const clusters = [];
    const radioKm = 0.5;
    const minimoIncidentes = 3;
    const procesados = new Set();
    
    this.filteredIncidentsData.forEach((incident, idx) => {
      if (procesados.has(idx)) return;
      
      const coordsInfo1 = incident._coordenadas;
      if (!coordsInfo1) return;
      
      const cluster = {
        centro: { lat: coordsInfo1.lat, lng: coordsInfo1.lng },
        incidentes: [incident],
        indices: [idx]
      };
      
      this.filteredIncidentsData.forEach((otro, otroIdx) => {
        if (idx === otroIdx || procesados.has(otroIdx)) return;
        
        const coordsInfo2 = otro._coordenadas;
        if (!coordsInfo2) return;
        
        const distancia = this.calcularDistanciaKm(
          { lat: coordsInfo1.lat, lng: coordsInfo1.lng },
          { lat: coordsInfo2.lat, lng: coordsInfo2.lng }
        );
        
        if (distancia <= radioKm) {
          cluster.incidentes.push(otro);
          cluster.indices.push(otroIdx);
          procesados.add(otroIdx);
        }
      });
      
      procesados.add(idx);
      
      if (cluster.incidentes.length >= minimoIncidentes) {
        cluster.peligrosidad = this.calcularNivelPeligrosidad(cluster.incidentes);
        cluster.totalFallecidos = cluster.incidentes.reduce((sum, inc) => 
          sum + parseInt(inc[this.COLUMNAS.TOTAL_FALLECIDOS] || 0), 0
        );
        cluster.municipio = cluster.incidentes[0][this.COLUMNAS.MUNICIPIO] || 'Desconocido';
        cluster.vialidad = cluster.incidentes[0][this.COLUMNAS.TIPO_VIALIDAD] || 'No especificada';
        clusters.push(cluster);
      }
    });
    
    this.zonasPeligrosas = clusters.sort((a, b) => b.incidentes.length - a.incidentes.length);
    return this.zonasPeligrosas;
  }

  calcularDistanciaKm(coords1, coords2) {
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

  calcularNivelPeligrosidad(incidentes) {
    const fallecidos = incidentes.reduce((sum, inc) => 
      sum + parseInt(inc[this.COLUMNAS.TOTAL_FALLECIDOS] || 0), 0
    );
    const score = incidentes.length + (fallecidos * 3);
    
    if (score >= 20) return 'Crítica';
    if (score >= 10) return 'Alta';
    if (score >= 5) return 'Media';
    return 'Baja';
  }

  visualizarZonasPeligrosas() {
    this.zonasLayer.clearLayers();
    
    if (!this.showZonasPeligrosas) return;
    
    const zonas = this.identificarZonasPeligrosas();
    
    zonas.forEach((zona) => {
      const colorConfig = {
        'Crítica': { color: '#8B0000', fillColor: '#FF0000', opacity: 0.3 },
        'Alta': { color: '#DC143C', fillColor: '#FF4444', opacity: 0.25 },
        'Media': { color: '#FF8C00', fillColor: '#FFA500', opacity: 0.2 },
        'Baja': { color: '#FFD700', fillColor: '#FFFF00', opacity: 0.15 }
      };
      
      const config = colorConfig[zona.peligrosidad];
      
      const circle = L.circle([zona.centro.lat, zona.centro.lng], {
        color: config.color,
        fillColor: config.fillColor,
        fillOpacity: config.opacity,
        radius: 500,
        weight: 3
      });
      
      const popupContent = `
        <div style="font-family: Arial, sans-serif; min-width: 200px;">
          <h4 style="color: ${config.color}; margin: 0 0 10px 0;">
            <i class="fas fa-exclamation-triangle"></i> Zona ${zona.peligrosidad}
          </h4>
          <div style="font-size: 13px;">
            <div><strong>Municipio:</strong> ${zona.municipio}</div>
            <div><strong>Vialidad:</strong> ${zona.vialidad}</div>
            <div><strong>Incidentes:</strong> ${zona.incidentes.length}</div>
            <div><strong>Fallecidos:</strong> ${zona.totalFallecidos}</div>
            <div><strong>Radio:</strong> 500m</div>
          </div>
        </div>
      `;
      
      circle.bindPopup(popupContent);
      this.zonasLayer.addLayer(circle);
    });
    
    this.zonasLayer.addTo(this.map);
  }

  toggleZonasPeligrosas() {
    this.showZonasPeligrosas = !this.showZonasPeligrosas;
    const btn = document.querySelector('#zonasText');
    
    if (this.showZonasPeligrosas) {
      this.visualizarZonasPeligrosas();
      if (btn) btn.textContent = 'Ocultar Zonas Peligrosas';
      this.mostrarNotificacion('Zonas peligrosas activadas', 'info', 2000);
    } else {
      this.zonasLayer.clearLayers();
      if (btn) btn.textContent = 'Mostrar Zonas Peligrosas';
      this.mostrarNotificacion('Zonas peligrosas desactivadas', 'info', 2000);
    }
  }

  // ============================================================
  // ACTUALIZACIÓN DEL MAPA
  // ============================================================
  
  updateMapWithFilteredData() {
    if (!this.map) return;
    
    console.log(`🗺️ Actualizando mapa con ${this.filteredIncidentsData.length} incidentes`);
    
    if (this.markersGroup) {
      this.markersGroup.clearLayers();
    }
    
    if (this.heatMapLayer && this.map.hasLayer(this.heatMapLayer)) {
      this.map.removeLayer(this.heatMapLayer);
    }

    const heatPoints = [];
    const iconos = this.getIconosSiniestros();
    
    // Contadores por tipo
    const conteoTipos = {
      exactas: 0,
      municipio: 0
    };
    
    this.filteredIncidentsData.forEach(row => {
      const coordsInfo = row._coordenadas;
      
      if (coordsInfo) {
        conteoTipos[coordsInfo.tipo]++;
        
        const fallecidos = parseInt(row[this.COLUMNAS.TOTAL_FALLECIDOS] || 0);
        const intensidad = coordsInfo.tipo === 'exactas' 
          ? 1 + (fallecidos * 0.5)
          : 0.5 + (fallecidos * 0.2);
        
        heatPoints.push([coordsInfo.lat, coordsInfo.lng, intensidad]);
        
        if (this.showMarkersLayer) {
          const causaSiniestro = row[this.COLUMNAS.CAUSA_SINIESTRO] || 'Otro';
          const iconoBase = iconos[causaSiniestro] || iconos['Otro'];
          
          // Extraer color del icono base
          const colorMatch = iconoBase.options.html.match(/background-color: ([^;]+)/);
          const iconClassMatch = iconoBase.options.html.match(/class="([^"]+)"/);
          const extraStyleMatch = iconoBase.options.html.match(/font-size: 10px;([^"]*)/);
          
          const color = colorMatch ? colorMatch[1] : '#888888';
          const iconClass = iconClassMatch ? iconClassMatch[1] : 'fas fa-exclamation';
          const extraStyle = extraStyleMatch && extraStyleMatch[1] ? extraStyleMatch[1].trim() : '';
          
          const iconoConTipo = this.createCustomIcon(color, iconClass, extraStyle, coordsInfo.tipo);
          
          const marker = L.marker([coordsInfo.lat, coordsInfo.lng], { icon: iconoConTipo });
          const popupContent = this.crearPopupContent(row, coordsInfo);
          
          marker.bindPopup(popupContent, {
            maxWidth: 400,
            className: 'custom-popup'
          });

          this.markersGroup.addLayer(marker);
        }
      }
    });
    
    console.log(`📍 Marcadores por tipo:`);
    console.log(`   Coordenadas exactas: ${conteoTipos.exactas}`);
    console.log(`   Centro municipio: ${conteoTipos.municipio}`);
    
    if (this.showMarkersLayer && this.markersGroup) {
      this.markersGroup.addTo(this.map);
    }

    if (this.showHeatmapLayer && heatPoints.length > 0) {
      this.heatMapLayer = L.heatLayer(heatPoints, {
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
      }).addTo(this.map);
    }
    
    if (this.showZonasPeligrosas) {
      this.visualizarZonasPeligrosas();
    }
    
    this.actualizarEstadisticas();
  }

  // ============================================================
  // FILTROS
  // ============================================================
  
  aplicarFiltros() {
    console.log('\n🔍 ========== APLICANDO FILTROS ==========');
    console.log(`Datos antes de filtrar: ${this.allIncidentsData.length}`);
    
    this.filteredIncidentsData = this.allIncidentsData.filter(row => {
      // Filtro por tipo
      if (this.currentTypeFilter !== 'all') {
        const causa = row[this.COLUMNAS.CAUSA_SINIESTRO] || 'Otro';
        if (causa !== this.currentTypeFilter) return false;
      }
      
      // Filtro por municipio
      if (this.currentMunicipioFilter) {
        const municipio = row[this.COLUMNAS.MUNICIPIO] || '';
        if (municipio !== this.currentMunicipioFilter) return false;
      }
      
      // Filtro por período
      if (this.tipoPeriodoFilter !== 'todos' && this.periodoSeleccionado) {
        const fechaStr = row[this.COLUMNAS.FECHA_SINIESTRO];
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
        if (this.tipoPeriodoFilter === 'mensual') {
          claveRegistro = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        } else if (this.tipoPeriodoFilter === 'trimestral') {
          const trimestre = Math.floor(fecha.getMonth() / 3) + 1;
          claveRegistro = `${fecha.getFullYear()}-T${trimestre}`;
        }
        
        if (claveRegistro !== this.periodoSeleccionado) return false;
      }
      
      // Filtro por fallecidos
      if (this.currentFallecidosFilter > 0) {
        const fallecidos = parseInt(row[this.COLUMNAS.TOTAL_FALLECIDOS] || 0);
        if (fallecidos < this.currentFallecidosFilter) return false;
      }
      
      return true;
    });
    
    console.log(`✅ Datos después de filtrar: ${this.filteredIncidentsData.length}`);
    console.log('========================================\n');
    
    this.updateMapWithFilteredData();
  }

  filterByType(type) {
    console.log(`🔍 Filtrando por tipo: ${type}`);
    this.currentTypeFilter = type;
    
    document.querySelectorAll('.legend-item').forEach(item => {
      item.classList.remove('active');
    });
    
    this.aplicarFiltros();
    
    const targetItem = type === 'all' 
      ? document.querySelector('.legend-all')
      : document.querySelector(`[data-type="${type}"]`);
    
    if (targetItem) {
      targetItem.classList.add('active');
    }
  }

  // ============================================================
  // ESTADÍSTICAS
  // ============================================================
  
  actualizarEstadisticas() {
    const contadores = {
      'Choque': 0,
      'Atropello': 0,
      'Volcadura': 0,
      'Caída': 0,
      'Otro': 0
    };
    
    this.filteredIncidentsData.forEach(row => {
      const causa = row[this.COLUMNAS.CAUSA_SINIESTRO] || 'Otro';
      if (contadores.hasOwnProperty(causa)) {
        contadores[causa]++;
      } else {
        contadores['Otro']++;
      }
    });
    
    Object.entries(contadores).forEach(([tipo, count]) => {
      const countElement = document.getElementById(`count-${tipo}`);
      if (countElement) {
        countElement.textContent = count;
      }
    });
    
    const countAll = document.getElementById('count-all');
    if (countAll) {
      countAll.textContent = this.filteredIncidentsData.length;
    }
  }

  // ============================================================
  // POPUP MEJORADO
  // ============================================================
  
 crearPopupContent(row, coordsInfo) {
  // Limpiar la fecha para quitar T00:00:00.000Z
  let fechaLimpia = 'No especificada';
  if (row[this.COLUMNAS.FECHA_SINIESTRO]) {
    const fechaStr = row[this.COLUMNAS.FECHA_SINIESTRO].toString();
    // Quitar la parte de la hora si existe
    fechaLimpia = fechaStr.split('T')[0];
  }
  
  const datos = {
    fecha: fechaLimpia,
    municipio: row[this.COLUMNAS.MUNICIPIO] || 'No especificado',
    tipoSiniestro: row[this.COLUMNAS.TIPO_SINIESTRO] || 'No especificado',
    causaSiniestro: row[this.COLUMNAS.CAUSA_SINIESTRO] || 'No especificada',
    vialidad: row[this.COLUMNAS.TIPO_VIALIDAD] || 'No especificada',
    direccion: row[this.COLUMNAS.DIRECCION] || 'No especificada',
    usuarios: row[this.COLUMNAS.TOTAL_USUARIOS] || '0',
    heridos: row[this.COLUMNAS.TOTAL_HERIDOS] || '0',
    fallecidos: row[this.COLUMNAS.TOTAL_FALLECIDOS] || '0',
    linkNoticia: row[this.COLUMNAS.LINK_NOTICIA] || '',
    descripcion: row[this.COLUMNAS.DESCRIPCION] || 'Sin descripción'
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };
    
    const tipoCoordInfo = {
      'exactas': { icono: '📍', texto: 'Ubicación exacta', color: '#4caf50' },
      'municipio': { icono: '🏛️', texto: 'Centro del municipio (aproximado)', color: '#ff9800' }
    };
    
    const tipoInfo = tipoCoordInfo[coordsInfo?.tipo] || tipoCoordInfo['exactas'];

    let popupHTML = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 380px;">
        <h4 style="color: #1976d2; margin: 0 0 12px 0; border-bottom: 2px solid #1976d2; padding-bottom: 8px;">
          <i class="fas fa-exclamation-triangle"></i> Resumen del Siniestro
        </h4>
        
        ${coordsInfo ? `
        <div style="background: linear-gradient(135deg, ${tipoInfo.color}22, ${tipoInfo.color}11); 
                    border-left: 3px solid ${tipoInfo.color}; padding: 8px 12px; margin-bottom: 12px; 
                    border-radius: 4px; font-size: 12px;">
          <strong style="color: ${tipoInfo.color};">${tipoInfo.icono} ${tipoInfo.texto}</strong>
          ${coordsInfo.tipo !== 'exactas' ? `
          <div style="color: #666; margin-top: 4px; font-size: 11px;">
            La ubicación mostrada es aproximada
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        <div style="display: grid; gap: 8px; font-size: 13px;">
          <div style="display: flex; align-items: start; gap: 8px;">
            <i class="fas fa-calendar" style="color: #666; min-width: 16px; margin-top: 2px;"></i>
            <div><strong>Fecha:</strong> ${escapeHtml(datos.fecha)}</div>
          </div>
          <div style="display: flex; align-items: start; gap: 8px;">
            <i class="fas fa-map-marker-alt" style="color: #666; min-width: 16px; margin-top: 2px;"></i>
            <div><strong>Municipio:</strong> ${escapeHtml(datos.municipio)}</div>
          </div>
          <div style="display: flex; align-items: start; gap: 8px;">
            <i class="fas fa-car-crash" style="color: #666; min-width: 16px; margin-top: 2px;"></i>
            <div><strong>Tipo:</strong> ${escapeHtml(datos.tipoSiniestro)}</div>
          </div>
          <div style="display: flex; align-items: start; gap: 8px;">
            <i class="fas fa-exclamation-circle" style="color: #666; min-width: 16px; margin-top: 2px;"></i>
            <div><strong>Causa:</strong> ${escapeHtml(datos.causaSiniestro)}</div>
          </div>
          <div style="display: flex; align-items: start; gap: 8px;">
            <i class="fas fa-road" style="color: #666; min-width: 16px; margin-top: 2px;"></i>
            <div><strong>Vialidad:</strong> ${escapeHtml(datos.vialidad)}</div>
          </div>
          ${datos.direccion !== 'No especificada' ? `
          <div style="display: flex; align-items: start; gap: 8px;">
            <i class="fas fa-location-arrow" style="color: #666; min-width: 16px; margin-top: 2px;"></i>
            <div><strong>Dirección:</strong> ${escapeHtml(datos.direccion.substring(0, 60))}${datos.direccion.length > 60 ? '...' : ''}</div>
          </div>
          ` : ''}
        </div>
        
        <div style="margin: 12px 0; padding: 12px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px; border-left: 3px solid #1976d2;">
          <div style="display: flex; justify-content: space-around; font-size: 13px; font-weight: 600;">
            <div style="text-align: center;">
              <i class="fas fa-users" style="color: #2196f3; font-size: 18px;"></i>
              <div style="color: #2196f3; margin-top: 4px;">${escapeHtml(datos.usuarios)}</div>
              <div style="font-size: 11px; color: #666; font-weight: normal;">Usuarios</div>
            </div>
            <div style="text-align: center;">
              <i class="fas fa-ambulance" style="color: #ff9800; font-size: 18px;"></i>
              <div style="color: #ff9800; margin-top: 4px;">${escapeHtml(datos.heridos)}</div>
              <div style="font-size: 11px; color: #666; font-weight: normal;">Heridos</div>
            </div>
            <div style="text-align: center;">
              <i class="fas fa-skull" style="color: #f44336; font-size: 18px;"></i>
              <div style="color: #f44336; margin-top: 4px;">${escapeHtml(datos.fallecidos)}</div>
              <div style="font-size: 11px; color: #666; font-weight: normal;">Fallecidos</div>
            </div>
          </div>
        </div>
        
        ${datos.descripcion !== 'Sin descripción' ? `
        <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 6px; font-size: 12px;">
          <strong style="color: #333;">Descripción:</strong><br>
          <span style="color: #666;">${escapeHtml(datos.descripcion.substring(0, 150))}${datos.descripcion.length > 150 ? '...' : ''}</span>
        </div>
        ` : ''}`;

    if (datos.linkNoticia && datos.linkNoticia.trim() !== '') {
      try {
        new URL(datos.linkNoticia);
        popupHTML += `
          <div style="text-align: center; margin-top: 12px;">
            <a href="${escapeHtml(datos.linkNoticia)}" target="_blank" rel="noopener noreferrer"
               style="display: inline-block; background: linear-gradient(135deg, #1976d2, #1565c0); color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 25px; font-weight: 600;
                      box-shadow: 0 4px 12px rgba(25,118,210,0.3); transition: all 0.3s;">
              <i class="fas fa-external-link-alt"></i> Ver Noticia Completa
            </a>
          </div>`;
      } catch (e) {
        console.warn('URL inválida:', datos.linkNoticia);
      }
    }

    popupHTML += `</div>`;
    return popupHTML;
  }

  // ============================================================
  // CONTROLES
  // ============================================================
  
  toggleHeatmapView() {
    this.showHeatmapLayer = !this.showHeatmapLayer;
    const btn = document.querySelector('#heatmapText');
    
    if (this.showHeatmapLayer) {
      if (this.heatMapLayer && !this.map.hasLayer(this.heatMapLayer)) {
        this.map.addLayer(this.heatMapLayer);
      }
      if (btn) btn.textContent = 'Ocultar Mapa de Calor';
    } else {
      if (this.heatMapLayer && this.map.hasLayer(this.heatMapLayer)) {
        this.map.removeLayer(this.heatMapLayer);
      }
      if (btn) btn.textContent = 'Mostrar Mapa de Calor';
    }
  }

  toggleMarkersView() {
    this.showMarkersLayer = !this.showMarkersLayer;
    const btn = document.querySelector('#markersText');
    
    if (this.showMarkersLayer) {
      if (this.markersGroup && !this.map.hasLayer(this.markersGroup)) {
        this.map.addLayer(this.markersGroup);
      }
      if (btn) btn.textContent = 'Ocultar Marcadores';
    } else {
      if (this.markersGroup && this.map.hasLayer(this.markersGroup)) {
        this.map.removeLayer(this.markersGroup);
      }
      if (btn) btn.textContent = 'Mostrar Marcadores';
    }
    
    this.updateMapWithFilteredData();
  }

  centrarMapa() {
    this.map.setView([16.75, -93.12], 11);
    this.mostrarNotificacion('Mapa centrado en Tuxtla Gutiérrez', 'info', 2000);
  }

  changeMapLayer(layerKey, element) {
    document.querySelectorAll('.layer-option').forEach(option => {
      option.classList.remove('active');
    });
    
    element.classList.add('active');
    
    Object.values(this.capasBase).forEach(capa => {
      if (this.map.hasLayer(capa)) {
        this.map.removeLayer(capa);
      }
    });
    
    if (this.capasBase[layerKey]) {
      this.capasBase[layerKey].addTo(this.map);
      
      const layerNames = {
        osm: 'Comunitario',
        hot: 'Infraestructura',
        topo: 'Topográfico',
        traffic: 'Tráfico'
      };
      
      this.mostrarNotificacion(`Capa: ${layerNames[layerKey]}`, 'info', 2000);
    }
  }

  // ============================================================
  // DESCARGAS
  // ============================================================
  
  mostrarModalDescarga() {
    const modal = document.getElementById('modalDescarga');
    if (modal) modal.style.display = 'flex';
  }

  cerrarModalDescarga() {
    const modal = document.getElementById('modalDescarga');
    if (modal) modal.style.display = 'none';
  }

  async descargarMapa(formato = 'png') {
    const modal = document.getElementById('modalDescarga');
    if (modal) modal.style.display = 'none';

    try {
      switch (formato) {
        case 'png':
          await this.descargarMapaImagen();
          break;
        case 'kml':
          this.descargarMapaKML();
          break;
        case 'csv':
          this.descargarMapaCSV();
          break;
        case 'geojson':
          this.descargarMapaGeoJSON();
          break;
      }
    } catch (error) {
      console.error('Error en descarga:', error);
      this.mostrarNotificacion('Error durante la descarga', 'error');
    }
  }

  async descargarMapaImagen() {
    this.mostrarProgreso('Generando imagen PNG...', 'Esto puede tomar unos segundos');
    
    const controls = document.querySelector('.map-controls');
    const legend = document.querySelector('.legend-panel');
    const layerSelector = document.querySelector('.layer-selector');
    
    const elementsToHide = [controls, legend, layerSelector].filter(el => el);
    elementsToHide.forEach(el => el.style.display = 'none');

    try {
      const canvas = await html2canvas(document.getElementById('mapaIncidentes'), {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      const currentDate = new Date().toISOString().slice(0, 10);
      const filterText = this.currentTypeFilter === 'all' ? 'todos' : this.currentTypeFilter;
      
      link.download = `mapa-siniestros-${filterText}-${currentDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      this.mostrarNotificacion('✅ Imagen PNG descargada', 'success');
    } catch (error) {
      console.error('Error al generar imagen:', error);
      this.mostrarNotificacion('❌ Error al generar imagen', 'error');
    } finally {
      elementsToHide.forEach(el => el.style.display = '');
      this.ocultarProgreso();
    }
  }

  descargarMapaKML() {
    this.mostrarProgreso('Generando KML...');
    
    const currentDate = new Date().toISOString().slice(0, 10);
    const filterText = this.currentTypeFilter === 'all' ? 'todos' : this.currentTypeFilter;
    
    let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Siniestros Viales Chiapas - ${filterText}</name>
    <description>Generado el ${currentDate}</description>`;

    this.filteredIncidentsData.forEach((row, index) => {
      const coordsInfo = row._coordenadas;
      if (coordsInfo) {
        const descripcion = (row[this.COLUMNAS.DESCRIPCION] || 'Sin descripción').replace(/[<>&"']/g, function(m) {
          return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[m];
        });
        
        const vialidad = row[this.COLUMNAS.TIPO_VIALIDAD] || 'No especificada';
        const fecha = row[this.COLUMNAS.FECHA_SINIESTRO] || 'No especificada';
        
        kmlContent += `
    <Placemark>
      <name>Siniestro ${index + 1} - ${row[this.COLUMNAS.MUNICIPIO] || 'Desconocido'}</name>
      <description><![CDATA[
        Fecha: ${fecha}<br/>
        Tipo: ${row[this.COLUMNAS.TIPO_SINIESTRO] || 'No especificado'}<br/>
        Vialidad: ${vialidad}<br/>
        Fallecidos: ${row[this.COLUMNAS.TOTAL_FALLECIDOS] || '0'}<br/>
        ${descripcion}
      ]]></description>
      <Point>
        <coordinates>${coordsInfo.lng},${coordsInfo.lat},0</coordinates>
      </Point>
    </Placemark>`;
      }
    });

    kmlContent += `
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `siniestros-${filterText}-${currentDate}.kml`;
    link.click();
    
    this.ocultarProgreso();
    this.mostrarNotificacion('✅ KML descargado', 'success');
  }

  descargarMapaGeoJSON() {
    this.mostrarProgreso('Generando GeoJSON...');
    
    const currentDate = new Date().toISOString().slice(0, 10);
    const filterText = this.currentTypeFilter === 'all' ? 'todos' : this.currentTypeFilter;
    
    const geoJsonData = {
      type: "FeatureCollection",
      name: `Siniestros Viales Chiapas - ${filterText}`,
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
      },
      features: []
    };

    this.filteredIncidentsData.forEach((row, index) => {
      const coordsInfo = row._coordenadas;
      if (coordsInfo) {
        geoJsonData.features.push({
          type: "Feature",
          properties: {
            id: index + 1,
            fecha: row[this.COLUMNAS.FECHA_SINIESTRO] || '',
            municipio: row[this.COLUMNAS.MUNICIPIO] || '',
            tipo: row[this.COLUMNAS.TIPO_SINIESTRO] || '',
            causa: row[this.COLUMNAS.CAUSA_SINIESTRO] || '',
            vialidad: row[this.COLUMNAS.TIPO_VIALIDAD] || '',
            direccion: row[this.COLUMNAS.DIRECCION] || '',
            usuarios: row[this.COLUMNAS.TOTAL_USUARIOS] || '0',
            heridos: row[this.COLUMNAS.TOTAL_HERIDOS] || '0',
            fallecidos: row[this.COLUMNAS.TOTAL_FALLECIDOS] || '0',
            tipo_coordenadas: coordsInfo.tipo
          },
          geometry: {
            type: "Point",
            coordinates: [coordsInfo.lng, coordsInfo.lat]
          }
        });
      }
    });

    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `siniestros-${filterText}-${currentDate}.geojson`;
    link.click();
    
    this.ocultarProgreso();
    this.mostrarNotificacion('✅ GeoJSON descargado', 'success');
  }

  descargarMapaCSV() {
    this.mostrarProgreso('Generando CSV...');
    
    const currentDate = new Date().toISOString().slice(0, 10);
    const filterText = this.currentTypeFilter === 'all' ? 'todos' : this.currentTypeFilter;
    
    const headers = [
      'ID', 'Fecha', 'Municipio', 'Tipo', 'Causa', 
      'Vialidad', 'Dirección', 'Usuarios', 'Heridos', 'Fallecidos', 
      'Latitud', 'Longitud', 'Tipo_Coordenadas'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    this.filteredIncidentsData.forEach((row, index) => {
      const coordsInfo = row._coordenadas;
      if (coordsInfo) {
        const escapeCSV = (value) => {
          if (!value) return '';
          const str = String(value).replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        };
        
        const csvRow = [
          index + 1,
          escapeCSV(row[this.COLUMNAS.FECHA_SINIESTRO] || ''),
          escapeCSV(row[this.COLUMNAS.MUNICIPIO] || ''),
          escapeCSV(row[this.COLUMNAS.TIPO_SINIESTRO] || ''),
          escapeCSV(row[this.COLUMNAS.CAUSA_SINIESTRO] || ''),
          escapeCSV(row[this.COLUMNAS.TIPO_VIALIDAD] || ''),
          escapeCSV(row[this.COLUMNAS.DIRECCION] || ''),
          escapeCSV(row[this.COLUMNAS.TOTAL_USUARIOS] || '0'),
          escapeCSV(row[this.COLUMNAS.TOTAL_HERIDOS] || '0'),
          escapeCSV(row[this.COLUMNAS.TOTAL_FALLECIDOS] || '0'),
          coordsInfo.lat.toFixed(6),
          coordsInfo.lng.toFixed(6),
          coordsInfo.tipo
        ];
        
        csvContent += csvRow.join(',') + '\n';
      }
    });
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `siniestros-${filterText}-${currentDate}.csv`;
    link.click();
    
    this.ocultarProgreso();
    this.mostrarNotificacion('✅ CSV descargado', 'success');
  }

  // ============================================================
  // NOTIFICACIONES Y PROGRESO
  // ============================================================
  
  mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
    const existingNotifications = document.querySelectorAll('.notification');
    if (existingNotifications.length >= 3) {
      existingNotifications[0].remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    
    const iconos = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2em;">${iconos[tipo]}</span>
        <span>${mensaje}</span>
      </div>
      <button class="close-btn" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }
    }, duracion);
  }

  mostrarProgreso(texto = 'Procesando...', subtexto = '') {
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

  ocultarProgreso() {
    const progressDiv = document.getElementById('progressIndicator');
    if (progressDiv) {
      progressDiv.classList.remove('show');
    }
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  
  poblarFiltros() {
    const municipios = [...new Set(this.allIncidentsData.map(row => row[this.COLUMNAS.MUNICIPIO]).filter(m => m))].sort();
    const selectMunicipio = document.getElementById('filtroMunicipio');
    
    if (selectMunicipio) {
      const valorActual = selectMunicipio.value;
      selectMunicipio.innerHTML = '<option value="">Todos los municipios</option>';
      
      municipios.forEach(municipio => {
        const option = document.createElement('option');
        option.value = municipio;
        
        const count = this.allIncidentsData.filter(row => row[this.COLUMNAS.MUNICIPIO] === municipio).length;
        option.textContent = `${municipio} (${count})`;
        
        selectMunicipio.appendChild(option);
      });
      
      if (valorActual && municipios.includes(valorActual)) {
        selectMunicipio.value = valorActual;
      }
    }
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
          if (modal.style.display === 'flex') {
            modal.style.display = 'none';
          }
        });
      }
      
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.mostrarModalDescarga();
      }
    });

    // Actualización automática cada 5 minutos
    setInterval(() => {
      console.log("🔄 Actualización automática...");
      this.cargarDatosMapaCalor(true);
    }, 5 * 60 * 1000);
  }
}

// ============================================================
// FUNCIONES GLOBALES
// ============================================================

let mapaInstance;

window.toggleLegend = function() {
  const content = document.getElementById('legendContent');
  const icon = document.getElementById('legendToggleIcon');
  const panel = document.querySelector('.legend-panel');
  
  if (content.classList.contains('collapsed')) {
    content.classList.remove('collapsed');
    panel.classList.remove('collapsed');
    icon.className = 'fas fa-chevron-up';
  } else {
    content.classList.add('collapsed');
    panel.classList.add('collapsed');
    icon.className = 'fas fa-chevron-down';
  }
};

window.toggleLayerSelector = function() {
  const content = document.getElementById('layerContent');
  const icon = document.getElementById('layerToggleIcon');
  const selector = document.getElementById('layerSelector');
  
  if (content.classList.contains('collapsed')) {
    content.classList.remove('collapsed');
    selector.classList.remove('collapsed');
    icon.className = 'fas fa-chevron-up';
  } else {
    content.classList.add('collapsed');
    selector.classList.add('collapsed');
    icon.className = 'fas fa-chevron-down';
  }
};

window.filterByType = function(type) {
  if (mapaInstance) mapaInstance.filterByType(type);
};

window.changeMapLayer = function(layerKey, element) {
  if (mapaInstance) mapaInstance.changeMapLayer(layerKey, element);
};

window.toggleHeatmapView = function() {
  if (mapaInstance) mapaInstance.toggleHeatmapView();
};

window.toggleMarkersView = function() {
  if (mapaInstance) mapaInstance.toggleMarkersView();
};

window.toggleZonasPeligrosas = function() {
  if (mapaInstance) mapaInstance.toggleZonasPeligrosas();
};

window.centrarMapa = function() {
  if (mapaInstance) mapaInstance.centrarMapa();
};

window.mostrarModalDescarga = function() {
  if (mapaInstance) mapaInstance.mostrarModalDescarga();
};

window.cerrarModalDescarga = function() {
  if (mapaInstance) mapaInstance.cerrarModalDescarga();
};

window.descargarMapa = function(formato) {
  if (mapaInstance) mapaInstance.descargarMapa(formato);
};

window.cambiarTipoPeriodo = function() {
  if (!mapaInstance) return;
  
  const tipoPeriodo = document.getElementById('tipoPeriodo')?.value || 'todos';
  mapaInstance.tipoPeriodoFilter = tipoPeriodo;
  
  if (tipoPeriodo === 'todos') {
    mapaInstance.periodoSeleccionado = '';
    mapaInstance.aplicarFiltros();
  } else {
    mapaInstance.actualizarSelectorPeriodo();
  }
};

window.aplicarFiltrosAvanzados = function() {
  if (!mapaInstance) return;
  
  mapaInstance.currentMunicipioFilter = document.getElementById('filtroMunicipio')?.value || '';
  mapaInstance.currentFallecidosFilter = parseInt(document.getElementById('minFallecidos')?.value || 0);
  mapaInstance.periodoSeleccionado = document.getElementById('selectorPeriodo')?.value || '';
  
  mapaInstance.aplicarFiltros();
};

window.limpiarFiltrosAvanzados = function() {
  if (!mapaInstance) return;
  
  const tipoPeriodoEl = document.getElementById('tipoPeriodo');
  const filtroMunicipioEl = document.getElementById('filtroMunicipio');
  const minFallecidosEl = document.getElementById('minFallecidos');
  const selectorPeriodoContainer = document.getElementById('selectorPeriodoContainer');
  
  if (tipoPeriodoEl) tipoPeriodoEl.value = 'todos';
  if (filtroMunicipioEl) filtroMunicipioEl.value = '';
  if (minFallecidosEl) minFallecidosEl.value = '0';
  if (selectorPeriodoContainer) selectorPeriodoContainer.style.display = 'none';
  
  mapaInstance.tipoPeriodoFilter = 'todos';
  mapaInstance.periodoSeleccionado = '';
  mapaInstance.currentMunicipioFilter = '';
  mapaInstance.currentFallecidosFilter = 0;
  mapaInstance.currentTypeFilter = 'all';
  
  document.querySelectorAll('.legend-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const legendAll = document.querySelector('.legend-all');
  if (legendAll) legendAll.classList.add('active');
  
  mapaInstance.aplicarFiltros();
  mapaInstance.mostrarNotificacion('✅ Filtros eliminados', 'info', 2000);
};

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  console.log('\n🚀 ========== INICIANDO MAPA ==========');
  console.log('📅 Fecha:', new Date().toLocaleString());
  console.log('🎯 Sistema configurado para mostrar TODAS las noticias');
  console.log('📍 Usando columna 43 para coordenadas (CORRECTO)');
  
  try {
    mapaInstance = new MapaIncidentes();
    mapaInstance.cargarDatosMapaCalor(false);
    
    const modalDescarga = document.getElementById('modalDescarga');
    if (modalDescarga) {
      modalDescarga.addEventListener('click', function(e) {
        if (e.target === this) {
          this.style.display = 'none';
        }
      });
    }
    
    setTimeout(() => {
      mapaInstance.mostrarNotificacion('✅ Sistema cargado - Mostrando todas las noticias', 'success', 4000);
    }, 1500);
    
    console.log('✅ Sistema inicializado correctamente');
    console.log('============================================\n');
    
  } catch (error) {
    console.error('❌ Error crítico:', error);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification error';
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.5em;">❌</span>
        <span>Error al inicializar. Por favor, recarga la página.</span>
      </div>
      <button class="close-btn" onclick="location.reload()">&times;</button>
    `;
    document.body.appendChild(errorDiv);
  }
});

console.log('✅ mapa.js cargado completamente');
console.log('🎯 Columna de coordenadas: 43 (CORRECTO)');
console.log('📊 Sistema listo para mostrar el 100% de las noticias');
