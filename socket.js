var WebSocket = require('ws')
var request = require('request')
var HttpsProxyAgent = require('https-proxy-agent')
var url = require('url')
var validUrl = require('valid-url')


function openWebSocketConnection(){

	var opts = {
		host: "147.204.6.136",
		port: "8080",
		secureEndpoint: true
	}

	var agent = new HttpsProxyAgent(opts)

	console.log('Trying to connect to socket')

	var ws = new WebSocket('wss://relaysapitcloudt.hana.ondemand.com/websocket', { agent: agent, headers: {
				Authorization: 'Bearer 5fca2742bb328badeb545e854b4c2a12'
		}
	})

	ws.on('message', function(data){
		console.log('On Message')
		var msg = JSON.parse(data)

		switch (msg.action) {

			case 'ONLINE_STATUS_CHANGED':
				console.log("websocket connected")
				break

			case 'MESSAGE_CREATED':
				console.log('MESSAGE_CREATED: ' + data)
				break

			default:
				console.log('Default Messgae')
		}

	})

	ws.on('open', function(){
		console.log('websocket opened ' + ws )
	})

	ws.on('error', function(error){
		console.log('Websocket disconnected ->' + error.toString())
		throw error
	})

	ws.on('close', function(code){
		console.log('Websocket closed:' + code )

		setTimeout(function(){
			openWebSocketConnection()
		}, 10000)
	})

}


exports.openWebSocketConnection = openWebSocketConnection
