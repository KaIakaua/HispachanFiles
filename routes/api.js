'use strict';

const express = require('express');
const router = express.Router();

const hispafiles = require('./api/hispafiles');
const hispachan = require('./api/hispachan');
const hispasexy = require('./api/hispasexy');

const publicSettings = require('../settings');

router.get('/', (req, res) => {
    // CloudFlare server push
    res.set('Link', '</dist/app.min.js>; rel=preload, </semantic/semantic.min.css>; rel=prefetch, </stylesheets/css/nprogress.css>; rel=prefetch, </semantic/semantic.js>; rel=prefetch');
    res.render('api', {
        title: `Api - ${publicSettings.site.title}`,
        settings: publicSettings,
    });
});

router.post('/threads', (req, res) => {
    const { subject, message, board, file }= req.body;
    const newThread = {
        subject,
        message,
        board,
        file,
        createdAt: new Date(),
    };
    
    saveThread(newThread, (error, saveThread) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to save thread' });
        }
        res.redirect('/board/${board}');
    })
})

router.use('/hispafiles', hispafiles);
router.use('/hispachan', hispachan);
router.use('/hispasexy', hispasexy);

module.exports = router;
