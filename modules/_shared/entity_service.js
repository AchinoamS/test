window.__SIMULATED = true;

app.factory('entity_service',
 function ($q, $http, blockUI, MetaService, DataService, $uibModal, uiLoad, PDialog, $translate) {

     var service = {}

     // --------------------------------------------------------------------------------------->
     // user
     // --------------------------------------------------------------------------------------->

     service.addEditUser = function (userId) {
         var deferred = $q.defer();
         blockUI.start();
         var q = {
             controller: MetaService.load(['modules/users/user_modal.js'])
         }
         if (userId) {
             q.user = DataService.getDetails("users", { id: userId });
         }
         $q.all(q).then(function (ret) {
             blockUI.stop();
             var modalEntity = $uibModal.open({
                 templateUrl: 'modules/users/user_modal.html',
                 controller: 'user_modal',
                 windowClass: "modal-flat",
                 size: 'sm',
                 resolve: {
                     modalParams: ret
                 }
             });
             modalEntity.result.then(function (ret) { deferred.resolve(ret); }).catch(function () { });
         }).catch(function (err) {
             blockUI.stop();
             console.error(err);
         });
         return deferred.promise;
     };

     // --------------------------------------------------------------------------------------->
     // group
     // --------------------------------------------------------------------------------------->

     service.prepareGroup = function (group) {
         for (var i = group.users.length; i--;) {
             var userData = _.find(MetaService.users, { id: group.users[i] });
             if (!userData) {
                 group.users.splice(i, 1);
             }
         }
     }

     service.addEditGroup = function (groupId) {
         var deferred = $q.defer();
         blockUI.start();
         var q = {
             controller: MetaService.load(['modules/portalGroups/group_modal.js'])
         }
         if (groupId) {
             q.group = DataService.getDetails("groups", { id: groupId });
         }
         $q.all(q).then(function (ret) {
             blockUI.stop();
             var modalEntity = $uibModal.open({
                 templateUrl: 'modules/portalGroups/group_modal.html',
                 controller: 'group_modal',
                 windowClass: "modal-flat",
                 size: 'sm',
                 resolve: {
                     modalParams: ret
                 }
             });
             modalEntity.result.then(function (ret) { deferred.resolve(ret); }).catch(function () { });
         }).catch(function (err) {
             blockUI.stop();
             console.error(err);
         });
         return deferred.promise;
     };

     // --------------------------------------------------------------------------------------->
     // shared
     // --------------------------------------------------------------------------------------->

     return service;
 })

