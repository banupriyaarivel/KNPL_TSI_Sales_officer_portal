sap.ui.define([
    "sap/ui/core/UIComponent",
    "knplsalesofficersportal/model/models",
    "sap/ui/Device",
    "sap/f/library",
    "sap/f/FlexibleColumnLayoutSemanticHelper",
    "sap/ui/model/json/JSONModel"
], (UIComponent, Device, models, library, FlexibleColumnLayoutSemanticHelper, JSONModel) => {
    "use strict";
    var LayoutType = library.LayoutType;
    return UIComponent.extend("knplsalesofficersportal.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            // this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
            var oData = {
                layout: "OneColumn"
            };
            var oModel = new JSONModel(oData);
            this.setModel(oModel);
        },
        getHelper: function () {
            var oFCL = this.getRootControl().byId("fcl");
            var oParams = new URLSearchParams(window.location.search);
            var oSettings = {
                defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
                defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
                maxColumnsCount: oParams.get("max")
            };

            return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
        }
    });
});