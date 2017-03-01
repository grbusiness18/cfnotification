

// Sqlite Properties....
exports.TableExists  	 	= "SELECT name FROM sqlite_master WHERE type='table' AND name='&tablename&'";
exports.ClientMaster 	 	= "clientmaster";
exports.LockObjects         = "lockobjects";


// Client Master DB Operations...
exports.CreateClientMaster 	= "CREATE TABLE IF NOT EXISTS clientmaster( clientid TEXT PRIMARY KEY, userid TEXT, conndate NUMERIC, conntime NUMERIC)";
exports.InsertClientMaster  = "INSERT INTO clientmaster(clientid, userid, conndate, conntime) VALUES(?, ?, ?, ?)";
exports.SelClientMasterClnt = "SELECT clientid, userid, conndate, conntime FROM clientmaster WHERE clientid=$clientid";
exports.SelClientMasterUsr  = "SELECT clientid, userid, conndate, conntime FROM clientmaster WHERE userid=$userid";
exports.DelClientMasterClnt = "DELETE FROM clientmaster WHERE clientid=$clientid";
exports.DelClientMasterUsr  = "DELETE FROM clientmaster WHERE userid=$userid";
exports.RemoveExpiredClnts  = "DELETE FROM clientmaster WHERE conndate<$conndate";


// Lock Object Tables ...
exports.CreateLockObjects   = "CREATE TABLE IF NOT EXISTS lockobjects( objectid INTEGER PRIMARY KEY, type TEXT, locked TEXT, timestamp INTEGER)";
exports.InsertLockObjects 	= "INSERT INTO lockobjects(objectid, type, locked, timestamp) VALUES(?,?,?,?)";
exports.DelLockObjectsByID	= "DELETE FROM lockobjects WHERE objectid=$objectid";
exports.DelLockObjectsByTS  = "DELETE FROM lockobjects WHERE timestamp<$timestamp";
exports.DelLockObjectsALL	= "DELETE FROM lockobjects WHERE objectid<>$objectid";