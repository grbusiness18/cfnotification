var http = require('http')
var port = process.env.PORT || 3000
var sysmode = process.env.SYSMODE || 'DEV'
var express = require('express')
var app = express()
var cors = require('express-cors')
var server = require('http').Server(app)
var io = require('socket.io')(server)
var bodyParser = require('body-parser')
var dbm = require('./db/dbManager.js')
var responseCode
var responseMsg
var authorizationrequest = require('./Authorization.js')
var path = require('path')
var db = new dbm()
var logger = require('./app-logs/logger.js')

// Namespace for SOCKET Connections
var GENERALINFO = io.of('/General-Information')
var LOCKOBJECTS = io.of('/Lock-Objects-Information')

logger.info("App Server - Started")
var listenPort = function(port) {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            server.listen(port, function(err) {
                if (err) {
                    logger.error('No Server listening in Port #' + port)
                    reject(err)
                } else {
                    logger.info('Server listening in Port #' + port)
                    resolve("'Server listening..");
                }
            })
        }, 500)
    })
    return oPromise
}


var generalInfoManager = function(msg) {
    logger.info('No.of.socket clients :' + Object.keys(GENERALINFO.sockets).length)
    if (Object.keys(GENERALINFO.sockets).length > 0) {
        GENERALINFO.emit('DataFeed', {
            'hello': 'Notification from Server',
            'message': msg
        })
    }
}

var lockObjectsInfoManager = function(msg) {
    logger.info('No.of.socket clients :' + Object.keys(LOCKOBJECTS.sockets).length)
    if (Object.keys(LOCKOBJECTS.sockets).length <= 0) {
        throw new Error("No clients found to send message")
    }
    var oJSON = JSON.parse(msg)
    //var epoch = parseInt(new Date().toJSON().slice(0, 10).split("-").join(""))
    oJSON.timestamp = parseInt(new Date().toJSON().slice(0, 10).split("-").join(""))

    try {

        if (oJSON.locked == 'X' || oJSON.locked == 'x') {
            oJSON.data = JSON.stringify(oJSON.data)
            db.InsertLockObjects(oJSON)
        } else {
            db.DeleteLockObjects(oJSON.id)
        }
    } catch (e) {
        logger.error("Lock Object Error :" + e.message)
        //throw new Error(e.message)
    }

    LOCKOBJECTS.emit('DataFeed', {
        'hello': 'Notification from Server',
        'message': JSON.stringify(oJSON)
    })
}

var getAllLockObjects = function(socketid) {
    var records = []
    this.sendRecords = function(records) {
        records.forEach(function(rw, index) {
            setTimeout(function() {
                LOCKOBJECTS.to(socketid).emit('DataFeed', {
                    'hello': socketid,
                    'message': JSON.stringify(rw)
                })
            })
        })
    }
    db.SelectLockObjectsAll(this.sendRecords)
}


var handlePost = function(request, response, jsonData) {
    try {
        var headers = request.headers;
        var clientKey = headers['userkey']
        var userAgent = clientKey || "HARMONYCLIENT"
        var msg = JSON.stringify(jsonData)
        var namespace = headers['namespace']
        logger.info('Namespace : ' + namespace)
        logger.info('Message :' + msg)
        switch (namespace) {
            case 'GENERAL':
                generalInfoManager(msg)
                break
            case 'LOCKOBJECTS':
                lockObjectsInfoManager(msg)
                break

            default:
                break
        }

    } catch (e) {
        logger.error(e.message)
        throw new Error(e)
    }
}


app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())


app.get("*", function(request, response, next) {

    if (request.url === "/") {
        var validateResponse = new authorizationrequest(request).getResponse()
        console.log(validateResponse.logs)
        responseCode = validateResponse.code
        responseMsg = validateResponse.msg
        if (responseCode === '201') {
            return next('Success')
        } else {
            responseCode = '401'
            return next('Error')
        }

    } else {
        responseCode = '404'
        responseMsg = 'Not Found..'
        return next('ERROR : Action not allowed or doesnt exists')
    }
})

app.post("/Notifications", function(request, response) {
    logger.info('*------------------------ POST -----------------------------*')
    var vDate = new Date().toJSON().slice(0, 10);
    vDate = vDate.split("-").reverse().join("-");
    var vTime = new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds();
    var validateResponse = new authorizationrequest(request).getResponse()
    responseCode = responseMsg = ''
    responseCode = validateResponse.code
    responseMsg = validateResponse.msg
    logger.info(request.body)
    if (responseCode === '201') {
        try {
            handlePost(request, response, request.body)
            responseCode = '201'
            responseMsg = 'Notification sent to the clients'
        } catch (Error) {
            responseCode = '500'
            responseMsg = Error.message
        }
    }

    response.status(responseCode).send({
        'User': request.headers['userkey'],
        'Date': vDate,
        'Time': vTime,
        'data': responseMsg
    })
    logger.info('*------------------------ End Of POST -----------------------------*')
})


app.post("/*", function(request, response, next) {
    responseCode = '404'
    return next('ERROR : Action not allowed or doesnt exists')
})


app.put("/*", function(request, response, next) {
    responseCode = '404'
    return next('ERROR : Action not allowed or doesnt exists')
})

app.delete("/*", function(request, response, next) {
    responseCode = '404'
    return next('ERROR : Action not allowed or doesnt exists')
})

app.use(function(err, request, response, next) {
    if (err) {
        if (responseCode == '401') {
            response.status(responseCode).sendFile(path.join(__dirname + '/img/401.png'))
        } else if (responseCode == '404') {
            response.status(responseCode).sendFile(path.join(__dirname + '/img/404.png'))
        } else if (responseCode == '500') {
            response.status(responseCode).sendFile(path.join(__dirname + '/img/401.png'))
        } else {
            response.status('201').jsonp('Server Up and Running..')
        }
    }
    responseCode = responseMsg = ''
})


//Socket Programming ...
io.set('origins', '*:*');

// GeneralInformation Namespace Connection
GENERALINFO.on('connection', function(socket) {
    //console.log(socket)
    var socketid = socket.id;
    GENERALINFO.to(socketid).emit('NewConnection', {
        'hello': socketid,
        'status': 'connected'
    })

    // On Socket Disconnected ...
    socket.on('disconnect', function() {
        var socketid = socket.id

        GENERALINFO.to(socketid).emit('disconnect', {
            'hello': socketid,
            'status': 'dis-connected'
        })
    })
})


// Lock Objects Namespace Connections
LOCKOBJECTS.on('connection', function(socket) {
    //console.log(socket)
    var socketid = socket.id;
    LOCKOBJECTS.to(socketid).emit('NewConnection', {
        'hello': socketid,
        'status': 'connected'
    })

    socket.on("getAllLocks", function() {
        getAllLockObjects(socketid)
    })

    // On Socket Disconnected ...
    socket.on('disconnect', function() {
        var socketid = socket.id

        LOCKOBJECTS.to(socketid).emit('disconnect', {
            'hello': socketid,
            'status': 'dis-connected'
        })
    })
})

// General Namespace Connection
io.on('connection', function(socket) {
    //console.log(socket)
    var socketid = socket.id;
    io.to(socketid).emit('NewConnection', {
        'hello': socketid,
        'status': 'connected'
    })

    // On Socket Disconnected ...
    socket.on('disconnect', function() {
        var socketid = socket.id

        io.to(socketid).emit('disconnect', {
            'hello': socketid,
            'status': 'dis-connected'
        })
    })
})

listenPort(port);
