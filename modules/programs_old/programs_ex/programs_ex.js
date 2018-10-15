

app.controller('app_programs_ex',
    function ($scope, $q, $uibModal, $translate, MetaService, DataService, entity_service) {

        var isPlan = $scope.$state.includes("app.main.programs_plan");
        var isForecast = $scope.$state.includes("app.main.programs_forecast");

        entity_service.mapProgramsEnum(true);
        SBLOCK_entity_multi($scope, $translate);
        $scope.initArgs({
            isPlan: isPlan,
            isForecast: isForecast,
            name: $translate.instant(isPlan ? "Program Plan" : isForecast ? "Program Forecast" : "Program Execute"),
            filtersTemplate: "modules/programs_ex/blocks/programs_ex_filters.html",
            filter: { mode: isPlan ? 'plan' : 'actual' },
            actions: [{text:"Planning", icon:"fa-vcard-o", mode:"plan"}]
        });

        var year = _.find(MetaService.work_years, { "default": true });
        if (!year) year = MetaService.work_years[MetaService.work_years.length - 1];
        if (year) $scope.UIARGS.filter.year = year.id;

		var period = false;
        if (!isPlan) {
            $scope.UIARGS.actions.push({text:"Execution", icon:"fa-vcard", mode:"actual"});
			period = _.find(MetaService.work_periods, { "defaultActual": true });
            /*$scope.UIARGS.actions.push({text:"Forecast", icon:"fa-address-book", mode:"forecast"});
            var period = _.find(MetaService.work_periods, { "default": true });
            if (!period) period = MetaService.work_periods[0];
            if (period) $scope.UIARGS.filter.period = period.id;*/
        }
		else {
			period = _.find(MetaService.work_periods, { "defaultPlan": true });
		}
        if (!period) period = MetaService.work_periods[0];
        if (period) $scope.UIARGS.filter.period = period.id;

        $scope.reportDS = new kendo.data.DataSource({
            transport: {
                read: function (options) {
                    $scope.UIARGS.selectedRow = null;
                    $q.all({
                        programs: DataService.get("programs_ex", $scope.UIARGS.filter)
                        //,programs_data: DataService.get("programs_data", $scope.UIARGS.filter)
                    }).then(function (ret) {
                        //entity_service.preparePrgrams(ret.programs, ret.programs_data);
                        entity_service.preparePrgrams(ret.programs);
                        options.success(ret.programs);
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
                        measures: { nullable: true },
                        planApproved: { type: "boolean", nullable: true, defaultValue:false },
                        actualApproved: { type: "boolean", nullable: true, defaultValue:false },
                    }
                }
            },
            pageSize: 100
        });

        $scope.gridConfig = {
            toolbar: [
                { 'name': 'batch', template: '<div ng-include="\'modules/programs_ex/blocks/programs_ex_bar.html\'"></div>' },
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
                    $scope.editProgramData(dataItem, isPlan ? 'plan' : isForecast ? 'forecast' : 'actual');
                });
            },
            columns: [
                {
                    field: "",
                    title: "..",
                    width: 50,
                    template: '<button ng-if="!dataItem.closed" uib-popover-template="\'modules/programs_ex/blocks/popover_row_actions.html\'"  popover-placement="\'auto left-top\'" popover-trigger="\'focus\'" popover-append-to-body="true" popover-title="{{\'Actions\' | translate}}" type="button" class="btn btn-default fa">\
                                &\\#xf013;\
                              </button>'
                },
                {
                    field: "name",
                    title: $translate.instant("Name"),
                    width: 200,
					template: "<div class='text-ellipsis' uib-tooltip='{{dataItem.description}}' tooltip-append-to-body='true'>{{dataItem.name}}</div>"
                },
                /*{
                    field: "description",
                    title: $translate.instant("Description"),
                    width: 300,
                    template: "<div class='text-ellipsis' uib-tooltip='{{dataItem.description}}' tooltip-append-to-body='true'>{{dataItem.description}}</div>"
                },*/
                {
                    field: "measures",
                    title: $translate.instant("Measures"),
                    width: 150,
                    values: $scope.meta.measurements,
                    template: "{{dataItem.measures | filterMsEnt:meta.measurements}}",
                    filterable: false,
                    hidden: true
                }, {
                    field: "$$unit",
                    title: $translate.instant("Unit"),
                    width: 120,
                    values: $scope.meta.units,
                    filterable: { multi: true }
                }, {
                    field: "$$sub_unit",
                    title: $translate.instant("Sub Unit"),
                    width: 120,
                    values: $scope.meta.subUnits,
                    //filterable: { multi: true }
                }, {
                    field: "$$subject",
                    title: $translate.instant("Subject"),
                    width: 120,
                    values: $scope.meta.subjects,
                    //filterable: { multi: true },
                }, {
                    title: $translate.instant("Approvals"),
                    columns:[
                        {
                            field: "entered",
                            title: $translate.instant("Entered"),
                            width: 70,
                            filterable: false,
                            template: '<div ng-if="dataItem.entered" class="text-success text-center"><i class="fa fa-check"></i></div><div ng-if="!dataItem.entered" class="text-danger text-center"><i class="fa fa-ban"></i></div>'
                        },
                        {
                            field: "approved",
                            title: $translate.instant("Approved"),
                            width: 80,
                            filterable: false,
                            template: '<div ng-if="dataItem.approved" class="text-success text-center"><i class="fa fa-check"></i></div><div ng-if="!dataItem.approved" class="text-danger text-center"><i class="fa fa-ban"></i></div>'
                        }
                    ]
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
                            field: "name",
                            operator: "contains",
                            value: val
                        }, {
                            field: "description",
                            operator: "contains",
                            value: val
                        }
                    ]
                });
            } else {
                $scope.reportDS.filter({})
            }
        };


        $scope.editProgramData = function (program, mode) {
			//if (!MetaService.meta.checkAccess([1,2,3]))return;

            var filter = _.extend({ id: program.id }, $scope.UIARGS.filter, {mode: mode});
            entity_service.editProgramData(filter).then(function () {
                $scope.reportDS.read();
            }).catch(function () { });
        };


    });
