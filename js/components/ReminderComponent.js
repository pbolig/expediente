// Archivo: js/components/ReminderComponent.js (Versión Final)

class ReminderComponent {
    constructor(options) {
        this.container = document.getElementById(options.containerId);
        this.tagger = options.taggerInstance;

        this.checkbox = this.container.querySelector('#check-fecha-limite');
        this.fieldsContainer = this.container.querySelector('#reminder-fields'); // Corregido para apuntar al nuevo div
        this.frecuenciaSelect = this.container.querySelector('#frecuencia-recordatorio');
        this.fechaLimiteInput = this.container.querySelector('#fecha-limite-edicion');
        
        this.accordionContent = this.container.closest('.accordion-content');

        // --- INICIALIZACIÓN DE CHOICES.JS PARA LA FRECUENCIA ---
        this.choicesFrecuencia = new Choices(this.frecuenciaSelect, {
            searchEnabled: false,
            itemSelectText: '',
            shouldSort: false,
        });

        this._bindEvents();
    }

    _bindEvents() {
        this.checkbox.addEventListener('change', () => {
            const isChecked = this.checkbox.checked;
            this.fieldsContainer.style.display = isChecked ? 'block' : 'none';
            if (!isChecked) {
                this.clear();
            }
            this._actualizarAlturaAcordeon();
        });
    }

    _actualizarAlturaAcordeon() {
        if (this.accordionContent && this.accordionContent.style.maxHeight !== '0px') {
            requestAnimationFrame(() => { // Esperamos al siguiente frame para que el DOM se actualice
                this.accordionContent.style.maxHeight = this.accordionContent.scrollHeight + "px";
            });
        }
    }

    getValue() {
        if (!this.checkbox.checked) {
            return { fechaLimite: null, destinatarios: [], frecuencia: null };
        }
        return {
            fechaLimite: this.fechaLimiteInput.value,
            destinatarios: this.tagger.getValue(),
            frecuencia: this.choicesFrecuencia.getValue(true) // Leemos el valor desde Choices.js
        };
    }

    clear() {
        this.checkbox.checked = false;
        this.fieldsContainer.style.display = 'none';
        this.tagger.clear();
        this.fechaLimiteInput.value = '';
        this.choicesFrecuencia.setChoiceByValue('unico'); // Reseteamos a "Una sola vez"
        this._actualizarAlturaAcordeon();
    }

    setData(acontecimiento) {
        if (acontecimiento.fecha_limite) {
            this.checkbox.checked = true;
            this.fieldsContainer.style.display = 'block';
            this.fechaLimiteInput.value = acontecimiento.fecha_limite.split('T')[0];
            this.choicesFrecuencia.setChoiceByValue(acontecimiento.frecuencia_recordatorio || 'unico');
            const emails = JSON.parse(acontecimiento.destinatario_email || '[]');
            this.tagger.add(emails);
            this._actualizarAlturaAcordeon();
        } else {
            this.clear();
        }
    }
}