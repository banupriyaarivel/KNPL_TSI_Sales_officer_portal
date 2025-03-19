
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/GroupHeaderListItem"

], function (Controller, MessageBox,MessageToast, JSONModel, Fragment, Filter, FilterOperator, GroupHeaderListItem) {
    "use strict";
    return Controller.extend("knplsalesofficersportal.controller.Detail", {
        onInit: function () {
            this.oFColumnModel = this.getOwnerComponent().getModel();

            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("detail").attachPatternMatched(this._onUserMatched, this);
            // this.oRouter.getRoute("detailGroup").attachPatternMatched(this._onUserMatched, this);
            this._userID = null;

            // // page refresh 
            window.addEventListener('beforeunload', function () {
                sessionStorage.setItem('pageRefreshed', 'true');
            });

            if (sessionStorage.getItem('pageRefreshed') === 'true') {

                this.handleClose();

                sessionStorage.removeItem('pageRefreshed');
            }

            let nSalesGroup = new JSONModel({
                ID: null,
                SALES_GROUP: null,
                USER_ID: null,
                IS_ARCHIVED: null,
                CREATED_AT: null,
                UPDATED_AT: null
            })
            this.getView().setModel(nSalesGroup, 'nSalesGroup')

            var tSection = new JSONModel({ asmMapVisible: false, tsiMapVisible: false, rsmMapVisible: false })
            this.getView().setModel(tSection, 'toggleSection')

            let sEditUser = new JSONModel()
            this.getView().setModel(sEditUser, 'existData')

            let dialogModel = new JSONModel({
                title: "Updating...",
                text: "Please wait user details updating..."
            });
            this.getView().setModel(dialogModel, "dialogModel");

            let rsmDepos = new JSONModel()
            this.getView().setModel(rsmDepos, "rsmDepos")

            let setPassword = new JSONModel({userScimID: '',password: '', rePassword: ''})
            this.getView().setModel(setPassword, "setPassword")

            let updateIASUser = new JSONModel({userScimID: null,active: null})
            this.getView().setModel(updateIASUser, "updateIASUser")

        },
        // sales group column section
        // ID -> userID
        _openGroups: function (ID, roleId) {
            var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(2);
            this.oRouter.navTo("detailGroup", {
                layout: oNextUIState.layout,
                userID: ID,
                role: roleId
            });
        },

        onPostSuccess: function () {
            var oModel = this.getView().getModel("USERS_DATA");
            if (oModel) {
                oModel.refresh();
                this._getDeposofRSM(this._userID)
            }
        },



        // formaters for the icons and color status and if data is null -> not available
        formatter: {
            fullName: function (firstName, lastName) {
                return lastName === null ? firstName : firstName + " " + lastName;
            },
            statusIcon: function (isTrue) {
                return Number(isTrue) === 1 ? "sap-icon://sys-enter-2" : "sap-icon://decline";
            },
            statusState: function (isTrue) {
                return Number(isTrue) === 1 ? "Success" : "Error";
            },
            nullState: function (rValue) {
                // console.log(rValue)
                if (rValue == 'NULL'){
                    return 'Not Available'
                }
                return rValue ? rValue : 'Not Available';
                
            },
            formatRole: function (iRole) {
                let toggleSection = this.getView().getModel('toggleSection')
                let tAssignSections = this.getView().getModel('tAssignSections')
                if (iRole == 1) {
                    toggleSection.setData({ asmMapVisible: false, tsiMapVisible: false, rsmMapVisible: true })
                    // tAssignSections.setData({AsmUserSection : false,
                    //     RsmUserSection : true})
                    return 'RSM'
                }
                if (iRole == 2) {
                    toggleSection.setData({ asmMapVisible: true, tsiMapVisible: false, rsmMapVisible: false })
                    // tAssignSections.setData({AsmUserSection: true, RsmUserSection : false})
                    return 'ASM'
                }

                if (iRole == 3) {
                    toggleSection.setData({ asmMapVisible: false, tsiMapVisible: true, rsmMapVisible: false })
                    return 'TSI'
                }

                return 'Not Assigned'
            },
            formatRowCount: function (aData) {
                if (aData && aData.length) {
                    return `Total Rows: ${aData.length - 1}`;
                }
                return "Total Rows: 0";
            },
            activeFormat: function (isActive) {
                // console.log(typeof isActive)
                // return Number(isActive) ? 'Active' : 'Inactive'
                if (Number(isActive)) {
                    
                    return 'Active'
                }
                
                return 'Inactive'
            }

        },

        // close function for the Detail page
        handleClose: function () {
            var sNextLayout = this.oFColumnModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
            this.oRouter.navTo("list", { layout: sNextLayout });
        },

        _onUserMatched: async function (oEvent) {
            // console.log(oEvent.getParameter('arguments').role)
            this._userID = oEvent.getParameter("arguments").userID;
            this._userID = Number(this._userID);
            let RoleID = oEvent.getParameter('arguments').role
            // console.log(oEvent.getParameter("arguments"))



            if (!isNaN(this._userID)) {
                this.getView().bindElement({
                    path: `/user(${this._userID})`,
                    model: "USERS_DATA",
                    parameters: {
                        expand: "ROLE,ASM,TSI,SALES_GROUPS,RSM"
                    }
                });
                this._openGroups(this._userID, RoleID)
                this._getDeposofRSM(this._userID)

            }
        },


        onTSIAssignUser: function (oEvent) {
            // console.log(oEvent.getSource().getElementBinding('USERS_DATA'))
            let ElementBinding = this.getView().getBindingContext('USERS_DATA');
            // console.log(ElementBinding.getObject())
            let existData = ElementBinding.getObject()
            let eASMDetails = {
                ASMID: existData.EMPLOYEE_CODE,

            }


            if (!this.aDialog) {
                this.aDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "knpltsiiasfrontend.fragments.tsiAssignDialog",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this.aDialog.then(oDialog => {
                oDialog.open()
            });



        },
        onTsiClose: function () {
            this.byId('tsiAssignDialog').close();
        },

        onASMAssignUser: function (oEvent) {
            // console.log(oEvent.getSource().getElementBinding('USERS_DATA'))
            let ElementBinding = this.getView().getBindingContext('USERS_DATA');
            // console.log(ElementBinding.getObject())
            let existData = ElementBinding.getObject()
            let eASMDetails = {
                ASMID: existData.EMPLOYEE_CODE,

            }


            if (!this.aDialog) {
                this.aDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "knpltsiiasfrontend.fragments.asmAssignDialog",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this.aDialog.then(oDialog => {
                oDialog.open()
            });



        },
        onAsmClose: function () {
            this.byId('asmAssignDialog').close();
        },
        getVWERK: function (oContext) {
            return oContext.getProperty('VWERK');

        },
        getGroupHeader: function (oGroup) {

            return new GroupHeaderListItem({
                title: oGroup.key
            })

        },


        _getDeposofRSM: function (id) {
            let sUrl = `${this.getOwnerComponent().getModel('USERS_DATA').getServiceUrl()}user(${id})?$expand=RSM`
            let that = this
            $.ajax({
                url: sUrl,
                method: 'GET',
                success: function (oData) {
                    if (oData.RSM.length !== 0) {
                        that._uniqueRsmDepos(oData.RSM)
                    }
                },
                error: function (oError) {
                    console.log(oError)
                }
            })
        },
        _uniqueRsmDepos: function (aDepos) {
            let rsmDepos = this.getView().getModel('rsmDepos');

            // Extract unique VWERK values and format as required
            let uniqueVWERK = {
                Depos: Array.from(
                    new Set(aDepos.map(depo => depo.VWERK ? depo.VWERK : null))
                ).map(vwerk => ({ VWERK: vwerk })),

                ASMUsers: Array.from(
                    aDepos.reduce((map, depo) => {
                        const key = `${depo.ASMID}-${depo.ASMUNIQUE_SG}`;
                        if (!map.has(key)) {
                            map.set(key, depo);
                        }
                        return map;
                    }, new Map()).values()
                ),
                TSIUsers: Array.from(
                    aDepos.reduce((map, depo) => {
                        const key = `${depo.SALESMANID}-${depo.VKGRP}`
                        if (!map.has(key)) {
                            map.set(key, depo)
                        }
                        return map;
                    }, new Map()).values()
                )


            };

            // console.log(uniqueVWERK);


            rsmDepos.setData(uniqueVWERK);
            // console.log(rsmDepos.getData())
        },



        // open fragment
        handleEdit:async function () {
            // console.log('HandleEdit');

            var ElementBinding = this.getView().getBindingContext('USERS_DATA');
            let nSalesGroup = this.getView().getModel('nSalesGroup');

       

            // Fetch existing data and set it to the model
            let existData = ElementBinding.getObject();
            this.getView().getModel('existData').setData(existData);
            
            // Check if SALES_GROUPS exists and has data
            if (existData.SALES_GROUPS && existData.SALES_GROUPS.length > 0) {
                // Assign existing SALES_GROUP
                nSalesGroup.setData({
                    ID: existData.ID,
                    SALES_GROUP: existData.SALES_GROUPS[0].SALES_GROUP, // Assuming first entry
                    USER_ID: existData.ID,
                    IS_ARCHIVED: existData.IS_ARCHIVED
                });
            } else {
                // Assign a new SALES_GROUP
                nSalesGroup.setData({
                    ID: existData.ID,
                    USER_ID: existData.ID,
                    IS_ARCHIVED: existData.IS_ARCHIVED
                });
            }

            // console.log(nSalesGroup.getData());

            // Load and open the dialog
            if (!this.eDialog) {
                this.eDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "knplsalesofficersportal.fragments.editDialog",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this.eDialog.then(oDialog => oDialog.open());
        },

        // closing fragment
        onCancel: function () {
            this.byId('editDialog').close();
        },

        onSubmit: async function (oEvent) {
            const nData = this.getView().getModel('existData').getData();
            let nSalesGroup = this.getView().getModel('nSalesGroup').getData()
            // let updateIASUser = this.getView().getModel('updateIASUser')
            console.log(nData)
            let _userEditedData = {
                FIRST_NAME: nData.FIRST_NAME,
                LAST_NAME: nData.LAST_NAME,
                EMAIL: nData.EMAIL,
                ZONE: nData.ZONE,
                DESIGNATION: nData.DESIGNATION,
                MANAGER: nData.MANAGER,
                MOBILE: nData.MOBILE,
                DIVISION_IDENTIFIER: nData.DIVISION_IDENTIFIER,
                IS_ACTIVATED: nData.IS_ACTIVATED,
                IS_ARCHIVED: nData.IS_ARCHIVED,
                EMPLOYEE_CODE: nData.EMPLOYEE_CODE,
                SALES_GROUPS: [{
                    SALES_GROUP: nData.SALES_GROUPS.length === 0 ? null : nData.SALES_GROUPS[0].SALES_GROUP
                }],
                ROLE: [
                    {
                        ROLE_ID: nData.ROLE[0].ROLE_ID
                    }
                ]


            };

            console.log(_userEditedData)
            if (this._validateNewUserData(_userEditedData)) {
                console.log('Validation passed')
                _userEditedData.ROLE[0].ROLE_ID = Number(_userEditedData.ROLE[0].ROLE_ID)
                this.getView().getModel("dialogModel").setData({
                    title: "Please wait...",
                    text: "User details updating..."
                })
                this.showBusyDialog()
                this._updateUserDetails(_userEditedData)
                
            }

           
        },

        onRadioButtonChange: function (oEvent) {
            var sId = oEvent.getSource().getId(); // ID of the changed RadioButtonGroup
            var iSelectedIndex = oEvent.getParameter("selectedIndex"); // Selected index (0 = Yes, 1 = No)
            var oModel = this.getView().getModel("existData");

            if (sId.includes("Active")) {
                oModel.setProperty("/IS_ACTIVATED", iSelectedIndex === 0 ? 1 : 0);
            } else if (sId.includes("Archive")) {
                oModel.setProperty("/IS_ARCHIVED", iSelectedIndex === 0 ? 1 : 0);
            }
        },// Busy dialog handling
        showBusyDialog: function () {


            if (!this._pBusyDialog) {
                this._pBusyDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "knplsalesofficersportal.fragments.busyDialog",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pBusyDialog.then(oDialog => oDialog.open());
        },
        // hide busy dialog
        hideBusyDialog: function () {
            if (this._pBusyDialog) {
                this._pBusyDialog.then(oDialog => oDialog.close());
            }
        },

        // Validations
        // Email validation
        // param = email
        _validateNewUserData: function (newData) {
            
            if (!newData.FIRST_NAME) {
                sap.m.MessageBox.error("First name should not be empty.");
                return false
            }
            if (!newData.LAST_NAME) {
                sap.m.MessageBox.error("Last name should not be empty.");
                return false
            }
            
            return true;
        },
        _formatSalesGroupID: function (value) {
            let newValue;
            if (value.length === 1) {
                newValue = "00" + value
            } else if (value.length === 2) {
                newValue = "0" + value
            } else {
                newValue = value
            }

            return newValue
        },

        onLiveSearchforASMuser: function (oEvent) {
            // Get the search query
            var sQuery = oEvent.getParameter("newValue");
            // Build filter array
            var aFilters = [];
            if (sQuery) {
                aFilters.push(
                    new Filter({
                        filters: [
                            new Filter("ASMID", FilterOperator.Contains, sQuery),
                            new Filter("EMAIL_ASM", FilterOperator.Contains, sQuery)
                        ],
                        and: false // Matches if any of the conditions are true
                    })
                );
            }

            var oTable = this.byId("ASMusersTableforRSM");
            var oBinding = oTable.getBinding("rows");

            oBinding.filter(aFilters);
        },

        onLiveSearchforTSIuser: function (oEvent) {


            let sQuery = oEvent.getParameter("newValue");
            console.log(sQuery)

            var aFilters = [];
            if (sQuery) {
                aFilters.push(
                    new Filter({
                        filters: [
                            new Filter("SALESMANID", FilterOperator.Contains, sQuery),
                            new Filter("EMAIL_TSI", FilterOperator.Contains, sQuery)
                        ],
                        and: false // Matches if any of the conditions are true
                    })
                );
            }
            const oList = this.byId("TSIusersTableforRSM");
            const oBinding = oList.getBinding('rows');
            oBinding.filter(aFilters);
        },
        onLiveSearchforTSIuserinASM: function (oEvent) {
            const aFilter = [];

            let sQuery = oEvent.getParameter("newValue");
            console.log(sQuery)

            if (sQuery) {
                // filter for employee first name
                const oFirstNameFilter = new Filter("EMAIL_TSI", FilterOperator.Contains, sQuery);
                aFilter.push(oFirstNameFilter);

                const oEmailFilter = new Filter('SALESMANID', FilterOperator.Contains, sQuery);
                aFilter.push(oEmailFilter)

            }
            // binding filters to the List in Table
            const oCombinedFilter = new Filter({ filters: aFilter, and: false });
            const oList = this.byId("TSIusersTableforASM");
            const oBinding = oList.getBinding('rows');
            oBinding.filter(oCombinedFilter);
        },
        onLiveSearchforRSMDepo: function (oEvent) {
            const aFilter = [];

            let sQuery = oEvent.getParameter("newValue");

            if (sQuery) {
                // filter for VWERK 
                const oFirstNameFilter = new Filter("VWERK", FilterOperator.Contains, sQuery);
                aFilter.push(oFirstNameFilter);

            }
            // binding filters to the List in Table
            // const oCombinedFilter = new Filter({ filters: aFilter, and: false });
            const oList = this.byId("depotList");
            const oBinding = oList.getBinding('items');
            oBinding.filter(aFilter);
        },
        

    
        
        

        _updateUserDetails: function (userData) {
            // console.log(userData)
            let that = this
            let sUrl = `${this.getOwnerComponent().getModel('USERS_DATA').getServiceUrl()}user(${this._userID})`;
                $.ajax({
                    url: sUrl,
                    method: 'PATCH',
                    contentType: 'application/json',
                    data: JSON.stringify(userData),
                    success: function (data) {
                        MessageToast.show("User details updated");
                        that.onPostSuccess()
                        that.onCancel()
                        that.hideBusyDialog()
                    },
                    error: function (err) {
                        console.error("Error updating user details:", err);
                        MessageBox.error((err.responseText || "Failed to update user details."));
                        that.hideBusyDialog()
                    },
                });
            
        }

        

    });
});
