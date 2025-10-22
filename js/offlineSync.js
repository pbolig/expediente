// Archivo: js/offlineSync.js

class OfflineSyncManager {
    constructor() {
        this.db = null;
        this.dbName = 'expedientes-offline';
        this.storeName = 'peticiones-pendientes';
        this._openDB();
    }

    _openDB() {
        const request = indexedDB.open(this.dbName, 1);
        request.onerror = (event) => { 
            console.error('[OfflineSync] Error al abrir IndexedDB:', event.target.error); 
        };
        request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('[OfflineSync] Base de datos offline lista.');
        };
        request.onupgradeneeded = (event) => {
            event.target.result.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        };
    }

    // Convierte un File a Base64
    async _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Guarda una petición y devuelve una promesa
    async saveRequest(url, method, body) {
        if (!this.db) {
            console.error('[OfflineSync] Base de datos no disponible');
            return Promise.reject('La base de datos offline no está disponible.');
        }

        const bodyObject = {};
        const files = [];
        
        console.log('[OfflineSync] Procesando FormData...');
        
        // Procesamos el FormData
        for (let [key, value] of body.entries()) {
            if (value instanceof File) {
                console.log(`[OfflineSync] Convirtiendo archivo: ${value.name}`);
                // Convertimos el archivo a Base64
                try {
                    const base64 = await this._fileToBase64(value);
                    files.push({ 
                        key, 
                        name: value.name,
                        type: value.type,
                        size: value.size,
                        data: base64
                    });
                    console.log(`[OfflineSync] ✅ Archivo convertido: ${value.name} (${value.size} bytes)`);
                } catch (error) {
                    console.error(`[OfflineSync] ❌ Error al convertir archivo ${value.name}:`, error);
                    throw error;
                }
            } else { 
                bodyObject[key] = value; 
            }
        }
        
        const requestData = { 
            url, 
            method, 
            body: bodyObject, 
            files, 
            timestamp: new Date().toISOString() 
        };
        
        console.log(`[OfflineSync] Guardando petición con ${files.length} archivo(s)`);
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.add(requestData);
            request.onsuccess = () => {
                console.log(`[OfflineSync] ✅ Petición guardada en IndexedDB con ${files.length} archivo(s).`);
                resolve();
            };
            request.onerror = (event) => {
                console.error('[OfflineSync] ❌ ERROR al guardar en IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }
}