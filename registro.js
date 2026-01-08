/* ============================================================
   REGISTRO.JS - SISTEMA PROFESIONAL CON DETECCIÓN DE DUPLICADOS
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  
  /* ============================================================
     VARIABLES GLOBALES
     ============================================================ */
  let fotografiasCloudinary = [];
  let cloudinaryWidget = null;
  let datosFormularioTemp = null;  // ← CRÍTICO: Guarda datos para envío forzado
  let marker = null;
  
  const REGISTRO_API_URL = "https://script.google.com/macros/s/AKfycbyh_f5b6vcLB3_mSQPke9pLtXYrTYJF4mwJnc88CBNDyjrmSNtSfrmOMv5YRoDb7eBS/exec";

  const CLOUDINARY_CONFIG = {
    cloudName: 'DS04HXGCP',
    uploadPreset: 'siniestros_viales',
    folder: 'siniestros-viales',
    maxFiles: 2,
    maxFileSize: 10000000,
    sources: ['local', 'camera'],
    multiple: true,
    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp']
  };

  /* ============================================================
     FUNCIONES DE UTILIDAD
     ============================================================ */
  
  function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${mensaje}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, duracion);
  }

  function mostrarProgreso(texto, subtexto = '') {
    ocultarProgreso();
    
    const progressDiv = document.createElement('div');
    progressDiv.id = 'progressIndicator';
    progressDiv.innerHTML = `
      <div class="progress-backdrop">
        <div class="progress-modal">
          <div class="progress-spinner"></div>
          <div class="progress-text">${texto}</div>
          ${subtexto ? `<div class="progress-subtext">${subtexto}</div>` : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(progressDiv);
    
    setTimeout(() => {
      progressDiv.classList.add('show');
    }, 10);
  }

  function ocultarProgreso() {
    const progressDiv = document.getElementById('progressIndicator');
    if (progressDiv) {
      progressDiv.remove();
    }
  }

  /* ============================================================
     CONFIGURACIÓN DEL MAPA
     ============================================================ */
  const map = L.map('mapa').setView([16.75, -93.12], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  map.on('click', async function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);

    const campoCoordenadas = document.getElementById('coordenadas');
    if (campoCoordenadas) campoCoordenadas.value = `${lat}, ${lng}`;

    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }

    try {
      mostrarProgreso('Obteniendo dirección...', 'Por favor espera');
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      const addressInput = document.getElementById('direccion');
      if (addressInput) {
        addressInput.value = data.display_name || '';
      }
      ocultarProgreso();
    } catch (err) {
      console.warn("No se pudo obtener la dirección:", err);
      ocultarProgreso();
      mostrarNotificacion('No se pudo obtener la dirección', 'warning');
    }
  });

  /* ============================================================
     CLOUDINARY
     ============================================================ */
  
  function inicializarCloudinary() {
    if (!window.cloudinary) {
      console.error("Cloudinary no está cargado");
      mostrarNotificacion('Error: Cloudinary no disponible', 'error');
      return;
    }
    
    cloudinaryWidget = cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        sources: CLOUDINARY_CONFIG.sources,
        maxFiles: CLOUDINARY_CONFIG.maxFiles,
        maxFileSize: CLOUDINARY_CONFIG.maxFileSize,
        folder: `${CLOUDINARY_CONFIG.folder}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        clientAllowedFormats: CLOUDINARY_CONFIG.clientAllowedFormats,
        multiple: true,
        theme: 'white',
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#1976d2",
            tabIcon: "#1976d2",
            menuIcons: "#1976d2",
            textDark: "#333333",
            textLight: "#FFFFFF",
            link: "#1976d2",
            action: "#1976d2",
            inactiveTabIcon: "#999999",
            error: "#F44336",
            inProgress: "#1976d2",
            complete: "#4CAF50",
            sourceBg: "#F5F5F5"
          }
        }
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          console.log("Imagen subida a Cloudinary:", result.info);
          procesarImagenCloudinary(result.info);
        }
        
        if (error) {
          console.error("Error en Cloudinary:", error);
          mostrarNotificacion('Error al subir imagen: ' + error.message, 'error');
        }
      }
    );
    
    console.log("Widget de Cloudinary inicializado");
  }

  function procesarImagenCloudinary(info) {
    if (fotografiasCloudinary.length >= 2) {
      mostrarNotificacion('Máximo 2 fotografías permitidas', 'error');
      return;
    }
    
    const fotoCloudinary = {
      public_id: info.public_id,
      secure_url: info.secure_url,
      url: info.url,
      format: info.format,
      bytes: info.bytes,
      width: info.width,
      height: info.height,
      original_filename: info.original_filename,
      created_at: info.created_at,
      folder: info.folder,
      name: info.original_filename,
      preview: info.secure_url,
      size: info.bytes,
      type: `image/${info.format}`
    };
    
    fotografiasCloudinary.push(fotoCloudinary);
    
    console.log(`Foto ${fotografiasCloudinary.length}/2 agregada a Cloudinary`);
    mostrarNotificacion(`Imagen "${info.original_filename}" subida correctamente`, 'success');
    
    mostrarVistaPrevia();
    actualizarContadorFotos();
  }

  function mostrarVistaPrevia() {
    const filePreview = document.getElementById('filePreview');
    if (!filePreview) return;
    filePreview.innerHTML = '';
    
    fotografiasCloudinary.forEach((foto, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'file-preview-item';
      
      const previewUrl = foto.secure_url ? 
        `${foto.secure_url.replace('/upload/', '/upload/w_200,h_150,c_fill,q_auto,f_auto/')}` : 
        foto.preview;
      
      const tamaño = foto.bytes ? 
        (foto.bytes / 1024 / 1024).toFixed(2) : 
        (foto.size / 1024 / 1024).toFixed(2);
      
      previewItem.innerHTML = `
        <img src="${previewUrl}" alt="${foto.name}" loading="lazy">
        <div class="file-preview-info">
          <div class="file-preview-name">${foto.name}</div>
          <div class="file-preview-size">${tamaño} MB</div>
          <div class="cloudinary-badge">☁️ Cloudinary</div>
        </div>
        <button type="button" class="file-remove" onclick="eliminarFoto(${index})">
          <i class="fas fa-times"></i>
        </button>
      `;
      filePreview.appendChild(previewItem);
    });
  }

  function actualizarContadorFotos() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    if (!fileUploadArea) return;
    
    let contador = fileUploadArea.querySelector('.foto-contador');
    if (!contador) {
      contador = document.createElement('div');
      contador.className = 'foto-contador';
      fileUploadArea.appendChild(contador);
    }
    
    contador.innerHTML = `${fotografiasCloudinary.length}/2 fotos`;
    
    if (fotografiasCloudinary.length >= 2) {
      fileUploadArea.style.opacity = '0.7';
      fileUploadArea.style.pointerEvents = 'none';
      
      let mensaje = fileUploadArea.querySelector('.limite-mensaje');
      if (!mensaje) {
        mensaje = document.createElement('div');
        mensaje.className = 'limite-mensaje';
        mensaje.textContent = 'Límite alcanzado';
        fileUploadArea.appendChild(mensaje);
      }
    } else {
      fileUploadArea.style.opacity = '1';
      fileUploadArea.style.pointerEvents = 'auto';
      
      const mensaje = fileUploadArea.querySelector('.limite-mensaje');
      if (mensaje) mensaje.remove();
    }
  }

  window.eliminarFoto = function(index) {
    console.log(`Eliminando foto ${index}`);
    fotografiasCloudinary.splice(index, 1);
    mostrarVistaPrevia();
    actualizarContadorFotos();
    mostrarNotificacion(`Imagen eliminada`, 'info');
  };

  const fileUploadArea = document.getElementById('fileUploadArea');
  if (fileUploadArea) {
    fileUploadArea.addEventListener('click', function() {
      if (fotografiasCloudinary.length >= 2) {
        mostrarNotificacion('Máximo 2 fotografías permitidas', 'error');
        return;
      }
      
      if (!cloudinaryWidget) {
        mostrarNotificacion('Inicializando Cloudinary...', 'info');
        inicializarCloudinary();
        setTimeout(() => {
          if (cloudinaryWidget) {
            cloudinaryWidget.open();
          }
        }, 1000);
      } else {
        cloudinaryWidget.open();
      }
    });
  }

  /* ============================================================
     FUNCIONES AUXILIARES DEL FORMULARIO
     ============================================================ */

  window.mostrarOtraDependencia = function() {
    const seleccion = document.getElementById("dependenciaSelect")?.value || '';
    const otraDiv = document.getElementById("otraDependenciaDiv");
    if (otraDiv) {
      otraDiv.style.display = seleccion === "Otra" ? "block" : "none";
    }
  };

  window.mostrarLink = function() {
    const fuente = document.getElementById("fuenteNoticia")?.value || '';
    const campoLink = document.getElementById("linkNoticia");
    if (campoLink) {
      campoLink.style.display = fuente === "Noticia" ? "block" : "none";
    }
  };

  /* ============================================================
     LÓGICA DE TRANSPORTE PÚBLICO
     ============================================================ */

  document.querySelectorAll('#usuario1, #usuario2').forEach(select => {
    select.addEventListener('change', verificarTransportePublico);
  });

  function verificarTransportePublico() {
    const usuario1 = document.getElementById('usuario1')?.value || '';
    const usuario2 = document.getElementById('usuario2')?.value || '';
    
    const esTransportePublico = 
      usuario1 === "Chofer de transporte público" || 
      usuario2 === "Chofer de transporte público";
    
    const transporteDiv = document.getElementById('transportePublicoDiv');
    
    if (transporteDiv) {
      if (esTransportePublico) {
        transporteDiv.style.display = 'block';
      } else {
        transporteDiv.style.display = 'none';
        limpiarCamposTransporte();
      }
    }
  }

  window.mostrarCamposTransporte = function() {
    const tipoSeleccionado = document.querySelector('input[name="tipoTransportePublico"]:checked')?.value;
    
    document.getElementById('camposColectivo').style.display = 'none';
    document.getElementById('camposTaxi').style.display = 'none';
    document.getElementById('camposMototaxi').style.display = 'none';
    
    if (tipoSeleccionado === 'colectivo') {
      document.getElementById('camposColectivo').style.display = 'block';
    } else if (tipoSeleccionado === 'taxi') {
      document.getElementById('camposTaxi').style.display = 'block';
    } else if (tipoSeleccionado === 'mototaxi') {
      document.getElementById('camposMototaxi').style.display = 'block';
    }
  };

  window.mostrarCampoSitioTaxi = function() {
    const tipoTaxi = document.getElementById('taxiTipo')?.value;
    const grupoSitio = document.getElementById('grupoSitioTaxi');
    
    if (grupoSitio) {
      if (tipoTaxi === 'Taxi de base') {
        grupoSitio.style.display = 'block';
      } else {
        grupoSitio.style.display = 'none';
        const taxiSitio = document.getElementById('taxiSitio');
        if (taxiSitio) taxiSitio.value = '';
      }
    }
  };

  window.mostrarCampoOtroSitio = function() {
    const sitioSelect = document.getElementById('taxiSitio');
    const campoOtroSitio = document.getElementById('campoOtroSitio');
    const inputOtroSitio = document.getElementById('taxiOtroSitio');
    
    if (sitioSelect && sitioSelect.value === 'Otro sitio') {
      campoOtroSitio.style.display = 'block';
    } else {
      campoOtroSitio.style.display = 'none';
      if (inputOtroSitio) inputOtroSitio.value = '';
    }
  };

  window.mostrarCampoOtroColor = function() {
    const colorSelect = document.getElementById('taxiColor');
    const campoOtroColor = document.getElementById('campoOtroColor');
    const inputOtroColor = document.getElementById('taxiOtroColor');
    
    if (colorSelect && colorSelect.value === 'Otro color') {
      campoOtroColor.style.display = 'block';
    } else {
      campoOtroColor.style.display = 'none';
      if (inputOtroColor) inputOtroColor.value = '';
    }
  };

  window.mostrarCampoNumeroPasajeros = function() {
    const pasajerosSelect = document.getElementById('taxiPasajeros');
    const grupoNumeroPasajeros = document.getElementById('grupoNumeroPasajeros');
    const selectNumeroPasajeros = document.getElementById('taxiNumeroPasajeros');
    
    if (pasajerosSelect && pasajerosSelect.value === 'Sí') {
      grupoNumeroPasajeros.style.display = 'block';
    } else {
      grupoNumeroPasajeros.style.display = 'none';
      if (selectNumeroPasajeros) selectNumeroPasajeros.value = '';
    }
  };

  window.mostrarCampoNumeroPasajerosMototaxi = function() {
    const pasajerosSelect = document.getElementById('mototaxiPasajeros');
    const grupoNumeroPasajeros = document.getElementById('grupoNumeroPasajerosMototaxi');
    const selectNumeroPasajeros = document.getElementById('mototaxiNumeroPasajeros');
    
    if (pasajerosSelect && pasajerosSelect.value === 'Sí') {
      grupoNumeroPasajeros.style.display = 'block';
    } else {
      grupoNumeroPasajeros.style.display = 'none';
      if (selectNumeroPasajeros) selectNumeroPasajeros.value = '';
    }
  };

  function limpiarCamposTransporte() {
    document.querySelectorAll('input[name="tipoTransportePublico"]').forEach(radio => {
      radio.checked = false;
    });
    
    document.querySelectorAll('.transport-fields input, .transport-fields select').forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false;
      } else {
        el.value = '';
      }
    });
    
    document.getElementById('camposColectivo').style.display = 'none';
    document.getElementById('camposTaxi').style.display = 'none';
    document.getElementById('camposMototaxi').style.display = 'none';
    document.getElementById('grupoSitioTaxi').style.display = 'none';
    document.getElementById('campoOtroSitio').style.display = 'none';
    document.getElementById('campoOtroColor').style.display = 'none';
    document.getElementById('grupoNumeroPasajeros').style.display = 'none';
    document.getElementById('grupoNumeroPasajerosMototaxi').style.display = 'none';
  }

  /* ============================================================
     ENVÍO DEL FORMULARIO CON DETECCIÓN DE DUPLICADOS
     ============================================================ */

  async function enviarFormularioCompleto(datos) {
    const mensaje = document.getElementById("respuesta");
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      submitBtn.disabled = true;
    }
    
    const esForzado = datos.get('forzar_insercion') === 'true';
    mostrarProgreso(esForzado ? '🔒 Enviando registro forzado...' : '📤 Enviando registro...', 'Procesando datos');
    
    try {
      console.log("📤 Enviando a:", REGISTRO_API_URL);
      console.log("📸 Fotos:", fotografiasCloudinary.length);
      console.log("🔒 Forzado:", esForzado);
      
      // Agregar URLs de Cloudinary
      fotografiasCloudinary.forEach((foto, index) => {
        datos.append(`cloudinary_url_${index}`, foto.secure_url);
        datos.append(`cloudinary_public_id_${index}`, foto.public_id);
        datos.append(`cloudinary_filename_${index}`, foto.original_filename);
        datos.append(`cloudinary_size_${index}`, foto.bytes.toString());
        datos.append(`cloudinary_format_${index}`, foto.format);
        datos.append(`cloudinary_width_${index}`, foto.width.toString());
        datos.append(`cloudinary_height_${index}`, foto.height.toString());
      });
      
      datos.append('numeroFotografias', fotografiasCloudinary.length.toString());
      datos.append('origen_fotos', 'cloudinary');
      
      const response = await fetch(REGISTRO_API_URL, {
        method: "POST",
        body: datos
      });
      
      console.log("📡 Status:", response.status);
      
      const responseText = await response.text();
      console.log("📄 Respuesta:", responseText.substring(0, 200));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parseando JSON:", parseError);
        throw new Error("Respuesta inválida del servidor");
      }
      
      ocultarProgreso();
      
      // ⚠️ DETECCIÓN DE DUPLICADO
      if (responseData.status === 'duplicado' && !esForzado) {
        console.log("⚠️ DUPLICADO DETECTADO:", responseData.similitud + '%');
        
        // GUARDAR DATOS GLOBALMENTE
        datosFormularioTemp = datos;
        
        // MOSTRAR MODAL
        mostrarModalDuplicados(responseData);
        
        // Restaurar botón
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
        return;
      }
      
      // ✅ ÉXITO
      if (responseData.status === 'exito' || response.ok) {
        console.log("✅ Envío exitoso");
        
        if (mensaje) {
          mensaje.innerHTML = `
            <div class="mensaje-exito">
              <i class="fas fa-check-circle"></i>
              <div>
                <strong>✅ Registro enviado correctamente</strong>
                <p>📸 Fotografías: ${fotografiasCloudinary.length}/2</p>
                ${esForzado ? '<p><small>⚠️ Marcado como duplicado forzado</small></p>' : ''}
              </div>
            </div>
          `;
        }
        
        mostrarNotificacion(
          esForzado ? '✅ Registro forzado enviado' : '✅ Registro enviado correctamente', 
          'success', 
          5000
        );
        
        setTimeout(() => {
          limpiarFormularioCompleto();
        }, 2000);
        
      } else {
        throw new Error(responseData.mensaje || 'Error desconocido');
      }
      
    } catch (error) {
      console.error("❌ Error:", error);
      ocultarProgreso();
      
      if (mensaje) {
        mensaje.innerHTML = `
          <div class="mensaje-error">
            <i class="fas fa-exclamation-circle"></i>
            <div>
              <strong>❌ Error al enviar</strong>
              <p>${error.message}</p>
            </div>
          </div>
        `;
      }
      mostrarNotificacion('❌ Error: ' + error.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }
  }

  /* ============================================================
     MODAL DE DUPLICADOS - PROFESIONAL
     ============================================================ */

  function mostrarModalDuplicados(respuesta) {
    console.log("⚠️ Mostrando modal de duplicados");
    
    const modal = document.getElementById('modalDuplicados');
    if (!modal) {
      console.error("❌ Modal no encontrado en el HTML");
      return;
    }
    
    const similitud = respuesta.similitud || 0;
    const nivelAlerta = respuesta.nivelAlerta || 'medio';
    const registroExistente = respuesta.registroExistente || [];
    
    // Actualizar porcentaje de similitud
    actualizarPorcentajeSimilitud(similitud, nivelAlerta);
    
    // Actualizar colores según nivel de alerta
    actualizarColoresModal(nivelAlerta, similitud);
    
    // Llenar comparación de registros
    llenarComparacionRegistros(datosFormularioTemp, registroExistente);
    
    // Mostrar modal con animación
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    
    setTimeout(() => {
      modal.style.opacity = '1';
      const content = modal.querySelector('.modal-content');
      if (content) {
        content.style.transform = 'scale(1)';
        content.style.opacity = '1';
      }
    }, 10);
  }

  function actualizarPorcentajeSimilitud(similitud, nivelAlerta) {
    const scoreText = document.getElementById('scoreText');
    const scoreFill = document.querySelector('.score-fill');
    const scoreCircle = document.querySelector('.score-circle');
    
    if (scoreText) {
      // Animación del número
      let current = 0;
      const increment = similitud / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= similitud) {
          current = similitud;
          clearInterval(timer);
        }
        scoreText.textContent = Math.round(current) + '%';
      }, 20);
    }
    
    if (scoreFill) {
      const circumference = 2 * Math.PI * 45;
      const offset = circumference - (similitud / 100) * circumference;
      scoreFill.style.strokeDasharray = `${circumference} ${circumference}`;
      scoreFill.style.strokeDashoffset = circumference;
      
      setTimeout(() => {
        scoreFill.style.strokeDashoffset = offset;
      }, 100);
      
      // Color según nivel
      const colores = {
        'critico': '#dc3545',
        'alto': '#ff6b6b',
        'medio': '#ffc107'
      };
      scoreFill.style.stroke = colores[nivelAlerta] || '#ffc107';
    }
    
    // Agregar clase al círculo
    if (scoreCircle) {
      scoreCircle.className = 'score-circle ' + nivelAlerta;
    }
  }

  function actualizarColoresModal(nivelAlerta, similitud) {
    const modalHeader = document.querySelector('.modal-header');
    const scoreDetails = document.querySelector('.score-details');
    
    const configuraciones = {
      'critico': {
        gradiente: 'linear-gradient(135deg, #dc3545, #c82333)',
        titulo: '🚨 Duplicado Crítico Detectado',
        subtitulo: 'Este registro es muy similar a uno existente'
      },
      'alto': {
        gradiente: 'linear-gradient(135deg, #ff6b6b, #ff8c42)',
        titulo: '⚠️ Posible Duplicado',
        subtitulo: 'Se encontró un registro con alta similitud'
      },
      'medio': {
        gradiente: 'linear-gradient(135deg, #feca57, #ff9ff3)',
        titulo: '⚡ Registro Similar Encontrado',
        subtitulo: 'Verifica que no sea el mismo incidente'
      }
    };
    
    const config = configuraciones[nivelAlerta] || configuraciones['medio'];
    
    if (modalHeader) {
      modalHeader.style.background = config.gradiente;
      const titulo = modalHeader.querySelector('h2');
      const subtitulo = modalHeader.querySelector('.subtitle');
      if (titulo) titulo.textContent = config.titulo;
      if (subtitulo) subtitulo.textContent = config.subtitulo;
    }
    
    if (scoreDetails) {
      scoreDetails.style.background = config.gradiente;
    }
    
    // Actualizar botones según criticidad
    const btnContinuar = document.querySelector('.modal-btn-continue');
    if (btnContinuar && similitud >= 90) {
      btnContinuar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Forzar Envío (¡Precaución!)';
      btnContinuar.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
    }
  }

  function llenarComparacionRegistros(datosNuevos, registroExistente) {
    const nuevoDiv = document.getElementById('nuevoRegistro');
    const existenteDiv = document.getElementById('registroExistente');
    
    if (!nuevoDiv || !existenteDiv) return;
    
    const campos = [
      { key: 'Municipio', label: 'Municipio', icon: 'fa-city', index: 0 },
      { key: 'Fecha_del_siniestro', label: 'Fecha', icon: 'fa-calendar', index: 1 },
      { key: 'Tipo_de_siniestro', label: 'Tipo', icon: 'fa-car-crash', index: 7 },
      { key: 'Causa_del_siniestro', label: 'Causa', icon: 'fa-search', index: 8 },
      { key: 'Total_de_fallecidos', label: 'Fallecidos', icon: 'fa-skull', index: 39 },
      { key: 'Coordenadas_Geograficas', label: 'Coordenadas', icon: 'fa-map-marker-alt', index: 43 },
      { key: 'Direccion', label: 'Dirección', icon: 'fa-map-pin', index: 42 }
    ];
    
    nuevoDiv.innerHTML = '';
    existenteDiv.innerHTML = '';
    
    campos.forEach(campo => {
      const valorNuevo = datosNuevos.get(campo.key) || '';
      const valorExistente = (registroExistente[campo.index] || '').toString();
      
      // Limpiar fecha si es necesario
      let valorNuevoLimpio = valorNuevo;
      let valorExistenteLimpio = valorExistente;
      
      if (campo.key === 'Fecha_del_siniestro') {
        if (valorNuevo && valorNuevo.includes('T')) {
          valorNuevoLimpio = valorNuevo.split('T')[0];
        }
        if (valorExistente && valorExistente.includes('T')) {
          valorExistenteLimpio = valorExistente.split('T')[0];
        }
      }
      
      // Determinar tipo de coincidencia
      let tipoCoincidencia = 'different';
      if (valorNuevoLimpio && valorExistenteLimpio) {
        if (valorNuevoLimpio.toString().toLowerCase() === valorExistenteLimpio.toLowerCase()) {
          tipoCoincidencia = 'exact';
        }
      }
      
      const nuevoElemento = crearElementoComparacion(campo, valorNuevoLimpio, tipoCoincidencia);
      const existenteElemento = crearElementoComparacion(campo, valorExistenteLimpio, tipoCoincidencia);
      
      nuevoDiv.appendChild(nuevoElemento);
      existenteDiv.appendChild(existenteElemento);
    });
  }

  function crearElementoComparacion(campo, valor, tipoCoincidencia) {
    const div = document.createElement('div');
    div.className = 'field-comparison';
    
    const iconos = {
      'exact': '<i class="fas fa-check-circle" style="color: #28a745; margin-left: 5px;"></i>',
      'similar': '<i class="fas fa-exclamation-circle" style="color: #ffc107; margin-left: 5px;"></i>',
      'different': '<i class="fas fa-times-circle" style="color: #dc3545; margin-left: 5px;"></i>'
    };
    
    div.innerHTML = `
      <div class="field-label">
        <i class="fas ${campo.icon}"></i>
        ${campo.label}
        ${iconos[tipoCoincidencia]}
      </div>
      <div class="field-value ${tipoCoincidencia}">
        ${valor || '<span class="empty-state">Sin información</span>'}
      </div>
    `;
    
    return div;
  }

  /* ============================================================
     ACCIONES DEL MODAL
     ============================================================ */

  window.cerrarModalDuplicados = function() {
    console.log("🚪 Cerrando modal");
    const modal = document.getElementById('modalDuplicados');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
    
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Enviar Registro';
      submitBtn.disabled = false;
    }
  };

  window.cancelarEnvio = function() {
    console.log("❌ Envío cancelado por el usuario");
    datosFormularioTemp = null;
    cerrarModalDuplicados();
    mostrarNotificacion('✅ Envío cancelado. No se creó ningún duplicado.', 'success', 3000);
  };

  window.forzarEnvio = function() {
    console.log("🔄 FORZANDO ENVÍO");
    
    if (!datosFormularioTemp) {
      console.error("❌ No hay datos guardados");
      alert("ERROR: No hay datos para enviar.\n\nPor favor, intenta registrar el incidente nuevamente.");
      cerrarModalDuplicados();
      return;
    }
    
    const similitud = parseInt(document.getElementById('scoreText')?.textContent) || 0;
    
    // Confirmación adicional si es crítico
    if (similitud >= 90) {
      const confirmar = confirm(
        '⚠️ ADVERTENCIA FINAL\n\n' +
        'La similitud es del ' + similitud + '%\n\n' +
        'Estás a punto de registrar un posible duplicado.\n\n' +
        '¿Estás COMPLETAMENTE SEGURO de que este es un incidente DIFERENTE?'
      );
      
      if (!confirmar) {
        console.log("❌ Usuario canceló el envío forzado");
        return;
      }
    }
    
    // Cerrar modal
    cerrarModalDuplicados();
    
    // Agregar flag de forzado
    datosFormularioTemp.set('forzar_insercion', 'true');
    
    console.log("✅ Flag agregado, enviando...");
    
    // Enviar
    enviarFormularioCompleto(datosFormularioTemp);
  };

  /* ============================================================
     EVENTOS DEL MODAL
     ============================================================ */
  const modalDuplicados = document.getElementById('modalDuplicados');
  if (modalDuplicados) {
    modalDuplicados.addEventListener('click', function(e) {
      if (e.target === this) {
        cerrarModalDuplicados();
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('modalDuplicados');
      if (modal && modal.style.display === 'flex') {
        cerrarModalDuplicados();
      }
    }
  });

  /* ============================================================
     MANEJO DEL FORMULARIO
     ============================================================ */
  const form = document.getElementById("formIncidente");
  if (form) {
    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      console.log("📝 Iniciando envío");
      
      const camposRequeridos = ['Municipio', 'Correo_Electronico', 'Fecha_del_siniestro'];
      let validacion = true;
      
      camposRequeridos.forEach(campo => {
        const elemento = document.querySelector(`[name="${campo}"]`);
        if (!elemento || !elemento.value.trim()) {
          mostrarNotificacion(`El campo ${campo.replace(/_/g, ' ')} es requerido`, 'error');
          validacion = false;
        }
      });
      
      if (!validacion) return;
      
      const datos = new FormData(form);
      
      const tipoTransporte = document.querySelector('input[name="tipoTransportePublico"]:checked');
      if (tipoTransporte) {
        datos.append('Tipo_Transporte_Publico', tipoTransporte.value);
      }
      
      enviarFormularioCompleto(datos);
    });
  }

  function limpiarFormularioCompleto() {
    const form = document.getElementById("formIncidente");
    if (form) form.reset();
    
    fotografiasCloudinary = [];
    datosFormularioTemp = null;
    mostrarVistaPrevia();
    actualizarContadorFotos();
    
    if (marker) {
      map.removeLayer(marker);
      marker = null;
    }
    
    const otraDepDiv = document.getElementById("otraDependenciaDiv");
    if (otraDepDiv) otraDepDiv.style.display = "none";
    
    const linkDiv = document.getElementById("linkNoticia");
    if (linkDiv) linkDiv.style.display = "none";
    
    const transporteDiv = document.getElementById("transportePublicoDiv");
    if (transporteDiv) transporteDiv.style.display = "none";
    
    limpiarCamposTransporte();
    
    const mensaje = document.getElementById("respuesta");
    if (mensaje) mensaje.innerHTML = '';
    
    console.log("✅ Formulario limpiado");
  }

  /* ============================================================
     INICIALIZACIÓN
     ============================================================ */
  
  console.log("🚀 Sistema inicializando...");
  
  if (typeof cloudinary !== 'undefined') {
    inicializarCloudinary();
  }
  
  actualizarContadorFotos();
  verificarTransportePublico();
  
  console.log("✅ Sistema listo con detección de duplicados");
});
