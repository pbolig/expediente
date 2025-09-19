// js/app.js

const API_URL = 'http://localhost:3000';
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM y Variables de Estado ---
    const inputFoto = document.getElementById('input-foto');
    const fotosPrevisualizacion = document.getElementById('fotos-previsualizacion');
    const formulario = document.getElementById('formulario-expediente');
    const formularioBusqueda = document.getElementById('formulario-busqueda');
    const campoBusqueda = document.getElementById('campo-busqueda');
    const resultadosBusqueda = document.getElementById('resultados-busqueda');
    const selectTipoTramite = document.getElementById('tipo-tramite');
    const btnTomarFoto = document.getElementById('btn-tomar-foto');

    // Referencias al modal de fotos/archivos
    const modalFotos = document.getElementById('modal-fotos');
    const fotosModalBody = document.getElementById('fotos-modal-body');
    const closeBtn = document.querySelector('.close-btn');

    // Referencias al formulario de edición (acontecimientos)
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
    const paginacionAcontecimientos = document.getElementById('paginacion-acontecimientos');
    
    // Referencias a la grilla de acontecimientos
    const grillaAcontecimientos = document.getElementById('grilla-acontecimientos');

    const fotosTomadas = []; // Almacena fotos del formulario principal
    const fotosEdicion = []; // Almacena fotos del formulario de edición

    // --- Funciones Utilitarias ---
    
    // Función para detectar el tipo de archivo y obtener el icono correspondiente
    const obtenerIconoArchivo = (nombreArchivo, tipoMime = '') => {
        const extension = nombreArchivo.split('.').pop().toLowerCase();
        const iconos = {
            // Documentos
            'pdf': '📄',
            'doc': '📝',
            'docx': '📝',
            'txt': '📝',
            'rtf': '📝',
            // Hojas de cálculo
            'xls': '📊',
            'xlsx': '📊',
            'csv': '📊',
            // Presentaciones
            'ppt': '📊',
            'pptx': '📊',
            // Imágenes
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'gif': '🖼️',
            'bmp': '🖼️',
            'svg': '🖼️',
            // Audio/Video
            'mp3': '🎵',
            'wav': '🎵',
            'mp4': '🎬',
            'avi': '🎬',
            // Archivos comprimidos
            'zip': '🗜️',
            'rar': '🗜️',
            '7z': '🗜️',
            // Por defecto
            'default': '📎'
        };
        return iconos[extension] || iconos.default;
    };

    // Función para determinar si un archivo es una imagen
    const esImagen = (nombreArchivo, tipoMime = '') => {
        const extensionesImagen = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        const extension = nombreArchivo.split('.').pop().toLowerCase();
        return extensionesImagen.includes(extension) || tipoMime.startsWith('image/');
    };

    // Función para forzar la descarga de un archivo
    const descargarArchivo = async (nombreArchivo, expedienteId, acontecimientoId) => {
        try {
            const url = `${API_URL}/api/archivos/descargar/${nombreArchivo}?expedienteId=${expedienteId}&acontecimientoId=${acontecimientoId}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error al descargar: ${response.status}`);
            }

            const blob = await response.blob();
            const urlBlob = window.URL.createObjectURL(blob);
            
            const enlaceDescarga = document.createElement('a');
            enlaceDescarga.href = urlBlob;
            enlaceDescarga.download = nombreArchivo;
            document.body.appendChild(enlaceDescarga);
            enlaceDescarga.click();
            document.body.removeChild(enlaceDescarga);
            
            window.URL.revokeObjectURL(urlBlob);
        } catch (error) {
            console.error('Error al descargar archivo:', error);
            alert(`No se pudo descargar el archivo: ${error.message}`);
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
        } catch (error) {
            console.error('Error al cargar tipos de trámite:', error);
        }
    };

    const buscarExpedientes = async (termino) => {
        try {
            const url = `${API_URL}/api/tramites?busqueda=${encodeURIComponent(termino)}`;
            const response = await fetch(url);
            if (response.ok) {
                const expedientes = await response.json();
                mostrarResultados(expedientes);
            } else {
                console.error('Error al buscar expedientes:', response.statusText);
                resultadosBusqueda.innerHTML = '<p>No se pudieron cargar los resultados.</p>';
            }
        } catch (error) {
            console.error('Error de red:', error);
            resultadosBusqueda.innerHTML = '<p>No se pudo conectar con el servidor.</p>';
        }
    };
    
    const mostrarResultados = (expedientes) => {
        resultadosBusqueda.innerHTML = '';
        if (expedientes.length === 0) {
            resultadosBusqueda.innerHTML = '<p>No se encontraron expedientes.</p>';
            return;
        }
        expedientes.forEach(expediente => {
            const expedienteDiv = document.createElement('div');
            expedienteDiv.classList.add('expediente-item');
            expedienteDiv.innerHTML = `
                <h3>Nro. Expediente: ${expediente.numero_expediente}</h3>
                <p><strong>Fecha:</strong> ${new Date(expediente.fecha_creacion).toLocaleDateString()}</p>
                <p><strong>Descripción:</strong> ${expediente.descripcion}</p>
                <p><strong>Tipo de Trámite:</strong> ${expediente.tipo_tramite_nombre}</p>
                <p><strong>Estado:</strong> ${expediente.estado}</p>
                <button class="btn-ver-acontecimientos" data-expediente-id="${expediente.id}">Ver Acontecimientos</button>
            `;
            resultadosBusqueda.appendChild(expedienteDiv);
        });
    };

    // Obtiene y muestra los acontecimientos de un expediente
    // Obtiene y muestra los acontecimientos de un expediente
    const mostrarAcontecimientos = async (expedienteId, page = 1) => {
        try {
            const response = await fetch(`${API_URL}/api/acontecimientos/${expedienteId}?page=${page}`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Limpiar la grilla
            grillaAcontecimientos.innerHTML = '';
            
            // Verificar si hay acontecimientos
            if (!data.acontecimientos || data.acontecimientos.length === 0) {
                grillaAcontecimientos.innerHTML = '<p class="no-data">No hay acontecimientos para este expediente.</p>';
                return;
            }
            
            // Crear elementos para cada acontecimiento
            data.acontecimientos.forEach(acontecimiento => {
                const acontecimientoDiv = document.createElement('div');
                acontecimientoDiv.classList.add('acontecimiento-item');
                
                // Formatear fecha de manera más legible
                const fechaFormateada = new Date(acontecimiento.fecha_hora).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                acontecimientoDiv.innerHTML = `
                    <div class="acontecimiento-header">
                        <h4>Acontecimiento #${acontecimiento.id}</h4>
                        <span class="fecha">${fechaFormateada}</span>
                    </div>
                    <div class="acontecimiento-content">
                        <p><strong>Descripción:</strong> ${acontecimiento.descripcion || 'Sin descripción'}</p>
                        <p><strong>Estado:</strong> ${acontecimiento.nuevo_estado || 'Sin estado'}</p>
                    </div>
                    <div class="acontecimiento-actions">
                        <button class="btn-ver-fotos-acontecimiento" data-acontecimiento-id="${acontecimiento.id}" data-expediente-id="${expedienteId}">
                            📁 Ver Archivos
                        </button>
                        <button class="btn-editar-acontecimiento" data-acontecimiento-id="${acontecimiento.id}">
                            ✏️ Editar
                        </button>
                        <button class="btn-eliminar-acontecimiento" data-acontecimiento-id="${acontecimiento.id}">
                            🗑️ Eliminar
                        </button>
                    </div>
                `;
                
                grillaAcontecimientos.appendChild(acontecimientoDiv);
            });
            
            // Mover la paginación fuera del forEach
            if (data.total_pages && data.total_pages > 1) {
                mostrarPaginacion(data.current_page, data.total_pages, expedienteId);
            }
            
        } catch (error) {
            console.error('Error de red al cargar acontecimientos:', error);
            
            // Mostrar mensaje de error al usuario
            grillaAcontecimientos.innerHTML = `
                <div class="error-message">
                    <p>Error al cargar acontecimientos: ${error.message}</p>
                    <button onclick="mostrarAcontecimientos(${expedienteId}, ${page})" class="btn-retry">
                        Reintentar
                    </button>
                </div>
            `;
        }
    };

    const mostrarPaginacion = (currentPage, totalPages, expedienteId) => {
        // Verificar si ya existe un contenedor de paginación
        let paginacionContainer = document.getElementById('paginacion-acontecimientos');
        
        if (!paginacionContainer) {
            // Crear el contenedor si no existe
            paginacionContainer = document.createElement('div');
            paginacionContainer.id = 'paginacion-acontecimientos';
            paginacionContainer.classList.add('paginacion');
            
            // Insertar después de grillaAcontecimientos
            grillaAcontecimientos.parentNode.insertBefore(paginacionContainer, grillaAcontecimientos.nextSibling);
        }
        
        // Limpiar contenido anterior
        paginacionContainer.innerHTML = '';
        
        // Crear controles de paginación
        let paginacionHTML = '<div class="pagination-controls">';
        
        // Botón anterior
        if (currentPage > 1) {
            paginacionHTML += `
                <button class="btn-paginacion" onclick="mostrarAcontecimientos(${expedienteId}, ${currentPage - 1})">
                    « Anterior
                </button>
            `;
        }
        
        // Números de página
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        if (startPage > 1) {
            paginacionHTML += `
                <button class="btn-paginacion" onclick="mostrarAcontecimientos(${expedienteId}, 1)">1</button>
            `;
            if (startPage > 2) {
                paginacionHTML += '<span class="pagination-dots">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            paginacionHTML += `
                <button class="btn-paginacion ${activeClass}" onclick="mostrarAcontecimientos(${expedienteId}, ${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginacionHTML += '<span class="pagination-dots">...</span>';
            }
            paginacionHTML += `
                <button class="btn-paginacion" onclick="mostrarAcontecimientos(${expedienteId}, ${totalPages})">
                    ${totalPages}
                </button>
            `;
        }
        
        if (currentPage < totalPages) {
            paginacionHTML += `
                <button class="btn-paginacion" onclick="mostrarAcontecimientos(${expedienteId}, ${currentPage + 1})">
                    Siguiente »
                </button>
            `;
        }
        
        paginacionHTML += '</div>';
        
        paginacionHTML += `
            <div class="pagination-info">
                Página ${currentPage} de ${totalPages}
            </div>
        `;
        
        paginacionContainer.innerHTML = paginacionHTML;
    };
    
    // Obtiene los detalles del expediente para llenar el formulario de edición
    const cargarExpedienteParaEdicion = async (expedienteId) => {
        try {
            const response = await fetch(`${API_URL}/api/tramites/${expedienteId}`);
            if (response.ok) {
                const expediente = await response.json();
                document.querySelector('#panel-edicion h2').textContent = `Editar Expediente: ${expediente.numero_expediente}`;
                expedienteIdEdicion.value = expediente.id;
                selectEstadoEdicion.value = expediente.estado;
                descripcionEdicion.value = '';
                fotosPrevisualizacionEdicion.innerHTML = '';
                fotosEdicion.length = 0;
            } else {
                alert('No se pudo cargar la información del expediente.');
            }
        } catch (error) {
            console.error('Error de red al cargar expediente:', error);
            alert('No se pudo conectar con el servidor.');
        }
    };

    // Envía el formulario de registro de expediente al backend
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
    
    // Envía el nuevo acontecimiento al servidor
    const enviarAcontecimiento = async (event) => {
        event.preventDefault();
        const expedienteId = expedienteIdEdicion.value;
        const numeroExpediente = document.querySelector('#panel-edicion h2').textContent.split(': ')[1];
        const descripcionAcontecimiento = descripcionEdicion.value;
        const nuevoEstado = selectEstadoEdicion.value;
        const formData = new FormData();
        formData.append('descripcionAcontecimiento', descripcionAcontecimiento);
        formData.append('nuevoEstado', nuevoEstado);
        formData.append('numeroExpediente', numeroExpediente);
        fotosEdicion.forEach((foto, index) => {
            formData.append(`foto-${index}`, foto);
        });
        try {
            const response = await fetch(`${API_URL}/api/acontecimientos/${expedienteId}`, {
                method: 'POST', body: formData
            });
            if (response.ok) {
                alert('Acontecimiento guardado con éxito.');
                formularioEdicion.reset();
                fotosPrevisualizacionEdicion.innerHTML = '';
                fotosEdicion.length = 0;
                panelEdicion.style.display = 'none';
                panelConsulta.style.display = 'block';
                buscarExpedientes('');
            } else {
                console.error('Error al guardar el acontecimiento:', response.statusText);
                alert('Hubo un error al guardar el acontecimiento.');
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('No se pudo conectar con el servidor.');
        }
    };
    
    // Muestra las fotos de un expediente en el modal
    const mostrarArchivosEnModal = (archivos, tituloModal, expedienteId, acontecimientoId) => {
        fotosModalBody.innerHTML = '';
        document.querySelector('#modal-fotos h2').textContent = tituloModal;
        
        if (archivos.length === 0) {
            fotosModalBody.innerHTML = '<p class="no-archivos">No hay archivos para este acontecimiento.</p>';
            modalFotos.style.display = 'block';
            return;
        }

        // Separar imágenes de otros archivos
        const imagenes = archivos.filter(archivo => esImagen(archivo.nombre_archivo));
        const otrosArchivos = archivos.filter(archivo => !esImagen(archivo.nombre_archivo));

        // Crear contenedor para imágenes
        if (imagenes.length > 0) {
            const seccionImagenes = document.createElement('div');
            seccionImagenes.classList.add('seccion-archivos');
            seccionImagenes.innerHTML = '<h3>📷 Imágenes</h3>';
            
            const galeriaImagenes = document.createElement('div');
            galeriaImagenes.classList.add('galeria-imagenes');
            
            imagenes.forEach(imagen => {
                const contenedorImagen = document.createElement('div');
                contenedorImagen.classList.add('contenedor-imagen');
                
                const imgElement = document.createElement('img');
                imgElement.src = `${API_URL}/uploads/${imagen.nombre_archivo}`;
                imgElement.alt = imagen.nombre_archivo;
                imgElement.loading = 'lazy';
                
                // Botón de descarga para la imagen
                const btnDescargar = document.createElement('button');
                btnDescargar.classList.add('btn-descargar-archivo');
                btnDescargar.innerHTML = '⬇️ Descargar';
                btnDescargar.onclick = () => descargarArchivo(imagen.nombre_archivo, expedienteId, acontecimientoId);
                
                const infoImagen = document.createElement('div');
                infoImagen.classList.add('info-archivo');
                infoImagen.innerHTML = `
                    <span class="nombre-archivo">${imagen.nombre_archivo}</span>
                    ${btnDescargar.outerHTML}
                `;
                
                contenedorImagen.appendChild(imgElement);
                contenedorImagen.appendChild(infoImagen);
                galeriaImagenes.appendChild(contenedorImagen);
            });
            
            seccionImagenes.appendChild(galeriaImagenes);
            fotosModalBody.appendChild(seccionImagenes);
        }

        // Crear contenedor para otros archivos
        if (otrosArchivos.length > 0) {
            const seccionOtrosArchivos = document.createElement('div');
            seccionOtrosArchivos.classList.add('seccion-archivos');
            seccionOtrosArchivos.innerHTML = '<h3>📁 Otros Archivos</h3>';
            
            const listaArchivos = document.createElement('div');
            listaArchivos.classList.add('lista-archivos');
            
            otrosArchivos.forEach(archivo => {
                const itemArchivo = document.createElement('div');
                itemArchivo.classList.add('item-archivo');
                
                const icono = obtenerIconoArchivo(archivo.nombre_archivo);
                const extension = archivo.nombre_archivo.split('.').pop().toUpperCase();
                
                itemArchivo.innerHTML = `
                    <div class="info-archivo-completa">
                        <span class="icono-archivo">${icono}</span>
                        <div class="detalles-archivo">
                            <span class="nombre-archivo">${archivo.nombre_archivo}</span>
                            <span class="tipo-archivo">${extension}</span>
                        </div>
                        <button class="btn-descargar-archivo" onclick="descargarArchivo('${archivo.nombre_archivo}', '${expedienteId}', '${acontecimientoId}')">
                            ⬇️ Descargar
                        </button>
                    </div>
                `;
                
                listaArchivos.appendChild(itemArchivo);
            });
            
            seccionOtrosArchivos.appendChild(listaArchivos);
            fotosModalBody.appendChild(seccionOtrosArchivos);
        }

        // Añadir estadísticas de archivos
        const estadisticas = document.createElement('div');
        estadisticas.classList.add('estadisticas-archivos');
        estadisticas.innerHTML = `
            <p><strong>Total de archivos:</strong> ${archivos.length} (${imagenes.length} imágenes, ${otrosArchivos.length} otros archivos)</p>
        `;
        fotosModalBody.appendChild(estadisticas);

        modalFotos.style.display = 'block';
    };

    const cerrarModal = () => {
        modalFotos.style.display = 'none';
    };
    
    // --- Event Listeners Globales ---
    btnTomarFoto.addEventListener('click', () => { inputFoto.click(); });
    
    inputFoto.addEventListener('change', (event) => {
        const archivos = event.target.files;
        if (archivos.length > 0) {
            for (const archivo of archivos) {
                fotosTomadas.push(archivo);
                const previsualizacionDiv = document.createElement('div');
                previsualizacionDiv.classList.add('previsualizacion-item');
                
                if (archivo.type.startsWith('image/')) {
                    const urlImagen = URL.createObjectURL(archivo);
                    const imgElement = document.createElement('img');
                    imgElement.src = urlImagen;
                    previsualizacionDiv.appendChild(imgElement);
                } else {
                    const fileIcon = document.createElement('span');
                    fileIcon.classList.add('file-icon');
                    fileIcon.textContent = obtenerIconoArchivo(archivo.name, archivo.type);
                    const fileName = document.createElement('p');
                    fileName.textContent = archivo.name;
                    previsualizacionDiv.appendChild(fileIcon);
                    previsualizacionDiv.appendChild(fileName);
                }
                
                // Botón para eliminar archivo de la previsualización
                const btnEliminar = document.createElement('button');
                btnEliminar.classList.add('btn-eliminar-preview');
                btnEliminar.innerHTML = '❌';
                btnEliminar.onclick = () => {
                    const index = fotosTomadas.indexOf(archivo);
                    if (index > -1) {
                        fotosTomadas.splice(index, 1);
                        previsualizacionDiv.remove();
                    }
                };
                previsualizacionDiv.appendChild(btnEliminar);
                
                fotosPrevisualizacion.appendChild(previsualizacionDiv);
            }
            console.log(`Archivos añadidos. Total de archivos: ${fotosTomadas.length}`);
            inputFoto.value = '';
        }
    });
    
    formulario.addEventListener('submit', enviarFormulario);
    formularioBusqueda.addEventListener('submit', (event) => {
        event.preventDefault();
        const terminoBusqueda = campoBusqueda.value;
        buscarExpedientes(terminoBusqueda);
    });

    // Delega los clics en el contenedor de resultados de búsqueda
    resultadosBusqueda.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-ver-acontecimientos')) {
            const expedienteId = event.target.dataset.expedienteId;
            panelConsulta.style.display = 'none';
            panelEdicion.style.display = 'block';
            await cargarExpedienteParaEdicion(expedienteId);
            await mostrarAcontecimientos(expedienteId, 1);
        }
    });

    // Delegación de eventos en la grilla de acontecimientos
    grillaAcontecimientos.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-ver-fotos-acontecimiento')) {
            const acontecimientoId = event.target.dataset.acontecimientoId;
            const expedienteId = event.target.dataset.expedienteId;
            
            try {
                // Mostrar indicador de carga
                event.target.disabled = true;
                event.target.innerHTML = '⏳ Cargando...';
                
                const response = await fetch(`${API_URL}/api/acontecimientos/${acontecimientoId}/fotos`);
                if (response.ok) {
                    const archivos = await response.json();
                    mostrarArchivosEnModal(archivos, `Archivos del Expediente #${expedienteId}, Acontecimiento #${acontecimientoId}`, expedienteId, acontecimientoId);
                } else {
                    alert('No se pudieron obtener los archivos.');
                }
            } catch (error) {
                console.error('Error de red al obtener archivos:', error);
                alert('No se pudo conectar con el servidor.');
            } finally {
                // Restaurar el botón
                event.target.disabled = false;
                event.target.innerHTML = '📁 Ver Archivos';
            }
        }
        
        // Agregar funcionalidad para editar acontecimientos
        if (event.target.classList.contains('btn-editar-acontecimiento')) {
            const acontecimientoId = event.target.dataset.acontecimientoId;
            // TODO: Implementar función de edición de acontecimientos
            alert(`Funcionalidad de edición para el acontecimiento ${acontecimientoId} pendiente de implementar`);
        }
        
        // Agregar funcionalidad para eliminar acontecimientos
        if (event.target.classList.contains('btn-eliminar-acontecimiento')) {
            const acontecimientoId = event.target.dataset.acontecimientoId;
            if (confirm('¿Está seguro de que desea eliminar este acontecimiento?')) {
                // TODO: Implementar función de eliminación de acontecimientos
                alert(`Funcionalidad de eliminación para el acontecimiento ${acontecimientoId} pendiente de implementar`);
            }
        }
    });

    // Hacer la función descargarArchivo global para que sea accesible desde los onclick
    window.descargarArchivo = descargarArchivo;
    window.mostrarAcontecimientos = mostrarAcontecimientos;

    btnAdjuntarEdicion.addEventListener('click', () => { inputFotoEdicion.click(); });
    inputFotoEdicion.addEventListener('change', (event) => {
        const archivos = event.target.files;
        if (archivos.length > 0) {
            for (const archivo of archivos) {
                fotosEdicion.push(archivo);
                const previsualizacionDiv = document.createElement('div');
                previsualizacionDiv.classList.add('previsualizacion-item');
                if (archivo.type.startsWith('image/')) {
                    const urlImagen = URL.createObjectURL(archivo);
                    const imgElement = document.createElement('img');
                    imgElement.src = urlImagen;
                    previsualizacionDiv.appendChild(imgElement);
                } else {
                    const fileIcon = document.createElement('span');
                    fileIcon.classList.add('file-icon');
                    fileIcon.textContent = '📄';
                    const fileName = document.createElement('p');
                    fileName.textContent = archivo.name;
                    previsualizacionDiv.appendChild(fileIcon);
                    previsualizacionDiv.appendChild(fileName);
                }
                fotosPrevisualizacionEdicion.appendChild(previsualizacionDiv);
            }
            console.log(`Archivos de edición añadidos. Total: ${fotosEdicion.length}`);
            inputFotoEdicion.value = '';
        }
    });
    
    formularioEdicion.addEventListener('submit', enviarAcontecimiento);
    btnCancelarEdicion.addEventListener('click', () => {
        panelEdicion.style.display = 'none';
        panelConsulta.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', cerrarModal);
    window.addEventListener('click', (event) => {
        if (event.target === modalFotos) {
            cerrarModal();
        }
    });

    // --- Inicialización ---
    cargarTiposTramite();
});