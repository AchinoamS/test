

app.controller('app_programstree',
    function ($scope, $q, $uibModal, $translate, MetaService, DataService, entity_service) {
        SBLOCK_entity_multi($scope, $translate);
        $scope.initArgs({
            name: $translate.instant('Programs Tree'),
            boxed: true
        });

        $scope.ui = {};

        DataService.get("programs_tree", null).then(function (ret) {
            $scope.ui.data = ret;
        });


        $scope.selectUnit = function (o) {
            $scope.ui.selectedUnit = o;
            $scope.ui.selectedDepartment = null;
            $scope.ui.selectedGroup = null;
        };
        $scope.selectDepartment = function (o) {
            $scope.ui.selectedDepartment = o;
            $scope.ui.selectedGroup = null;
        };
        $scope.selectGroup = function (o) {
            $scope.ui.selectedGroup = o;
        };
        $scope.editMember = function (o, sEnt) {
            if (!_.find($scope.ui.data, {parentId: o.id})){
                o.$$canDelete = true;
            }
            addEditMember(o).then(function(ret){
                if (!ret){
                    switch (sEnt){
                        case "unit": $scope.selectUnit(); break;
                        case "department": $scope.selectDepartment(); break;
                        case "group": $scope.selectGroup(); break;
                    }                
                }
            });
        };

        $scope.addUnit = function () {
            addEditMember({ parentId: null, active: true }, 'selectedUnit').then(function(ret){
                $scope.selectUnit(ret);
            });
        };
        $scope.addDepartment = function () {
            if (!$scope.ui.selectedUnit) return;
            addEditMember({ parentId: $scope.ui.selectedUnit.id, active: true }, 'selectedDepartment').then(function(ret){
                $scope.selectDepartment(ret);
            });
        };
        $scope.addGroup = function () {
            if (!$scope.ui.selectedDepartment) return;
            addEditMember({ parentId: $scope.ui.selectedDepartment.id, active: true }, 'selectedGroup').then(function(ret){
                $scope.selectGroup(ret);
            });
        };

        function addEditMember(member, sEnt) {
            var deferred = $q.defer();
            var isNew = !member.id;
            var modalEntity = $uibModal.open({
                templateUrl: 'modules/setup/programstree_modal.html',
                controller: 'app_programstree_modal',
                windowClass: "modal-flat",
                animation: false,
                //size: 'sm',
                resolve: {
                    modalParams: {
                        member: member
                    }
                }
            });
            modalEntity.result.then(function (ret) {
                if (ret.mode == 'delete'){
                    var index = _.findIndex($scope.ui.data, {id: member.id});
                    $scope.ui.data.splice(index, 1);
                    deferred.resolve();
                }else{
                    ret = ret.data;
                    if (isNew) {
                        $scope.ui.data.push(ret);
                        deferred.resolve(ret);
                    } else {
                        _.extend(member, ret);
                        deferred.resolve(member);
                    }                
                }
            }).catch(function () { });
            return deferred.promise;
        }


    });



app.controller('app_programstree_modal',
    function ($scope, MetaService, DataService, entity_service, $uibModalInstance, modalParams, $timeout, $http, $locale, $translate, $locale) {
        $scope.meta = MetaService;
        $scope.DS = DataService;
        $scope.params = modalParams;
        $scope.member = modalParams.member;

        $scope.apply = function () {
            if ($scope.form.$valid) {
                DataService.save("programs_tree", $scope.member).then(function (ret) {
                    $scope.PDialog.success({ text: $translate.instant("Saved Successfully") }).then(function () {
                        $uibModalInstance.close({mode: "update", data: ret});
                    });
                });
            }
        };
        $scope.delete = function () {
            DataService.delete("programs_tree", $scope.member, {confirm:true}).then(function (ret) {
                $uibModalInstance.close({mode: "delete", data: ret});
            });
        };
    });
