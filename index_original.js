var http = require('https')
var port = process.env.PORT || 8080
var express = require('express')
var app = express()
var cors = require('express-cors')
var server = require('http').Server(app)
var io = require('socket.io')(server)
var sqls = require('./dbquery.js')
var Promise = require('promise')
var sqlite3 = require('sqlite3').verbose()
var bodyParser = require('body-parser')
var db
var allowedOrigins = ['', 'wdf.sap.corp']

// function isOriginValid(origin){
//     var sOrigin = origin
//     var searchOrigin = function(element){
//         return sOrigin.includes(element)
//     }
//     return allowedOrigins.find(searchOrigin)
// }

// var corsDelegate = function(req, callback){
//     console.log('Test Cors')
//     debugger
//     var corsOptions
//     if(!isOriginValid(req.header('Origin')) === null){
//         corsOptions = { origin: true }
//     } else {
//         corsOptions = { origin: false }
//     }
//     callback(null, corsOptions)
// }

var whitelist = ['http://example1.com', 'http://example2.com']
var corsOptions = {
  origin: function(origin, callback){
    console.log("Test Cors")
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1
    callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted)
  }
}

var dbInstance = function() {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            db = new sqlite3.Database('cozy.db', function(error) {
                if (error) {
                    reject(LogError(error))
                } else {
                    console.log('Success DB instance')
                    resolve({
                        'dbInstance': db
                    })
                }
            }, 500)
        })
    })
    return oPromise
}


var CreateTables = function(tableName) {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            db.run(tableName, function(error) {
                if (error) {
                    reject(LogError(error))
                } else {
                    console.log('Success Table Created')
                    resolve("Success Table Created")
                }
            })
        }, 500)
    })
    return oPromise
}

var isNewClient = function(id) {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            var sSQL = sqls.SelClientMasterClnt;
            var oParams = {
                '$clientid': id
            }
            db.get(sSQL, oParams, function(error, row) {
                if (error) {
                    reject(LogError(error))
                } else if (row === undefined) {
                    reject(LogError(" No Row Found for ID #" + id))
                } else {
                    console.log('Success Row Retrived')
                    resolve({
                        'row': row
                    })
                }
            })
        }, 500)
    })
    return oPromise
}

var deleteClient = function(id) {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            var sSQL = sqls.DelClientMasterClnt;
            var oParams = {
                '$clientid': id
            }
            db.run(sSQL, oParams, function(error) {
                if (error) {
                    reject(LogError(error))
                } else {
                    console.log('Deleted Client' + id)
                    resolve("Success Table Created")
                }
            })
        }, 500)
    })
    return oPromise
}


var deleteAllClientsForUsers = function(id) {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            var sSQL = sqls.DelClientMasterUsr;
            var oParams = {
                '$userid': id
            }
            db.run(sSQL, oParams, function(error) {
                if (error) {
                    reject(LogError(error))
                } else {
                    console.log('Deleted Client' + id)
                    resolve("Success Table Created")
                }
            })
        }, 500)
    })
    return oPromise
}


var getAllClientsForUser = function(id) {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            var sSQL = sqls.SelClientMasterUsr;
            var oParams = {
                '$userid': id
            }
            db.all(sSQL, oParams, function(error, rows) {
                if (error) {
                    reject(LogError(error))
                } else {
                    console.log("success rows retrievres")
                    resolve(rows);
                }
            })
        }, 1000)
    })
    return oPromise
}

var addNewClient = function(clientid, userid) {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            var sSQL = sqls.InsertClientMaster;
            var vDate = new Date().toJSON().slice(0, 10);
            vDate = vDate.split("-").reverse().join("-");
            var vTime = new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds();
            var dbSql = db.prepare(sSQL)
            dbSql.run(clientid, userid, vDate, vTime, function(error) {
                if (error) {
                    reject(LogError(error))
                } else {
                    console.log("CLient Created ")
                    resolve("Client Added");
                }
            })
            dbSql.finalize()
        }, 1000)
    })
    return oPromise
}


var removeExpiredClients = function() {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            var sSQL = sqls.RemoveExpiredClnts
            var vDate = new Date().toJSON().slice(0, 10);
            vDate = vDate.split("-").reverse().join("-");
            var dbSql = db.prepare(sSQL)
            dbSql.run(vDate, function(error) {
                if (error) {
                    reject(LogError(error))
                } else {
                    console.log("CLient REmoved ")
                    resolve("Client Removed Expired");
                }
            })
            dbSql.finalize()
        }, 1000)
    })
    return oPromise
}

var LogError = function(error) {
    console.log(error.message);
}

var listenPort = function(port) {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            server.listen(port, function(err) {
                if (err) {
                    reject(LogError(err))
                } else {
                    console.log('Server listening in Port #' + port)
                    resolve("'Server listening..");
                }
            })
        }, 500)
    })
    return oPromise
}

var handlePost = function(request, response, jsonData) {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            var headers = request.headers;
            var clientKey = headers['userkey'];
            var userAgent = clientKey || "D058802";
            var randomNo = Math.floor((Math.random() * 100) + 1)
            var msg = JSON.stringify(jsonData)
            getAllClientsForUser(userAgent).then(function(rows) {
                if (rows) {
                    var clients = rows
                    for (i = 0; i <= clients.length; i++) {
                        var socketid = clients[i].clientid
                        //console.log(socketid)
                        //console.log(jsonData)
                        io.to(socketid).emit('DataFeed', {
                            'hello': socketid,
                            'message': msg
                        })
                    }
                    resolve("PushNotifications sent to clinets")
                }
            }, function(error) {
                reject("Error on PUSH PushNotifications")
            })
        })
    })
    return oPromise
}

dbInstance()
    .then(CreateTables(sqls.CreateClientMaster))


var allowCrossDomain = function(req, res, next) {
    
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  console.log("AllowCrossDomain")
  var origin = req.headers.Origin;
  if (origin === 'http://localhost:3000'){
    console.log("Test cors-1")
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    console.log("Test cors-2 ")
    res.send(200);
  } else {
    console.log("Test cors-3")
    next();
  }
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(allowCrossDomain)


app.get("/", function(request, response) {
   // console.log(request.header('Origin'))
    response.status('201').jsonp('Server Up and Running..')
})

app.post("/PushNotifications", function(request, response) {
    console.log(request.header('Origin'))
    var vDate = new Date().toJSON().slice(0, 10);
    vDate = vDate.split("-").reverse().join("-");
    var vTime = new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds();
    handlePost(request, response, request.body).then(function(msg) {
        console.log(msg)
    }, function(err) {
        console.log(err)
    })
    response.status(201).send({
        'User': request.headers['userkey'],
        'Date': vDate,
        'Time': vTime,
        'data': 'Test Push Notification Posted'
    })
})


// Socket Programming ...

io.set( 'origins', '*:*' );


io.on('connection', function(socket) {

    var socketid = socket.id;
    var UserID = socket.handshake.query.UserID || "D058802"
    console.log(UserID)
        // On New Client ... 
    addNewClient(socketid, UserID)
        .then(function(data) {
            io.to(socketid).emit('NewConnection', {
                'hello': socketid,
                'status': 'connected'
            })
        }, function(error) {
            console.log("Client not Added")
        })

    // On Socket Disconnected ...
    socket.on('disconnect', function() {
        var socketid = socket.id

        deleteClient(socketid)
            .then(function(data) {
                io.to(socketid).emit('disconnect', {
                    'hello': socketid,
                    'status': 'dis-connected'
                })
            }, function(error) {
                console.log("Client Removed..")
            })
    });

});

listenPort(port)