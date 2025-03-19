sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller"
], function (JSONModel, Controller) {
	"use strict";

	return Controller.extend("knplsalesofficersportal.controller.Groups", {
		onInit: function () {
            
            // var oUserModel = new sap.ui.model.json.JSONModel();
            // this.getView().setModel(oUserModel, "userModel");
            // this.oUserModel = this.getOwnerComponent().getModel();

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("detailGroup").attachPatternMatched(this._onGroupsMatched, this);
            this._userID = null
            this._userRoleID = null

            let listToggle = new JSONModel ({
                RSMListVisible : false,
                ASMListVisible : false,
                TSIListVisible : false
            })

            this.getView().setModel(listToggle, 'listToggle')
		},
        _onGroupsMatched: function(oEvent){
            this._userID = oEvent.getParameter("arguments").userID;
            this._userRoleID = oEvent.getParameter('arguments').role
            this._userID = Number(this._userID)
            if (this._userID !== NaN){
                this.getView().bindElement({
                    path: `/user(${this._userID})`,
                    model: "USERS_DATA",
                    parameters: {
                        expand: "ROLE,SALES_GROUPS,ASM,TSI,RSM"
                    }
                })
            
            this._ListVisible(this._userRoleID)
                // setTimeout(() => {
                //     console.log(this._salesGroups())
                // }, 4000);
        }
        },
        // formatter for the sales group archieved
        formatter: {
            statusState: function (isArchived) {
                if (isArchived === 1) {
                    return "Error"; 
                } else {
                    return "Success"; 
                }
            },
          
        },
        

        // _salesGroups : function (){
        //     let ElementBinding = this.getView().getBindingContext('USERS_DATA');
        //     let SalesGroupsOfTSiandAsm = ElementBinding.getObject()
        //     console.log(SalesGroupsOfTSiandAsm)

            
            
        // }

        _ListVisible : function (id) {
            let tList = this.getView().getModel('listToggle')
            if(id == 1){
                tList.setData({
                RSMListVisible : true,
                ASMListVisible : false,
                TSIListVisible : false
                })
            }
            if(id == 2) {
                tList.setData({
                    RSMListVisible : false,
                    ASMListVisible : true,
                    TSIListVisible : false
                    })
            }
            if(id == 3){
                tList.setData({
                    RSMListVisible : false,
                    ASMListVisible : false,
                    TSIListVisible : true
                    })
            }

            // console.log(tList.getData())
        }
        


		
	});
});
