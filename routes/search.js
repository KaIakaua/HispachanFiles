'use strict';

const express = require('express');
const router = express.Router();
const publicSettings = require('../settings');
const serverSettings = require('../server-settings');
const Thread = require('../models/thread');
const async = require('async');

router.get('/ui-search', (req, res) => {
    let q = req.query.q;
    let r = [];
    let query = { $or: [{ subject: { $regex: q, $options: 'i' } }, { message: { $regex: q, $options: 'i' } }] };
    let response = { results: [] };
    if (!q) {
        res.jsonp({ results: [] });
        return;
    }
    Thread.count(query, (err, num) => {
        Thread.find(query).limit(4).exec((err, result) => {
            if (result) {
                result.forEach(el => {
                    let re = {};
                    if (el.subject) re.title = el.subject;
                    re.description = el.message.substr(0, 120);
                    re.image = '/'+el.file.thumb;
                    re.url = `/${el.board}/res/${el.postId}.html`;
                    response.results.push(re);
                });
                if(num > 4) {
                    response.action = { url: `/search?q=${encodeURIComponent(q)}`, text: `Ver todos los resultados (${num})` }
                }
                res.jsonp(response);
            }
            else res.jsonp(response);
        });
    });
});

// Búsqueda avanzada
router.get('/search', (req, res) => {
    // CloudFlare server push
    res.set('Link', '</dist/app.min.js>; rel=preload, </semantic/semantic.min.css>; rel=prefetch, </stylesheets/css/nprogress.css>; rel=prefetch, </semantic/semantic.js>; rel=prefetch');

    let q = req.query.q;
    let board = req.query.board;
    let p = parseInt(req.query.p || 1);
    let pages = [];
    let totalPages = 0;
    let query;
    // Página en blanco si no hay query
    if (!q && !board) {
        res.render('search-results', {
            title: `Resultados de búsqueda: ${q} - ${publicSettings.site.title}`,
            settings: publicSettings,
            currentQuery: q, totalPages: 1, items: [], pages: []
        });
        return;
    }

    if (!q && board) {
        query = { board: board };
    }

    if (q && !board) {
        query = { $or: [{ subject: { $regex: q, $options: 'i' } }, { message: { $regex: q, $options: 'i' } }] };
    }

    if (q && board) {
        query = { $and: [{ $or: [{ subject: { $regex: q, $options: 'i' } }, { message: { $regex: q, $options: 'i' } }] }, { board: board }] };
    }
    
    async.waterfall([
        // Contar los resultados
        cb => Thread.count(query, cb),
        (num, cb) => {
            totalPages = Math.floor(num / 10) + 1;
            // Generar paginado (perdón por esta cagada de código, debería ir en la view, pero lo arreglo despues)
            if (totalPages > 1) {
                // Primera página
                pages.push({ type: 'page', num: 1, active: p == 1 });
                // Crear un rango de páginas
                let rangeStart = (p - 5 > 0) ? (p - 4) : 2;
                let rangeEnd = (p + 5 < totalPages) ? (p + 4) : totalPages - 1;
                // Poner un divisor a partir de la página 5
                if (rangeStart > 2) pages.push({ type: 'divider' });
                // Añadir botones para cada página
                for (let i = rangeStart; i <= rangeEnd; i++)
                {
                    pages.push({ type: 'page', num: i, active: p == i });
                }
                // Poner un divisor 10+ páginas antes del final
                if (rangeEnd < totalPages - 1) pages.push({ type: 'divider' });
                // Última página
                pages.push({ type: 'page', num: totalPages, active: p == totalPages });
            }
            cb();
        },
        cb => Thread.find(query).skip((p - 1) * 10).limit(10).exec(cb),
    ], (err, result) => {
        if (err) {
            res.render('search-results', {
                title: `Resultados de búsqueda ${q} - ${publicSettings.site.title}`,
                settings: publicSettings,
                currentQuery: q, totalPages: 1, items: [], pages: []
            });
        }
        else {
            res.render('search-results', {
                title: `Resultados de búsqueda ${q} - ${publicSettings.site.title}`,
                settings: publicSettings,
                currentQuery: q, totalPages: totalPages, items: result, pages: pages
            });
        }
    });
});

module.exports = router;