//
// loadConfig.js
// Author : Gokulraj Ramdass
// 

var moment = require('moment-timezone')

module.exports = {
	setJSONBody: setJSONBody,
	setAuthHeaders: setAuthHeaders,
	beforeRequestHandlers: beforeRequestHandlers,
	afterRequestHandlers: afterRequestHandlers
}

var getEuropeanDate = function(submins) {
    try {
        var jsDate = new Date()

        if (submins > 0) {
            jsDate.setMinutes(jsDate.getMinutes() - submins)
        }
        var cetTimestamp = moment.tz(jsDate, 'Europe/Berlin').format()
        var cetDate = cetTimestamp.slice(0, 10).split("-").join("")
        var cetTime = cetTimestamp.split("T")[1].split("+")[0].split(":").join("")
        return (cetDate + cetTime)
    } catch (e) {}
}

function setJSONBody(requestParams, context, ee, next){
	var d = getEuropeanDate(5);
	if (d.substr(1)=="-") {
		requestParams.headers.appkey = requestParams.headers.appkey.split("D")[0] + "D" + d.substr(1,9) + "T" + d.substr(9,6);
	} else {
		requestParams.headers.appkey = requestParams.headers.appkey.split("D")[0] + "D" + d.substr(0,8) + "T" + d.substr(8,6);
	}
	return next();
}

function setAuthHeaders(requestParams, context, ee, next){
	return next();
}

function beforeRequestHandlers(requestParams, context, ee, next){
	return next();
}

function afterRequestHandlers(requestParams, response, context, ee, next){
	console.log(response.headers);
	return next();
}

