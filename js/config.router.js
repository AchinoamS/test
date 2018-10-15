'use strict';

/**
 * Config for the router
 */
angular.module('app')
  .run(
        function ($rootScope, $state, $stateParams, AuthService, MetaService, PDialog, $templateCache, $http) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            $rootScope.PDialog = PDialog;

            toastr.options = { positionClass: 'toast-top-right', }
            $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
                MetaService.sectionCaption = "";
                if (toState.name.indexOf("access") != 0) {
                    if (!AuthService.isAuthenticated()) {
                        AuthService.toState = toState.name;
                        AuthService.toParams = toParams;
                        $state.transitionTo("access.signin");
                        event.preventDefault();
                    } else {
                        return;
                        // will implement on v1 of ui router
                        var roles = _.get(toState, 'data.auth[0]');
                        if (roles && !MetaService.checkAccess(roles)) {
                            $state.transitionTo("app.noaccess");
                            event.preventDefault();
                        }
                    }
                }
            });
        }
    )

  .config(function ($stateProvider, $urlRouterProvider, LAZY_LOAD_CONFIG, $injector) {

      $urlRouterProvider.otherwise('/access/signin');
      $stateProvider

          // ----------------------------------------------------------------------------->
          // access
          // ----------------------------------------------------------------------------->

          .state('access', {
              url: '/access',
              template: '<div ui-view class="fade-in-right-big smooth"></div>'
          })
          .state('access.signin', {
              url: '/signin',
              templateUrl: 'modules/_access/page_signin_auto.html',
          })
          .state('access.404', {
              url: '/404',
              templateUrl: 'modules/_access/page_404.html'
          })

          // ----------------------------------------------------------------------------->
          // app
          // ----------------------------------------------------------------------------->

          .state('app', {
              abstract: true,
              url: '/app',
              templateUrl: 'modules/_app/app.html',
              resolve: load(['modules/_shared/entity_multi.js', 'modules/_shared/entity_service.js'])
          })
          .state('app.uc', {
              url: '/uc',
              templateUrl: 'modules/_access/page_under-contruction.html'
          })
          .state('app.noaccess', {
              url: '/na',
              templateUrl: 'modules/_access/page_noaccess.html'
          })

        //main------------------------------------------------------------->

        .state('app.main', {
            abstract: true,
            url: '/main',
            template: '<div ui-view class=""></div>',
            resolve: {
                resources: function (DataService, MetaService) {
                    'ngInject';
                    MetaService.wasMainEnumsParsed = false;
                    return DataService.getStateEntities(['users','portal_tree'], null, { mapEnum: true, setEnum: true });
                }
            }
        })

        .state('app.main.portalGroups', {
            url: '/portalGroups',
            templateUrl: 'modules/_shared/entity_multi.html',
            controller: 'app_portal_groups',
            resolve: load([
                'modules/portalGroups/groups.js'
            ])
          })

          .state('app.main.users', {
            url: '/users',
            templateUrl: 'modules/_shared/entity_multi.html',
            controller: 'app_users',
            //data: { auth: ['setup'] },
            resolve: load([
                'modules/users/users.js',
            ])
        })


      // ----------------------------------------------------------------------------->
      // other
      // ----------------------------------------------------------------------------->

      function load(srcs, callback) {
          return {
              deps: ['$ocLazyLoad', '$q',
                  function ($ocLazyLoad, $q) {
                      var deferred = $q.defer();
                      var promise = false;
                      srcs = angular.isArray(srcs) ? srcs : srcs.split(/\s+/);
                      if (!promise) {
                          promise = deferred.promise;
                      }
                      angular.forEach(srcs, function (src) {
                          if (src == "ui.map") {
                              promise = promise.then(function () {
                                  return $ocLazyLoad.load(src).then(function () {
                                      return loadGoogleMaps(3, 'AIzaSyCFr2AdQh14mwe0SVy0EQKHrB5RRk4NTBU', 'iw');
                                  });
                              })
                          } else {
                              promise = promise.then(function () {
                                  angular.forEach(LAZY_LOAD_CONFIG, function (module) {
                                      if (module.name == src) {
                                          src = module.module ? module.name : module.files;
                                      }
                                  });
                                  return $ocLazyLoad.load(src);
                              });
                          };
                      });
                      deferred.resolve();
                      return callback ? promise.then(function () { return callback(); }) : promise;
                  }]
          }
      };

  }
  );