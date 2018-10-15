

app.controller('user_modal',
    function ($scope, MetaService, DataService, entity_service, $uibModalInstance, modalParams, $timeout, $http, $locale, $translate) {
        $scope.meta = MetaService;
        $scope.DS = DataService;
        $scope.params = modalParams;
        $scope.ES = entity_service;
        $scope.user = modalParams.user || {};
        $scope.isNew = !$scope.user.id;

        $scope.apply = function () {
            if ($scope.form.$valid) {
                $scope.user.name = $scope.user.firstName + " " + $scope.user.lastName;
                DataService.save("users", $scope.user).then(function (ret) {
                    $scope.PDialog.success({ text: $translate.instant("User Saved Successfully") }).then(function () {
                        $uibModalInstance.close(ret);
                    });
                });
            }
        };


        // ----------------------------------------------------------------------------->
        // tabs
        // ----------------------------------------------------------------------------->
        $scope.ui = {
            tabs: [
                { text: "Personal Details", icon: "fa-vcard-o", key: "D"},
                { text: "BI Premissions", icon: "fa-vcard-o", key: "B" },
                { text: "Purchase Premissions", icon: "fa-vcard-o", key: "P" }
            ],
            tab: 'D'
        };

        $scope.setTab = function (sTab) {
            $scope.ui.tab = sTab;
            $scope.ui.submitAttempt = false;
        };

        SBLOCK_user_data_shared($scope, $translate);

        $scope.setUITabsPremission();
    });

// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// Personal Details
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

app.controller('user_modal_personal_details',
    function ($scope, $translate, $uibModal, PDialog) {
        SBLOCK_user_data_shared($scope, $translate);

        $scope.uiD = {
            formDisabled: false
        }

        $scope.findUsers = function (query) {
            if (!query) return;
            $scope.DS.get("ADusers", { query: query }, { hideLoading: true }).then(function (rows) {
                $scope.ui.users = rows;
            }).finally(function () {
                $scope.ui.usersLoading = false;
            });
        }

        $scope.userSelected = function (item) {
            $scope.user.userName = item.value;
            $scope.user.firstName = item.firstName;
            $scope.user.lastName = item.lastName;
            $scope.user.nationalID = item.nationalID;
            $scope.user.phone = item.phone;
            $scope.user.email = item.email;
        };
    });

// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// BI Premissions
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

app.controller('user_modal_bi_premissions',
    function ($scope, $translate, $uibModal, PDialog) {
        $scope.uiB = {
            formDisabled: false
        }


    });



// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// Purchase Premissions
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

app.controller('user_modal_purchase_premissions',
    function ($scope, $translate, $uibModal, PDialog) {
        $scope.uiP = {
            formDisabled: false
        }


    });




// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// shared
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

var SBLOCK_user_data_shared = function ($scope, $translate) {
    $scope.setUITabsPremission = function () {
        _.each($scope.ui.tabs, function (tab) {
            tab.tabDisable = false;
        });
        if ($scope.user.userType == 1 || !$scope.user.userType) {
            var indexB = _.findIndex($scope.ui.tabs, { key: 'B' });
            $scope.ui.tabs[indexB].tabDisable = true;
        }
        if ($scope.user.userType == 2 || !$scope.user.userType) {
            var indexP = _.findIndex($scope.ui.tabs, { key: 'P' });
            $scope.ui.tabs[indexP].tabDisable = true;
        }
    }
}


