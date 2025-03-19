sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
    ],
    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("knplsalesofficersportal.controller.FlexibleColumnLayout", {
            onInit: function () {
                this.oRouter = this.getOwnerComponent().getRouter();

                this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                this.oRouter.attachBeforeRouteMatched(this.onBeforeRouteMatched, this);

                // Initialize column distribution sizes
                this.oAPPColumnSizes = {
                    desktop: {
                        TwoColumnsMidExpanded: "25/75/0" 
                    },
                    tablet: {
                        TwoColumnsMidExpanded: "40/50/100", 
                        ThreeColumnsMidExpanded: "20/70/10" 
                    }
                };

                // Set the model for column distribution with initial data
                this.oFCL = this.getView().byId("app");
                var oModel = new JSONModel(this.oAPPColumnSizes);
                this.getView().setModel(oModel, "columnsDistribution");
            },

            // Prepares the layout state before a route is matched
            onBeforeRouteMatched: function (oEvent) {
                var oModel = this.getOwnerComponent().getModel();
                var sLayout = oEvent.getParameters().arguments.layout;

                // If no layout is defined in route, use the default layout
                if (!sLayout) {
                    var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(0);
                    sLayout = oNextUIState.layout;
                }

                // Update the FlexibleColumnLayout layout state in the model
                if (sLayout) {
                    oModel.setProperty("/layout", sLayout);
                }
            },

            // Handler for when a route is matched
            onRouteMatched: function (oEvent) {
                var sRouteName = oEvent.getParameter("name"),
                    oArguments = oEvent.getParameter("arguments");

                this._updateUIElements();

                // Save the current route information
                this.currentRouteName = sRouteName;
                this.currentProduct = oArguments.product;
                this.currentSupplier = oArguments.supplier;
            },

            // Updates the UI elements based on current UI state
            _updateUIElements: function () {
                var oModel = this.getOwnerComponent().getModel();
                var oUIState = this.getOwnerComponent().getHelper().getCurrentUIState();

                // Ensure model and UI state are valid before updating
                if (oModel && oUIState) {
                    oModel.setData(oUIState);
                } else {
                    console.error("Model or UI State is undefined:", oModel, oUIState);
                }
            },

            // Cleans up the event handlers when the controller is destroyed
            onExit: function () {
                this.oRouter.detachRouteMatched(this.onRouteMatched, this);
                this.oRouter.detachBeforeRouteMatched(this.onBeforeRouteMatched, this);
            }
        });
    }
);
