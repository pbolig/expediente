class AutocompleteTagger {
    constructor(options) {
        // --- 1. CONFIGURACIÓN ---
        this.inputEl = options.inputEl;
        this.tagsEl = options.tagsEl;
        this.resultsEl = options.resultsEl;
        this.buttonEl = options.buttonEl;
        this.apiEndpoint = options.apiEndpoint;

        // Nuevas referencias para el modal
        this.modalContacto = options.modalContacto;
        this.contactoEmailInput = options.contactoEmailInput;

        this.seleccionados = [];
        this._bindEvents();
    }

    // --- 2. MÉTODOS PRIVADOS (LÓGICA INTERNA) ---

    // Dibuja las "etiquetas" de los emails seleccionados
    _renderizarTags() {
        this.tagsEl.innerHTML = '';
        this.seleccionados.forEach(email => {
            const tag = document.createElement('span');
            tag.classList.add('tag');
            tag.textContent = email;
            
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-tag');
            removeBtn.textContent = '×';
            removeBtn.onclick = () => {
                this.seleccionados = this.seleccionados.filter(e => e !== email);
                this._renderizarTags();
            };
            
            tag.appendChild(removeBtn);
            this.tagsEl.appendChild(tag);
        });
    }

    // Valida la sintaxis de un email
    _esEmailValido(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // Conecta todos los eventos
    _bindEvents() {
        this.inputEl.addEventListener('input', async () => {
            const searchTerm = this.inputEl.value;
            this.buttonEl.style.display = 'none';
            this.resultsEl.innerHTML = '';
            this.resultsEl.style.display = 'none';

            if (searchTerm.length < 1) return;

            this.resultsEl.style.display = 'block';

            try {
                const response = await fetch(`${this.apiEndpoint}?search=${searchTerm}`);
                if (response.ok) {
                    const contactos = await response.json();
                    if (contactos.length > 0) {
                        contactos.forEach(contacto => {
                            const item = document.createElement('div');
                            item.classList.add('autocomplete-item');
                            item.textContent = contacto.nombre ? `${contacto.nombre} (${contacto.email})` : contacto.email;
                            item.onclick = () => {
                                this.add(contacto.email);
                                this.inputEl.value = '';
                                this.resultsEl.style.display = 'none';
                            };
                            this.resultsEl.appendChild(item);
                        });
                    } else {
                        if (this._esEmailValido(searchTerm)) {
                            this.buttonEl.style.display = 'block';
                            this.resultsEl.style.display = 'none'; // Ocultamos la caja vacía
                        }
                    }
                }
            } catch (error) { console.error('Error en autocompletado:', error); }
        });

        this.buttonEl.addEventListener('click', () => {
            const emailEscrito = this.inputEl.value;
            if (this._esEmailValido(emailEscrito)) {
                this.contactoEmailInput.value = emailEscrito;
                this.modalContacto.style.display = 'block';
                this.resultsEl.style.display = 'none'; // Ocultamos la lista por si acaso
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-component')) { // Asegúrate de que tu contenedor principal tenga esta clase
                this.resultsEl.style.display = 'none';
            }
        });
    }

    // --- 3. MÉTODOS PÚBLICOS (PARA USAR DESDE AFUERA) ---

    // Añade un email a la lista de seleccionados
    add(email) {
        if (email && !this.seleccionados.includes(email)) {
            this.seleccionados.push(email);
            this._renderizarTags();
        }
    }
    
    // Devuelve el array de emails seleccionados
    getValue() {
        return this.seleccionados;
    }

    // Limpia el componente
    clear() {
        this.seleccionados = [];
        this._renderizarTags();
        this.inputEl.value = '';
    }
}