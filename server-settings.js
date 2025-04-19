/**
 * Hispachan Files
 *
 * Opciones del servidor
 */
'use strict';

module.exports =
{
    /* Base de datos */
    db:
    {
        url: 'mongodb://127.0.0.1/hispaFiles',
        testUrl: 'mongodb://127.0.0.1/hispaFilesTest',
    },

    /* HTTPS */
    ssl:
    {
        // Desactivalo si no tienes ningún certificado
        enabled: false,
        // Ubicación del archivo de certificado.
        cert: '/home/HispaFiles/cert.pem',
        // Ubicación de la clave parra el certificado
        key: '/home/HispaFiles/certKey.pem',
        // Si tienes un archivo PFX, coloca su ruta aquí, y establece cert y key en undefined.
        pfx: undefined,
    },

    /* Clave para borrado de hilos (esto es temporal) */
    delPass: 'zetaputo',

    /* Sentry */
    sentry: {
        enabled: false,
        dsn: '',
    },
};