require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { enviarCorreoRecordatorio } = require('./emailService');

// --- FUNCIÓN AUXILIAR PARA CALCULAR DÍAS HÁBILES ---
function addBusinessDays(startDate, days) {
    let date = new Date(startDate);
    let added = 0;
    const direction = days > 0 ? 1 : -1; // Determina si sumamos o restamos días
    const daysAbs = Math.abs(days);      // Usamos el número absoluto de días

    while (added < daysAbs) {
        // Mueve la fecha un día en la dirección correcta
        date.setDate(date.getDate() + direction);
        
        const dayOfWeek = date.getDay();
        // Si no es fin de semana (0=Domingo, 6=Sábado), cuenta como un día hábil
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            added++;
        }
    }
    return date; // Devuelve la fecha final calculada
}

// --- TAREA PROGRAMADA (CRON JOB) ---
cron.schedule('0 8 * * *', async () => {
   //cron.schedule('* * * * *', async () => {  //Envía cada minuto el mail
   console.log('--- Ejecutando tarea diaria de recordatorios ---');
    const conn = await pool.getConnection();
    try {
        const hoy = new Date();
        
        // 1. Buscamos TODOS los acontecimientos con fecha límite en el futuro y que tengan destinatario
        const [acontecimientos] = await conn.execute(
            "SELECT * FROM acontecimientos WHERE fecha_limite >= CURDATE() AND destinatario_email IS NOT NULL AND destinatario_email != '[]'"
        );

        if (acontecimientos.length === 0) {
            console.log('No hay acontecimientos con recordatorios activos.');
            return;
        }

        console.log(`Revisando ${acontecimientos.length} acontecimientos con recordatorios activos.`);

        // 2. Para cada uno, aplicamos la lógica de frecuencia
        for (const acontecimiento of acontecimientos) {

            console.log(`\n[DEBUG] Procesando Acontecimiento ID: ${acontecimiento.id}`);
            console.log(`[DEBUG]   -> Frecuencia: ${acontecimiento.frecuencia_recordatorio}`);
            console.log(`[DEBUG]   -> Fecha Límite (DB): ${acontecimiento.fecha_limite}`);
            console.log(`[DEBUG]   -> Recordatorio Enviado (DB): ${acontecimiento.recordatorio_enviado_el}`);


            const fechaLimite = new Date(acontecimiento.fecha_limite);
            const fechaEnvioOriginal = addBusinessDays(fechaLimite, -3);

            console.log(`[DEBUG]   -> Hoy es: ${hoy.toDateString()}`);
            console.log(`[DEBUG]   -> Fecha de envío calculada: ${fechaEnvioOriginal.toDateString()}`);
            
            let enviarHoy = false;

            switch (acontecimiento.frecuencia_recordatorio) {
                case 'unico':
                    // Si hoy es el día de envío y nunca se ha enviado
                    if (hoy.toDateString() === fechaEnvioOriginal.toDateString() && !acontecimiento.recordatorio_enviado_el) {
                        enviarHoy = true;

                        console.log("[DEBUG]   -> DECISIÓN: Enviar hoy (Único)");
                    }
                    break;
                case 'diario':
                    // Si hoy es el día de envío o una fecha posterior (hasta la fecha límite)
                    if (hoy >= fechaEnvioOriginal && hoy <= fechaLimite) {
                        enviarHoy = true;
                    }
                    break;
                case 'semanal':
                    // Si hoy es posterior al día de envío original y coincide el día de la semana
                    if (hoy >= fechaEnvioOriginal && hoy.getDay() === fechaEnvioOriginal.getDay()) {
                        enviarHoy = true;
                    }
                    break;
                case 'mensual':
                    // Si hoy es posterior y coincide el día del mes
                    if (hoy >= fechaEnvioOriginal && hoy.getDate() === fechaEnvioOriginal.getDate()) {
                        enviarHoy = true;
                    }
                    break;
                case 'anual':
                    // Si hoy es posterior a la fecha de envío original,
                    // y coincide el mes y el día, se debe enviar.
                    if (hoy >= fechaEnvioOriginal && 
                        hoy.getMonth() === fechaEnvioOriginal.getMonth() && 
                        hoy.getDate() === fechaEnvioOriginal.getDate()) {
                        enviarHoy = true;
                    }
                    break;
                }

            if (!enviarHoy) {
                 console.log("[DEBUG]   -> DECISIÓN: No enviar hoy.");
            }

            if (enviarHoy) {            
                console.log(`[INFO] Preparando envío para acontecimiento ID: ${acontecimiento.id}`);
                const [expedientes] = await conn.execute('SELECT * FROM expedientes WHERE id = ?', [acontecimiento.expediente_id]);
                const [fotos] = await conn.execute('SELECT * FROM fotos WHERE acontecimiento_id = ?', [acontecimiento.id]);
                
                if (expedientes.length > 0) {
                    await enviarCorreoRecordatorio(acontecimiento, expedientes[0], fotos);
                    
                    // 3. ¡IMPORTANTE! Actualizamos la fecha del último envío
                    await conn.execute(
                        'UPDATE acontecimientos SET recordatorio_enviado_el = NOW() WHERE id = ?',
                        [acontecimiento.id]
                    );
                }
            }
        }

    } catch (error) {
        console.error('Error durante la tarea programada de recordatorios:', error);
    } finally {
        if (conn) conn.release();
        console.log('--- Tarea diaria de recordatorios finalizada ---');
    }
}, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
});

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Juani2008**',
    database: process.env.DB_NAME || 'expedientes_db'
};

let pool;
async function connectToDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Conexión a la base de datos MySQL exitosa!');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
}
connectToDatabase();

// --- Configuración de Archivos Estáticos y Subidas ---
app.use(express.static(path.join(__dirname, '..', '/')));
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir); }
app.use('/uploads', express.static(uploadsDir));

const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } }); 
const uploadMiddleware = multer({ 
    limits: { fileSize: 15 * 1024 * 1024 } 
}).any();
// Creamos nuestro propio manejador que usa el middleware de multer
const handleUpload = (req, res, next) => {
    uploadMiddleware(req, res, function (err) {
        // Si multer devuelve un error (ej: archivo demasiado grande), lo capturamos aquí
        if (err) {
            console.error("--- ERROR DE MULTER DETECTADO ---");
            console.error(err);
            return res.status(400).json({ error: `Error al subir el archivo: ${err.message}` });
        }
        // Si no hay error, continuamos a la lógica principal del endpoint
        next();
    });
};


// --- API Endpoints ---

app.post('/api/tramites', upload.any(), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { tipoTramite, descripcion } = req.body;
        const fotos = req.files;

        if (!tipoTramite || !descripcion || !fotos || !fotos.length) {
            return res.status(400).json({ error: 'Faltan datos o fotos.' });
        }

        const fechaHora = new Date();
        const numeroExpediente = fechaHora.toISOString().replace(/[-:.]/g, '').slice(0, 14);

        const [expedienteResult] = await conn.execute(
            'INSERT INTO expedientes (numero_expediente, fecha_creacion, descripcion, tipo_tramite_id, estado) VALUES (?, ?, ?, ?, ?)',
            [numeroExpediente, fechaHora, descripcion, tipoTramite, 'en-espera']
        );

        const expedienteId = expedienteResult.insertId;

        // --- CORRECCIÓN AQUÍ ---
        // Al ser el primer acontecimiento, su número secuencial es siempre 1.
        // Añadimos la columna 'num_secuencial' y el valor '1' a la consulta.
        const [acontecimientoResult] = await conn.execute(
            'INSERT INTO acontecimientos (expediente_id, fecha_hora, descripcion, nuevo_estado, num_secuencial) VALUES (?, ?, ?, ?, ?)',
            [expedienteId, fechaHora, 'Creación de expediente inicial.', 'en-espera', 1]
        );        

        const acontecimientoId = acontecimientoResult.insertId;

        const year = fechaHora.getFullYear().toString();
        const month = (fechaHora.getMonth() + 1).toString().padStart(2, '0');
        const day = fechaHora.getDate().toString().padStart(2, '0');

        const datePath = path.join(year, month, day);
        const fullDateDirPath = path.join(uploadsDir, datePath);

        // Crea el directorio si no existe
        fs.mkdirSync(fullDateDirPath, { recursive: true });

        for (let i = 0; i < fotos.length; i++) {
            const foto = fotos[i];
            const uniqueSuffix = `${acontecimientoId}-${i + 1}${path.extname(foto.originalname)}`;
            const baseFilename = `${numeroExpediente}-${uniqueSuffix}`;
            
            // La ruta que guardamos en la BD ahora incluye las subcarpetas
            const nombreArchivoConRuta = path.join(datePath, baseFilename);
            const rutaAbsolutaArchivo = path.join(uploadsDir, nombreArchivoConRuta);

            fs.writeFileSync(rutaAbsolutaArchivo, foto.buffer);

            await conn.execute(
                'INSERT INTO fotos (expediente_id, acontecimiento_id, nombre_archivo, ruta_archivo) VALUES (?, ?, ?, ?)',
                [expedienteId, acontecimientoId, nombreArchivoConRuta, rutaAbsolutaArchivo]
            );
        }

        await conn.commit();
        res.status(201).json({ mensaje: 'Expediente guardado con éxito.', numero_expediente: numeroExpediente });
    } catch (error) {
        await conn.rollback();
        console.error('Error al procesar el expediente:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

app.get('/api/tramites', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { busqueda, estado, tipoTramite, page = 1 } = req.query; // Obtenemos los nuevos filtros
        const limit = 5;
        
        let pageNum = parseInt(page, 10);
        if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
        const offset = (pageNum - 1) * limit;

        const selectFields = `SELECT e.id, e.numero_expediente, e.fecha_creacion, e.descripcion, e.estado, t.nombre as tipo_tramite_nombre FROM expedientes e INNER JOIN tipos_tramite t ON e.tipo_tramite_id = t.id`;
        
        // --- LÓGICA DE FILTRADO DINÁMICO ---
        const conditions = [];
        const params = [];

        if (busqueda) {
            conditions.push(`(e.numero_expediente LIKE ? OR e.descripcion LIKE ? OR t.nombre LIKE ?)`);
            const termino = `%${busqueda}%`;
            params.push(termino, termino, termino);
        }
        if (estado) {
            conditions.push(`e.estado = ?`);
            params.push(estado);
        }
        if (tipoTramite) {
            conditions.push(`e.tipo_tramite_id = ?`);
            params.push(tipoTramite);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        // Query para contar
        const countQuery = `SELECT COUNT(e.id) as total FROM expedientes e INNER JOIN tipos_tramite t ON e.tipo_tramite_id = t.id ${whereClause}`;
        const [countRows] = await conn.execute(countQuery, params);
        const totalPages = Math.ceil(countRows[0].total / limit);

        // Query para obtener los datos
        const dataQuery = `${selectFields} ${whereClause} ORDER BY e.fecha_creacion DESC LIMIT ? OFFSET ?`;
        const [rows] = await conn.execute(dataQuery, [...params, String(limit), String(offset)]);
        
        res.status(200).json({ expedientes: rows, total_pages: totalPages, current_page: pageNum });

    } catch (error) {
        console.error('Error al buscar expedientes:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
});

app.get('/api/tipos-tramite', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.execute('SELECT id, nombre FROM tipos_tramite ORDER BY nombre');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener tipos de trámite:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
});

// Endpoint para obtener acontecimientos paginados
app.get('/api/acontecimientos/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        let page = parseInt(req.query.page, 10);
        if (isNaN(page) || page < 1) page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [countRows] = await conn.execute('SELECT COUNT(*) as total FROM acontecimientos WHERE expediente_id = ?', [id]);
        const totalPages = Math.ceil(countRows[0].total / limit);

        // --- CONSULTA CORREGIDA ---
        // Nos aseguramos de seleccionar todos los campos necesarios.
        const query = `
            SELECT id, expediente_id, fecha_hora, descripcion, nuevo_estado, num_secuencial, fecha_limite, recordatorio_enviado_el, frecuencia_recordatorio, destinatario_email
            FROM acontecimientos 
            WHERE expediente_id = ? 
            ORDER BY fecha_hora DESC 
            LIMIT ? OFFSET ?
        `;
        const [rows] = await conn.execute(query, [id, String(limit), String(offset)]);

        res.status(200).json({
            acontecimientos: rows,
            total_pages: totalPages,
            current_page: page
        });
    } catch (e) {
        console.error("Error al obtener acontecimientos:", e);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (conn) conn.release();
    }
});


// Nuevo endpoint para guardar un nuevo acontecimiento
app.post('/api/acontecimientos/:id', handleUpload, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { id } = req.params;
        const { 
            descripcionAcontecimiento, 
            nuevoEstado, 
            numeroExpediente,
            fechaLimite,
            destinatariosEmail
        } = req.body;
        const fotos = req.files;

        const [countRows] = await conn.execute('SELECT COUNT(*) as total FROM acontecimientos WHERE expediente_id = ?', [id]);
        const nuevoNumeroSecuencial = countRows[0].total + 1;
        const fechaHora = new Date();

        const [acontecimientoResult] = await conn.execute(
            'INSERT INTO acontecimientos (expediente_id, fecha_hora, descripcion, nuevo_estado, num_secuencial, fecha_limite, destinatario_email) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, fechaHora, descripcionAcontecimiento, nuevoEstado, nuevoNumeroSecuencial, fechaLimite || null, destinatariosEmail || null]
        );
        // Obtenemos el ID del acontecimiento recién insertado para usarlo después.
        const acontecimientoId = acontecimientoResult.insertId;

        await conn.execute('UPDATE expedientes SET estado = ? WHERE id = ?', [nuevoEstado, id]);

        if (fotos && fotos.length > 0) {
            const year = fechaHora.getFullYear().toString();
            const month = (fechaHora.getMonth() + 1).toString().padStart(2, '0');
            const day = fechaHora.getDate().toString().padStart(2, '0');
            const datePath = path.join(year, month, day);
            const fullDateDirPath = path.join(uploadsDir, datePath);
            fs.mkdirSync(fullDateDirPath, { recursive: true });

            for (let i = 0; i < fotos.length; i++) {
                const foto = fotos[i];
                // Ahora 'acontecimientoId' está disponible aquí
                const uniqueSuffix = `${acontecimientoId}-${i + 1}${path.extname(foto.originalname)}`;
                const baseFilename = `${numeroExpediente}-${uniqueSuffix}`;
                const nombreArchivoConRuta = path.join(datePath, baseFilename);
                const rutaAbsolutaArchivo = path.join(uploadsDir, nombreArchivoConRuta);

                fs.writeFileSync(rutaAbsolutaArchivo, foto.buffer);

                await conn.execute(
                    'INSERT INTO fotos (expediente_id, acontecimiento_id, nombre_archivo, ruta_archivo) VALUES (?, ?, ?, ?)',
                    [id, acontecimientoId, nombreArchivoConRuta, rutaAbsolutaArchivo]
                );
            }
        }
        
        await conn.commit();
        res.status(201).json({ mensaje: 'Acontecimiento guardado con éxito.' });

    } catch (error) {
        await conn.rollback();
        // Ahora cualquier error se registrará en la consola
        console.error("--- ERROR AL GUARDAR ACONTECIMIENTO ---");
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para obtener las fotos de un acontecimiento
app.get('/api/acontecimientos/:id/fotos', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const [rows] = await conn.execute(
            'SELECT nombre_archivo, ruta_archivo FROM fotos WHERE acontecimiento_id = ?',
            [id]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener fotos del acontecimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
});

// Nuevo endpoint para obtener los detalles de un solo expediente por ID
app.get('/api/tramites/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const [rows] = await conn.execute(
            `SELECT
                e.id,
                e.numero_expediente,
                e.fecha_creacion,
                e.descripcion,
                e.estado,
                t.nombre as tipo_tramite_nombre
            FROM expedientes e
            INNER JOIN tipos_tramite t ON e.tipo_tramite_id = t.id
            WHERE e.id = ?`,
            [id]
        );

        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ error: 'Expediente no encontrado.' });
        }
    } catch (error) {
        console.error('Error al obtener expediente:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
});

// --- Endpoint para EDITAR un acontecimiento ---
app.put('/api/acontecimientos/:id', handleUpload, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const { 
            descripcionAcontecimiento, 
            nuevoEstado, 
            fechaLimite, 
            frecuenciaRecordatorio, 
            destinatariosEmail 
        } = req.body;

        await conn.beginTransaction();

        // Actualizamos el acontecimiento
        await conn.execute(
            'UPDATE acontecimientos SET descripcion = ?, nuevo_estado = ?, fecha_limite = ?, frecuencia_recordatorio = ?, destinatario_email = ? WHERE id = ?',
            [
                descripcionAcontecimiento, 
                nuevoEstado, 
                fechaLimite || null, 
                frecuenciaRecordatorio || 'unico', 
                destinatariosEmail || null, 
                id
            ]
        );

        // Aquí podrías añadir lógica para manejar nuevos archivos adjuntos en una edición si quisieras

        await conn.commit();
        res.status(200).json({ mensaje: 'Acontecimiento actualizado con éxito.' });

    } catch (error) {
        await conn.rollback();
        console.error('Error al actualizar el acontecimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (conn) conn.release();
    }
});


// --- Endpoint para ELIMINAR un acontecimiento ---
app.delete('/api/acontecimientos/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        await conn.beginTransaction();

        // 1. Buscar todos los archivos asociados al acontecimiento
        const [fotos] = await conn.execute('SELECT nombre_archivo FROM fotos WHERE acontecimiento_id = ?', [id]);
        
        // 2. Borrar los archivos del disco
        for (const foto of fotos) {
            const rutaArchivo = path.join(uploadsDir, foto.nombre_archivo);
            if (fs.existsSync(rutaArchivo)) {
                fs.unlinkSync(rutaArchivo);
                console.log(`Archivo eliminado: ${foto.nombre_archivo}`);
            }
        }
        
        // 3. Borrar los registros de los archivos de la base de datos
        await conn.execute('DELETE FROM fotos WHERE acontecimiento_id = ?', [id]);

        // 4. Borrar el acontecimiento en sí
        await conn.execute('DELETE FROM acontecimientos WHERE id = ?', [id]);

        await conn.commit();
        res.status(200).json({ mensaje: 'Acontecimiento y sus archivos eliminados con éxito.' });

    } catch (error) {
        await conn.rollback();
        console.error('Error al eliminar el acontecimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

// --- Endpoint para CREAR un nuevo contacto ---
app.post('/api/contactos', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { email, nombre, telefono, direccion } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'El email es obligatorio.' });
        }

        // Insertamos el nuevo contacto en la tabla 'contactos'
        await conn.execute(
            'INSERT INTO contactos (email, nombre, telefono, direccion) VALUES (?, ?, ?, ?)',
            [email, nombre || null, telefono || null, direccion || null]
        );

        res.status(201).json({ mensaje: 'Contacto creado con éxito.' });

    } catch (error) {
        // Manejo de error si el email ya existe (código 1062 para duplicados en MySQL)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El email ya existe.' });
        }
        console.error('Error al crear el contacto:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

// --- Endpoint para BUSCAR contactos (autocompletado) ---
app.get('/api/contactos', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { search } = req.query;
        if (!search || search.length < 3) {
            return res.json([]);
        }

        const searchTerm = `${search}%`;
        const [rows] = await conn.execute(
            'SELECT email FROM contactos WHERE email LIKE ? OR nombre LIKE ? LIMIT 5',
            [searchTerm, searchTerm]
        );
        
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error al buscar contactos:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (conn) conn.release();
    }
});


// --- Endpoint para CREAR un nuevo contacto ---
app.post('/api/contactos', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { email, nombre, telefono, direccion } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'El email es obligatorio.' });
        }

        await conn.execute(
            'INSERT INTO contactos (email, nombre, telefono, direccion) VALUES (?, ?, ?, ?)',
            [email, nombre || null, telefono || null, direccion || null]
        );

        res.status(201).json({ mensaje: 'Contacto creado con éxito.' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El email ya existe.' });
        }
        console.error('Error al crear el contacto:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

app.post('/api/acontecimientos/:id/reset_recordatorio', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        await conn.execute(
            'UPDATE acontecimientos SET recordatorio_enviado_el = NULL WHERE id = ?',
            [id]
        );
        res.status(200).json({ mensaje: 'Recordatorio reseteado. Se volverá a enviar.' });
    } catch (error) {
        console.error("Error al resetear recordatorio:", error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (conn) conn.release();
    }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log(`También accesible desde la red local en http://${'192.168.100.7'}:${port}`);
});