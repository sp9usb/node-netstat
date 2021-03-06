"use strict";

var os = require('os');
var activators = require('./activators');
var noop = require('./utils').noop;
var parsers = require('./parsers');
var filters = require('./filters');
var pkg = require('../package');

var commands = {
    linux: {
        cmd: 'netstat',
        args: ['-apn', '--tcp']
    },
    darwin: {
        cmd: 'netstat',
        args: ['-p', 'tcp']
    },
    win32: {
        cmd: 'netstat',
        args: ['-a', '-n', '-o']
    }
};

module.exports = function (options, callback) {
    options = options || {};
    var done = options.done || noop;
    var platform = options.platform || os.platform();
    var command = commands[platform];
    var parser = parsers[platform];
    var handler = callback;
    var activator = options.sync ? activators.sync : activators.async;

    var makeLineHandler = function (stopParsing) {
        return function (line) {
            if (parser(line, handler) === false) {
                stopParsing();
            }
        };
    };

    if (!parser || !command) {
        throw new Error('platform is not supported.');
    }

    if (options.limit && options.limit > 0) {
        handler = filters.limit(handler, options.limit);
    }

    if (options.filter) {
        handler = filters.conditional(handler, options.filter);
    }

    activator(command.cmd, command.args, makeLineHandler, done);
};

exports.commands = commands;
exports.filters = filters;
exports.parsers = parsers;
exports.version = pkg.version;