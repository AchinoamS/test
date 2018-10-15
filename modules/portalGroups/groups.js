

app.controller('app_portal_groups',
    function ($scope, $q, $uibModal, $translate, MetaService, DataService, entity_service) {
        SBLOCK_entity_multi($scope, $translate);
        $scope.initArgs({
            name: $translate.instant("Portal & Groups Management"),
        });

        
        $scope.reportDS = new kendo.data.DataSource({
            transport: {
                read: function (options) {
                    $scope.UIARGS.selectedRow = null;
                    DataService.get("groups", null).then(function (ret) {
                        _.each(ret, function (group) {
                            entity_service.prepareGroup(group);
                        });
                        options.success(ret);
                    });
                },
            },
            schema: {
                model: {
                    id: "id",
                    fields: {
                        profile: { nullable: true },
                        accessLevel: { nullable: true },
                    }
                }
            },
            pageSize: 100
        });

        $scope.gridConfig = {
            toolbar: [
                { 'name': 'new', template: '<button type="button" class="btn btn-default" ng-click="addEditGroup()"><i class="fa fa-fw fa-plus"></i>{{"New Group" | translate}}</button>' },
                { 'name': 'edit', template: '<button type="button" class="btn btn-default" ng-click="addEditGroup(UIARGS.selectedRow)" ng-disabled="!UIARGS.selectedRow"><i class="fa fa-fw fa-pencil"></i>{{"Edit" | translate}}</button>' },
                { 'name': 'delete', template: '<button type="button" class="btn btn-default" ng-click="deleteGroup(UIARGS.selectedRow)" ng-disabled="!UIARGS.selectedRow"><i class="fa fa-fw fa-trash"></i>{{"Delete" | translate}}</button>' },
            ],
            selectable: true,
            sortable: true,
            resizable: true,
            reorderable: true,
            pageable: true,
            filterable: $scope.defColumnFilters,
            dataBound: function (e) {
                var grid = this;
                grid.tbody.find("tr").dblclick(function (e) {
                    var dataItem = grid.dataItem(this);
                    $scope.addEditGroup(dataItem);
                });
            },
            columns: [
                {
                    field: "name",
                    title: $translate.instant("Group Name"),
                    width: 110,
                },
                {
                    field: "users",
                    title: $translate.instant("Participants Number"),
                    template: "<span>{{dataItem.users.length}}</span>",
                    width: 110,
                },
                {
                    field: "created",
                    title: $translate.instant("Created Date"),
                    width: 110,
                    format: "{0:dd, HH:mm }",
                    template: "<span uib-tooltip='{{dataItem.created | date:\"MMM-dd-yy, HH:mm\"}}'  tooltip-append-to-body='true' am-time-ago='dataItem.created'></span>",
                },
                {
                    field: "updated",
                    title: $translate.instant("Updated Date"),
                    width: 110,
                    format: "{0:dd, HH:mm }",
                    template: "<span uib-tooltip='{{dataItem.updated | date:\"MMM-dd-yy, HH:mm\"}}'  tooltip-append-to-body='true' am-time-ago='dataItem.updated'></span>",
                }
            ]
        };


        $scope.deleteGroup = function (group) {
            if (!group) return;
            DataService.delete("groups", group, { confirm: true }).then(function (ret) {
                $scope.reportDS.pushDestroy(group);
            }).catch();
        };
        $scope.addEditGroup = function (group) {
            entity_service.addEditGroup(group && group.id).then(function () {
                $scope.reportDS.read();
            }).catch(function () { });
        };
        

    });
