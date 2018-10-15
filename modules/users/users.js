

app.controller('app_users',
    function ($scope, $q, $uibModal, $translate, MetaService, DataService, entity_service) {
        SBLOCK_entity_multi($scope, $translate);
        $scope.initArgs({
            name: $translate.instant("User Management"),
        });

        $scope.reportDS = new kendo.data.DataSource({
            transport: {
                read: function (options) {
                    $scope.UIARGS.selectedRow = null;
                    options.success(MetaService.users);
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
                { 'name': 'batch', template: '<div ng-include="\'modules/users/users_bar.html\'"></div>' },
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
                    $scope.addEditUser(dataItem);
                });
            },
            columns: [
                {
                    field: "userName",
                    title: $translate.instant("User Name"),
                    width: 110,
                },
				{
                    field: "firstName",
                    title: $translate.instant("First Name"),
                    width: 110,
                },
                {
                    field: "lastName",
                    title: $translate.instant("Last Name"),
                    width: 110,
                    values: $scope.meta.accessLevels
                },
				{
                    field: "nationalID",
                    title: $translate.instant("Identity Number"),
                    width: 110,
                },
                {
                    field: "phone",
                    title: $translate.instant("Phone"),
                    //template: "<span class='inline _ltr'>{{dataItem.phone | tel}}</span>",
                    width: 110, 
                },
                {
                    field: "email",
                    title: $translate.instant("Email"),
                    width: 150,
                },
                {
                    field: "userType",
                    title: $translate.instant("User Type"),
                    width: 70,
                    values: $scope.meta.user_types
                }
            ]
        };

        $scope.searchGrid = function () {
            var val = $.trim($scope.UIARGS.query);
            if (val.length) {
                $scope.reportDS.filter({
                    logic: "or",
                    filters: [
                        {
                            field: "firstName",
                            operator: "contains",
                            value: val
                        }, {
                            field: "lastName",
                            operator: "contains",
                            value: val
                        }
                    ]
                });
            } else {
                $scope.reportDS.filter({})
            }
        };

        $scope.deleteUser = function (user) {
            if (!user) return;
            DataService.delete("users", user, { confirm: true }).then(function (ret) {
                $scope.reportDS.pushDestroy(user);
            }).catch();
        };
        $scope.addEditUser = function (user) {
            entity_service.addEditUser(user && user.id).then(function () {
                $scope.reportDS.read();
            }).catch(function () { });
        };


    });
