require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Juani2008**',
    database: 'expedientes_db'
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

const upload = multer();

// --- API Endpoints ---

app.post('/api/tramites', upload.any(), async (req, res) => {
    // ... Este endpoint no cambia
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { tipoTramite, descripcion } = req.body;
        const fotos = req.files;
        if (!tipoTramite || !descripcion || !fotos || fotos.length === 0) {
            return res.status(400).json({ error: 'Faltan datos o fotos.' });
        }
        const fechaHora = new Date();
        const numeroExpediente = fechaHora.toISOString().replace(/[-:.]/g, '').slice(0, 14);
        const [expedienteResult] = await conn.execute('INSERT INTO expedientes (numero_expediente, fecha_creacion, descripcion, tipo_tramite_id, estado) VALUES (?, ?, ?, ?, ?)', [numeroExpediente, fechaHora, descripcion, tipoTramite, 'en-espera']);
        const expedienteId = expedienteResult.insertId;
        const [acontecimientoResult] = await conn.execute('INSERT INTO acontecimientos (expediente_id, fecha_hora, descripcion, nuevo_estado) VALUES (?, ?, ?, ?)', [expedienteId, fechaHora, 'Creación de expediente inicial.', 'en-espera']);
        const acontecimientoId = acontecimientoResult.insertId;
        for (let i = 0; i < fotos.length; i++) {
            const foto = fotos[i];
            const nombreArchivo = `${numeroExpediente}-${acontecimientoId}-${i + 1}${path.extname(foto.originalname)}`;
            fs.writeFileSync(path.join(uploadsDir, nombreArchivo), foto.buffer);
            await conn.execute('INSERT INTO fotos (expediente_id, acontecimiento_id, nombre_archivo) VALUES (?, ?, ?)', [expedienteId, acontecimientoId, nombreArchivo]);
        }
        await conn.commit();
        res.status(201).json({ mensaje: 'Expediente guardado con éxito.', numero_expediente: numeroExpediente });
    } catch (error) {
        await conn.rollback(); console.error('Error al procesar el expediente:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        conn.release();
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

        // Primero, obtenemos el total de acontecimientos para este expediente
        const [countRows] = await conn.execute('SELECT COUNT(*) as total FROM acontecimientos WHERE expediente_id = ?', [id]);
        const totalAcontecimientos = countRows[0].total;
        const totalPages = Math.ceil(totalAcontecimientos / limit);

        // Luego, obtenemos los acontecimientos de la página actual
        const query = `
            SELECT id, expediente_id, fecha_hora, descripcion, nuevo_estado 
            FROM acontecimientos 
            WHERE expediente_id = ? 
            ORDER BY fecha_hora DESC 
            LIMIT ? OFFSET ?
        `;
        const [rows] = await conn.execute(query, [id, String(limit), String(offset)]);

        // --- LÓGICA PARA CALCULAR EL NÚMERO SECUENCIAL ---
        // A cada acontecimiento le agregamos un nuevo campo 'num_acontecimiento'
        const acontecimientosConNumero = rows.map((acontecimiento, index) => {
            return {
                ...acontecimiento,
                num_acontecimiento: totalAcontecimientos - offset - index
            };
        });

        res.status(200).json({
            acontecimientos: acontecimientosConNumero, // Enviamos el array modificado
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
app.post('/api/acontecimientos/:id', upload.any(), async (req, res) => {
    console.log('\n--- INICIO: Petición para crear nuevo acontecimiento ---');
    const conn = await pool.getConnection();
    
    try {
        const { id } = req.params;
        const { descripcionAcontecimiento, nuevoEstado, numeroExpediente } = req.body;
        const fotos = req.files;

        // --- LOG 1: Datos recibidos ---
        console.log(`[LOG] Expediente ID: ${id}`);
        console.log('[LOG] Descripción:', descripcionAcontecimiento);
        console.log('[LOG] Nuevo Estado:', nuevoEstado);
        console.log(`[LOG] Archivos adjuntos: ${fotos ? fotos.length : 0}`);

        await conn.beginTransaction();
        console.log('[LOG] Transacción iniciada.');

        // --- LOG 2: Insertando en la base de datos ---
        console.log('[LOG] Ejecutando INSERT en la tabla "acontecimientos"...');
        const [acontecimientoResult] = await conn.execute(
            'INSERT INTO acontecimientos (expediente_id, fecha_hora, descripcion, nuevo_estado) VALUES (?, ?, ?, ?)',
            [id, new Date(), descripcionAcontecimiento, nuevoEstado]
        );
        const acontecimientoId = acontecimientoResult.insertId;
        console.log(`[LOG] > Éxito. Nuevo acontecimiento creado con ID: ${acontecimientoId}`);

        // --- LOG 3: Actualizando el estado del expediente ---
        console.log('[LOG] Ejecutando UPDATE en la tabla "expedientes"...');
        const [updateResult] = await conn.execute('UPDATE expedientes SET estado = ? WHERE id = ?', [nuevoEstado, id]);
        console.log(`[LOG] > Éxito. Filas afectadas: ${updateResult.affectedRows}`);

        if (fotos && fotos.length > 0) {
            for (let i = 0; i < fotos.length; i++) {
                const foto = fotos[i];
                const nombreArchivo = `${numeroExpediente}-${acontecimientoId}-${i + 1}${path.extname(foto.originalname)}`;
                const rutaArchivo = path.join(uploadsDir, nombreArchivo);
                
                // --- LOG 4: Guardando archivos ---
                console.log(`[LOG] Guardando archivo en disco: ${nombreArchivo}`);
                fs.writeFileSync(rutaArchivo, foto.buffer);

                await conn.execute(
                    'INSERT INTO fotos (expediente_id, acontecimiento_id, nombre_archivo, ruta_archivo) VALUES (?, ?, ?, ?)',
                    [id, acontecimientoId, nombreArchivo, rutaArchivo]
                );
            }
        }
        
        await conn.commit();
        console.log('[LOG] Transacción confirmada (COMMIT).');
        
        res.status(201).json({ mensaje: 'Acontecimiento guardado con éxito.' });

    } catch (error) {
        // --- LOG 5: Captura de Errores ---
        console.error('>> ¡ERROR! Se ha producido un fallo en el proceso. <<');
        console.error('>> Mensaje de error:', error.message);
        console.error('>> Error completo:', error);

        await conn.rollback();
        console.log('[LOG] Transacción revertida (ROLLBACK).');
        
        res.status(500).json({ error: 'Error interno del servidor al guardar el acontecimiento.' });

    } finally {
        if (conn) conn.release();
        console.log('--- FIN: Petición para crear nuevo acontecimiento ---\n');
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

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log(`También accesible desde la red local en http://${'192.168.100.7'}:${port}`);
});