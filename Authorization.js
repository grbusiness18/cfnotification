var auth = require('basic-auth')
var config = require('./customization/config.js')
var harmonypass = process.env.HARMONYPASS || 'aGFybW9ueS0yMDE3R1IkMTgmMDImODVf'
var harmonyusr = process.env.HARMONYUSER || 'harmony'
var harmonykey = process.env.HARMONYKEY || 'harmonyclient'
var base64 = require('base-64')
var utf8 = require('utf8')
var bigInt = require('big-integer')
var path = require("path")
var moment = require('moment-timezone')
var logger = require.main.require('./app-logs/logger.js')


module.exports = function(request) {
    var self = this
    this.response = {
        'msg': '',
        'code': '',
        'logs': []
    }

    this.getResponse = function() {
        return this.response
    }

    this.credentials = auth(request)
    this.appkey = request.headers['appkey']
    this.userkey = request.headers['userkey']
    this.getEuropeanDate = function(submins) {
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

    this.validateParameters = function() {
        if (self.credentials.name == "" || self.credentials.pass == "" ||  
            self.appkey == "" || self.appkey == undefined || self.userkey == "" || self.userkey == undefined) {
            self.response.msg = 'Not Authorized / invalid parameters'
            self.response.code = '401'
            self.response.logs.push(self.response.code + '-' + self.response.msg)
            logger.error(self.response.code + '-' + self.response.msg)
            return false
        }
        return true
    }

    this.validateCredentials = function() {
        var username = self.credentials.name.split('').reverse().join('')
        var password = ''
        var harmonypassw = ''
        if (harmonypass) {
            harmonypassw = utf8.decode(base64.decode(harmonypass))
        }

        try {
            password = utf8.decode(base64.decode(self.credentials.pass))
        } catch (e) {
            winston.error(" Password Translation failed ")
            password = password
        }
        password = password.substr(0, 7).split('').reverse().join('') + password.substr(7, password.length)
        if (username !== harmonyusr ||
            password !== harmonypassw) {
            self.response.msg = 'Not Authoized - Credentials'
            self.response.code = '401'
            self.response.logs.push(self.response.code + '-' + self.response.msg)
            logger.error(self.response.code + '-' + self.response.msg)
            return false
        }
        return true
    }

    this.validateUserKey = function() {
        if (self.userkey !== harmonykey.toUpperCase()) {
            self.response.msg = 'Not Authorized - UserKey'
            self.response.code = '401'
            self.response.logs.push(self.response.code + '-' + self.response.msg)
            logger.error(self.response.code + '-' + self.response.msg)
            return false
        }
        return true
    }

    this.validateRSAKey = function() {
        var keys = self.appkey.substr(6, self.appkey.length).split("D")[0].split('yek')
        var key1 = bigInt(keys[1]).pow(config.encryptionkeys.k0.d).mod(config.encryptionkeys.k0.n).value.toString()
        var key2 = bigInt(keys[2]).pow(config.encryptionkeys.k1.d).mod(config.encryptionkeys.k1.n).value.toString()
        var key3 = bigInt(keys[3]).pow(config.encryptionkeys.k2.d).mod(config.encryptionkeys.k2.n).value.toString()
        if (parseInt(self.appkey.substr(0, 6)) === parseInt(key1 + key2 + key3) &&
            parseInt(self.appkey.split("D")[1]) === parseInt(self.getEuropeanDate(0).substr(0, 8)) && // Current Server Date in CET
            parseInt(self.appkey.split("T")[1]) < parseInt(self.getEuropeanDate(0).substr(8, 6)) && // Current Server Time in CET
            parseInt(self.appkey.split("T")[1]) > (parseInt(self.getEuropeanDate(10).substr(8, 6)))) { // 30 mins before server time
            return true
        } else {
            self.response.msg = 'Not Authorized - RSA Key'
            self.response.code = '401'
            self.response.logs.push(self.response.code + '-' + self.response.msg)
            logger.error(self.response.code + '-' + self.response.msg)
            return false
        }
        return true
    }

    this.validate = function() {
        if (self.validateParameters() && self.validateCredentials() &&
            self.validateUserKey() && self.validateRSAKey()) {
            self.response.msg = 'Successfully Authorized'
            self.response.code = '201'
            self.response.logs = []
            self.response.logs.push(self.response.code + '-' + self.response.msg)
        }
    }
    this.validate()
}
