// js/app.js

const API_URL = 'http://localhost:3000';

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
    const accordionHeader = document.querySelector('.accordion-header');
    
    // Referencias a la grilla de acontecimientos
    const grillaAcontecimientos = document.getElementById('grilla-acontecimientos');

    const fotosTomadas = []; // Almacena fotos del formulario principal
    const fotosEdicion = []; // Almacena fotos del formulario de edición

    // --- Funciones Utilitarias ---
    
    const obtenerIconoArchivo = (nombreArchivo, tipoMime = '') => {
        const extension = nombreArchivo.split('.').pop().toLowerCase();
        const iconos = {
            'pdf': '📄', 'doc': '📝', 'docx': '📝', 'txt': '📝', 'rtf': '📝',
            'xls': '📊', 'xlsx': '📊', 'csv': '📊', 'ppt': '📊', 'pptx': '📊',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'bmp': '🖼️', 'svg': '🖼️',
            'mp3': '🎵', 'wav': '🎵', 'mp4': '🎬', 'avi': '🎬',
            'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️',
            'default': '📎'
        };
        return iconos[extension] || iconos.default;
    };

    const esImagen = (nombreArchivo, tipoMime = '') => {
        const extensionesImagen = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        const extension = nombreArchivo.split('.').pop().toLowerCase();
        return extensionesImagen.includes(extension) || tipoMime.startsWith('image/');
    };

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
                <button class="btn btn-outline btn-ver-acontecimientos" data-expediente-id="${expediente.id}">Ver Detalles</button>
            `;
            resultadosBusqueda.appendChild(expedienteDiv);
        });
    };

    const mostrarAcontecimientos = async (expedienteId, page = 1) => {
        try {
            const response = await fetch(`${API_URL}/api/acontecimientos/${expedienteId}?page=${page}`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            grillaAcontecimientos.innerHTML = '';
            
            if (!data.acontecimientos || data.acontecimientos.length === 0) {
                grillaAcontecimientos.innerHTML = '<p class="no-data">No hay acontecimientos para este expediente.</p>';
                return;
            }
            
            data.acontecimientos.forEach(acontecimiento => {
                const acontecimientoDiv = document.createElement('div');
                acontecimientoDiv.classList.add('acontecimiento-item');
                
                const fechaFormateada = new Date(acontecimiento.fecha_hora).toLocaleString('es-ES', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
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
                        <button class="btn btn-outline btn-ver-archivos" data-acontecimiento-id="${acontecimiento.id}" data-expediente-id="${expedienteId}">
                            📁 Ver Archivos
                        </button>
                        <button class="btn btn-secondary btn-editar-acontecimiento" data-acontecimiento-id="${acontecimiento.id}">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger btn-eliminar-acontecimiento" data-acontecimiento-id="${acontecimiento.id}">
                            🗑️ Eliminar
                        </button>
                    </div>
                `;
                
                grillaAcontecimientos.appendChild(acontecimientoDiv);
            });
            
            if (data.total_pages && data.total_pages > 1) {
                mostrarPaginacion(data.current_page, data.total_pages, expedienteId);
            }
            
        } catch (error) {
            console.error('Error de red al cargar acontecimientos:', error);
            grillaAcontecimientos.innerHTML = `
                <div class="error-message">
                    <p>Error al cargar acontecimientos: ${error.message}</p>
                </div>
            `;
        }
    };

    const mostrarPaginacion = (currentPage, totalPages, expedienteId) => {
        const paginacionContainer = document.getElementById('paginacion-acontecimientos');
        if (!paginacionContainer) return;
    
        paginacionContainer.innerHTML = '';
    
        const crearBoton = (texto, pagina, clases = [], deshabilitado = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = texto;
            btn.disabled = deshabilitado;
            btn.classList.add('btn-paginacion', ...clases);
            btn.addEventListener('click', () => mostrarAcontecimientos(expedienteId, pagina));
            return btn;
        };
    
        const controlesDiv = document.createElement('div');
        controlesDiv.classList.add('pagination-controls');
    
        if (currentPage > 1) {
            controlesDiv.appendChild(crearBoton('« Anterior', currentPage - 1));
        }
    
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
    
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage ? ['active'] : [];
            controlesDiv.appendChild(crearBoton(i, i, isActive, isActive.length > 0));
        }
    
        if (currentPage < totalPages) {
            controlesDiv.appendChild(crearBoton('Siguiente »', currentPage + 1));
        }
    
        paginacionContainer.appendChild(controlesDiv);
    
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('pagination-info');
        infoDiv.textContent = `Página ${currentPage} de ${totalPages}`;
        paginacionContainer.appendChild(infoDiv);
    };
    
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
    
    const mostrarArchivosEnModal = (archivos, tituloModal, expedienteId, acontecimientoId) => {
        fotosModalBody.innerHTML = '';
        document.querySelector('#modal-fotos h2').textContent = tituloModal;
        
        if (archivos.length === 0) {
            fotosModalBody.innerHTML = '<p class="no-archivos">No hay archivos para este acontecimiento.</p>';
            modalFotos.style.display = 'block';
            return;
        }

        const imagenes = archivos.filter(archivo => esImagen(archivo.nombre_archivo));
        const otrosArchivos = archivos.filter(archivo => !esImagen(archivo.nombre_archivo));

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
                
                const btnDescargar = document.createElement('button');
                btnDescargar.classList.add('btn-descargar-archivo');
                btnDescargar.innerHTML = '⬇️ Descargar';
                btnDescargar.onclick = () => descargarArchivo(imagen.nombre_archivo, expedienteId, acontecimientoId);
                
                const infoImagen = document.createElement('div');
                infoImagen.classList.add('info-archivo');
                infoImagen.innerHTML = `<span class="nombre-archivo">${imagen.nombre_archivo}</span> ${btnDescargar.outerHTML}`;
                
                contenedorImagen.appendChild(imgElement);
                contenedorImagen.appendChild(infoImagen);
                galeriaImagenes.appendChild(contenedorImagen);
            });
            
            seccionImagenes.appendChild(galeriaImagenes);
            fotosModalBody.appendChild(seccionImagenes);
        }

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
                
                const btnDescargar = document.createElement('button');
                btnDescargar.classList.add('btn');
                btnDescargar.innerHTML = '⬇️ Descargar';
                btnDescargar.onclick = () => descargarArchivo(archivo.nombre_archivo, expedienteId, acontecimientoId);

                itemArchivo.innerHTML = `
                    <div class="info-archivo-completa">
                        <span class="icono-archivo">${icono}</span>
                        <div class="detalles-archivo">
                            <span class="nombre-archivo">${archivo.nombre_archivo}</span>
                            <span class="tipo-archivo">${extension}</span>
                        </div>
                        ${btnDescargar.outerHTML}
                    </div>
                `;
                listaArchivos.appendChild(itemArchivo);
            });
            
            seccionOtrosArchivos.appendChild(listaArchivos);
            fotosModalBody.appendChild(seccionOtrosArchivos);
        }

        modalFotos.style.display = 'block';
    };

    const cerrarModal = () => {
        modalFotos.style.display = 'none';
    };

    // --- MANEJO DE ARCHIVOS Y EVENT LISTENERS ---

    const manejarPrevisualizacionArchivos = (archivos, contenedor, arrayDestino) => {
        if (!archivos || archivos.length === 0) return;
    
        for (const archivo of archivos) {
            arrayDestino.push(archivo);
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
                previsualizacionDiv.appendChild(fileIcon);
            }
    
            const btnEliminar = document.createElement('button');
            btnEliminar.classList.add('btn-eliminar-preview');
            btnEliminar.innerHTML = '×';
            btnEliminar.onclick = () => {
                const index = arrayDestino.indexOf(archivo);
                if (index > -1) {
                    arrayDestino.splice(index, 1);
                    previsualizacionDiv.remove();

                    if (contenedor.id === 'fotos-previsualizacion-edicion') {
                        actualizarAlturaAcordeon();
                    }

                    console.log(`Archivo eliminado. Total restantes: ${arrayDestino.length}`);
                }
            };
            previsualizacionDiv.appendChild(btnEliminar);
            contenedor.appendChild(previsualizacionDiv);

            // --- LLAMADA AL ACTUALIZAR ALTURA (al agregar) ---
            if (contenedor.id === 'fotos-previsualizacion-edicion') {
                actualizarAlturaAcordeon();
            }
        }
        console.log(`Archivos añadidos. Total actual: ${arrayDestino.length}`);
    };
    
    btnTomarFoto.addEventListener('click', () => { inputFoto.click(); });
    inputFoto.addEventListener('change', (event) => {
        manejarPrevisualizacionArchivos(event.target.files, fotosPrevisualizacion, fotosTomadas);
        event.target.value = '';
    });
    
    btnAdjuntarEdicion.addEventListener('click', () => { inputFotoEdicion.click(); });
    inputFotoEdicion.addEventListener('change', (event) => {
        manejarPrevisualizacionArchivos(event.target.files, fotosPrevisualizacionEdicion, fotosEdicion);
        event.target.value = '';
    });
    
    formulario.addEventListener('submit', enviarFormulario);
    formularioBusqueda.addEventListener('submit', (event) => {
        event.preventDefault();
        const terminoBusqueda = campoBusqueda.value;
        buscarExpedientes(terminoBusqueda);
    });

    resultadosBusqueda.addEventListener('click', async (event) => {
        const botonClickeado = event.target.closest('.btn-ver-acontecimientos');
        if (botonClickeado) {
            const expedienteId = botonClickeado.dataset.expedienteId;
            panelConsulta.style.display = 'none';
            panelEdicion.style.display = 'block';

            document.getElementById('registro-expediente').style.display = 'none';

            await cargarExpedienteParaEdicion(expedienteId);
            await mostrarAcontecimientos(expedienteId, 1);
        }
    });

    const btnVolverBusqueda = document.getElementById('btn-volver-busqueda');
        btnVolverBusqueda.addEventListener('click', () => {
            panelEdicion.style.display = 'none';
            panelConsulta.style.display = 'block';
            document.getElementById('registro-expediente').style.display = 'block';
        });

    // --- LÓGICA PARA EL ACORDEÓN (Función de ayuda nueva) ---
    const actualizarAlturaAcordeon = () => {
        // Solo actualizamos si el acordeón está visible y activo
        if (panelEdicion.style.display === 'block' && accordionHeader.classList.contains('active')) {
            const accordionContent = accordionHeader.nextElementSibling;
            accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
        }
    };

    grillaAcontecimientos.addEventListener('click', async (event) => {
        const botonClickeado = event.target.closest('button');
        if (!botonClickeado) return;

        if (botonClickeado.classList.contains('btn-ver-archivos')) {
            const acontecimientoId = botonClickeado.dataset.acontecimientoId;
            const expedienteId = botonClickeado.dataset.expedienteId;
            
            try {
                botonClickeado.disabled = true;
                botonClickeado.innerHTML = '⏳ Cargando...';
                
                const response = await fetch(`${API_URL}/api/acontecimientos/${acontecimientoId}/fotos`);
                if (response.ok) {
                    const archivos = await response.json();
                    mostrarArchivosEnModal(archivos, `Archivos del Acontecimiento #${acontecimientoId}`, expedienteId, acontecimientoId);
                } else {
                    alert('No se pudieron obtener los archivos.');
                }
            } catch (error) {
                console.error('Error de red al obtener archivos:', error);
                alert('No se pudo conectar con el servidor.');
            } finally {
                botonClickeado.disabled = false;
                botonClickeado.innerHTML = '📁 Ver Archivos';
            }
        }
        
        if (botonClickeado.classList.contains('btn-editar-acontecimiento')) {
            const acontecimientoId = botonClickeado.dataset.acontecimientoId;
            alert(`Funcionalidad de edición para el acontecimiento ${acontecimientoId} pendiente de implementar`);
        }
        
        if (botonClickeado.classList.contains('btn-eliminar-acontecimiento')) {
            const acontecimientoId = botonClickeado.dataset.acontecimientoId;
            if (confirm('¿Está seguro de que desea eliminar este acontecimiento?')) {
                alert(`Funcionalidad de eliminación para el acontecimiento ${acontecimientoId} pendiente de implementar`);
            }
        }
    });

    if (accordionHeader) {
        accordionHeader.addEventListener('click', () => {
            accordionHeader.classList.toggle('active');
            const accordionContent = accordionHeader.nextElementSibling;
            const accordionIcon = accordionHeader.querySelector('.accordion-icon');
            if (accordionContent.style.maxHeight) {
                accordionContent.style.maxHeight = null;
                accordionIcon.textContent = '+';
            } else {
                accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
                accordionIcon.textContent = '×';
            }
        });
    }

    formularioEdicion.addEventListener('submit', enviarAcontecimiento);
    btnCancelarEdicion.addEventListener('click', () => {
        panelEdicion.style.display = 'none';
        panelConsulta.style.display = 'block';
        document.getElementById('registro-expediente').style.display = 'block';
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