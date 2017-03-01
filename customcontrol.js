sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/Label",
	"sap/m/Button"
], function (Control) {
	"use strict";
	return Control.extend("sap.ui.demo.wt.control.ProductRating", {
		metadata : {
			properties:{
				counter : { type: "int", defaultValue: 0}
			},
			aggregations:{
				_label : {type : "sap.m.Label", multiple: false, visibility : "hidden"},
				_button : {type : "sap.m.Button", multiple: false, visibility : "hidden"}
			},
			events: {
				click : {}
			}
		},
		init : function () {
			this.setAggregation("_label", new Label({
				text: "0"
			});
			this.setAggregation("_button", new Button({
				text: "",
				icon:"sap-icon://bell",
				iconFirst: false,
				type:"Transparent",
				enabled: true
			}));
		},
		renderer : function (oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.addClass("myAppDemoWTProductRating");
			oRM.writeClasses();
			oRM.write(">");
			oRM.renderControl(oControl.getAggregation("_label"));
			oRM.renderControl(oControl.getAggregation("_button"));
			oRM.write("</div>");
		}
	});
});