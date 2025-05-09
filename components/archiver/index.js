/**
 * Archivador de Hispachan Files
 *
 * Aquí es donde ocurre toda la magia
 */
'use strict';

const mkdirp   = require('mkdirp');
const fs       = require('fs/promises');
const md5      = require('md5');
const axios    = require('axios');

const Post     = require('../../models/post');

class Archiver {
    constructor() {
        this.queue = [];
        this.current = {};
    }

    // Añadir hilo a la cola.
    addToQueue(data, socket) {
        this.queue.push({ data: data, by: socket });
        if (this.queue.length < 2) {
            this.next();
        }
    }

    // Avanzar en la cola
    next() {
        this.current = this.queue.shift();
        this.start();
    }

    // Archivar Hilo
    async start() {
        const thread = this.current;
        const replies = thread.data.replies;
        delete thread.data.replies;
        // Establecer directorios para los datos del hilo
        thread.dataDir = `data/${thread.data.board}/${thread.data.postId}/`;
        thread.fileDir = thread.dataDir + 'src/';
        thread.thumbDir = thread.dataDir + 'thumb/';
        thread.saved = 0;

        const query = { postId: thread.data.postId, board: thread.data.board };
        const threadDoc = await Post.findOneAndUpdate(query, thread.data, { upsert: true, new: true });
        threadDoc.replies = [];

        // Almacenar todas las respuestas
        for (const reply of replies) {
            reply.board = threadDoc.board;
            reply.thread = threadDoc;
            const query = { postId: reply.postId, board: reply.board };
            const replyDoc = await Post.findOneAndUpdate(query, reply, { upsert: true, new: true });
            threadDoc.replies.push(replyDoc);

            if (reply.file) {
                await this.storeAttachment(replyDoc);
            }

            this.reportProgress('Guardando archivos...', ++thread.saved, thread.data.replyCount + 1);
        }

        // Almacenar imagen de OP
        if (thread.data.file) {
            await this.storeAttachment(threadDoc);
        }

        // Almacenar en la base de datos
        threadDoc.lastUpdate = Date.now();
        await threadDoc.save();

        // Reportar al navegador
        if (this.current.by.connected) {
            this.current.by.emit('archiverDone');
        }
        // Avanzar en la cola
        this.current = {};
        if (this.queue.length > 0) this.next();
    }

    // Reportar progreso al navegador
    reportProgress(text, current, total) {
        if (this.current.by.connected) {
            this.current.by.emit('progressReport', text, current, total);
        }
    }

    // Guardar archivos adjuntos de un post
    async storeAttachment(post) {
        // Crear Directorios para archivos, si no existen
        await mkdirp(this.current.fileDir);
        await mkdirp(this.current.thumbDir);

        // Almacenar thumb
        // Ubicación final de la thumb
        const thumbPath = this.current.thumbDir + post.file.thumb.split('/').reverse()[0];

        try {
            await fs.access(thumbPath);
        } catch (e) {
            // Descargar thumb
            try {
                const response = await axios.get(
                    post.file.thumb,
                    { responseType: 'arraybuffer' },
                );
                await fs.writeFile(thumbPath, response.data);
            } catch (error) {
                if (!(error.response && error.response.status === 404)) {
                    throw new Error(error);
                }
                // Esto es un hack
                // Hace falta hacer el parseado de hilos con un headless browser
                const response = await axios.get(
                    'https://www.hispachan.org/buttons/previewerror.png',
                    { responseType: 'arraybuffer' },
                );
                await fs.writeFile(thumbPath, response.data);
            }
        }

        // Establecer nueva ubicación
        post.file.thumb = thumbPath;

        // Almacenar archivo
        // Ubicación final del archivo
        const filePath = this.current.fileDir + post.file.url.split('/').reverse()[0];

        try {
            await fs.access(filePath);
        } catch (e) {
            // Descargar archivo
            try {
                const response = await axios.get(
                    encodeURI(post.file.url),
                    { responseType: 'arraybuffer' },
                );
                await fs.writeFile(filePath, response.data);
                post.file.md5 = md5(response.data);

            } catch (e) {
                if (e.response.status !== 404) {
                    throw e;
                }
            }
        }

        // Establecer nueva ubicación
        post.file.url = filePath;

        await post.save();
    }
}

module.exports = new Archiver();