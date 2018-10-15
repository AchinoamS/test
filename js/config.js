// config

var app =  
angular.module('app')
  .config(
    [        '$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
    function ($controllerProvider,   $compileProvider,   $filterProvider,   $provide) {
        
        // lazy controller, directive and service
        app.controller = $controllerProvider.register;
        app.directive  = $compileProvider.directive;
        app.filter     = $filterProvider.register;
        app.factory    = $provide.factory;
        app.service    = $provide.service;
        app.constant   = $provide.constant;
        app.value      = $provide.value;
    }
  ])
  .config(['$translateProvider', function($translateProvider){
    // Register a loader for the static files
    // So, the module will search missing translation tables under the specified urls.
    // Those urls are [prefix][langKey][suffix].
    $translateProvider.useStaticFilesLoader({
      prefix: 'l10n/',
      suffix: '.json'
    });
    // Tell the module what language to use by default
    //$translateProvider.preferredLanguage('en');
    $translateProvider.preferredLanguage('he-IL');
    // Tell the module to store the language in the local storage
    //$translateProvider.useLocalStorage();

    $translateProvider.useSanitizeValueStrategy('escape');

  }]);

app.factory("appHttpInterceptor", ["$q", "$log", "$injector", "$timeout", function ($q, $log, $injector, $timeout) {
    return {
        request: function (config) {

            return config;
        },
        requestError: function (rejection) {
            if (canRecover(rejection)) {
                return responseOrNewPromise
            }
            return $q.reject(rejection);
        },
        response: function (response) {
            $log.debug("success with status " + response.status);
            


            return response || $q.when(response);
        },
        responseError: function (rejection) {
            var message = angular.isObject(rejection.data) ? rejection.data.message : rejection.message;
            if (!rejection.data) {
                rejection.data = {};
            }
            $log.debug("error with status " + rejection.status + " and data: " + message);
            switch (rejection.status) {
                case 403:
                    toastr.error("You don't have the right to do this");
                    break;
                case 401:
                    var AuthService = $injector.get('AuthService')
                    AuthService.logout(false, message);
                    break;
                case 0:
                    toastr.error("No connection, internet is down?");
                    break;
                default:
                    toastr.error("" + message);
            }
            return $q.reject(rejection);
        }
    };
}]);

app.config(function ($provide, $httpProvider) {
    return $httpProvider.interceptors.push('appHttpInterceptor');
});