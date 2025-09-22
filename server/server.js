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

app.use(express.static(path.join(__dirname, '..', '/')));

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

const upload = multer();

app.post('/api/tramites', upload.any(), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { tipoTramite, descripcion } = req.body;
        const fotos = req.files;

        if (!tipoTramite || !descripcion || !fotos || fotos.length === 0) {
            return res.status(400).json({ error: 'Faltan datos o fotos.' });
        }

        const fechaHora = new Date();
        const numeroExpediente = fechaHora.toISOString().replace(/[-:.]/g, '').slice(0, 14);

        await conn.beginTransaction();

        const [expedienteResult] = await conn.execute(
            'INSERT INTO expedientes (numero_expediente, fecha_creacion, descripcion, tipo_tramite_id, estado) VALUES (?, ?, ?, ?, ?)',
            [numeroExpediente, fechaHora, descripcion, tipoTramite, 'en-espera']
        );
        const expedienteId = expedienteResult.insertId;

        const [acontecimientoResult] = await conn.execute(
            'INSERT INTO acontecimientos (expediente_id, fecha_hora, descripcion, nuevo_estado) VALUES (?, ?, ?, ?)',
            [expedienteId, fechaHora, 'Creación de expediente inicial.', 'en-espera']
        );
        const acontecimientoId = acontecimientoResult.insertId; 

        for (let i = 0; i < fotos.length; i++) {
            const foto = fotos[i];
            const nombreArchivo = `${numeroExpediente}-${acontecimientoId}-${i + 1}${path.extname(foto.originalname)}`;
            const rutaArchivo = path.join(uploadsDir, nombreArchivo);

            fs.writeFileSync(rutaArchivo, foto.buffer);

            await conn.execute(
                'INSERT INTO fotos (expediente_id, acontecimiento_id, nombre_archivo, ruta_archivo) VALUES (?, ?, ?, ?)',
                [expedienteId, acontecimientoId, nombreArchivo, rutaArchivo]
            );
        }

        await conn.commit();
        res.status(201).json({
            mensaje: 'Expediente guardado con éxito.',
            numero_expediente: numeroExpediente
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error al procesar el expediente:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
});

/*
app.get('/api/tramites', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { busqueda } = req.query;
        let query = `
            SELECT 
                e.id, 
                e.numero_expediente, 
                e.fecha_creacion, 
                e.descripcion, 
                e.estado,
                t.nombre as tipo_tramite_nombre
            FROM expedientes e
            INNER JOIN tipos_tramite t ON e.tipo_tramite_id = t.id
        `;
        const params = [];

        if (busqueda) {
            query += `
                WHERE e.numero_expediente LIKE ? OR e.descripcion LIKE ? OR t.nombre LIKE ?
            `;
            const termino = `%${busqueda}%`;
            params.push(termino, termino, termino);
        }

        query += ` ORDER BY e.fecha_creacion DESC`;

        const [rows] = await conn.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al buscar expedientes:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
});
*/

app.get('/api/tramites', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { busqueda, page = 1 } = req.query;
        const limit = 5; // O el número de resultados que quieras por página
        const offset = (parseInt(page, 10) - 1) * limit;

        let whereClause = '';
        const params = [];

        if (busqueda) {
            whereClause = `WHERE e.numero_expediente LIKE ? OR e.descripcion LIKE ? OR t.nombre LIKE ?`;
            const termino = `%${busqueda}%`;
            params.push(termino, termino, termino);
        }

        // Query para contar el total de resultados
        const countQuery = `
            SELECT COUNT(e.id) as total 
            FROM expedientes e 
            INNER JOIN tipos_tramite t ON e.tipo_tramite_id = t.id 
            ${whereClause}
        `;
        const [countRows] = await conn.execute(countQuery, params);
        const totalExpedientes = countRows[0].total;
        const totalPages = Math.ceil(totalExpedientes / limit);

        // Query para obtener los resultados de la página actual
        const dataQuery = `
            SELECT 
                e.id, e.numero_expediente, e.fecha_creacion, 
                e.descripcion, e.estado, t.nombre as tipo_tramite_nombre
            FROM expedientes e
            INNER JOIN tipos_tramite t ON e.tipo_tramite_id = t.id
            ${whereClause}
            ORDER BY e.fecha_creacion DESC
            LIMIT ? OFFSET ?
        `;
        
        // Añadimos los parámetros de paginación al final
        params.push(limit, offset);
        const [rows] = await conn.execute(dataQuery, params);

        res.status(200).json({
            expedientes: rows,
            total_pages: totalPages,
            current_page: parseInt(page, 10)
        });

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
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        console.log('Parámetros de consulta:', { id, page, limit, offset });

        const [countRows] = await conn.execute(
            'SELECT COUNT(*) as total FROM acontecimientos WHERE expediente_id = ?',
            [id]
        );
        const totalAcontecimientos = countRows[0].total;
        const totalPages = Math.ceil(totalAcontecimientos / limit);

        // Usar template literal para LIMIT y OFFSET, pero prepared statement para WHERE
        const query = `
            SELECT id, expediente_id, fecha_hora, descripcion, nuevo_estado 
            FROM acontecimientos 
            WHERE expediente_id = ? 
            ORDER BY fecha_hora DESC 
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;
        
        const [rows] = await conn.execute(query, [id]);

        res.status(200).json({
            acontecimientos: rows,
            total_pages: totalPages,
            current_page: page
        });
    } catch (error) {
        console.error('Error al obtener acontecimientos:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
});


// Nuevo endpoint para guardar un nuevo acontecimiento
app.post('/api/acontecimientos/:id', upload.any(), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const { descripcionAcontecimiento, nuevoEstado, numeroExpediente } = req.body;
        const fotos = req.files;

        await conn.beginTransaction();

        const [acontecimientoResult] = await conn.execute(
            'INSERT INTO acontecimientos (expediente_id, fecha_hora, descripcion, nuevo_estado) VALUES (?, ?, ?, ?)',
            [id, new Date(), descripcionAcontecimiento, nuevoEstado]
        );
        const acontecimientoId = acontecimientoResult.insertId;

        const [expedienteResult] = await conn.execute(
            'UPDATE expedientes SET estado = ? WHERE id = ?',
            [nuevoEstado, id]
        );

        if (expedienteResult.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Expediente no encontrado.' });
        }

        if (fotos && fotos.length > 0) {
            for (let i = 0; i < fotos.length; i++) {
                const foto = fotos[i];
                const nombreArchivo = `${numeroExpediente}-${acontecimientoId}-${i + 1}${path.extname(foto.originalname)}`;
                const rutaArchivo = path.join(uploadsDir, nombreArchivo);

                fs.writeFileSync(rutaArchivo, foto.buffer);

                await conn.execute(
                    'INSERT INTO fotos (expediente_id, acontecimiento_id, nombre_archivo, ruta_archivo) VALUES (?, ?, ?, ?)',
                    [id, acontecimientoId, nombreArchivo, rutaArchivo]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ mensaje: 'Acontecimiento guardado con éxito.' });
    } catch (error) {
        await conn.rollback();
        console.error('Error al procesar el acontecimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        conn.release();
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