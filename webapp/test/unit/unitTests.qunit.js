/* global QUnit */
// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false;

sap.ui.require([
	"knpl_sales_officers_portal/test/unit/AllTests"
], function (Controller) {
	"use strict";
	QUnit.start();
});