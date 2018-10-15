

app.controller('app_programs',
    function ($scope, $q, $uibModal, $translate, MetaService, DataService, entity_service) {
        

        SBLOCK_entity_multi($scope, $translate);
        $scope.initArgs({
            name: $translate.instant("Programs"),
        });
        
        entity_service.mapProgramsEnum();

        $scope.reportDS = new kendo.data.DataSource({
            transport: {
                read: function (options) {
                    $scope.UIARGS.selectedRow = null;
                    DataService.get("programs", null).then(function (ret) {
                        entity_service.preparePrgrams(ret);
                        options.success(ret);
                    });
                },
            },
            schema: {
                model: {
                    id: "id",
                    fields: {
                        $$unit: { nullable: true },
                        $$sub_unit: { nullable: true },
                        $$subject: { nullable: true },
                        referant: { nullable: true },
                        measures: { nullable: true }
                    }
                }
            },
            pageSize: 100
        });

        $scope.gridConfig = {
            toolbar: [
                { 'name': 'batch', template: '<div ng-include="\'modules/programs/programs_bar.html\'"></div>' },
            ],
            selectable: true,
            sortable: true,
            resizable: true,
            reorderable: true,
            groupable: true,
            pageable: true,
            filterable: $scope.defColumnFilters,
            dataBound: function (e) {
                var grid = this;
                grid.tbody.find("tr").dblclick(function (e) {
                    var dataItem = grid.dataItem(this);
                    $scope.addEditProgram(dataItem);
                });
            },
            columns: [
                {
                    field: "name",
                    title: $translate.instant("Name"),
                    width: 200,
					template: "<div class='text-ellipsis' uib-tooltip='{{dataItem.description}}' tooltip-append-to-body='true'>{{dataItem.name}}</div>"
                },{
                    field: "$$unit",
                    title: $translate.instant("Unit"),
                    width: 150,
                    values: $scope.meta.units,
                    filterable: { multi: true }
                },{
                    field: "$$sub_unit",
                    title: $translate.instant("Sub Unit"),
                    width: 150,
                    values: $scope.meta.subUnits,
                    //filterable: { multi: true }
                },{
                    field: "$$subject",
                    title: $translate.instant("Subject"),
                    width: 150,
                    values: $scope.meta.subjects,
                    //filterable: { multi: true },
                },{
                    field: "id",
                    title: $translate.instant("Program ID"),
                    width: 150,
                }
            ]
        };

        $scope.searchGrid = function(){
            var val = $.trim($scope.UIARGS.query);
            if (val.length){
                $scope.reportDS.filter({
                    logic  : "or",
                    filters: [
                        {
                            field   : "name",
                            operator: "contains",
                            value   : val
                        },{
                            field   : "description",
                            operator: "contains",
                            value   : val
                        }
                    ]
                });
            }else{
                $scope.reportDS.filter({})
            }
        };



        $scope.deleteProgram = function (program) {
            if (!program) return;
            DataService.delete("programs", program, { confirm: true }).then(function (ret) {
                $scope.reportDS.pushDestroy(program);
            }).catch();
        };
        $scope.addEditProgram = function (program) {
            entity_service.addEditProgram(program && program.id).then(function () {
                $scope.reportDS.read();
            }).catch(function () { });
        };


    });
