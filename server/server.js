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

const upload = multer();

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

        // --- LÓGICA SIMPLIFICADA ---
        // Ahora solo seleccionamos el 'num_secuencial' directamente de la base de datos
        const query = `
            SELECT id, expediente_id, fecha_hora, descripcion, nuevo_estado, num_secuencial 
            FROM acontecimientos 
            WHERE expediente_id = ? 
            ORDER BY fecha_hora DESC 
            LIMIT ? OFFSET ?
        `;
        const [rows] = await conn.execute(query, [id, String(limit), String(offset)]);

        res.status(200).json({
            acontecimientos: rows, // Ya no necesitamos mapear ni calcular nada
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
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { id } = req.params; // ID del expediente
        const { descripcionAcontecimiento, nuevoEstado, numeroExpediente } = req.body;
        const fotos = req.files;

        // --- LÓGICA NUEVA PARA OBTENER EL NÚMERO SECUENCIAL ---
        // 1. Contamos cuántos acontecimientos ya existen para este expediente.
        const [countRows] = await conn.execute('SELECT COUNT(*) as total FROM acontecimientos WHERE expediente_id = ?', [id]);
        const nuevoNumeroSecuencial = countRows[0].total + 1;

        const fechaHora = new Date()

        // 2. Insertamos el nuevo acontecimiento CON su número secuencial.
        const [acontecimientoResult] = await conn.execute(
            'INSERT INTO acontecimientos (expediente_id, fecha_hora, descripcion, nuevo_estado, num_secuencial) VALUES (?, ?, ?, ?, ?)',
            [id, new Date(), descripcionAcontecimiento, nuevoEstado, nuevoNumeroSecuencial]
        );

        const acontecimientoId = acontecimientoResult.insertId;

        await conn.execute('UPDATE expedientes SET estado = ? WHERE id = ?', [nuevoEstado, id]);

        if (fotos && fotos.length > 0) {
            // --- LÓGICA DE DIRECTORIOS POR FECHA ---
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
app.put('/api/acontecimientos/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const { descripcion } = req.body;

        if (!descripcion) {
            return res.status(400).json({ error: 'La descripción no puede estar vacía.' });
        }

        await conn.execute(
            'UPDATE acontecimientos SET descripcion = ? WHERE id = ?',
            [descripcion, id]
        );

        res.status(200).json({ mensaje: 'Acontecimiento actualizado con éxito.' });

    } catch (error) {
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


app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log(`También accesible desde la red local en http://${'192.168.100.7'}:${port}`);
});