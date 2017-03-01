/*
	Author : Gokulraj Ramdass( D058802 )
		Push Notification Server 
*/

/* Test  */
sap.ui.define([
		"../BasicOdataOperations",
		"../Constants",
		"sap/ui/model/json/JSONModel",
		"../../util/socket.io"
	],function(oDataOperations, Constants, JSONModel, socketIO){

	var Notification = oDataOperations.extend("harmony.util.ServiceCalls.Notificaiton", {

		constructor: function(){
			oDataOperations.call(this);
			
			this.oDataKey = Constants.oDataServiceKeys.Z_HARMONY;
			
			this.serviceURLS = {
				"Subscription" : "/SubscriptionCollection",
				"Subscriptionwithid" : "/SubscriptionCollection(':id')"
			};

			this.pushServer = {
				"url" : window.location.protocol 
							+ "//notifserver.cfapps.us10.hana"
							+ window.location.hostname.split("hana", 2)[1]
			};

			this.socketServerOptions = {
				"reconnectionAttempts": 20,
   			    "reconnectionDelay": 5000,
   				"reconnectionDelayMax": 5000,
   			    "timeout": 100000,
                 "query": "UserID=CLIENT1"
			};

			this.socket;
		},

		onCreateSubscription: function(data, errorCallBack){
			this.onCreate(this.serviceURLS.Subscription, this.oDataKey, {}, data, errorCallBack);
		},

		onGetSubscription: function(){
			this.onRead(this.serviceURLS.Subscription, this.oDataKey, {}, false, this.onSuccessLoadforGetSubscription.bind(this));
		},

		onRemoveSubscription: function(params, successCallBack){
			this.onDelete(this.serviceURLS.Subscriptionwithid, this.oDataKey, params, successCallBack);
		},

		onSuccessLoadforGetSubscription: function(data){

			for (i=0; i < data.results.length; i++){
				sap.ui.getCore().getComponent("__component0").getModel("PushModel").setProperty("/opportunity/" + data.results[i].changeType, true);
			}

			sap.ui.getCore().getComponent("__component0").getModel("PushModel").setProperty("/subscription", data);	
		},

		onCreateNotificationModel: function(oModel){
			var data = {};
			if (oModel){ oModel = new JSONModel(); }
			data.pushServerOn = false;
			data.counter = 0;
			data.notificaitions = {
				"list" : []
			};

			data.opportunity = {
				"created" : false,
				"updated" : false
			};
			
			data.subscription = {};

			oModel.setData(data);
			return oModel;
		},

		getPushServerStatus: function(successCallBack){
			var oStatus = false;

			$.ajax({
				url : this.pushServer.url,
				method: "GET",
				async: false,
				headers: {}
			})
			.done(function(data){
				sap.ui.getCore().getComponent("__component0").getModel("PushModel").setProperty("/pushServerOn", true);
				successCallBack();
			})
			.fail(function(xhr){
				console.log(xhr.statusText);
				sap.ui.getCore().getComponent("__component0").getModel("PushModel").setProperty("/pushServerOn", false);			
			});
		},

		onEstablishSocketConnection: function(){
			var serverStatus = sap.ui.getCore().getComponent("__component0").getModel("PushModel").getData().pushServerOn;
			if (serverStatus){
				this.socket = io.connect( this.pushServerUrl, this.socketServerOptions);
			}
			return this.socket;
		},


		onNewConnection: function(data){
			console.log("Socket connection Established");
		},

		onSocketServerDataFeed: function(data){
			console.log("data from server");
		},

		doPrepareSubscriptionXml: function(data) {

			var sXml = '<entry xmlns="http://www.w3.org/2005/Atom"'
					 + ' xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata"'
					 + ' xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices">'
					 + ' xml:base="http://pgd.wdf.sap.corp/sap/opu/odata/sap/ZDEALHARMONY_EXECUTION_API/">';
				sXml = sXml + '<title type="text">' + data.title + '</title>';
				sXml = sXml + '<updated />';
				sXml = sXml + '<author><name>' + data.author + '</name></author>';
				sXml = sXml + '<content type="application/xml">';
				sXml = sXml + '<m:properties><d:ID/>';
				sXml = sXml + '<d:deliveryAddress>' + this.pushServer.url + '</d:deliveryAddress>';
				sXml = sXml + '<d:persistNotifications>false</d:persistNotifications>';
				sXml = sXml + '<d:collection>' + data.collection + '</d:collection>';
				sXml = sXml + '<d:filter/>';
				sXml = sXml + '<d:select/>';
				sXml = sXml + '<d:changeType>' + data.changeType + '</d:changeType>';
				sXml = sXml + '</m:properties>';
				sXml = sXml + '</content></entry>' ;
			
			return sXml;
		}

	});

	var oNotificaiton = new Notification();
	return oNotificaiton;	
});