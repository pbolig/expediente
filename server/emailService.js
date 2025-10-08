// Archivo: server/emailService.js
const nodemailer = require('nodemailer');

// Configuración del transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'expe.recordatorio@gmail.com',
        pass: 'qdfd upeq wsxx qzrl'  // Contraseña de aplicación
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify(function(error, success) {
   if (error) { console.error('Error en la configuración del correo:', error); } 
   else { console.log('✓ Servidor de correo listo para enviar mensajes'); }
});

async function enviarCorreoRecordatorio(acontecimiento, expediente, fotos) {
    try {
        // --- LA VERIFICACIÓN DEBE ESTAR AQUÍ ADENTRO ---
        if (!acontecimiento.destinatario_email || acontecimiento.destinatario_email === '[]') {
            console.log(`(i) Acontecimiento ID ${acontecimiento.id} omitido: no tiene destinatarios.`);
            return; // Si no hay emails, la función se detiene aquí.
        }
        
        const destinatarios = JSON.parse(acontecimiento.destinatario_email).join(', ');
        const fechaLimite = new Date(acontecimiento.fecha_limite).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        let listaArchivos = fotos && fotos.length > 0 
            ? fotos.map(f => `<li style="padding: 6px 0;">📎 ${f.nombre_archivo.split('/').pop()}</li>`).join('')
            : '<li style="padding: 6px 0; color: #6c757d;">No hay archivos adjuntos</li>';

        const mailOptions = {
        from: '"Sistema de Expedientes" <expe.recordatorio@gmail.com>',
        to: destinatarios,
        subject: `⏰ Recordatorio de Vencimiento - Expediente N° ${expediente.numero_expediente}`,
        text: `
        Recordatorio de Vencimiento

        Acontecimiento: ${acontecimiento.descripcion}
        Fecha Límite: ${fechaLimite}

        Este es un recordatorio de que faltan 3 días hábiles para la fecha límite.

        Expediente: ${expediente.numero_expediente}
        Descripción: ${expediente.descripcion}

        Sistema de Gestión de Expedientes
                `,
                html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recordatorio de Vencimiento</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; line-height: 1.4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 15px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                            
                            <!-- Header con gradiente -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px 15px; text-align: center;">
                                    <div style="font-size: 44px; margin-bottom: 8px;">⏰</div>
                                    <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.2;">
                                        Recordatorio de Vencimiento
                                    </h1>
                                </td>
                            </tr>

                            <!-- Alerta de días restantes -->
                            <tr>
                                <td style="padding: 0 35px;">
                                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 18px; margin: 20px 0; border-radius: 4px;">
                                        <p style="margin: 0; color: #856404; font-size: 16px; font-weight: 500; line-height: 1.3;">
                                            ⚠️ Faltan <strong>3 días hábiles</strong> para la fecha límite
                                        </p>
                                    </div>
                                </td>
                            </tr>

                            <!-- Información del acontecimiento -->
                            <tr>
                                <td style="padding: 0 35px;">
                                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 18px;">
                                        <h2 style="margin: 0 0 14px 0; color: #2c3e50; font-size: 20px; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 8px; line-height: 1.2;">
                                            📋 Detalles del Acontecimiento
                                        </h2>
                                        
                                        <div style="margin-bottom: 12px;">
                                            <span style="color: #6c757d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                                                Descripción
                                            </span>
                                            <p style="margin: 4px 0 0 0; color: #2c3e50; font-size: 17px; line-height: 1.4;">
                                                ${acontecimiento.descripcion}
                                            </p>
                                        </div>

                                        <div style="background-color: #ffffff; padding: 12px; border-radius: 4px; border-left: 4px solid #28a745;">
                                            <span style="color: #6c757d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                                                📅 Fecha Límite
                                            </span>
                                            <p style="margin: 4px 0 0 0; color: #28a745; font-size: 19px; font-weight: 600; line-height: 1.3;">
                                                ${fechaLimite}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            <!-- Información del expediente -->
                            <tr>
                                <td style="padding: 0 35px;">
                                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 18px;">
                                        <h2 style="margin: 0 0 14px 0; color: #2c3e50; font-size: 20px; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 8px; line-height: 1.2;">
                                            📂 Expediente Asociado
                                        </h2>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                                                    <span style="color: #6c757d; font-size: 15px; font-weight: 600;">Número:</span>
                                                </td>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right;">
                                                    <span style="color: #2c3e50; font-size: 16px; font-weight: 600;">${expediente.numero_expediente}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding: 12px 0 0 0;">
                                                    <span style="color: #6c757d; font-size: 15px; font-weight: 600;">Descripción:</span>
                                                    <p style="margin: 6px 0 0 0; color: #495057; font-size: 16px; line-height: 1.4;">
                                                        ${expediente.descripcion}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </td>
                            </tr>

                            <!-- Archivos adjuntos -->
                            <tr>
                                <td style="padding: 0 35px;">
                                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
                                        <h2 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 20px; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 8px; line-height: 1.2;">
                                            📎 Archivos Relacionados
                                        </h2>
                                        <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
                                            ${listaArchivos}
                                        </ul>
                                    </div>
                                </td>
                            </tr>

                            <!-- Instrucciones finales -->
                            <tr>
                                <td style="padding: 0 35px 22px 35px;">
                                    <div style="background-color: #e7f3ff; border-left: 4px solid #0d6efd; padding: 15px; border-radius: 4px;">
                                        <p style="margin: 0 0 8px 0; color: #084298; font-size: 16px; font-weight: 600; line-height: 1.3;">
                                            💡 Importante
                                        </p>
                                        <p style="margin: 0; color: #084298; font-size: 15px; line-height: 1.4;">
                                            Una vez finalizada la tarea, no olvides actualizar el estado de este acontecimiento en el sistema para mantener el registro actualizado.
                                        </p>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #2c3e50; padding: 20px 35px; text-align: center;">
                                    <p style="margin: 0 0 4px 0; color: #ecf0f1; font-size: 15px; font-weight: 600; line-height: 1.3;">
                                        Sistema de Gestión de Expedientes
                                    </p>
                                    <p style="margin: 0; color: #95a5a6; font-size: 13px; line-height: 1.3;">
                                        Este es un mensaje automático, por favor no responder a este correo
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>

            <div style="text-align: center; padding: 10px; font-size: 11px; color: #95a5a6;">
                <p style="margin: 5px 0;">
                    Para dejar de recibir estos recordatorios, contacte al administrador del sistema.
                </p>
                <p style="margin: 5px 0;">
                    Necochea 1339, Rosario Santa Fe Argentina
                </p>
            </div>


        </body>
        </html>
                `
            };

        await transporter.sendMail(mailOptions);
        console.log(`✓ Correo de recordatorio enviado a: ${destinatarios} (Acontecimiento ID: ${acontecimiento.id})`);

    } catch (error) {
        console.error(`✗ Error al enviar correo para el acontecimiento ID ${acontecimiento.id}:`, error);
        // No relanzamos el error para no detener el bucle del cron job
    }
}

module.exports = { enviarCorreoRecordatorio };








































async function enviarCorreoRecordatorio(acontecimiento, expediente, fotos) {
    const destinatarios = JSON.parse(acontecimiento.destinatario_email).join(', ');
    const fechaLimite = new Date(acontecimiento.fecha_limite).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let listaArchivos = '';
    if (fotos && fotos.length > 0) {
        listaArchivos = fotos.map(f => 
            `<li style="padding: 6px 0; border-bottom: 1px solid #e9ecef;">
                📎 ${f.nombre_archivo.split('/').pop()}
            </li>`
        ).join('');
    } else {
        listaArchivos = '<li style="padding: 6px 0; color: #6c757d;">No hay archivos adjuntos</li>';
    }

    const mailOptions = {
        from: '"Sistema de Expedientes" <expe.recordatorio@gmail.com>',
        to: destinatarios,
        subject: `⏰ Recordatorio de Vencimiento - Expediente N° ${expediente.numero_expediente}`,
        text: `
Recordatorio de Vencimiento

Acontecimiento: ${acontecimiento.descripcion}
Fecha Límite: ${fechaLimite}

Este es un recordatorio de que faltan 3 días hábiles para la fecha límite.

Expediente: ${expediente.numero_expediente}
Descripción: ${expediente.descripcion}

Sistema de Gestión de Expedientes
        `,
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recordatorio de Vencimiento</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; line-height: 1.4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 15px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header con gradiente -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px 15px; text-align: center;">
                            <div style="font-size: 44px; margin-bottom: 8px;">⏰</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.2;">
                                Recordatorio de Vencimiento
                            </h1>
                        </td>
                    </tr>

                    <!-- Alerta de días restantes -->
                    <tr>
                        <td style="padding: 0 35px;">
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 18px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #856404; font-size: 16px; font-weight: 500; line-height: 1.3;">
                                    ⚠️ Faltan <strong>3 días hábiles</strong> para la fecha límite
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Información del acontecimiento -->
                    <tr>
                        <td style="padding: 0 35px;">
                            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 18px;">
                                <h2 style="margin: 0 0 14px 0; color: #2c3e50; font-size: 20px; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 8px; line-height: 1.2;">
                                    📋 Detalles del Acontecimiento
                                </h2>
                                
                                <div style="margin-bottom: 12px;">
                                    <span style="color: #6c757d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                                        Descripción
                                    </span>
                                    <p style="margin: 4px 0 0 0; color: #2c3e50; font-size: 17px; line-height: 1.4;">
                                        ${acontecimiento.descripcion}
                                    </p>
                                </div>

                                <div style="background-color: #ffffff; padding: 12px; border-radius: 4px; border-left: 4px solid #28a745;">
                                    <span style="color: #6c757d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                                        📅 Fecha Límite
                                    </span>
                                    <p style="margin: 4px 0 0 0; color: #28a745; font-size: 19px; font-weight: 600; line-height: 1.3;">
                                        ${fechaLimite}
                                    </p>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Información del expediente -->
                    <tr>
                        <td style="padding: 0 35px;">
                            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 18px;">
                                <h2 style="margin: 0 0 14px 0; color: #2c3e50; font-size: 20px; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 8px; line-height: 1.2;">
                                    📂 Expediente Asociado
                                </h2>
                                
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                                            <span style="color: #6c757d; font-size: 15px; font-weight: 600;">Número:</span>
                                        </td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right;">
                                            <span style="color: #2c3e50; font-size: 16px; font-weight: 600;">${expediente.numero_expediente}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding: 12px 0 0 0;">
                                            <span style="color: #6c757d; font-size: 15px; font-weight: 600;">Descripción:</span>
                                            <p style="margin: 6px 0 0 0; color: #495057; font-size: 16px; line-height: 1.4;">
                                                ${expediente.descripcion}
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Archivos adjuntos -->
                    <tr>
                        <td style="padding: 0 35px;">
                            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
                                <h2 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 20px; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 8px; line-height: 1.2;">
                                    📎 Archivos Relacionados
                                </h2>
                                <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
                                    ${listaArchivos}
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <!-- Instrucciones finales -->
                    <tr>
                        <td style="padding: 0 35px 22px 35px;">
                            <div style="background-color: #e7f3ff; border-left: 4px solid #0d6efd; padding: 15px; border-radius: 4px;">
                                <p style="margin: 0 0 8px 0; color: #084298; font-size: 16px; font-weight: 600; line-height: 1.3;">
                                    💡 Importante
                                </p>
                                <p style="margin: 0; color: #084298; font-size: 15px; line-height: 1.4;">
                                    Una vez finalizada la tarea, no olvides actualizar el estado de este acontecimiento en el sistema para mantener el registro actualizado.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2c3e50; padding: 20px 35px; text-align: center;">
                            <p style="margin: 0 0 4px 0; color: #ecf0f1; font-size: 15px; font-weight: 600; line-height: 1.3;">
                                Sistema de Gestión de Expedientes
                            </p>
                            <p style="margin: 0; color: #95a5a6; font-size: 13px; line-height: 1.3;">
                                Este es un mensaje automático, por favor no responder a este correo
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

    <div style="text-align: center; padding: 10px; font-size: 11px; color: #95a5a6;">
        <p style="margin: 5px 0;">
            Para dejar de recibir estos recordatorios, contacte al administrador del sistema.
        </p>
        <p style="margin: 5px 0;">
            Necochea 1339, Rosario Santa Fe Argentina
        </p>
    </div>


</body>
</html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✓ Correo de recordatorio enviado a: ${destinatarios}`);
    } catch (error) {
        console.error(`✗ Error al enviar correo para el acontecimiento ID ${acontecimiento.id}:`, error);
        throw error;
    }
}

module.exports = { enviarCorreoRecordatorio };