var http 		= require('http')
var port 		= process.env.PORT || 3000
var harmonypass = process.env.HARMONYPASS || 'harmony-2017GR$18&02&85_'
var harmonyusr  = process.env.HARMONYUSER || 'ynomrah'
var harmonykey  = process.env.HARMONYKEY  || 'harmonyclient'
var sysmode		= process.env.SYSMODE     || 'DEV'
var express 	= require('express')
var app 		= express()
var cors 		= require('express-cors')
var server 		= require('http').Server(app)
var io 			= require('socket.io')(server)
var sqls 		= require('./dbquery.js')
var Promise 	= require('promise')
var sqlite3 	= require('sqlite3').verbose()
var bodyParser  = require('body-parser')
var config 		= require('./config.js')
var auth 		= require('basic-auth')
var base64 		= require('base-64')
var utf8    	= require('utf8')
var bigInt		= require('big-integer')
var path 		= require("path")
var moment 		= require('moment-timezone')
var db
var responseCode
var responseMsg

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

 var LogError = function(error) {
     console.log(error.message);
 }

var listenPort = function(port) {
    var oPromise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            server.listen(port, function(err) {
                if (err) {
                	console.log('No Server listening in Port #' + port)
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

var getEuropeanDate = function(submins){
	try {
		var jsDate = new Date()

		if (submins > 0){
			jsDate.setMinutes(jsDate.getMinutes() - submins)
		}
		var cetTimestamp = moment.tz(jsDate, 'Europe/Berlin').format()
		var cetDate = cetTimestamp.slice(0,10).split("-").join("")
		var cetTime = cetTimestamp.split("T")[1].split("+")[0].split(":").join("")
		return(cetDate + cetTime)
	} catch (e) {
	}
}

var handlePost = function(request, response, jsonData) {
    console.log(jsonData)
    var headers = request.headers;
    var clientKey = headers['userkey']
    var userAgent = clientKey || "HARMONYCLIENT"
    var msg = JSON.stringify(jsonData)
    var epoch = parseInt(new Date().toJSON().slice(0, 10).split("-").join(""))
    if (jsonData.Locked === 'X') {
        var sSQL = sqls.InsertLockObjects;
        var dbSQL = db.prepare(sSQL)
        dbSQL.run(jsonData.ObjectID, jsonData.Type, jsonData.Locked, epoch, function(error) {
            if (!error) {
                io.emit('DataFeed', {
                    'hello': 'Notification From Server',
                    'message': msg
                })
            }
        })
    } else {
        sSQL = sqls.DelLockObjectsByID
        dbSQL = db.prepare(sSQL)
        dbSQL.run(jsonData.ObjectID, function(error) {
            if (!error) {
                io.emit('DataFeed', {
                    'hello': 'Notification from Cloud Foundry Server',
                    'message': msg
                })
            }
        })
    }
}

var afterPost = function(){
	var today = new Date().toJSON().slice(0, 10).split("-").join("")
	sSql = sqls.DelLockObjectsByTS
	dbSQL = db.prepare(sSQL)
	dbSQL.run(today, function(error){
		console.log('DB delete Old objects executed..')
	})
}

var validateRequest = function(request){

	try {

	var credentials = auth(request)
	var appkey = request.headers['appkey']
	var userkey = request.headers['userkey']

	if (credentials.name == "" || credentials.pass == "" || appkey == "" || appkey == undefined || userkey == "" || userkey == undefined ) {
	//	console.log(appkey, userkey, credentials.name, credentials.pass )
		responseMsg = 'Not Authorized / invalid parameters' 
		return '401'
	}
	
	
	username = credentials.name.split('').reverse().join('')
	
	try {
		var password = utf8.decode(base64.decode(credentials.pass))
	} catch (e){
		password = credentials.pass
	}
		
	password = password.substr(0,7).split('').reverse().join('') + password.substr(7, password.length)
	
	// validate password & username
	if ( (username !== harmonyusr.split('').reverse().join('')) ||
		(password !== harmonypass)) 
	{
		responseMsg = 'Not Authorized - credentials'
		return '401'
	}

	// validate user key 
	if ( userkey !== harmonykey.toUpperCase()) {
		responseMsg = 'Not Authorized - userkey'
		return '401'
	}

	// validate app token	
	console.log(appkey.substr(6,appkey.length).split("D")[0].split('yek'))
	var keys = appkey.substr(6,appkey.length).split("D")[0].split('yek')
	var key1 = bigInt(keys[1]).pow(config.encryptionkeys.k0.d).mod(config.encryptionkeys.k0.n).value.toString()
	var key2 = bigInt(keys[2]).pow(config.encryptionkeys.k1.d).mod(config.encryptionkeys.k1.n).value.toString()
 	var key3 = bigInt(keys[3]).pow(config.encryptionkeys.k2.d).mod(config.encryptionkeys.k2.n).value .toString()
	console.log(parseInt(getEuropeanDate(30).substr(8,6) ), key1 + key2 + key3)
	if (parseInt(appkey.substr(0,6)) === parseInt(key1 + key2 + key3) &&
		parseInt(appkey.split("D")[1]) === parseInt(getEuropeanDate(0).substr(0,8)) &&    // Current Server Date in CET
		parseInt(appkey.split("T")[1])	< parseInt(getEuropeanDate(0).substr(8,6))  &&   // Current Server Time in CET
		parseInt(appkey.split("T")[1])	> (parseInt(getEuropeanDate(30).substr(8,6)))) {  // 30 mins before server time
		responseMsg = 'Successfull'
		return '201'
	} else {
		responseMsg = 'Not Authorized - app key'
		return '401'
	}

	} catch (e) {
		responseMsg = 'Error : ' + e
		return '500'
		
	}
	responseMsg = 'Successfull'
	return '201'
	
}


dbInstance().then(CreateTables(sqls.CreateLockObjects))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


 app.get("*", function(request, response, next){
	if ( request.url === "/" ){
		responseCode = validateRequest(request)
		if (responseCode === '201'){
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
    var credentials = auth(request);
    var vDate = new Date().toJSON().slice(0, 10);
    vDate = vDate.split("-").reverse().join("-");
    var vTime = new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds();
    responseCode = validateRequest(request)

    if (responseCode === '201'){
    	 try {
    	handlePost(request, response, request.body)
    	responseCode = '201'
    	responseMsg  = 'Push Notification sent to the clients'
    } catch (Error){
    	responseCode = '500'
    	responseMsg  = Error
    	}
    } 
   
    
    response.status(responseCode).send({
        'User': request.headers['userkey'],
        'Date': vDate,
        'Time': vTime,
        'data': responseMsg
    })
})


app.post("/*", function(request, response, next){
	responseCode = '404'
	return next('ERROR : Action not allowed or doesnt exists')
})


app.put("/*", function(request, response, next){
	responseCode = '404'
	return next('ERROR : Action not allowed or doesnt exists')
})

app.delete("/*", function(request, response, next){
	responseCode = '404'
	return next('ERROR : Action not allowed or doesnt exists')
})

app.use(function(err, request,response, next){
	if (err){ 
		if (responseCode == '401'){
			response.status(responseCode).sendFile(path.join(__dirname+'/img/401.png'))
		} else if (responseCode == '404') {
			response.status(responseCode).sendFile(path.join(__dirname+'/img/404.png'))
		} else if (responseCode == '500'){
			response.status(responseCode).sendFile(path.join(__dirname+'/img/401.png'))
		} else {
			response.status('201').jsonp('Server Up and Running..')
		}
	} 
	responseCode = ''
})

//Socket Programming ...

io.set( 'origins', '*:*' );

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
     });

});

listenPort(port);