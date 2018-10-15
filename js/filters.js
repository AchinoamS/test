'use strict';

/* Filters */

angular.module('app')
  .filter('fromNow', function () {
      return function (date) {
          return moment(date).fromNow();
      }
  }).filter('duration', function () {
      return function (minutes) {
          if (isNaN(minutes)) return "";
          var m = minutes % 60;
          var h = (minutes - m) / 60;
          return _.padStart(h + '', 2, '0') + ":" + _.padStart(m + '', 2, '0');
      }
  }).filter('mapList', function () {
      return function (native, options, matchField, valueField) {
          if (!matchField) matchField = "value";
          if (!valueField) valueField = "text";
          if (options) {
              for (var i = 0; i < options.length; i++) {
                  if (options[i][matchField] == native) {
                      return options[i][valueField];
                  }
              }
          }
          return '';
      }
  }).filter('mapEnt', function () {
      return function (native, options) {
          var matchField = "id", valueField = "name";
          if (options) {
              for (var i = 0; i < options.length; i++) {
                  if (options[i][matchField] == native) {
                      return options[i][valueField];
                  }
              }
          }
          return '';
      }
  }).filter('propsFilter', function () {
      return function (items, props) {
          var out = [];

          if (angular.isArray(items)) {
              items.forEach(function (item) {
                  var itemMatches = false;

                  var keys = Object.keys(props);
                  for (var i = 0; i < keys.length; i++) {
                      var prop = keys[i];
                      var text = props[prop] ? props[prop].toLowerCase() : '';
                      if (item[prop] && item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                          itemMatches = true;
                          break;
                      }
                  }

                  if (itemMatches) {
                      out.push(item);
                  }
              });
          } else {
              // Let the output be the input untouched
              out = items;
          }

          return out;
      };
  }).filter("filterMsEnt", function () {
      return function (ms, entList) {
          var ret = [];

          _.each(ms, function (v) {
              var o = _.find(entList, { id: v });
              if (o) ret.push(o.name);
          });
          return ret.join(", ");
      };
  }).filter("filterEntByWhitelist", function () {
      return function (array, wlist) {
          return array.filter(function (item) {
              return wlist ? wlist.indexOf(item.id) !== -1 : false; // item id not found in blacklist
          });
      };
  }).filter('nFormat', function ($filter) {
      return function (input, format) {
          if (!input) return '';
          switch (format) {
              case 'P': return $filter('number')(input, 2) + '%';
              case 'C': return $filter('currency')(input);
              case 'N': return $filter('number')(input, 2);
              case 'I': return $filter('number')(input, 0);
              case 'D': return $filter('date')(input, 'MMM/dd/yyyy');
          }
          return input;
      };
  });




angular.module('app').filter('tel', function () {
    return function (tel) {
        if (!tel) { return ''; }

        var value = tel.toString().trim().replace(/^\+/, '');

        if (value.match(/[^0-9]/)) {
            return tel;
        }

        var country, city, number;

        switch (value.length) {
            case 10: // +1PPP####### -> C (PPP) ###-####
                country = 1;
                city = value.slice(0, 3);
                number = value.slice(3);
                break;

            case 11: // +CPPP####### -> CCC (PP) ###-####
                country = value[0];
                city = value.slice(1, 4);
                number = value.slice(4);
                break;

            case 12: // +CCCPP####### -> CCC (PP) ###-####
                country = value.slice(0, 3);
                city = value.slice(3, 5);
                number = value.slice(5);
                break;

            default:
                return tel;
        }

        if (country == 1) {
            country = "";
        }

        number = number.slice(0, 3) + '-' + number.slice(3);

        return (country + " (" + city + ") " + number).trim();
    };
});