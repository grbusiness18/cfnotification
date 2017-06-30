var sqls = require('./dbquery.js')
var Promise = require('promise')
var sqlite3 = require('sqlite3').verbose()
var logger = require.main.require('./app-logs/logger.js')
var databaseManager = function() {
    var db
    var self = this
    var dbInstance = function() {
        var oPromise = new Promise(function(resolve, reject) {
            setTimeout(function() {
                db = new sqlite3.Database('cozy.db', function(error) {
                    if (error) {
                        logger.error(error)
                        reject(error)
                    } else {
                        logger.info('DB Instance created Successfully')
                        resolve({
                            'dbInstance': db
                        })
                    }
                }, 0)
            })
        })
        return oPromise
    }

    var CreateTables = function(sqlstatement) {
        var oPromise = new Promise(function(resolve, reject) {
            setTimeout(function() {
                db.run(sqlstatement, function(error) {
                    if (error) {
                        logger.error('Table Creation - Failed')
                        reject(console.log(error))
                    } else {
                        logger.info('DB Table created - Successfully')
                        resolve("Success - Table Created")
                    }
                })
            }, 0)
        })
        return oPromise
    }

    // delete Lock Objects
    this.DeleteLockObjects = function(objectID) {
        var sSQL = sqls.DelLockObjectsByID
        var dbSQL = db.prepare(sSQL)
        dbSQL.run(objectID, function(error) {
            if (error) {
                throw new Error(error.message)
            }
        })
    }


    // insert Lock Objects
    this.InsertLockObjects = function(data) {
      var sSQL = sqls.InsertLockObjects
      var dbSQL = db.prepare(sSQL)

      dbSQL.run(data.id, data.type, data.locked, data.data, data.timestamp, function(error) {
                if (error) {
                  //  throw new Error(error.message)
                }
            })
        }

    // select all lock objects
    this.SelectLockObjectsAll = function(sendRecords) {
      var sSQL = sqls.SelectLockObjects
      var lockedlogs = []

      db.all(sSQL,function(err, rows) {
        if(err){
          logger.error(err.message)
        } else {
          lockedlogs = rows
          sendRecords(lockedlogs)
        }
      })
   }

   this.SelectLockObjectsbyID = function(id){
     var sSQL = sqls.SelectLockObjectsbyID
     var dbSQL = db.prepare(sSQL)
     var found = false
     dbSQL.run(id, function(err, rows){
       if (!err && rows){
         logger.info(rows)
      found = true
       }
     })
     return found
   }

    if (!db) {
        dbInstance().then(CreateTables(sqls.CreateLockObjects))
    }
}

module.exports = databaseManager
