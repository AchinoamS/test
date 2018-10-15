'use strict';

var _DEFAULTSTATE = "app.main.users";
var _APPSimulated = true;

app.factory('AuthService', function ($state, $http, $q, blockUI, $cookieStore, MetaService) {
    var _HTTPTokenName = "schkip-token";
    var _HTTPURL = "handler_simulated.ashx";
    var service = {
        isLoggedIn: false,//for simulation purposes
        user: null,
        loginMessage: null,
        toState: null,
        toParams: null,
        onUserGet: null
    };

    service.logout = function (fromUser, message) {
        service.isLoggedIn = true;
        service.loginMessage = message;
        $cookieStore.remove(_HTTPTokenName);
        $state.transitionTo("access.signin");
    };

    service.login = function (user) {
        var deferred = $q.defer();
        blockUI.start();

        $http.post(_HTTPURL + "?Action=login", user)
          .then(function (data) {
              handleLoginSuccess(data.data);
          }).catch(function (msg, code) {
              handleLoginFail(msg);
          });
        return deferred.promise;

        function handleLoginSuccess(data) {
            blockUI.stop();
            service.isLoggedIn = true;
            $cookieStore.put(_HTTPTokenName, data.token);
            service.user = data;
            deferred.resolve(service);
        };
        function handleLoginFail(msg) {
            blockUI.stop();
            msg = msg.message;
            service.loginMessage = msg;
            deferred.reject(msg);
        };
    };

    service.isAuthenticated = function () {
        if ($cookieStore.get(_HTTPTokenName)) {
            service.loginMessage = false;
            if (!service.user) {
                service.getUserInfo(true);
            }
            return true;
        } else {
            service.loginMessage = "Please login!";
            return false;
        }
    };
    service.getUserInfo = function (getMetaData) {
        $http.post(_HTTPURL + "?Action=userInfo")
            .then(function (data) {
                service.user = data.data;
                if (getMetaData) {
                    service.getMetaData().then(
                        function () {
                            if (service.onUserGet) service.onUserGet.call(null);
                        }
                    );
                }
            }).catch(function (msg, code) {
                service.logout(null, msg);
            }
        );
    };
    service.getMetaData = function () {
        var deferred = $q.defer();
        blockUI.start();

        $http.post(_HTTPURL + "?Action=appMeta", {})
            .then(function (data) {
                data = data.data;
                blockUI.stop();
                $.each(data, function (key, value) {
                    MetaService[key] = value;
                });

                // fix access
                var _access = {};
                _.each(service.user.roles, function (o) {
                    _access[o] = true;
                });
                MetaService.access = _access;
                // fix menu

                _.remove(MetaService.menu, function (menu) {
                    if (noAccessMenu(menu)) return true;
                    else {
                        _.remove(menu.modules, function (module) {
                            if (noAccessMenu(module)) return true;
                            else {
                                _.remove(menu.children, function (child) {
                                    return noAccessMenu(child);
                                });
                            }
                        });
                    };
                    function noAccessMenu(o) {
                        if (o.access) {
                            return !MetaService.checkAccess(o.access);
                        }
                    };
                });


                MetaService.wasLoaded = true;
                deferred.resolve(data);
            })
            .catch(function (msg, code) {
                blockUI.stop();
                service.logout(null, msg);
                //deferred.reject(msg);
            });
        return deferred.promise;
    };
    service.resetPassword = function (user) {
        var deferred = $q.defer();
        $http.get('api/resetpass.json', user)
          .then(function (data) {
              deferred.resolve(data.data);
          }).catch(function (msg, code) {
              msg = msg.message;
              service.loginMessage = msg;
              deferred.reject(msg);
          });
        return deferred.promise;
    }
    return service;
});

app.factory('MetaService', function ($state, $http, $q, $filter, blockUI, $translate, uiLoad) {
    var service = {
        __SIMULATED: window._APPSimulated,
        _DEFAULTSTATE: window._DEFAULTSTATE,
        wasLoaded: false,
        mapEnum: function (arr) {
            _.each(arr, function (o) { o.value = o.id, o.text = o.name })
        },
        dateOpts: {
            format: 'MMMM D, YY',
            opens: 'left',
            ranges: {
                "This Month": [moment().date(1), moment()],
                'Previous Month': [moment().date(0).date(1), moment().date(0)],
                'Last Day': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()]
            }
        },
        dateInputFormats: ['d!/M!/yyyy'],

        defMapCenter: { "lat": 32.178195, "lng": 34.90761 },
        defMapZoom: 4,
        mapSearchLocalComponents: "country:IL|street_address",
        mapLanguage: "iw",
        load: function (args) { return uiLoad.load(args) }
    }

    service.checkAccess = function (key) {
        if (!key || key.length === 0) return true;
        if (_.isArray(key)) var arr = key;
        else var arr = key.split(",");
        for (var i = 0; i < arr.length; i++) {
            if (service.access[arr[i]]) return true;
        }
        return false;
    };

    service.processTableToTree = function (data, parentId, deep, extend) {
        var ret = [];
        if (!deep) deep = 100;
        generateBranch(ret, parentId, 0)
        return ret;

        function generateBranch(source, parentId, level) {
            if (level < deep) {
                _.each(data, function (node) {
                    if (node.parentId == parentId) {
                        //node.text = node.name;
                        var _node = angular.copy(node);
                        delete _node.level;
                        if (!node.parentId) {
                            _node.expanded = true;
                        };
                        var arr = [];
                        generateBranch(arr, node.id, level + 1);
                        if (arr.length) {
                            _node.items = arr;
                        };
                        if (extend) {
                            _.extend(_node, extend);
                        };
                        
                        source.push(_node);
                    };
                });
            }
        };
        return ret;
    };


    return service;
});


app.factory('DataService', function ($state, $http, $q, $filter, blockUI, $translate, MetaService, PDialog) {
    var service = {};
    var _HTTPURL = "handler_simulated.ashx";
    // --------------------------------------------------------------------------------------->
    // http
    // --------------------------------------------------------------------------------------->

    service.getGEURL = function (what, act) {
        return _HTTPURL + "?Action=generalEntity&ET=" + what + "&ACT=" + act;
    };

    service.getStateEntities = function (what, data, args) {
        var deferred = $q.defer();
        var q = {};
        _.each(what, function (ent) {
            q[ent] = service.get(ent, data, angular.copy(args));
        });
        $q.all(q).then(function (ret) {
            deferred.resolve(ret);
            window.setTimeout(function () { $(window).trigger('resize'); }, 400);
        }).catch(function (err) {
            deferred.resolve();
            console.error(err);
            window.setTimeout(function () { $(window).trigger('resize'); }, 400);
        });
        return deferred.promise;
    };
    service.getURL = function (args) {
        var deferred = $q.defer();
        if (!args) args = {};
        if (!args.url) args.url = service.getGEURL(what, "rows");
        if (!args.hideLoading) blockUI.start();
        $http.get(args.url).then(function (data) {
            data = data.data;
            if (args.mapEnum) MetaService.mapEnum(data);
            if (!args.hideLoading) blockUI.stop();
            if (args.mapList) MetaService.mapEnum(data);
            if (args.prepare) args.prepare(data);
            if (args.cache) MetaService[args.cache] = data;
            if (args.setEnum) MetaService[what] = data;
            deferred.resolve(data);
        }).catch(function (msg, code) {
            if (!args.hideLoading) blockUI.stop();
            deferred.reject(msg);
        });
        return deferred.promise;
    }

    service.get = function (what, data, args) {
        var deferred = $q.defer();
        if (!data) data = {};
        if (!args) args = {};
        if (!args.url) args.url = service.getGEURL(what, "rows");
        args.httpdelay = 600;
        var httpdelay = args.httpdelay || 0;
        if (!args.hideLoading) blockUI.start();
        $http.post(args.url, data).then(function (data) {
            data = data.data;
            if (args.mapEnum) MetaService.mapEnum(data);
            if (!args.hideLoading) blockUI.stop();
            if (args.mapList) MetaService.mapEnum(data);
            if (args.prepare) args.prepare(data);
            if (args.cache) MetaService[args.cache] = data;
            if (args.setEnum) MetaService[what] = data;

            deferred.resolve(data);
        }).catch(function (msg, code) {
            if (!args.hideLoading) blockUI.stop();
            deferred.reject(msg);
        });
        return deferred.promise;
    }

    service.getDetails = function (what, data, args) {
        var deferred = $q.defer();
        if (!data) data = {};
        if (!args) args = {};
        if (!args.url) args.url = service.getGEURL(what, "details");

        var httpdelay = args.httpdelay || 0;
        if (!args.hideLoading) blockUI.start();
        $http.post(args.url, data).then(function (data) {
            data = data.data;
            if (!args.hideLoading) blockUI.stop();
            if (args.mapList) MetaService.mapEnum(data);
            if (args.prepare) args.prepare(data);
            if (args.cache) MetaService[args.cache] = data;
            deferred.resolve(data);
        }).catch(function (msg, code) {
            if (!args.hideLoading) blockUI.stop();
            deferred.reject(msg);
        });
        return deferred.promise;
    }

    service.save = function (what, data, args) {
        var deferred = $q.defer();
        if (!args) args = {};
        if (!args.url) args.url = service.getGEURL(what, "save");
        args.httpdelay = 300;
        if (!args.hideLoading) blockUI.start();


        $http.post(args.url, data).then(function (data) {
            if (data.data) data = data.data;
            if (!args.hideLoading) blockUI.stop();
            if (args.prepare) args.prepare(data);
            if (args.cache) MetaService[args.cache] = data;
            deferred.resolve(data);
        }).catch(function (msg, code) {
            if (!args.hideLoading) blockUI.stop();
            deferred.reject(msg);
        });
        return deferred.promise;
    }



    service.delete = function (what, data, args) {
        if (!args) args = {};
        var deferred = $q.defer();
        if (args.confirm) {
            PDialog.warning({
                text: args.confirmText || $translate.instant("Are you sure you wish to delete this record?"),
                showCancelButton: true,
                confirmButtonText: $translate.instant("DELETE")
            }).then(function () {
                delete_continue();
            }, function () {
                deferred.reject();
            });
        } else {
            delete_continue();
        }
        return deferred.promise;

        function delete_continue() {
            if (!args.url) args.url = service.getGEURL(what, "delete");
            if (!args.hideLoading) blockUI.start();
            if (args.simulated) {
                window.setTimeout(function () {
                    if (!args.hideLoading) blockUI.stop();
                    fixDeleteCache();
                    deferred.resolve(data);
                }, 600);
            } else {
                $http.post(args.url, data).then(function (data) {
                    if (!args.hideLoading) blockUI.stop();
                    if (args.cache) fixDeleteCache();
                    deferred.resolve(data);
                }).catch(function (msg, code) {
                    if (!args.hideLoading) blockUI.stop();
                    deferred.reject(msg);
                });
            }
        }

        function fixDeleteCache() {
            if (args.cache) {
                try {
                    _.remove(MetaService[args.cache], { id: data.id });
                } catch (e) { }
            }
            PDialog.success({
                text: args.successText || $translate.instant("Deleted Successfully!"),
            }).then(function () {
                deferred.resolve(true);
            });
        };
        return deferred.promise;
    }

    return service;
});


