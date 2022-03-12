/**
 * Hispachan Files
 *
 * Modelo de hilos baneados
 */
'use strict';
const mongoose = require('mongoose');

module.exports = mongoose.model('BannedThread', {
    board: String,
    postId: Number,
});
