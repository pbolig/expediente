// js/app.js

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : '';
const APP_VERSION = '2.3.7';

document.addEventListener('DOMContentLoaded', () => {
   
    // --- 1. REFERENCIAS A ELEMENTOS DEL DOM ---
    const btnHome = document.getElementById('btn-home');
    const registroExpedienteSection = document.getElementById('registro-expediente');
    const panelConsulta = document.getElementById('panel-consulta');
    const grillaAcontecimientos = document.getElementById('grilla-acontecimientos');
    const expedienteIdEdicion = document.getElementById('expediente-id-edicion');
    const modalEdicion = document.getElementById('modal-edicion');
    const descripcionModal = document.getElementById('descripcion-modal');
    const acontecimientoIdModal = document.getElementById('acontecimiento-id-modal');    
    const panelEdicion = document.getElementById('panel-edicion');
    const formulario = document.getElementById('formulario-expediente');
    const formularioBusqueda = document.getElementById('formulario-busqueda');
    const campoBusqueda = document.getElementById('campo-busqueda');
    const resultadosBusqueda = document.getElementById('resultados-busqueda');
    const btnMostrarFormulario = document.getElementById('btn-mostrar-formulario');
    const selectTipoTramite = document.getElementById('tipo-tramite');
    const btnTomarFoto = document.getElementById('btn-tomar-foto');
    const inputFoto = document.getElementById('input-foto');
    const fotosPrevisualizacion = document.getElementById('fotos-previsualizacion');
    const modalFotos = document.getElementById('modal-fotos');
    const fotosModalBody = document.getElementById('fotos-modal-body');
    const closeBtn = document.querySelector('#modal-fotos .close-btn');
    const formularioEdicion = document.getElementById('formulario-edicion');
    
    const descripcionEdicion = document.getElementById('descripcion-edicion');
    const inputFotoEdicion = document.getElementById('input-foto-edicion');
    const fotosPrevisualizacionEdicion = document.getElementById('fotos-previsualizacion-edicion');
    const btnAdjuntarEdicion = document.getElementById('btn-adjuntar-edicion');
    const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
    const btnVolverBusqueda = document.getElementById('btn-volver-busqueda');
    const accordionHeader = document.querySelector('.accordion-header');
    
    const filtroEstado = document.getElementById('filtro-estado');
    const filtroTipoTramite = document.getElementById('filtro-tipo-tramite');
    const btnVoz = document.getElementById('btn-reconocimiento-voz');
    const descripcionTextarea = document.getElementById('descripcion');
    const formModalEdicion = document.getElementById('form-modal-edicion');
    const btnCancelarModal = document.getElementById('btn-cancelar-modal');
    const closeBtnEdicion = document.querySelector('#modal-edicion .close-btn-edicion');
    const checkFechaLimite = document.getElementById('check-fecha-limite');
    const contenedorRecordatorio = document.getElementById('contenedor-recordatorio');
    const destinatarioInput = document.getElementById('destinatario-input');
    const destinatariosTags = document.getElementById('destinatarios-tags');
    const autocompleteResults = document.getElementById('autocomplete-results');
    const fechaLimiteInput = document.getElementById('fecha-limite-edicion');
    const btnAbrirModalContacto = document.getElementById('btn-abrir-modal-contacto');
    const modalContacto = document.getElementById('modal-contacto');
    const formModalContacto = document.getElementById('form-modal-contacto');
    const contactoEmailInput = document.getElementById('contacto-email');
    const btnCancelarModalContacto = document.getElementById('btn-cancelar-modal-contacto');
    const closeBtnContacto = document.querySelector('#modal-contacto .close-btn-contacto');
    const accordionTitle = document.getElementById('accordion-title');
    const spinnerOverlay = document.getElementById('spinner-overlay');



    // --- 2. INICIALIZACIÓN DE LIBRERÍAS Y COMPONENTES ---
    const choicesEstado = new Choices(filtroEstado, { itemSelectText: '', searchEnabled: false, shouldSort: false });
    const choicesTipoTramite = new Choices(filtroTipoTramite, { itemSelectText: '', searchEnabled: false, shouldSort: false });
    const choicesFormularioTramite = new Choices(selectTipoTramite, { itemSelectText: '', searchEnabled: true, shouldSort: false });
    const taggerDestinatarios = new AutocompleteTagger({
        inputEl: destinatarioInput,
        tagsEl: destinatariosTags,
        resultsEl: autocompleteResults,
        buttonEl: btnAbrirModalContacto,
        apiEndpoint: `${API_URL}/api/contactos`,
        modalContacto: modalContacto,
        contactoEmailInput: contactoEmailInput
    });

    const reminderComponent = new ReminderComponent({
        containerId: 'contenedor-recordatorio',
        taggerInstance: taggerDestinatarios
    });

    // --- 3. VARIABLES DE ESTADO ---
    const fotosTomadas = [];
    const fotosEdicion = [];

    // --- 4. FUNCIONES ---

    // FUNCIÓN DE AYUDA PARA RESETEAR EL FORMULARIO
    const resetearFormularioAcontecimiento = () => {
        // 1. Limpiamos todo el contenido del formulario
        formularioEdicion.reset();
        document.getElementById('editing-acontecimiento-id').value = '';
        accordionTitle.textContent = 'Agregar Nuevo Acontecimiento';
        reminderComponent.clear();
        fotosPrevisualizacionEdicion.innerHTML = '';
        fotosEdicion.length = 0;

        // 2. Cerramos el acordeón (con un pequeño retraso para el navegador)
        if (accordionHeader.classList.contains('active')) {
            // Usamos setTimeout para asegurar que el navegador procese los cambios
            // de limpieza antes de intentar la animación de cierre.
            setTimeout(() => {
                const content = accordionHeader.nextElementSibling;
                accordionHeader.classList.remove('active');
                content.style.maxHeight = null;
            }, 50); // Un pequeño retraso de 50ms es suficiente
        }
    };

    const resetApp = () => {
        registroExpedienteSection.style.display = 'none';
        panelConsulta.style.display = 'block';
        panelEdicion.style.display = 'none';
        campoBusqueda.value = '';
        resultadosBusqueda.innerHTML = '';
        document.getElementById('paginacion-busqueda').innerHTML = '';
        choicesEstado.setChoiceByValue('');
        choicesTipoTramite.setChoiceByValue('');
        btnMostrarFormulario.textContent = '➕ Crear Nuevo Expediente';
        btnMostrarFormulario.classList.remove('btn-secondary');
        btnMostrarFormulario.classList.add('btn-primary');
    };

    const btnVolver = () => {
        registroExpedienteSection.style.display = 'none';
        panelConsulta.style.display = 'block';
        panelEdicion.style.display = 'none';
        //campoBusqueda.value = '';
        //resultadosBusqueda.innerHTML = '';
        //document.getElementById('paginacion-busqueda').innerHTML = '';
        //choicesEstado.setChoiceByValue('');
        //choicesTipoTramite.setChoiceByValue('');
        btnMostrarFormulario.textContent = '➕ Crear Nuevo Expediente';
        btnMostrarFormulario.classList.remove('btn-secondary');
        btnMostrarFormulario.classList.add('btn-primary');
    };

    const obtenerIconoArchivo = (nombreArchivo) => {
        const extension = nombreArchivo.split('.').pop().toLowerCase();
        const iconos = { 'pdf': '📄', 'doc': '📝', 'docx': '📝', 'xls': '📊', 'xlsx': '📊', 'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'zip': '🗜️', 'default': '📎' };
        return iconos[extension] || iconos.default;
    };

    const esImagen = (nombreArchivo) => {
        const extensionesImagen = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        return extensionesImagen.includes(nombreArchivo.split('.').pop().toLowerCase());
    };
    
    function mostrarMensaje(texto) {
        const toast = document.createElement('div');
        toast.textContent = texto;
        toast.style.cssText = `
            position: fixed;
            top: -100px;
            left: 50%;
            transform: translateX(-50%);
            background: #7e9d0dff;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: top 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.top = '20px', 10);
        
        setTimeout(() => {
            toast.style.top = '-100px';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }


    async function mostrarConfirmacion(texto) {
        return new Promise((resolve) => {
            // Crear el fondo oscuro
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';

            // Crear la caja del diálogo
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';

            // Crear el mensaje
            const message = document.createElement('p');
            message.textContent = texto;

            // Crear el contenedor de botones
            const actions = document.createElement('div');
            actions.className = 'confirm-actions';

            // Crear el botón de "Detener"
            const btnStop = document.createElement('button');
            btnStop.textContent = 'Detener';
            btnStop.className = 'btn btn-secondary';
            
            // Crear el botón de "Continuar"
            const btnContinue = document.createElement('button');
            btnContinue.textContent = 'Continuar';
            btnContinue.className = 'btn btn-primary';

            // Función para cerrar y eliminar el diálogo
            const closeDialog = (result) => {
                overlay.style.opacity = '0';
                dialog.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(result); // Devuelve 'true' o 'false'
                }, 200);
            };

            // Asignar eventos a los botones
            btnContinue.onclick = () => closeDialog(true);
            btnStop.onclick = () => closeDialog(false);

            // Armar la estructura
            actions.appendChild(btnStop);
            actions.appendChild(btnContinue);
            dialog.appendChild(message);
            dialog.appendChild(actions);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Animación de entrada
            setTimeout(() => {
                overlay.style.opacity = '1';
                dialog.style.transform = 'scale(1)';
            }, 10);
        });
    }

    // Programación del spinner de espera 
    let spinnerStartTime = 0;
    const MIN_SPINNER_TIME = 500; // Medio segundo

    const mostrarSpinner = () => {
        spinnerStartTime = Date.now();
        spinnerOverlay.style.display = 'flex';
    };

    const ocultarSpinner = () => {
        const elapsedTime = Date.now() - spinnerStartTime;
        const remainingTime = MIN_SPINNER_TIME - elapsedTime;
        
        if (remainingTime > 0) {
            setTimeout(() => {
                spinnerOverlay.style.display = 'none';
            }, remainingTime);
        } else {
            spinnerOverlay.style.display = 'none';
        }
    };

    const descargarArchivo = async (nombreArchivo) => {
        try {
            const response = await fetch(`${API_URL}/uploads/${nombreArchivo}`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const blob = await response.blob();
            const urlBlob = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = urlBlob;
            a.download = nombreArchivo;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlBlob);
            a.remove();
        } catch (error) {
            console.error('Error al descargar:', error);
            mostrarMensaje('No se pudo descargar el archivo.');
        }
    };

    const actualizarAlturaAcordeon = () => {
        if (panelEdicion.style.display === 'block' && accordionHeader.classList.contains('active')) {
            const accordionContent = accordionHeader.nextElementSibling;
            accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
        }
    };

    const procesarYAnadirArchivos = async (archivos, contenedor, arrayDestino) => {
        const MAX_FILE_SIZE = 10 * 1024 * 1024; 

        const opcionesCompresion = {
            maxSizeMB: 1,          // Tamaño máximo de la imagen después de comprimir
            maxWidthOrHeight: 1920, // Redimensiona la imagen si es muy grande
            useWebWorker: true,
            fileType: 'image/jpeg',// Convierte todo a JPG
        };

        for (const archivo of archivos) {
            let archivoParaSubir = archivo;

            // --- VALIDACIÓN DE TAMAÑO PARA DOCUMENTOS ---
            if (!archivo.type.startsWith('image/') && archivo.size > MAX_FILE_SIZE) {
                //alert(`El archivo "${archivo.name}" es demasiado grande (${(archivo.size / 1024 / 1024).toFixed(1)} MB). El tamaño máximo para documentos es 10 MB.`);
                mostrarMensaje(`El archivo "${archivo.name}" es demasiado grande (${(archivo.size / 1024 / 1024).toFixed(1)} MB). El tamaño máximo para documentos es 10 MB.`);
                continue; // Salta este archivo y continúa con el siguiente
            }

            // --- COMPRESIÓN PARA IMÁGENES ---
            if (archivo.type.startsWith('image/')) {
                try {
                    const archivoComprimido = await imageCompression(archivo, opcionesCompresion);
                    archivoParaSubir = new File([archivoComprimido], archivo.name, { type: 'image/jpeg' });
                } catch (error) {
                    console.error('Error al comprimir la imagen, se usará el original:', error);
                    // Si la compresión falla, verificamos si el original supera el límite
                    if (archivoParaSubir.size > MAX_FILE_SIZE) {
                        //alert(`La imagen "${archivo.name}" es demasiado grande (${(archivo.size / 1024 / 1024).toFixed(1)} MB) y no se pudo comprimir. El tamaño máximo es 10 MB.`);
                        mostrarMensaje(`La imagen "${archivo.name}" es demasiado grande (${(archivo.size / 1024 / 1024).toFixed(1)} MB) y no se pudo comprimir. El tamaño máximo es 10 MB.`);
                        continue;
                    }
                }
            }

            // --- Lógica para añadir a la lista y previsualizar (sin cambios) ---
            arrayDestino.push(archivoParaSubir);
            
            const div = document.createElement('div');
            div.classList.add('previsualizacion-item');
            if (esImagen(archivoParaSubir.name)) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(archivoParaSubir);
                div.appendChild(img);
            } else {
                div.innerHTML = `<span class="file-icon">${obtenerIconoArchivo(archivoParaSubir.name)}</span>`;
            }
            const btnEliminar = document.createElement('button');
            btnEliminar.classList.add('btn-eliminar-preview');
            btnEliminar.innerHTML = '×';
            btnEliminar.onclick = () => {
                const index = arrayDestino.indexOf(archivoParaSubir);
                if (index > -1) {
                    arrayDestino.splice(index, 1);
                    div.remove();
                    if (contenedor.id === 'fotos-previsualizacion-edicion') actualizarAlturaAcordeon();
                }
            };
            div.appendChild(btnEliminar);
            contenedor.appendChild(div);
            if (contenedor.id === 'fotos-previsualizacion-edicion') actualizarAlturaAcordeon();
        }
    };

    const cargarFiltroEstados = () => {
        choicesEstado.clearStore();
        const estados = [{ value: '', label: 'Todos los Estados', selected: true }, { value: 'en-espera', label: 'En Espera' }, { value: 'iniciado', label: 'Iniciado' }, { value: 'finalizado', label: 'Finalizado' }];
        choicesEstado.setChoices(estados, 'value', 'label', false);
    };

    const cargarOpcionesTipoTramite = async (choicesInstance, defaultLabel = 'Todos los Tipos') => {
        try {
            const response = await fetch(`${API_URL}/api/tipos-tramite`);
            if (response.ok) {
                const tipos = await response.json();
                choicesInstance.clearStore();
                const opciones = [{ value: '', label: defaultLabel, selected: true }];                                 
                tipos.forEach(tipo => opciones.push({ value: tipo.id, label: tipo.nombre }));
                choicesInstance.setChoices(opciones, 'value', 'label', false);
            }
        } catch (error) { console.error('Error al cargar tipos de trámite:', error); }
    };

    const buscarExpedientes = async (termino, estado, tipoTramite, page = 1) => {
        mostrarSpinner();
        try {
            let url = `${API_URL}/api/tramites?busqueda=${encodeURIComponent(termino)}&page=${page}`;
            if (estado) url += `&estado=${estado}`;
            if (tipoTramite) url += `&tipoTramite=${tipoTramite}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                mostrarResultados(data);
            } else {
                resultadosBusqueda.innerHTML = '<p>No se pudieron cargar los resultados.</p>';
            }
        } catch (error) {
            console.error('Error de red:', error);
            resultadosBusqueda.innerHTML = '<p>No se pudo conectar con el servidor.</p>';
        } finally {
            ocultarSpinner();
        }
    };

    const mostrarResultados = (data) => {
        resultadosBusqueda.innerHTML = '';
        const paginacionContainer = document.getElementById('paginacion-busqueda');
        paginacionContainer.innerHTML = '';
        if (!data.expedientes || data.expedientes.length === 0) {
            resultadosBusqueda.innerHTML = '<p>No se encontraron expedientes.</p>';
            return;
        }
        data.expedientes.forEach(expediente => {
            const expedienteDiv = document.createElement('div');
            expedienteDiv.classList.add('expediente-item');
            expedienteDiv.innerHTML = `<h3>Nro. Expediente: ${expediente.numero_expediente}</h3><p><strong>Fecha:</strong> ${new Date(expediente.fecha_creacion).toLocaleDateString()}</p><p><strong>Descripción:</strong> ${expediente.descripcion}</p><p><strong>Tipo de Trámite:</strong> ${expediente.tipo_tramite_nombre}</p><p><strong>Estado:</strong> ${expediente.estado}</p><button class="btn btn-outline btn-ver-acontecimientos" data-expediente-id="${expediente.id}">Ver Detalles</button>`;
            resultadosBusqueda.appendChild(expedienteDiv);
        });
        if (data.total_pages > 1) {
            const crearBoton = (texto, pagina, deshabilitado = false, activo = false) => {
                const btn = document.createElement('button');
                btn.innerHTML = texto;
                btn.disabled = deshabilitado;
                btn.classList.add('btn-paginacion');
                if (activo) btn.classList.add('active');
                btn.addEventListener('click', () => buscarExpedientes(campoBusqueda.value, choicesEstado.getValue(true), choicesTipoTramite.getValue(true), pagina));
                return btn;
            };
            const controlesDiv = document.createElement('div');
            controlesDiv.classList.add('pagination-controls');
            if (data.current_page > 1) controlesDiv.appendChild(crearBoton('«', data.current_page - 1));
            for (let i = 1; i <= data.total_pages; i++) {
                controlesDiv.appendChild(crearBoton(i, i, i === data.current_page, i === data.current_page));
            }
            if (data.current_page < data.total_pages) controlesDiv.appendChild(crearBoton('»', data.current_page + 1));
            paginacionContainer.appendChild(controlesDiv);
        }
    };

    const cargarExpedienteParaEdicion = async (expedienteId) => {
        try {
            const response = await fetch(`${API_URL}/api/tramites/${expedienteId}`);
            if (response.ok) {
                const expediente = await response.json();
                document.querySelector('#panel-edicion .panel-header h2').textContent = `Detalles del Expediente: ${expediente.numero_expediente}`;
                expedienteIdEdicion.value = expediente.id;
                document.getElementById('info-expediente-general').innerHTML = `<p><strong>Descripción General:</strong> ${expediente.descripcion}</p><p><strong>Tipo de Trámite:</strong> ${expediente.tipo_tramite_nombre}</p><hr>`;
                
                const radioActivo = document.querySelector(`input[name="estado-toggle"][value="${expediente.estado}"]`);
                if (radioActivo) {
                    radioActivo.checked = true;
                }
            }
        } catch (error) { console.error('Error al cargar expediente:', error); }
    };

    const mostrarAcontecimientos = async (expedienteId, page = 1) => {
        try {
            const response = await fetch(`${API_URL}/api/acontecimientos/${expedienteId}?page=${page}`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const data = await response.json();
            grillaAcontecimientos.innerHTML = '';
            
            if (!data.acontecimientos || data.acontecimientos.length === 0) {
                grillaAcontecimientos.innerHTML = '<p class="no-data">No hay acontecimientos para este expediente.</p>';
                return;
            }
            
            grillaAcontecimientos.dataset.acontecimientos = JSON.stringify(data.acontecimientos);

            data.acontecimientos.forEach(acontecimiento => {
                const div = document.createElement('div');
                div.classList.add('acontecimiento-item');
                const fecha = new Date(acontecimiento.fecha_hora).toLocaleString('es-ES');
                
                let recordatorioHtml = '';
                let botonRecordatorioHtml = '';

                if (acontecimiento.fecha_limite) {
                    const fechaLimite = new Date(acontecimiento.fecha_limite).toLocaleDateString('es-ES');
                    
                    // --- LÓGICA RESTAURADA PARA LA ETIQUETA ---
                    if (acontecimiento.recordatorio_enviado_el) {
                        const fechaEnvio = new Date(acontecimiento.recordatorio_enviado_el).toLocaleDateString('es-ES');
                        recordatorioHtml = `<p class="recordatorio-status enviado">✔ Recordatorio enviado el ${fechaEnvio} (Límite: ${fechaLimite})</p>`;
                    } else {
                        recordatorioHtml = `<p class="recordatorio-status pendiente">🔔 Recordatorio programado para el ${fechaLimite}</p>`;
                    }

                    // --- LÓGICA SIMPLIFICADA PARA EL BOTÓN ---
                    const textoBoton = acontecimiento.recordatorio_enviado_el ? '🔔 Reenviar Ahora' : '🔔 Enviar Ahora';
                    botonRecordatorioHtml = `<button class="btn btn-outline btn-enviar-recordatorio-manual" data-acontecimiento-id="${acontecimiento.id}" data-expediente-id="${expedienteId}">${textoBoton}</button>`;
                }

                div.innerHTML = `
                    <div class="acontecimiento-header">
                        <h4>Acontecimiento #${acontecimiento.num_secuencial}</h4>
                        <span class="fecha">${fecha}</span>
                    </div>
                    <div class="acontecimiento-content">
                        <p><strong>Descripción:</strong> ${acontecimiento.descripcion || 'N/A'}</p>
                        <p><strong>Estado:</strong> ${acontecimiento.nuevo_estado || 'N/A'}</p>
                        ${recordatorioHtml}
                    </div>
                    <div class="acontecimiento-actions">
                        <button class="btn btn-outline btn-ver-archivos" data-acontecimiento-id="${acontecimiento.id}" data-expediente-id="${expedienteId}">📁 Ver Archivos</button>
                        <button class="btn btn-secondary btn-editar-acontecimiento" data-acontecimiento-id="${acontecimiento.id}">✏️ Editar</button>
                        <button class="btn btn-danger btn-eliminar-acontecimiento" data-acontecimiento-id="${acontecimiento.id}" data-expediente-id="${expedienteId}">🗑️ Eliminar</button>
                        ${botonRecordatorioHtml}
                    </div>`;
                
                grillaAcontecimientos.appendChild(div);
            });
        } catch (error) {
            console.error('Error al cargar acontecimientos:', error);
            grillaAcontecimientos.innerHTML = '<p class="error-message">No se pudieron cargar los acontecimientos.</p>';
        }
    };

    const mostrarArchivosEnModal = (archivos, tituloModal) => {
        fotosModalBody.innerHTML = '';
        document.querySelector('#modal-fotos h2').textContent = tituloModal;
    
        if (!archivos || archivos.length === 0) {
            fotosModalBody.innerHTML = '<p>No hay archivos para este acontecimiento.</p>';
        } else {
            archivos.forEach(archivo => {
                const div = document.createElement('div');
                div.classList.add('contenedor-imagen');
                if (esImagen(archivo.nombre_archivo)) {
                    div.innerHTML = `<img src="${API_URL}/uploads/${archivo.nombre_archivo}" alt="${archivo.nombre_archivo}">`;
                } else {
                    div.innerHTML = `<div class="file-placeholder"><span class="file-icon">${obtenerIconoArchivo(archivo.nombre_archivo)}</span></div>`;
                }
                const infoDiv = document.createElement('div');
                infoDiv.classList.add('info-archivo');
                infoDiv.innerHTML = `<span class="nombre-archivo">${archivo.nombre_archivo}</span>`;
                const btnDescargar = document.createElement('button');
                btnDescargar.classList.add('btn', 'btn-outline');
                btnDescargar.style.width = '100%';
                btnDescargar.style.padding = '4px 8px';
                btnDescargar.textContent = 'Descargar';
                btnDescargar.onclick = () => descargarArchivo(archivo.nombre_archivo);
                infoDiv.appendChild(btnDescargar);
                div.appendChild(infoDiv);
                fotosModalBody.appendChild(div);
            });
        }
        // La línea clave para mostrar el modal
        modalFotos.style.display = 'block';
    };

    const enviarFormulario = async (event) => {
        event.preventDefault();

        if (fotosTomadas.length === 0) {
            const confirmacion = await mostrarConfirmacion('No has adjuntado ningún archivo. ¿Deseas continuar de todas formas?');
            if (!confirmacion) { // Si el usuario presiona "Detener", la confirmación es 'false'
                return; // Detenemos el proceso de guardado
            }
        }

        //if (fotosTomadas.length === 0) {
            //alert('Por favor, adjunte al menos un documento.');
        //    mostrarMensaje('Por favor, adjunte al menos un documento.');
        //    return;
        //}

        // -- Leemos el valor usando el método de Choices.js --
        const tipoTramite = choicesFormularioTramite.getValue(true);
        const descripcion = document.getElementById('descripcion').value;

        if (!tipoTramite) {
            //alert('Por favor, seleccione un tipo de trámite.');
            mostrarMensaje('Por favor, seleccione un tipo de trámite.');
            return;
        }
        

        

        const formData = new FormData();
        formData.append('tipoTramite', tipoTramite);
        formData.append('descripcion', descripcion);
        fotosTomadas.forEach((foto, index) => {
            formData.append(`foto-${index}`, foto);
        });

        console.log("--- Datos que se van a enviar al servidor ---");
console.log("Tipo de Trámite:", tipoTramite);
console.log("Descripción:", descripcion);
console.log("Cantidad de fotos:", fotosTomadas.length);
        
        mostrarSpinner();
        try {
            const response = await fetch(`${API_URL}/api/tramites`, { method: 'POST', body: formData });
            if (response.ok) {
                const resultado = await response.json();
                //alert(`Expediente ${resultado.numero_expediente} guardado con éxito!`);
                mostrarMensaje(`Expediente ${resultado.numero_expediente} guardado con éxito!`);
                formulario.reset();
                fotosPrevisualizacion.innerHTML = '';
                fotosTomadas.length = 0;
                choicesFormularioTramite.clearStore(); // Limpiamos el combo
                cargarOpcionesTipoTramite(choicesFormularioTramite, 'Seleccione un tipo...'); // Lo recargamos
            } else {
                //alert('Hubo un error al guardar el expediente.');
                mostrarMensaje('Hubo un error al guardar el expediente.');
            }
        } catch (error) {
            console.error('Error de red:', error);
            //alert('No se pudo conectar con el servidor.');
            mostrarMensaje('No se pudo conectar con el servidor.');
        } finally {
            ocultarSpinner();
        }
    };

    const enviarAcontecimiento = async (event) => {
        event.preventDefault();
        
        const editingId = document.getElementById('editing-acontecimiento-id').value;
        const esEdicion = !!editingId;
        const expedienteId = expedienteIdEdicion.value;
        
        // --- VALIDACIÓN DE RECORDATORIO ---
        if (checkFechaLimite.checked) {
            if (!fechaLimiteInput.value) {
                mostrarMensaje('Por favor, seleccione una fecha límite para el recordatorio.');
                return;
            }
            if (taggerDestinatarios.getValue().length === 0) {
                mostrarMensaje('Por favor, añada al menos un destinatario para el recordatorio.');
                return;
            }
        }

        const numeroExpediente = document.querySelector('#panel-edicion .panel-header h2').textContent.split(': ')[1];
        if (!numeroExpediente && !esEdicion) { // El numeroExpediente es vital solo en la creación
            mostrarMensaje("Error: No se pudo leer el número de expediente.");
            return;
        }

        // --- AHORA SIEMPRE USAREMOS FormData ---
        const formData = new FormData();
        const reminderData = reminderComponent.getValue();

        // 1. Añadimos los datos de texto
        formData.append('descripcionAcontecimiento', descripcionEdicion.value);
        formData.append('nuevoEstado', document.querySelector('input[name="estado-toggle"]:checked').value);
        
        if (reminderData.fechaLimite) {
            formData.append('fechaLimite', reminderData.fechaLimite);
            formData.append('frecuenciaRecordatorio', reminderData.frecuencia);
            if (reminderData.destinatarios.length > 0) {
                formData.append('destinatariosEmail', JSON.stringify(reminderData.destinatarios));
            }
        } else {
            formData.append('fechaLimite', '');
            formData.append('frecuenciaRecordatorio', '');
            formData.append('destinatariosEmail', '[]');
        }

        // 2. Añadimos los archivos (fotosEdicion es el array de previsualización)
        fotosEdicion.forEach((foto, index) => {
            formData.append(`foto-${index}`, foto);
        });

        // 3. Definimos el método y la URL
        const method = esEdicion ? 'PUT' : 'POST';
        const url = esEdicion ? `${API_URL}/api/acontecimientos/${editingId}` : `${API_URL}/api/acontecimientos/${expedienteId}`;
        
        if (!esEdicion) {
            formData.append('numeroExpediente', numeroExpediente);
        }
        
        mostrarSpinner();
        try {
            // No se necesita 'headers', FormData lo establece automáticamente
            const response = await fetch(url, { method, body: formData });

            if (response.ok) {
                mostrarMensaje(`Acontecimiento ${esEdicion ? 'actualizado' : 'guardado'} con éxito.`);
                resetearFormularioAcontecimiento(); // Limpia y cierra el acordeón
                await mostrarAcontecimientos(expedienteId, 1);
            } else {
                const errorData = await response.json();
                mostrarMensaje(`Hubo un error: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Error de red:', error);
            mostrarMensaje('No se pudo conectar con el servidor.');
        } finally {
            ocultarSpinner();
        }
    };

    // --- FUNCIÓN PARA MANEJAR ENLACES DIRECTOS ---
    const manejarEnlaceDirecto = async () => {
        // Comprobamos si hay un "hash" en la URL (ej: #expediente=5)
        if (window.location.hash) {
            // Usamos URLSearchParams para leer los parámetros fácilmente
            const params = new URLSearchParams(window.location.hash.substring(1)); // Quitamos el '#'
            const expedienteId = params.get('expediente');

            if (expedienteId) {
                console.log('Enlace directo detectado. Abriendo expediente:', expedienteId);

                // Ocultamos las vistas principales y mostramos la de edición
                panelConsulta.style.display = 'none';
                registroExpedienteSection.style.display = 'none';
                panelEdicion.style.display = 'block';

                // Cargamos los datos del expediente
                await cargarExpedienteParaEdicion(expedienteId);
                await mostrarAcontecimientos(expedienteId, 1);
            }
        }
    };
    
    // --- 5. EVENT LISTENERS ---
    document.getElementById('app-version').textContent = APP_VERSION;
    
    btnHome.addEventListener('click', resetApp);
    
    btnMostrarFormulario.addEventListener('click', () => {
        const isHidden = registroExpedienteSection.style.display === 'none';
        registroExpedienteSection.style.display = isHidden ? 'block' : 'none';
        btnMostrarFormulario.textContent = isHidden ? '➖ Ocultar Formulario' : '➕ Crear Nuevo Expediente';
        btnMostrarFormulario.classList.toggle('btn-primary', !isHidden);
        btnMostrarFormulario.classList.toggle('btn-secondary', isHidden);
    });
    
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !isSafari) {
        const recognition = new SpeechRecognition();
        let isListening = false;
        recognition.lang = 'es-AR';
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.onresult = (event) => {
            let textoFinal = '';
            for (const resultado of event.results) { textoFinal += resultado[0].transcript; }
            descripcionTextarea.value += (descripcionTextarea.value.length > 0 ? ' ' : '') + textoFinal;
        };
        recognition.onerror = (event) => console.error('Error en reconocimiento de voz:', event.error);
        recognition.onend = () => { isListening = false; btnVoz.classList.remove('escuchando'); };
        btnVoz.addEventListener('click', () => {
            if (isListening) { recognition.stop(); } else {
                try { recognition.start(); isListening = true; btnVoz.classList.add('escuchando'); } 
                catch (error) { console.error("Error al iniciar reconocimiento:", error); }
            }
        });
    } else {
        btnVoz.style.display = 'none';
    }

    checkFechaLimite.addEventListener('change', () => {
        const isChecked = checkFechaLimite.checked;
        contenedorRecordatorio.style.display = isChecked ? 'block' : 'none';
        if (!isChecked) {
            taggerDestinatarios.clear();
            fechaLimiteInput.value = '';
        }
        actualizarAlturaAcordeon();
    });

    const cerrarModalContacto = () => modalContacto.style.display = 'none';
    closeBtnContacto.addEventListener('click', cerrarModalContacto);
    btnCancelarModalContacto.addEventListener('click', cerrarModalContacto);
    formModalContacto.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevoContacto = {
            email: document.getElementById('contacto-email').value,
            nombre: document.getElementById('contacto-nombre').value,
            telefono: document.getElementById('contacto-telefono').value,
            direccion: document.getElementById('contacto-direccion').value,
        };
        try {
            const response = await fetch(`${API_URL}/api/contactos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoContacto) });
            if (response.ok) {
                mostrarMensaje('Contacto guardado.');
                taggerDestinatarios.add(nuevoContacto.email);
                btnAbrirModalContacto.style.display = 'none';
                cerrarModalContacto();
                formModalContacto.reset();
            } else { mostrarMensaje('Error al guardar el contacto.'); }
        } catch (error) { console.error('Error al guardar contacto:', error); }
    });

    // Listeners de Formularios y UI principal
    formularioBusqueda.addEventListener('submit', (event) => {
        event.preventDefault();
        buscarExpedientes(campoBusqueda.value, choicesEstado.getValue(true), choicesTipoTramite.getValue(true), 1);
    });
    formulario.addEventListener('submit', enviarFormulario);
    formularioEdicion.addEventListener('submit', enviarAcontecimiento);

    formModalEdicion.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = acontecimientoIdModal.value; // Ahora 'id' tendrá el valor correcto
        const nuevaDescripcion = descripcionModal.value;
        const expedienteId = expedienteIdEdicion.value;

        if (!id) {
            alert("Error: No se pudo identificar el acontecimiento a editar.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/acontecimientos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcion: nuevaDescripcion })
            });
            if (response.ok) {
                modalEdicion.style.display = 'none';
                alert('Acontecimiento actualizado.');
                await mostrarAcontecimientos(expedienteId, 1);
            } else {
                alert('Error al actualizar el acontecimiento.');
            }
        } catch (error) {
            console.error("Error al editar:", error);
            alert("No se pudo conectar con el servidor.");
        }
    });
    
    // Listeners de la UI principal
    resultadosBusqueda.addEventListener('click', async (event) => {
        const boton = event.target.closest('.btn-ver-acontecimientos');
        if (boton) {
            const expedienteId = boton.dataset.expedienteId;
            panelConsulta.style.display = 'none';
            registroExpedienteSection.style.display = 'none';
            panelEdicion.style.display = 'block';
            await cargarExpedienteParaEdicion(expedienteId);
            await mostrarAcontecimientos(expedienteId, 1);
        }
    });

    grillaAcontecimientos.addEventListener('click', async (event) => {
        const boton = event.target.closest('button');
        if (!boton) return;

        const acontecimientoId = boton.dataset.acontecimientoId;
        const expedienteId = boton.dataset.expedienteId;

        // Lógica para RESETEAR RECORDATORIO
        if (boton.classList.contains('btn-enviar-recordatorio-manual')) {
            if (confirm("¿Estás seguro de que deseas enviar este recordatorio ahora mismo?")) {
                try {
                    boton.disabled = true;
                    boton.textContent = 'Enviando...';
                    const response = await fetch(`${API_URL}/api/acontecimientos/${acontecimientoId}/enviar_ahora`, { method: 'POST' });
                    if (response.ok) {
                        mostrarMensaje('Recordatorio enviado.');
                        await mostrarAcontecimientos(expedienteId, 1);
                    } else {
                        mostrarMensaje('Error al enviar el recordatorio.');
                    }
                } catch (error) {
                    console.error("Error al enviar manualmente:", error);
                    mostrarMensaje("No se pudo conectar con el servidor.");
                } finally {
                    // El texto se restaura en el refresco de la lista
                }
            }
        }

        // Lógica para VER ARCHIVOS
        if (boton.classList.contains('btn-ver-archivos')) {
            try {
                boton.disabled = true;
                boton.innerHTML = '⏳ Cargando...';
                const response = await fetch(`${API_URL}/api/acontecimientos/${acontecimientoId}/fotos`);
                if (response.ok) {
                    const archivos = await response.json();
                    mostrarArchivosEnModal(archivos, `Archivos del Acontecimiento #${acontecimientoId}`);
                } else {
                    mostrarMensaje('No se pudieron obtener los archivos.');
                }
            } catch (error) {
                console.error('Error de red:', error);
                mostrarMensaje('No se pudo conectar con el servidor.');
            } finally {
                boton.disabled = false;
                boton.innerHTML = '📁 Ver Archivos';
            }
        }

        // Lógica para EDITAR ACONTECIMIENTO
        if (boton.classList.contains('btn-editar-acontecimiento')) {
            const todosLosAcontecimientos = JSON.parse(grillaAcontecimientos.dataset.acontecimientos || '[]');
            const acontecimientoParaEditar = todosLosAcontecimientos.find(a => a.id == acontecimientoId);

            if (!acontecimientoParaEditar) {
                mostrarMensaje("Error: no se encontraron los datos de este acontecimiento.");
                return;
            }

            // 1. PRIMERO, rellenamos todos los campos del formulario.
            document.getElementById('editing-acontecimiento-id').value = acontecimientoParaEditar.id;
            descripcionEdicion.value = acontecimientoParaEditar.descripcion;
            document.querySelector(`input[name="estado-toggle"][value="${acontecimientoParaEditar.nuevo_estado}"]`).checked = true;
            
            // El componente se encarga de mostrar/ocultar los campos de recordatorio y rellenarlos.
            // Esto puede cambiar la altura del contenido.
            reminderComponent.setData(acontecimientoParaEditar);

            // Cambiamos el título
            accordionTitle.textContent = '✏️ Editar Acontecimiento';

            // 2. DESPUÉS, si el acordeón está cerrado, lo abrimos.
            // Ahora sí calculará la altura correcta porque el contenido ya cambió.
            if (!accordionHeader.classList.contains('active')) {
                accordionHeader.click();
            } else {
                // Si ya estaba abierto, solo recalculamos la altura para asegurarnos.
                actualizarAlturaAcordeon();
            }
            
            // 3. Finalmente, hacemos scroll para que el formulario sea visible.
            formularioEdicion.scrollIntoView({ behavior: 'smooth' });
        }

        // Lógica para ELIMINAR ACONTECIMIENTO
        if (boton.classList.contains('btn-eliminar-acontecimiento')) {
            if (confirm(`¿Estás seguro de eliminar este acontecimiento y todos sus archivos?`)) {
                try {
                    const response = await fetch(`${API_URL}/api/acontecimientos/${acontecimientoId}`, { method: 'DELETE' });
                    if (response.ok) {
                        mostrarMensaje('Acontecimiento eliminado.');
                        await mostrarAcontecimientos(expedienteId, 1);
                    } else {
                        mostrarMensaje('Error al eliminar el acontecimiento.');
                    }
                } catch (error) {
                    console.error("Error al eliminar:", error);
                    mostrarMensaje("No se pudo conectar con el servidor.");
                }
            }
        }
    });

    formModalEdicion.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = acontecimientoIdModal.value;
        const nuevaDescripcion = descripcionModal.value;
        const expedienteId = expedienteIdEdicion.value;

        if (!id) {
            mostrarMensaje("Error: No se pudo identificar el acontecimiento a editar.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/acontecimientos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcion: nuevaDescripcion })
            });
            if (response.ok) {
                cerrarModalEdicion();
                mostrarMensaje('Acontecimiento actualizado.');
                await mostrarAcontecimientos(expedienteId, 1); // Refrescar la lista
            } else {
                mostrarMensaje('Error al actualizar el acontecimiento.');
            }
        } catch (error) {
            console.error("Error al editar:", error);
            mostrarMensaje("No se pudo conectar con el servidor.");
        }
    });

    btnVolverBusqueda.addEventListener('click', () => {
        panelEdicion.style.display = 'none';
        panelConsulta.style.display = 'block';
        registroExpedienteSection.style.display = 'block';
        btnVolver();
    });

    btnCancelarEdicion.addEventListener('click', () => {        
        resetearFormularioAcontecimiento()
    });

    const cerrarModalEdicion = () => {
        modalEdicion.style.display = 'none';
    };
    closeBtnEdicion.addEventListener('click', cerrarModalEdicion);
    btnCancelarModal.addEventListener('click', cerrarModalEdicion);

    if (accordionHeader) accordionHeader.addEventListener('click', () => {
        accordionHeader.classList.toggle('active');
        const content = accordionHeader.nextElementSibling;
        content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
    });
    
    // Listeners de subida de archivos
    btnTomarFoto.addEventListener('click', () => inputFoto.click());
    inputFoto.addEventListener('change', (e) => { procesarYAnadirArchivos(e.target.files, fotosPrevisualizacion, fotosTomadas); e.target.value = ''; });
    btnAdjuntarEdicion.addEventListener('click', () => inputFotoEdicion.click());
    inputFotoEdicion.addEventListener('change', (e) => { procesarYAnadirArchivos(e.target.files, fotosPrevisualizacionEdicion, fotosEdicion); e.target.value = ''; });

    closeBtn.addEventListener('click', () => modalFotos.style.display = 'none');
    window.addEventListener('click', (event) => { if (event.target === modalFotos) modalFotos.style.display = 'none'; });

    // --- 6. INICIALIZACIÓN ---
    const inicializarApp = async () => {
        cargarFiltroEstados();
        await cargarOpcionesTipoTramite(choicesTipoTramite, 'Todos los Tipos');
        await cargarOpcionesTipoTramite(choicesFormularioTramite, 'Seleccione un tipo...');

        // Comprobamos si venimos de un enlace directo
        if (window.location.hash) {
            await manejarEnlaceDirecto();
        } else {
            // Si no, cargamos la app normalmente
            resetApp();
        }
    };
    inicializarApp();
});