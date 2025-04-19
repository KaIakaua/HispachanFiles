'use strict';

const express = require('express');
const router = express.Router();
const marked = require('marked');
const news = marked(require('fs').readFileSync('news.md', 'utf-8'));
const publicSettings = require('../settings');
const { boards } = require('../boards');


router.get('/', (req, res) => {
    res.render('index', {
        title: `${publicSettings.site.title} - ${publicSettings.site.subtitle}`,
        settings: publicSettings,
        news,
        boards,
    });
});

  

module.exports = router;