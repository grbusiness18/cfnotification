var winston = require('winston')
var fs = require('fs')
var env = process.env.NODE_ENV || 'development'
var logDir = 'app-logs'

// create the log directory if it does not exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
}


var tsFormat = function() {
    new Date().toLocaleTimeString()
}

var logger = new(winston.Logger)({
    transports: [
        // colorize the output to the console.
        new(winston.transports.Console)({
            timestamp: tsFormat,
            colorize: true,
            level: 'info'
        }),
        new(require('winston-daily-rotate-file'))({
            filename: './app-logs/-results.log',
            timestamp: true,
            datePattern: 'yyyy-MM-dd',
            prepend: true,
            level: env === 'development' ? 'verbose' : 'info'
        })
    ]
})

module.exports = logger
