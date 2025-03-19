sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/model/Sorter',
    'sap/m/MessageBox',
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, Filter, FilterOperator, Sorter, MessageBox, Fragment, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("knplsalesofficersportal.controller.List", {
        onInit: async function () {
            console.log('New Application Started');
            this.oRouter = this.getOwnerComponent().getRouter();


            // newUser model structure
            var oNewUser = {
                FIRST_NAME: null,
                LAST_NAME: null,
                EMAIL: null,
                IS_ARCHIVED: 0,
                EMPLOYEE_CODE: null,
                ZONE: null,
                DESIGNATION: null,
                MANAGER: null,
                MOBILE: null,
                DIVISION_IDENTIFIER: null,
                IS_ACTIVATED: 1,
                SALES_GROUP: null,
                ROLE_ID: null,
                RoleName: null
            };

            var oNewUserModel = new JSONModel(oNewUser);
            this.getView().setModel(oNewUserModel, "newUser");



            this.dialogModel = new JSONModel({
                title: "Registering...",
                text: "Please wait user registering..."
            });
            this.getView().setModel(this.dialogModel, "dialogModel");

            // Descending Order Sort for Employees ID's
            this._bDescendingSort = false;

            this._lastSelectedKey = null;

            let dFragmentSForm = new JSONModel({
                rsmVisible: false,
                asmVisible: false,
                tsiVisible: false
            })

            this.getView().setModel(dFragmentSForm, "sFormToggle")




        },
        _formatter: {
            formatRole: function (iRole) {
                if (iRole == 1) {
                    return 'RSM'
                }
                if (iRole == 2) {
                    return 'ASM'
                }

                if (iRole == 3) {
                    return 'TSI'
                }

                return 'Not Assigned'
            }
        },
        // onRoleFilterChange: function (oEvent) {
        //     const oMultiComboBox = oEvent.getSource();
        //     const aSelectedKeys = oMultiComboBox.getSelectedKeys();
        //     console.log(aSelectedKeys)
        //     const aFilter = []
        //     let sQuery = Number(aSelectedKeys);
        //     if (sQuery) {
        //         // filter for employee first name
        //         const oFirstNameFilter = new Filter("ROLE", FilterOperator.Contains, sQuery);
        //         aFilter.push(oFirstNameFilter);
        //     }

        //     // binding filters to the List in Table
        //     const oCombinedFilter = new Filter({ filters: aFilter, and: false });
        //     const oList = this.byId("usersTable");
        //     const oBinding = oList.getBinding("items");
        //     oBinding.filter(oCombinedFilter);
        // },
        
        
        




        // search filter
        onLiveSearch: function (oEvent) {
            const aFilter = [];

            let sQuery = oEvent.getParameter("newValue");

            if (sQuery) {
                // filter for employee first name
                const oFirstNameFilter = new Filter("FIRST_NAME", FilterOperator.Contains, sQuery);
                aFilter.push(oFirstNameFilter);

                const oEmailFilter = new Filter('EMAIL', FilterOperator.Contains, sQuery);
                aFilter.push(oEmailFilter)

                // filter for employee ID
                if (!isNaN(sQuery) && sQuery.trim() !== "") {
                    const oUserIDFilter = new Filter("ID", FilterOperator.EQ, Number(sQuery));
                    aFilter.push(oUserIDFilter);
                }
            }
            // binding filters to the List in Table
            const oCombinedFilter = new Filter({ filters: aFilter, and: false });
            const oList = this.byId("usersTable");
            const oBinding = oList.getBinding("items");
            oBinding.filter(oCombinedFilter);
        },

        // filter for sort of employee ID
        onSort: function () {
            this._bDescendingSort = !this._bDescendingSort;
            const oTable = this.getView().byId("usersTable"),
                oBinding = oTable.getBinding("items"),
                oSorter = new Sorter("ID", this._bDescendingSort);
            oBinding.sort(oSorter);
        },

        // Add new user frgment from frgments->register
        onAdd: function () {
            if (!this.rDialog) {
                this.rDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "knplsalesofficersportal.fragments.register",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this.rDialog.then(oDialog => oDialog.open());

        },

        // submiting the all required data for DB
        onSubmit: async function () {
            const oNewUserModel = this.getView().getModel("newUser");
            const oNewUserData = oNewUserModel.getData();

            // Check for required fields
            
                // Validate user data
                if (this._validateNewUserData(oNewUserData)) {
                    console.log("Validations passed");
                    console.log(oNewUserData);

                    let newData = {
                        FIRST_NAME: oNewUserData.FIRST_NAME,
                        LAST_NAME: oNewUserData.LAST_NAME,
                        EMAIL: oNewUserData.EMAIL,
                        EMPLOYEE_CODE: oNewUserData.EMPLOYEE_CODE,
                        ZONE: oNewUserData.ZONE,
                        DESIGNATION: oNewUserData.DESIGNATION,
                        MANAGER: oNewUserData.MANAGER,
                        MOBILE: oNewUserData.MOBILE,
                        DIVISION_IDENTIFIER: oNewUserData.DIVISION_IDENTIFIER,
                        IS_ACTIVATED: oNewUserData.IS_ACTIVATED,
                        SALES_GROUPS: [{
                            SALES_GROUP: this._formatSalesGroupID(oNewUserData.SALES_GROUP)
                        }],
                        ROLE: [
                            {
                                ROLE_ID: oNewUserData.ROLE_ID
                            }
                        ]

                    }
                    console.log(newData);
                    this.getView().getModel("dialogModel").setData({
                        title: "Please wait...",
                        text: `User is registering with the email ${newData.EMAIL}.`
                    })
                    this.showBusyDialog()
                    this._createUser(newData);


                }
         
            
        },


        // closing fragment
        onCancel: function () {
            this._ModelDataReset()
            this.byId('registerDialog').close();
        },

        // List item press navigation
        onListItemPress: function (oEvent) {

            const oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
            const oSelectedItem = oEvent.getParameter("listItem");
            const oContext = oSelectedItem.getBindingContext("USERS_DATA");
            const sUserID = oContext.getObject().ID;
            const RoleID = oContext.getObject().ROLE[0].ROLE_ID
            // console.log(oContext, oContext.getObject())

            // navigation to detail page
            this.oRouter.navTo("detail", {
                layout: oNextUIState.layout,
                userID: sUserID,
                role: RoleID
            }, true);



        },

        onDeleteUser: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("listItem");
            const oContext = oSelectedItem.getBindingContext("USERS_DATA");
            this.getView().getModel('dialogModel').setData({
                title: "Deleting...",
                text: "Please wait delete operation in progress..."
            })

            if (oContext) {
                const oUserData = oContext.getObject();  // Get the data of the selected user
                // console.log(oUserData)
                MessageBox.confirm('Are you sure you want to delete this user?', {
                    title: "Confirm Deletion",
                    onClose: async (oAction) => {
                        if (oAction === MessageBox.Action.OK) {
                            try {

                                this.showBusyDialog();

                                const deleteUserResult = await this._deleteUserFromDB(oUserData.ID);
                                // console.log(deleteUserResult)
                                if (deleteUserResult.success) {
                                    MessageToast.show("User deleted successfully!");
                                    this.onPostSuccess()
                                }
                            } catch (error) {
                                console.error("Error occurred during user deletion:", error);
                                MessageBox.error("An error occurred while deleting the user.");
                            } finally {
                                // Hide the busy dialog
                                this.hideBusyDialog();
                            }
                        }
                    }
                })
            }
            else {
                MessageBox.error("Please select a user to delete.");
            }
        },



        // Validations
        // Email validation
        // param = email
        _validateNewUserData: function (newData) {
            // Corrected regular expression for email validation
            const EmailRegEx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            // Corrected regular expression for phone number validation (exactly 10 digits)
            const PhoneRegEx = /^\d{10}$/;

            // Validate email
            if (!EmailRegEx.test(newData.EMAIL)) {
                sap.m.MessageBox.error("Please enter a valid email.");
                return false;
            }

            if (!newData.FIRST_NAME) {
                sap.m.MessageBox.error("Please provide first name.");
                return false;
            }

            if (!newData.LAST_NAME) {
                sap.m.MessageBox.error("Please provide last name.");
                return false;
            }

            if (!newData.SALES_GROUP) {
                sap.m.MessageBox.error("Please provide sales group id.");
                return false;
            }

            // Validate phone number
            if (!PhoneRegEx.test(newData.MOBILE)) {
                sap.m.MessageBox.error("Please enter a valid 10-digit phone number.");
                return false;
            }

            return true;
        },

        // sales group id formatting
        // 2 -> 002, 12 -> 012, 123 -> 123
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

        
        // Busy dialog handling
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
        // page refresh on data updation
        onPostSuccess: function () {
            var oModel = this.getView().getModel("USERS_DATA");
            if (oModel) {
                oModel.refresh();
            }
        },

        // model data reset after closing register fragment and submitting it
        _ModelDataReset: async function () {

            const oNewUserModel = this.getView().getModel("newUser");

            oNewUserModel.setData({
                FIRST_NAME: null,
                LAST_NAME: null,
                EMAIL: null,
                IS_ARCHIVED: 0,
                EMPLOYEE_CODE: null,
                ZONE: null,
                DESIGNATION: null,
                MANAGER: null,
                MOBILE: null,
                DIVISION_IDENTIFIER: null,
                IS_ACTIVATED: 1,
                SALES_GROUP: null,
                ROLE_ID: null,
                RoleName: null
            });
        },

        // ajax call for creating new user
        // Create user with promise
        _createUser: function (userData,) {
            let sUrl = this.getOwnerComponent().getModel("USERS_DATA").getServiceUrl();
            sUrl = `${sUrl}user`;
            let that = this;
            $.ajax({
                url: sUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(userData),
                success: function (oData) {
                    console.log(oData)
                    MessageToast.show(`${userData.EMAIL} has been successfully registered.`)
                    that.hideBusyDialog()
                    that.onCancel()
                },
                error: function (error) {
                    MessageBox.error("Error creating user: " + (error.responseJSON?.error?.message || error.statusText))
                    that.hideBusyDialog()
                }
            });
        },





        _deleteUserFromDB: function (userID) {
            let sUrl = this.getOwnerComponent().getModel("USERS_DATA").getServiceUrl();
            sUrl = `${sUrl}user(${userID})`;
            // console.log(sUrl)
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: sUrl,  
                    method: 'DELETE',
                    success: function (response) {
                        resolve({ success: true });  
                    },
                    error: function (error) {
                        console.log(error);
                        reject(new Error("Error deleting user: " + (error.responseJSON?.error?.message || error.statusText)));  
                    }
                });
            });
        },

        onAddSelectChange: function (oEvent) {
            // Get the selected MenuItem key
            var oSelectedItem = oEvent.getParameter("item");
            var sKey = oSelectedItem ? oSelectedItem.getKey() : null;
            let sFormModel = this.getView().getModel('sFormToggle')
            // let oNewUserRoleID = this.getView().getModel('newRole')
            let oNewUser = this.getView().getModel('newUser')

            // Check the selected key and handle accordingly
            if (sKey === "RSM") {
                sFormModel.setData({
                    rsmVisible: true,
                    asmVisible: false,
                    tsiVisible: false
                })
                oNewUser.setData({ ROLE_ID: 1, RoleName: sKey })
                this.onAdd()
            } else if (sKey === "ASM") {

                sFormModel.setData({
                    rsmVisible: false,
                    asmVisible: true,
                    tsiVisible: false
                })
                oNewUser.setData({ ROLE_ID: 2, RoleName: sKey })
                this.onAdd()

            } else if (sKey === "TSI") {
                sFormModel.setData({
                    rsmVisible: false,
                    asmVisible: false,
                    tsiVisible: true
                })
                oNewUser.setData({ ROLE_ID: 3, RoleName: sKey })
                this.onAdd()

            }
        },
        onCapitalizeFirstLetter: function (oEvent) {
            let input = oEvent.getSource();
            let value = input.getValue();

            // Capitalize the first letter
            if (value) {
                input.setValue(value.charAt(0).toUpperCase() + value.slice(1));
            }
        },









    });
});
