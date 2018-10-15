'use strict';

/* Controllers */

angular.module('app').controller('AppCtrl', 
function ($scope, $interval, $translate, $localStorage, $window, $uibModal, AuthService, MetaService, DataService, uiLoad) {
    // add 'ie' classes to html
    var isIE = !!navigator.userAgent.match(/MSIE/i);
    isIE && angular.element($window.document.body).addClass('ie');
    isSmartDevice($window) && angular.element($window.document.body).addClass('smart');
    $scope.meta = MetaService;
    $scope.DS = DataService;
    $scope.AuthService = AuthService;
    $scope.AuthService.onUserGet = function () {}

    // config
    $scope.app = {
        name: 'PERMISSIONS',
        version: '1.0.0',
        settings: {
            "isRTL": true,
	        "themeID": "9",
	        "navbarHeaderColor": "bg-dark",
	        "navbarCollapseColor": "bg-white-only",
	        "asideColor": "bg-dark",
	        "headerFixed": true,
	        "asideFixed": true,
	        "asideFolded": false,
	        "asideDock": false,
	        "container": false
        }
    }

    // save settings to local storage
    if (angular.isDefined($localStorage.mytown_settings)) {
        //$scope.app.settings = $localStorage.mytown_settings;
    } else {
        $localStorage.mytown_settings = $scope.app.settings;
    }

    var o = sessionStorage.getItem('ows_filters');
    if (o != null) {
        try {
            o = JSON.parse(o)
            if (o.dateRange) MetaService.filter = o;
        } catch (e) { }
    }

    $scope.$watch('app.settings', function () {
        if ($scope.app.settings.asideDock && $scope.app.settings.asideFixed) {
            // aside dock and fixed must set the header fixed.
            $scope.app.settings.headerFixed = true;
        }
        // save to local storage
        $localStorage.mytown_settings = $scope.app.settings;
        window.setTimeout(function () {
            _UITILS.UIreflowCharts();
        }, 100);
    }, true);

    // angular translate
    $scope.lang = { isopen: false };
    $scope.langs = { en: 'English'};
    $scope.selectLang = $scope.langs[$translate.proposedLanguage()] || "English";
    $scope.setLang = function (langKey, $event) {
        // set the current lang
        $scope.selectLang = $scope.langs[langKey];
        // You can change the language during runtime
        $translate.use(langKey);
        $scope.lang.isopen = !$scope.lang.isopen;
    };

    function isSmartDevice($window) {
        // Adapted from http://www.detectmobilebrowsers.com
        var ua = $window['navigator']['userAgent'] || $window['navigator']['vendor'] || $window['opera'];
        // Checks for iOs, Android, Blackberry, Opera Mini, and Windows mobile devices
        return (/iPhone|iPod|iPad|Silk|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
    }


    moment.locale("he");
    kendo.culture("he-IL");

    $scope.open_alerts = [{},{},{},{}]

});

// ------------------------------------------------------------------------------------------------------>
// signin controller auto
// ------------------------------------------------------------------------------------------------------>

app.controller('SigninFormController_auto', ['$scope', '$http', '$state', 'AuthService', function ($scope, $http, $state, AuthService, $timeout) {
    $scope.user = {};
    $scope.authError = null;

    AuthService.logout();

    $scope.login = function () {
        AuthService.login({}).then(function(obj){
            AuthService.getMetaData().then(
                function () {
                    if (obj.toState) {
                        $state.go(obj.toState, obj.toParams);
                        obj.toState = null;
                    } else {
                        $state.go(AuthService.user.defaultState || _DEFAULTSTATE);
                    }
                }
            );
        }).catch(function(err){
               $scope.user = {};
               $scope.authError = error;        
        });
    };
    $scope.login();

}]);

// ------------------------------------------------------------------------------------------------------>
// signin controller
// ------------------------------------------------------------------------------------------------------>

app.controller('SigninFormController', ['$scope', '$http', '$state', 'AuthService', function ($scope, $http, $state, AuthService) {
    $scope.user = {};
    $scope.authError = null;

    AuthService.logout();

    $scope.login = function () {
        handleLoginResponse(AuthService.login($scope.user));
    };

    function handleLoginResponse(promise) {
        promise.then(
           function (obj) {
               window.setTimeout(function () {
                   AuthService.getMetaData().then(
                         function () {
                             if (obj.toState) {
                                 $state.go(obj.toState, obj.toParams);
                                 obj.toState = null;
                             } else {
                                 $state.go(_DEFAULTSTATE);
                             }
                         }
                    );
               }, 100);
           },
           function (error) {
               $scope.user = {};
               $scope.authError = error;
           });
    }
}]);



