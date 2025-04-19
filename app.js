'use strict';

const express = require('express');
const socket_io = require('socket.io');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sass = require('express-dart-sass');
const mongoose = require('mongoose');
const Sentry = require('@sentry/node');
const winston = require('winston');

const routes = require('./routes/index');
const apiRoutes = require('./routes/api');
const socketRoutes = require('./routes/socket');
const threadRoutes = require('./routes/thread');
const searchRoutes = require('./routes/search');

const settings = require('./settings');
const serverSettings = require('./server-settings');
const capitalize = require('./utils/capitalize');

const app = express();

// Socket.io
const io = socket_io();
app.io = io;

// Mongoose
const url = process.env.NODE_ENV === 'test'
    ? serverSettings.db.testUrl
    : serverSettings.db.url;

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
});

// Sentry
if (serverSettings.sentry.enabled) {
    Sentry.init({
        dsn: serverSettings.sentry.dsn,
    });
    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
}

// Winston
winston.configure({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.File({ filename: './logs/logs.log' }),
    ],
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(sass({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    sourceMap: true,
}));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use((req, res, next) => {
    res.locals.capitalize = capitalize;
    next();
});


app.use('/', threadRoutes);
app.use('/', searchRoutes);
app.use('/', routes);
if (settings.features.apiEnabled) {
    app.use('/api', apiRoutes);
}

io.on('connection', socketRoutes);

if (serverSettings.sentry.enabled) {
    // The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler());
}

// Interceptar 404 y enviarlo al error handler
app.use((req, res, next) => {
    const err = new Error('Página no encontrada');
    err.status = 404;
    next(err);
});

// Error handler personalizado
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
    if (app.get('env') === 'development') {
        next(error);
        return;
    }

    res.status(error.status || 500).render('error', {
        title: `Error - ${settings.site.title}`,
        settings, error,
    });
});

module.exports = app;
