'use strict';
const Thread = require('../models/thread');
const rimraf = require('rimraf');

/**
 * Elimina un hilo de la base de datos y todos los archivos relacionados
 *
 * @param {Object} thread
 * @param {Function} callback
 */
function deleteThread(thread, callback) {
    Thread.findOneAndRemove({ postId: thread.postId, board: thread.board }, (err) => {
        if (err) {
            callback(err);
            return;
        } else {
            rimraf(`data/${thread.board}/${thread.postId}`, callback);
        }
    });
}

module.exports = deleteThread;