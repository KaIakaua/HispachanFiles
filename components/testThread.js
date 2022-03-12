'use strict';

const bannedThread = require('../models/bannedThread');
const settings = require('../settings');

/**
 * Decide si un hilo cumple con los requisitos para ser almacenado
 * (Putos moralfags)
 *
 * @param {Object} thread
 * @return {String} failReason
 */
async function testThread(thread) {
    if (thread.replyCount < settings.misc.minimumReplies) {
        return 'El hilo tiene pocas respuestas';
    }

    const banned = await bannedThread.findOne({ postId: thread.postId, board: thread.board });
    if (banned) {
        return 'Este hilo fue baneado';
    }

    return '';
}

module.exports = testThread;