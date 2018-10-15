

angular.module('app')
  .directive('uiButterbar', ['$rootScope', '$anchorScroll', function ($rootScope, $anchorScroll) {
      return {
          restrict: 'AC',
          template: '<span class="bar"></span>',
          link: function (scope, el, attrs) {
              el.addClass('butterbar hide');
              scope.$on('$stateChangeStart', function (event) {
                  $anchorScroll();
                  el.removeClass('hide').addClass('active');
              });
              scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
                  event.targetScope.$watch('$viewContentLoaded', function () {
                      el.addClass('hide').removeClass('active');
                  })
              });
          }
      };
  }]);


'use strict';


angular.module('app').service('uiLoad', function ($document, $q, $timeout) {

    var loaded = [];
    var promise = false;
    var deferred = $q.defer();

    this.load = function (srcs) {
        srcs = angular.isArray(srcs) ? srcs : srcs.split(/\s+/);
        var self = this;
        if (!promise) {
            promise = deferred.promise;
        }
        angular.forEach(srcs, function (src) {
            promise = promise.then(function () {
                return src.indexOf('.css') >= 0 ? self.loadCSS(src) : self.loadScript(src);
            });
        });
        deferred.resolve();
        return promise;
    }
    this.loadScript = function (src) {
        if (loaded[src]) return loaded[src].promise;

        var deferred = $q.defer();
        var script = $document[0].createElement('script');
        script.src = src;
        script.onload = function (e) {
            $timeout(function () {
                deferred.resolve(e);
            });
        };
        script.onerror = function (e) {
            $timeout(function () {
                deferred.reject(e);
            });
        };
        $document[0].body.appendChild(script);
        loaded[src] = deferred;

        return deferred.promise;
    };
    this.loadCSS = function (href) {
        if (loaded[href]) return loaded[href].promise;

        var deferred = $q.defer();
        var style = $document[0].createElement('link');
        style.rel = 'stylesheet';
        style.type = 'text/css';
        style.href = href;
        style.onload = function (e) {
            $timeout(function () {
                deferred.resolve(e);
            });
        };
        style.onerror = function (e) {
            $timeout(function () {
                deferred.reject(e);
            });
        };
        $document[0].head.appendChild(style);
        loaded[href] = deferred;

        return deferred.promise;
    };
});


'use strict';

/**
 * 0.1.1
 * General-purpose jQuery wrapper. Simply pass the plugin name as the expression.
 *
 * It is possible to specify a default set of parameters for each jQuery plugin.
 * Under the jq key, namespace each plugin by that which will be passed to ui-jq.
 * Unfortunately, at this time you can only pre-define the first parameter.
 * @example { jq : { datepicker : { showOn:'click' } } }
 *
 * @param ui-jq {string} The $elm.[pluginName]() to call.
 * @param [ui-options] {mixed} Expression to be evaluated and passed as options to the function
 *     Multiple parameters can be separated by commas
 * @param [ui-refresh] {expression} Watch expression and refire plugin on changes
 *
 * @example <input ui-jq="datepicker" ui-options="{showOn:'click'},secondParameter,thirdParameter" ui-refresh="iChange">
 */
angular.module('app').
  value('uiJqConfig', {}).
  directive('uiJq', function uiJqInjectingFunction(uiJqConfig, JQ_CONFIG, uiLoad, $timeout) {

      return {
          restrict: 'A',
          compile: function uiJqCompilingFunction(tElm, tAttrs) {

              if (!angular.isFunction(tElm[tAttrs.uiJq]) && !JQ_CONFIG[tAttrs.uiJq]) {
                  throw new Error('ui-jq: The "' + tAttrs.uiJq + '" function does not exist');
              }
              var options = uiJqConfig && uiJqConfig[tAttrs.uiJq];

              return function uiJqLinkingFunction(scope, elm, attrs) {

                  function getOptions() {
                      var linkOptions = [];

                      // If ui-options are passed, merge (or override) them onto global defaults and pass to the jQuery method
                      if (attrs.uiOptions) {
                          linkOptions = scope.$eval('[' + attrs.uiOptions + ']');
                          if (angular.isObject(options) && angular.isObject(linkOptions[0])) {
                              linkOptions[0] = angular.extend({}, options, linkOptions[0]);
                          }
                      } else if (options) {
                          linkOptions = [options];
                      }
                      return linkOptions;
                  }

                  // If change compatibility is enabled, the form input's "change" event will trigger an "input" event
                  if (attrs.ngModel && elm.is('select,input,textarea')) {
                      elm.bind('change', function () {
                          elm.trigger('input');
                      });
                  }

                  // Call jQuery method and pass relevant options
                  function callPlugin() {
                      $timeout(function () {
                          elm[attrs.uiJq].apply(elm, getOptions());
                      }, 0, false);
                  }

                  function refresh() {
                      // If ui-refresh is used, re-fire the the method upon every change
                      if (attrs.uiRefresh) {
                          scope.$watch(attrs.uiRefresh, function () {
                              callPlugin();
                          });
                      }
                  }

                  if (JQ_CONFIG[attrs.uiJq]) {
                      uiLoad.load(JQ_CONFIG[attrs.uiJq]).then(function () {
                          callPlugin();
                          refresh();
                      }).catch(function () {

                      });
                  } else {
                      callPlugin();
                      refresh();
                  }
              };
          }
      };
  });


angular.module('app')
  .directive('uiNav', ['$timeout', function ($timeout) {
      return {
          restrict: 'AC',
          link: function (scope, el, attr) {
              var _window = $(window),
              _mb = 768,
              wrap = $('.app-aside'),
              next,
              backdrop = '.dropdown-backdrop';
              // unfolded
              el.on('click', 'a', function (e) {
                  next && next.trigger('mouseleave.nav');
                  var _this = $(this);
                  _this.parent().siblings(".active").toggleClass('active');
                  _this.next().is('ul') && _this.parent().toggleClass('active') && e.preventDefault();
                  // mobile
                  _this.next().is('ul') || ((_window.width() < _mb) && $('.app-aside').removeClass('show off-screen'));
              });


              // folded & fixed
              el.on('mouseenter', 'a', function (e) {
                  next && next.trigger('mouseleave.nav');
                  $('> .nav', wrap).remove();
                  if (!$('.app-aside-fixed.app-aside-folded').length || (_window.width() < _mb) || $('.app-aside-dock').length) return;
                  var _this = $(e.target)
                  , top
                  , w_h = $(window).height()
                  , offset = 50
                  , min = 150;

                  !_this.is('a') && (_this = _this.closest('a'));
                  if (_this.next().is('ul')) {
                      next = _this.next();
                  } else {
                      return;
                  }

                  _this.parent().addClass('active');
                  top = _this.parent().position().top + offset;
                  next.css('top', top);
                  if (top + next.height() > w_h) {
                      next.css('bottom', 0);
                  }
                  if (top + min > w_h) {
                      next.css('bottom', w_h - top - offset).css('top', 'auto');
                  }
                  next.appendTo(wrap);

                  next.on('mouseleave.nav', function (e) {
                      $(backdrop).remove();
                      next.appendTo(_this.parent());
                      next.off('mouseleave.nav').css('top', 'auto').css('bottom', 'auto');
                      _this.parent().removeClass('active');
                  });

                  $('.smart').length && $('<div class="dropdown-backdrop"/>').insertAfter('.app-aside').on('click', function (next) {
                      next && next.trigger('mouseleave.nav');
                  });

              });

              wrap.on('mouseleave', function (e) {
                  next && next.trigger('mouseleave.nav');
                  $('> .nav', wrap).remove();
              });

              var syncMenuToState = function () {
                  $timeout(
                      function () {
                          el.find(".sub-child.active").first().each(function () {
                              $(this).parent().closest("li").children('a').click();
                          })
                      }, 0
                  );
              }
              syncMenuToState();
              $("body").on('syncmenu.nav', syncMenuToState);


          }
      };
  }]);

angular.module('app')
  .directive('uiScroll', ['$location', '$anchorScroll', function ($location, $anchorScroll) {
      return {
          restrict: 'AC',
          link: function (scope, el, attr) {
              el.on('click', function (e) {
                  $location.hash(attr.uiScroll);
                  $anchorScroll();
              });
          }
      };
  }]);


angular.module('app')
  .directive('uiToggleClass', ['$timeout', '$document', function ($timeout, $document) {
      return {
          restrict: 'AC',
          link: function (scope, el, attr) {
              el.on('click', function (e) {
                  e.preventDefault();
                  var classes = attr.uiToggleClass.split(','),
                      targets = (attr.target && attr.target.split(',')) || Array(el),
                      key = 0;
                  angular.forEach(classes, function (_class) {
                      var target = targets[(targets.length && key)];
                      (_class.indexOf('*') !== -1) && magic(_class, target);
                      $(target).toggleClass(_class);
                      key++;
                  });
                  $(el).toggleClass('active');

                  function magic(_class, target) {
                      var patt = new RegExp('\\s' +
                          _class.
                            replace(/\*/g, '[A-Za-z0-9-_]+').
                            split(' ').
                            join('\\s|\\s') +
                          '\\s', 'g');
                      var cn = ' ' + $(target)[0].className + ' ';
                      while (patt.test(cn)) {
                          cn = cn.replace(patt, ' ');
                      }
                      $(target)[0].className = $.trim(cn);
                  }
              });
          }
      };
  }]);

'use strict';

/**
 * General-purpose validator for ngModel.
 * angular.js comes with several built-in validation mechanism for input fields (ngRequired, ngPattern etc.) but using
 * an arbitrary validation function requires creation of a custom formatters and / or parsers.
 * The ui-validate directive makes it easy to use any function(s) defined in scope as a validator function(s).
 * A validator function will trigger validation on both model and input changes.
 *
 * @example <input ui-validate=" 'myValidatorFunction($value)' ">
 * @example <input ui-validate="{ foo : '$value > anotherModel', bar : 'validateFoo($value)' }">
 * @example <input ui-validate="{ foo : '$value > anotherModel' }" ui-validate-watch=" 'anotherModel' ">
 * @example <input ui-validate="{ foo : '$value > anotherModel', bar : 'validateFoo($value)' }" ui-validate-watch=" { foo : 'anotherModel' } ">
 *
 * @param ui-validate {string|object literal} If strings is passed it should be a scope's function to be used as a validator.
 * If an object literal is passed a key denotes a validation error key while a value should be a validator function.
 * In both cases validator function should take a value to validate as its argument and should return true/false indicating a validation result.
 */
angular.module('ui.validate', []).directive('uiValidate', function () {

    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            var validateFn, validators = {},
                validateExpr = scope.$eval(attrs.uiValidate);

            if (!validateExpr) { return; }

            if (angular.isString(validateExpr)) {
                validateExpr = { validator: validateExpr };
            }

            angular.forEach(validateExpr, function (exprssn, key) {
                validateFn = function (valueToValidate) {
                    var expression = scope.$eval(exprssn, { '$value': valueToValidate });
                    if (angular.isObject(expression) && angular.isFunction(expression.then)) {
                        // expression is a promise
                        expression.then(function () {
                            ctrl.$setValidity(key, true);
                        }, function () {
                            ctrl.$setValidity(key, false);
                        });
                        return valueToValidate;
                    } else if (expression) {
                        // expression is true
                        ctrl.$setValidity(key, true);
                        return valueToValidate;
                    } else {
                        // expression is false
                        ctrl.$setValidity(key, false);
                        return valueToValidate;
                    }
                };
                validators[key] = validateFn;
                ctrl.$formatters.push(validateFn);
                ctrl.$parsers.push(validateFn);
            });

            function apply_watch(watch) {
                //string - update all validators on expression change
                if (angular.isString(watch)) {
                    scope.$watch(watch, function () {
                        angular.forEach(validators, function (validatorFn) {
                            validatorFn(ctrl.$modelValue);
                        });
                    });
                    return;
                }

                //array - update all validators on change of any expression
                if (angular.isArray(watch)) {
                    angular.forEach(watch, function (expression) {
                        scope.$watch(expression, function () {
                            angular.forEach(validators, function (validatorFn) {
                                validatorFn(ctrl.$modelValue);
                            });
                        });
                    });
                    return;
                }

                //object - update appropriate validator
                if (angular.isObject(watch)) {
                    angular.forEach(watch, function (expression, validatorKey) {
                        //value is string - look after one expression
                        if (angular.isString(expression)) {
                            scope.$watch(expression, function () {
                                validators[validatorKey](ctrl.$modelValue);
                            });
                        }

                        //value is array - look after all expressions in array
                        if (angular.isArray(expression)) {
                            angular.forEach(expression, function (intExpression) {
                                scope.$watch(intExpression, function () {
                                    validators[validatorKey](ctrl.$modelValue);
                                });
                            });
                        }
                    });
                }
            }
            // Support for ui-validate-watch
            if (attrs.uiValidateWatch) {
                apply_watch(scope.$eval(attrs.uiValidateWatch));
            }
        }
    };
});




angular.module('app')
  .directive('heightContainer', function ($timeout, $parse) {
      return {
          link: function (scope, element, attr) {
              var $element = $(element);
              var toffset = isNaN(attr.offset) ? 15 : Number(attr.offset);
              var handleItemsHeight = function (_index) {
                  if (!_index) _index = 0
                  var offset = $element.offset().top + toffset;
                  var oHeight = $(window).height() - offset;
                  if (oHeight <= 0) {
                      if (_index < 4) {
                          $timeout(function () { handleItemsHeight(++_index) }, 200);
                      }
                      return;
                  }
                  $element.height(oHeight);

                  $element.find(".k-grid").each(function () {
                      var gridElement = $(this)
                      var oHeight = gridElement.parent().height();
                      var dataArea = gridElement.find(".k-grid-content"),
                          otherElements = gridElement.children().not(".k-grid-content"),
                          otherElementsHeight = 0;


                      otherElements.each(function () {
                          otherElementsHeight += $(this).outerHeight();
                      });
                      dataArea.height(oHeight - otherElementsHeight);

                  });

              }
              $(window).on("resize", handleItemsHeight);
              $timeout(handleItemsHeight);

          }
      };
  });

angular.module('app').directive('entityHeightContainer', function ($timeout, $parse) {
    return {
        link: function (scope, element, attr) {
            var $element = $(element);
            var handleItemsHeight = function () {
                var tOffset = attr.offset;
                if (!isNaN(tOffset)) {
                    tOffset = Number(tOffset);
                } else {
                    tOffset = 5;
                }
                var offset = $element.offset().top + tOffset;

                var oHeight = $(window).height() - offset;
                $element.height(oHeight);

                $element.find(".grid-wrapper.full-height .k-grid").each(function () {
                    var gridElement = $(this)
                    var oHeight = gridElement.parent().height();
                    var dataArea = gridElement.find(".k-grid-content, .k-grid-content-locked"),
                      otherElements = gridElement.children().not(".k-grid-content, .k-grid-content-locked"),
                      otherElementsHeight = 0;


                    otherElements.each(function () {
                        otherElementsHeight += $(this).outerHeight();
                    });
                    dataArea.height(oHeight - otherElementsHeight);

                });
            }

            $element.on('click', '.max-toggler', function (e) {
                e.stopPropagation();
                var btn = $(this);
                var icon = btn.children("i");
                var target = btn.closest(".inline-module");
                window.setTimeout(function () { _UITILS.UIreflowCharts(); }, 300);
                if (target.hasClass("maxed")) {
                    target.removeClass("maxed");
                    icon.removeClass("fa-compress").addClass("fa-expand");
                    handleItemsHeight();
                    $timeout(function () { $(window).trigger('resize') });
                } else {
                    target.addClass("maxed");
                    icon.removeClass("fa-expand").addClass("fa-compress");
                    handleItemsHeight();
                    $timeout(function () { $(window).trigger('resize') });
                }
            })

            $(window).on("resize", handleItemsHeight);
            $timeout(function () { handleItemsHeight(); });

        }
    };
});

angular.module('app').directive('dynamicCtrl', ['$compile', '$parse', function ($compile, $parse) {
    return {
        restrict: 'A',
        terminal: true,
        priority: 100000,
        link: function (scope, elem) {
            var name = $parse(elem.attr('dynamic-ctrl'))(scope);
            elem.removeAttr('dynamic-ctrl');
            if (name) {
                elem.attr('ng-controller', name);
                $compile(elem)(scope);
            }
        }
    };
}]);

angular.module('app').directive("taskTimeWatch", function (dateFilter) {
    return {
        restrict: "A",
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            task: '=',
            alertthreshhold: '=',
            alertchange: '&alertchange',

        },
        link: function (scope, element, attr) {
            var format;
            var dueStart = moment(model.dueStart);
            var dueEnd = moment(model.dueEnd);
            var status = moment.status;



            var alertThreshhold = (scope.alertthreshhold[0] || 60) * 60;
            var warnThreshhold = (scope.alertthreshhold[1] || 30) * 60;

            var timeoutHolder;
            function updateLater() {
                if (scope.task.closed) {
                    delete scope.task.$$alert;
                    element.removeClass("order-warn").removeClass('order-danger');
                    return;
                };
                timeoutHolder = setTimeout(function () {
                    updateTime(); // update DOM
                    updateLater(); // schedule another update
                }, 5000);
            }

            updateLater();

            scope.$on('$destroy', function () {
                window.clearTimeout(timeoutHolder);
            });

            scope.$watch("model", function () {
                updateTime(true);
            }, true);
        }
    }
});