// js/app.js (Versión Final y Completa)

const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    const registroExpedienteSection = document.getElementById('registro-expediente');
    const inputFoto = document.getElementById('input-foto');
    const fotosPrevisualizacion = document.getElementById('fotos-previsualizacion');
    const formulario = document.getElementById('formulario-expediente');
    const formularioBusqueda = document.getElementById('formulario-busqueda');
    const campoBusqueda = document.getElementById('campo-busqueda');
    const resultadosBusqueda = document.getElementById('resultados-busqueda');
    const selectTipoTramite = document.getElementById('tipo-tramite');
    const btnTomarFoto = document.getElementById('btn-tomar-foto');
    const modalFotos = document.getElementById('modal-fotos');
    const fotosModalBody = document.getElementById('fotos-modal-body');
    const closeBtn = document.querySelector('.close-btn');
    const panelConsulta = document.getElementById('panel-consulta');
    const panelEdicion = document.getElementById('panel-edicion');
    const formularioEdicion = document.getElementById('formulario-edicion');
    const expedienteIdEdicion = document.getElementById('expediente-id-edicion');
    const descripcionEdicion = document.getElementById('descripcion-edicion');
    const inputFotoEdicion = document.getElementById('input-foto-edicion');
    const fotosPrevisualizacionEdicion = document.getElementById('fotos-previsualizacion-edicion');
    const selectEstadoEdicion = document.getElementById('estado-edicion');
    const btnAdjuntarEdicion = document.getElementById('btn-adjuntar-edicion');
    const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
    const btnVolverBusqueda = document.getElementById('btn-volver-busqueda');
    const accordionHeader = document.querySelector('.accordion-header');
    const grillaAcontecimientos = document.getElementById('grilla-acontecimientos');
    const filtroEstado = document.getElementById('filtro-estado');
    const filtroTipoTramite = document.getElementById('filtro-tipo-tramite');
    const btnVoz = document.getElementById('btn-reconocimiento-voz');
    const descripcionTextarea = document.getElementById('descripcion');

    // --- Variables de Estado ---
    const fotosTomadas = [];
    const fotosEdicion = [];

    // Opciones de configuración para nuestros filtros
    const choicesOptions = {
        itemSelectText: 'Seleccionar',
        searchEnabled: false, // No necesitamos una caja de búsqueda en nuestros filtros
        shouldSort: false, // Mantenemos el orden original de las opciones
        allowHTML: true,
    };

    // Creamos las nuevas instancias de Choices.js
    const choicesEstado = new Choices(filtroEstado, choicesOptions);
    const choicesTipoTramite = new Choices(filtroTipoTramite, choicesOptions);

    // --- Funciones para Poblar los Nuevos Filtros ---
    const cargarFiltroEstados = () => {
        // Limpiamos opciones existentes antes de cargar
        choicesEstado.clearStore();
        const estados = [
            { value: '', label: 'Todos los Estados', selected: true },
            { value: 'en-espera', label: 'En Espera' },
            { value: 'iniciado', label: 'Iniciado' },
            { value: 'finalizado', label: 'Finalizado' }
        ];
        choicesEstado.setChoices(estados, 'value', 'label', false);
    };

    const cargarOpcionesTipoTramite = async (choicesInstance, selectElement) => {
        try {
            const response = await fetch(`${API_URL}/api/tipos-tramite`);
            if (response.ok) {
                const tipos = await response.json();
                
                // Limpiamos opciones existentes
                if (choicesInstance) choicesInstance.clearStore();
                else selectElement.innerHTML = '';
                
                const opciones = [{ value: '', label: 'Todos los Tipos', selected: true }];
                tipos.forEach(tipo => {
                    opciones.push({ value: tipo.id, label: tipo.nombre });
                });

                if (choicesInstance) {
                    choicesInstance.setChoices(opciones, 'value', 'label', false);
                } else { // Para el select normal del formulario de registro
                     opciones.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt.value;
                        option.textContent = opt.label;
                        selectElement.appendChild(option);
                     });
                }
            }
        } catch (error) { console.error('Error al cargar tipos de trámite:', error); }
    };

    // Comprobamos si el navegador es compatible
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        let isListening = false;

        // Configuración del reconocimiento
        recognition.lang = 'es-AR'; // Español (Argentina) ¡Muy importante para el acento!
        recognition.continuous = true; // Sigue escuchando hasta que lo paremos
        recognition.interimResults = false; // Solo nos da el resultado final

        // Evento que se dispara cuando el reconocimiento detecta voz y la convierte a texto
        recognition.onresult = (event) => {
            let textoFinal = '';
            for (const resultado of event.results) {
                textoFinal += resultado[0].transcript;
            }
            // Agregamos el texto reconocido al final del textarea, con un espacio
            descripcionTextarea.value += (descripcionTextarea.value.length > 0 ? ' ' : '') + textoFinal;
        };

        // Evento para manejar errores
        recognition.onerror = (event) => {
            console.error('Error en el reconocimiento de voz:', event.error);
        };

        // Evento que se dispara cuando el reconocimiento termina
        recognition.onend = () => {
            isListening = false;
            btnVoz.classList.remove('escuchando');
            console.log('Reconocimiento de voz detenido.');
        };

        // Manejador del clic en el botón del micrófono
        btnVoz.addEventListener('click', () => {
            if (isListening) {
                recognition.stop(); // Si está escuchando, lo paramos
            } else {
                try {
                    recognition.start(); // Si no está escuchando, lo iniciamos
                    isListening = true;
                    btnVoz.classList.add('escuchando');
                    console.log('Iniciando reconocimiento de voz...');
                } catch (error) {
                    console.error("Error al iniciar el reconocimiento:", error);
                    alert("No se pudo iniciar el reconocimiento de voz. Puede que ya esté activo en otra pestaña.");
                }
            }
        });

    } else {
        // Si el navegador no es compatible, ocultamos el botón
        console.warn('La API de Reconocimiento de Voz no es compatible con este navegador.');
        btnVoz.style.display = 'none';
    }

    // --- Funciones Utilitarias ---
    const obtenerIconoArchivo = (nombreArchivo) => {
        const extension = nombreArchivo.split('.').pop().toLowerCase();
        const iconos = { 'pdf': '📄', 'doc': '📝', 'docx': '📝', 'xls': '📊', 'xlsx': '📊', 'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'zip': '🗜️', 'default': '📎' };
        return iconos[extension] || iconos.default;
    };

    const esImagen = (nombreArchivo) => {
        const extensionesImagen = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        return extensionesImagen.includes(nombreArchivo.split('.').pop().toLowerCase());
    };

    const descargarArchivo = async (nombreArchivo) => {
        window.open(`${API_URL}/uploads/${nombreArchivo}`, '_blank');
    };

    // Función para actualizar la apariencia de los selects personalizados
    const actualizarCustomSelect = (selectElement) => {
        const wrapper = selectElement.parentElement;
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        wrapper.setAttribute('data-selected', selectedOption.textContent);
    };

    // Aplicamos la lógica a ambos filtros
    [filtroEstado, filtroTipoTramite].forEach(select => {
        // Lo actualizamos al cargar la página
        select.addEventListener('focus', () => { // Se asegura de que se actualice si las opciones cargan tarde
            actualizarCustomSelect(select);
        });

        // Y cada vez que el usuario cambia la opción
        select.addEventListener('change', () => {
            actualizarCustomSelect(select);
        });
    });

    const actualizarAlturaAcordeon = () => {
        if (panelEdicion.style.display === 'block' && accordionHeader.classList.contains('active')) {
            const accordionContent = accordionHeader.nextElementSibling;
            accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
        }
    };

    const manejarPrevisualizacionArchivos = (archivos, contenedor, arrayDestino) => {
        for (const archivo of archivos) {
            arrayDestino.push(archivo);
            const div = document.createElement('div');
            div.classList.add('previsualizacion-item');
            if (esImagen(archivo.name)) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(archivo);
                div.appendChild(img);
            } else {
                div.innerHTML = `<span class="file-icon">${obtenerIconoArchivo(archivo.name)}</span>`;
            }
            const btnEliminar = document.createElement('button');
            btnEliminar.classList.add('btn-eliminar-preview');
            btnEliminar.innerHTML = '×';
            btnEliminar.onclick = () => {
                const index = arrayDestino.indexOf(archivo);
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
    
    // --- Funciones de Lógica y UI ---
    const cargarTiposTramite = async () => {
        try {
            const response = await fetch(`${API_URL}/api/tipos-tramite`);
            if (response.ok) {
                const tipos = await response.json();
                tipos.forEach(tipo => {
                    const option = document.createElement('option');
                    option.value = tipo.id;
                    option.textContent = tipo.nombre;
                    selectTipoTramite.appendChild(option);
                });
            }
        } catch (error) { console.error('Error al cargar tipos de trámite:', error); }
    };

    const buscarExpedientes = async (termino, estado, tipoTramite, page = 1) => {
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
                btn.addEventListener('click', () => buscarExpedientes(
                    campoBusqueda.value,
                    choicesEstado.getValue(true),
                    choicesTipoTramite.getValue(true),
                    pagina
                ));
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
            
            data.acontecimientos.forEach(acontecimiento => {
                const div = document.createElement('div');
                div.classList.add('acontecimiento-item');
                const fecha = new Date(acontecimiento.fecha_hora).toLocaleString('es-ES');
                div.innerHTML = `
                    <div class="acontecimiento-header">
                        <h4>Acontecimiento #${acontecimiento.num_acontecimiento}</h4> 
                        <span class="fecha">${fecha}</span>
                    </div>
                    <div class="acontecimiento-content">
                        <p><strong>Descripción:</strong> ${acontecimiento.descripcion || 'N/A'}</p>
                        <p><strong>Estado:</strong> ${acontecimiento.nuevo_estado || 'N/A'}</p>
                    </div>
                    <div class="acontecimiento-actions">
                        <button class="btn btn-outline btn-ver-archivos" data-acontecimiento-id="${acontecimiento.id}" data-expediente-id="${expedienteId}">
                            📁 Ver Archivos
                        </button>
                        <button class="btn btn-secondary btn-editar-acontecimiento" data-acontecimiento-id="${acontecimiento.id}">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger btn-eliminar-acontecimiento" data-acontecimiento-id="${acontecimiento.id}">
                            🗑️ Eliminar
                        </button>
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
            modalFotos.style.display = 'block';
            return;
        }
    
        archivos.forEach(archivo => {
            const div = document.createElement('div');
            div.classList.add('contenedor-archivo');
            if (esImagen(archivo.nombre_archivo)) {
                div.innerHTML = `<img src="${API_URL}/uploads/${archivo.nombre_archivo}" alt="${archivo.nombre_archivo}">`;
            } else {
                div.innerHTML = `<span class="file-icon">${obtenerIconoArchivo(archivo.nombre_archivo)}</span><p>${archivo.nombre_archivo}</p>`;
            }
            const btnDescargar = document.createElement('button');
            btnDescargar.classList.add('btn', 'btn-outline');
            btnDescargar.textContent = 'Descargar';
            btnDescargar.onclick = () => descargarArchivo(archivo.nombre_archivo);
            div.appendChild(btnDescargar);
            fotosModalBody.appendChild(div);
        });
    
        modalFotos.style.display = 'block';
    };

    const enviarFormulario = async (event) => {
        event.preventDefault();
        const tipoTramite = selectTipoTramite.value;
        const descripcion = document.getElementById('descripcion').value;
        if (fotosTomadas.length === 0) {
            alert('Por favor, adjunte al menos un documento.');
            return;
        }
        const formData = new FormData();
        formData.append('tipoTramite', tipoTramite);
        formData.append('descripcion', descripcion);
        fotosTomadas.forEach((foto, index) => {
            formData.append(`foto-${index}`, foto);
        });
        try {
            const response = await fetch(`${API_URL}/api/tramites`, {
                method: 'POST', body: formData
            });
            if (response.ok) {
                const resultado = await response.json();
                console.log('Expediente guardado con éxito:', resultado);
                alert(`Expediente ${resultado.numero_expediente} guardado con éxito!`);
                formulario.reset();
                fotosPrevisualizacion.innerHTML = '';
                fotosTomadas.length = 0;
            } else {
                console.error('Error al guardar el expediente:', response.statusText);
                alert('Hubo un error al guardar el expediente.');
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('No se pudo conectar con el servidor.');
        }
    };
    
    const enviarAcontecimiento = async (event) => {
        event.preventDefault();
        const expedienteId = expedienteIdEdicion.value;
        if (!expedienteId) {
            alert("Error: No se ha seleccionado un expediente.");
            return;
        }
        const numeroExpediente = document.querySelector('#panel-edicion .panel-header h2').textContent.split(': ')[1];
        if (!numeroExpediente) {
            alert("Error: No se pudo leer el número de expediente.");
            return;
        }
        const formData = new FormData();
        formData.append('descripcionAcontecimiento', descripcionEdicion.value);
        formData.append('nuevoEstado', selectEstadoEdicion.value);
        formData.append('numeroExpediente', numeroExpediente);
        fotosEdicion.forEach((foto, index) => {
            formData.append(`foto-${index}`, foto);
        });
        try {
            const response = await fetch(`${API_URL}/api/acontecimientos/${expedienteId}`, { method: 'POST', body: formData });
            if (response.ok) {
                alert('Acontecimiento guardado con éxito.');
                formularioEdicion.reset();
                fotosPrevisualizacionEdicion.innerHTML = '';
                fotosEdicion.length = 0;
                if (accordionHeader.classList.contains('active')) accordionHeader.click();
                await mostrarAcontecimientos(expedienteId, 1);
            } else {
                const errorData = await response.json();
                alert(`Hubo un error al guardar: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('No se pudo conectar con el servidor.');
        }
    };
    
    // --- Event Listeners ---
    
    formularioBusqueda.addEventListener('submit', (event) => {
        event.preventDefault();
        buscarExpedientes(
            campoBusqueda.value,
            choicesEstado.getValue(true), // Usamos el método de Choices.js para obtener el valor
            choicesTipoTramite.getValue(true),
            1
        );
    });

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
    
        if (boton.classList.contains('btn-ver-archivos')) {
            try {
                boton.disabled = true;
                boton.innerHTML = '⏳ Cargando...';
                const response = await fetch(`${API_URL}/api/acontecimientos/${acontecimientoId}/fotos`);
                if (response.ok) {
                    const archivos = await response.json();
                    mostrarArchivosEnModal(archivos, `Archivos del Acontecimiento #${acontecimientoId}`);
                } else {
                    alert('No se pudieron obtener los archivos.');
                }
            } catch (error) {
                console.error('Error de red:', error);
                alert('No se pudo conectar con el servidor.');
            } finally {
                boton.disabled = false;
                boton.innerHTML = '📁 Ver Archivos';
            }
        }
    
        if (boton.classList.contains('btn-editar-acontecimiento')) {
            alert(`Funcionalidad 'Editar' para el acontecimiento #${acontecimientoId} pendiente de implementar.`);
        }
    
        if (boton.classList.contains('btn-eliminar-acontecimiento')) {
            if (confirm(`¿Está seguro de que desea eliminar el acontecimiento #${acontecimientoId}?`)) {
                alert(`Funcionalidad 'Eliminar' pendiente de implementar.`);
            }
        }
    });
    
    formulario.addEventListener('submit', enviarFormulario);
    formularioEdicion.addEventListener('submit', enviarAcontecimiento);
    
    btnVolverBusqueda.addEventListener('click', () => {
        panelEdicion.style.display = 'none';
        panelConsulta.style.display = 'block';
        registroExpedienteSection.style.display = 'block';
    });

    btnCancelarEdicion.addEventListener('click', () => {
        panelEdicion.style.display = 'none';
        panelConsulta.style.display = 'block';
        registroExpedienteSection.style.display = 'block';
    });

    if (accordionHeader) {
        accordionHeader.addEventListener('click', () => {
            accordionHeader.classList.toggle('active');
            const content = accordionHeader.nextElementSibling;
            content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
        });
    }

    btnTomarFoto.addEventListener('click', () => inputFoto.click());
    inputFoto.addEventListener('change', (e) => manejarPrevisualizacionArchivos(e.target.files, fotosPrevisualizacion, fotosTomadas));
    
    btnAdjuntarEdicion.addEventListener('click', () => inputFotoEdicion.click());
    inputFotoEdicion.addEventListener('change', (e) => manejarPrevisualizacionArchivos(e.target.files, fotosPrevisualizacionEdicion, fotosEdicion));

    closeBtn.addEventListener('click', () => modalFotos.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === modalFotos) {
            modalFotos.style.display = 'none';
        }
    });

    // --- Inicialización ---
    cargarFiltroEstados();
    cargarOpcionesTipoTramite(choicesTipoTramite);
    cargarOpcionesTipoTramite(null, selectTipoTramite); // Para el select normal, no pasamos instancia de Choices
    buscarExpedientes('', '', '', 1);
});