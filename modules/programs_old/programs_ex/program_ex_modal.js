

app.controller('program_ex_modal',
    function ($scope, MetaService, DataService, entity_service, $uibModalInstance, modalParams, $timeout, $translate, PDialog, $uibModal) {
        $scope.meta = MetaService;
        $scope.DS = DataService;
        $scope.params = modalParams;
        $scope.ES = entity_service;

        $scope.ui = {
            tabs: [
                { text: "Planning", icon: "fa-vcard-o", key: "P"},
                { text: "Program workplans", icon: "fa-vcard-o", key: "PS", access:['workplans'] },
            ],
            tab: 'P',
            isPlan: true,
            insertModel: {
                dimensions: {},
                measures: {}
            },
            defQuery: {
                program: modalParams.args.id,
                year: modalParams.args.year,
                period: modalParams.args.period,
            }
        };

        if (modalParams.args.mode == "actual") {
            //$scope.ui.tabs.unshift({ text: "Execution", icon: "fa-vcard", key: "E" });
			$scope.ui.tabs = [{ text: "Execution", icon: "fa-vcard", key: "E" }];
            $scope.ui.tab = "E";
            $scope.ui.isPlan = false;
        };
        if (modalParams.args.mode == "forecast") {
            $scope.ui.tabs.unshift({ text: "Forecast", icon: "fa-address-book", key: "F" });
            $scope.ui.tab = "F";
            $scope.ui.isPlan = false;        
        }

        $scope.program = modalParams.program;
        $scope.program_data = modalParams.program_data;
		//console.log("modalParams.program_data: ", modalParams.program_data);

        $scope.plan_data = angular.copy(modalParams.plan_data);

        $scope.editProgram = function () {
            entity_service.addEditProgram(modalParams.program.id).then(function (ret) {
                $scope.ui.loading = true;
                DataService.getDetails("programs_ex", modalParams.args).then(function (ret) {
                    delete $scope.ui.planParams;
                    delete $scope.ui.actualParams;
                    $scope.ui.loading = false;
                    $scope.program = ret;
                });
            }).catch(function () { });
        };

        $scope.apply = function () {
            DataService.save("programs", $scope.program).then(function (ret) {
                $scope.PDialog.success({ text: $translate.instant("Saved Successfully") }).then(function () {
                    $uibModalInstance.close(ret);
                });
            });
        };

		
		$scope.close = function(){
			$uibModalInstance.close();
			//$scope.$dismiss();
		}

        // ----------------------------------------------------------------------------->
        // tabs
        // ----------------------------------------------------------------------------->

        $scope.setTab = function (sTab) {
            $scope.ui.submitAttempt = true;
            switch ($scope.ui.tab) {
                case "E":

                    break;
                case "P":

                    break;
            };
            $scope.ui.tab = sTab;
            $scope.ui.submitAttempt = false;
        };

        // --------------------------------------------------------------------------------------->
        // utilities
        // --------------------------------------------------------------------------------------->

        $scope.approveRows = function (args) {
            var data = _.extend({}, $scope.program_data, args)
            $scope.DS.save("programs_data", data).then(function (ret) {
                //console.log(ret);
                $scope.program_data = ret;
				if('planApproved' in args){
					$scope.ui.planParams.readonly = $scope.program_data.planReadonly;
				}
				else if('actualApproved' in args){
					$scope.ui.actualParams.readonly = $scope.program_data.actualReadonly;
				}
				
            }).catch();
        };

        $scope.generateDataParams = function (args) {
            var dimensions = [], cols = [], measures = [], aggregate = [];

            cols.push({
                field: "",
                title: "..",
                width: 40,
                attributes: {
                    style: "padding: 0"
                },
                template: '<div class="text-center"><i class="fa" ng-class="{\'fa-star-o\':!dataItem.data.notes.length, \'fa-star text-warning\':dataItem.data.notes.length}""></i>{{dataItem.notes}}</div>'
            })

            var program = $scope.program;

            generateLocationCol(args.audiance_location, 'audiance_location', 'location', 'Audiance Location', true);
            generateLocationCol(args.program_location, 'program_location', 'location', 'Program Location', true);
            generateLocationCol(args.activity_types, 'activity_types', 'activity', 'Activity Type');

            _.each(program.measures, function (_measure) {
                var measure = _.find($scope.meta.measurements, { id: _measure });
                if (measure) {
                    var field = "measure_" + _measure;
                    cols.push({
                        title: measure.name,
                        field: field,
                        aggregates: ["sum"],
                        //footerTemplate: "Sum: #=sum#"
                        footerTemplate: "<span ng-bind-html=\"getMeasureTotal('" + field + "', #=sum #)\"></span>"

                    });
                    aggregate.push({
                        field: field,
                        aggregate: "sum"
                    });
                    measures.push({
                        id: _measure,
                        text: measure.name
                    });
                }
            });

            return {
                cols: cols,
                dimensions: dimensions,
                measures: measures,
                aggregate: aggregate
            };

            function generateLocationCol(dataField, field, type, text, checkAll) {
                var data = program[dataField] || {};
                if (!data.mandatory || data.mandatory == 'N') return;
                var ents = type == "location" ? ['countries', 'cities', 'locations'] : ['activity_types'];
                var members = [];

                _.each(ents, function (ent) {
                    if (checkAll && _.find(data[ent], { id: 1 })) {
                        var allArray = $scope.meta[ent];
                        allArray.forEach(function (e) { e.ent = ent });
                        members = members.concat(allArray); 
                    } else {
						_.each(data[ent], function (v) {
							var o = _.find($scope.meta[ent], { id: v.id });
                            if (o && !(_.find(members, { id: o.id, ent: ent}))) {
								//console.log("o: ", o);
								members.push({
									ent: ent,
									id: o.id,
									name: o.name
								});
							}
						});					
					}
                });

                if (members.length) {
                    var title = $translate.instant(text);
                    cols.push({
                        title: title,
                        field: field,
                    });

                    dimensions.push({
                        type: type,
                        field: field,
                        text: title,
                        members: members,
                        requiered: data.mandatory == 'M'
                    })
                };
            };
        };
    });
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// plan setup
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

app.controller('program_ex_modal_plan_setup',
    function ($scope, $translate, $uibModal, PDialog) {
        $scope.uiPS = {
            formDisabled: $scope.plan_data.readonly,
						rIndex: 1
        }
        if (!$scope.plan_data.rows) $scope.plan_data.rows = [];
				_.each($scope.plan_data.rows, function(row){
					row.$$id = ++$scope.uiPS.rIndex;
				});
		

		//console.log("$scope.plan_data: ", $scope.plan_data);

        $scope.reportDS = new kendo.data.DataSource({
            transport: {
                read: function (options) {
                    $scope.uiPS.selectedRow = null;
										options.success($scope.plan_data.rows || []);
                },
            },
            schema: {
                model: {
                    id: "$$id",
					fields: {
						expected_output: {type: "number"},
						core_budget: {type: "number"},
						designated_budget: {type: "number"},
						service_sales: {type: "number"}
					}
                }
            },
            pageSize: 100
        });
				
		$scope.onRowSelect = function(dataItem){
			$scope.uiPS.selectedRow = dataItem;
		}

				$scope.gridConfig = {
						selectable: true,
						sortable: true,
						resizable: true,
						reorderable: true,
						pageable: true,
						filterable: $scope.defColumnFilters,

						toolbar: [
                { 'name': 'new', template: '<button type="button" class="btn btn-default" ng-click="handlePlanSetupRow()"><i class="fa fa-fw fa-plus"></i>{{"Add" | translate}}</button>' },
                { 'name': 'edit', template: '<button type="button" class="btn btn-default" ng-click="handlePlanSetupRow(uiPS.selectedRow)" ng-disabled="!uiPS.selectedRow"><i class="fa fa-fw fa-pencil"></i>{{"Edit" | translate}}</button>' },
                { 'name': 'delete', template: '<button type="button" class="btn btn-default" ng-click="deletePlanSetupRow(uiPS.selectedRow)" ng-disabled="!uiPS.selectedRow"><i class="fa fa-fw fa-trash"></i>{{"Delete" | translate}}</button>' },
            ],

						dataBound: function (e) {
								window.setTimeout(function () {
										$(window).trigger('resize');
								}, 400);

								var grid = this;

								grid.tbody.find("tr").dblclick(function (e) {
										var dataItem = grid.dataItem(this);
										$scope.handlePlanSetupRow(dataItem);
								});
						},
						
						columns: [
							{
								field: "move_name",
								title: $translate.instant("Move Name"),
								width: 120,
							},{
								field: "expected_result",
								title: $translate.instant("Expected Result"),
								width: 300,
								template: "<div class='text-ellipsis' uib-tooltip='{{dataItem.expected_result}}' tooltip-append-to-body='true'>{{dataItem.expected_result}}</div>"
							},{
								field: "influence_objective",
								title: $translate.instant("Influence Objective"),
								values: $scope.meta.influence_objectives,
								width: 120,
							},{
								field: "intervention_strategy",
								title: $translate.instant("Intervention Strategy"),
								values: $scope.meta.intervention_strategies,
								width: 120,
							},{
								field: "expected_output",
								title: $translate.instant("Expected Output"),
								width: 90,
							},{
								field: "core_budget",
								title: $translate.instant("Core Budget"),
								width: 90,
							},{
								field: "designated_budget",
								title: $translate.instant("Designated Budget"),
								width: 90,
							},{
								field: "service_sales",
								title: $translate.instant("Service Sales"),
								width: 90
							}
							]
				};

			$scope.deletePlanSetupRow = function(dataItem){
            PDialog.warning({
                text: $translate.instant("Are you sure you wish to delete this record?"),
                showCancelButton: true,
                confirmButtonText: $translate.instant("DELETE")
            }).then(function () {
					var index = _.findIndex($scope.plan_data.rows, {$$id:dataItem.$$id});
					$scope.plan_data.rows.splice(index, 1);
					$scope.savePlanData();					
            });
				}

				$scope.handlePlanSetupRow = function (dataItem) {
					if (dataItem) var row = angular.copy(_.find($scope.plan_data.rows, {$$id:dataItem.$$id}));
						
					var modalRow = $uibModal.open({
						templateUrl: 'modules/programs_ex/blocks/program_ex_modal_plan_setup_modal_row.html',
						windowClass: 'cs-order-modal modal-default',
						animation: false,
						backdtop: "static",
						//size: 'lg',
						scope: $scope,
						controller: function ($scope, $uibModalInstance, modalParams, AuthService) {
								$scope.plan_data = modalParams.dataItem;
								$scope.uiPS = {
										formDisabled: modalParams.disabled
								};

								$scope.apply = function () {
										if ($scope.dform.$valid) {
											$uibModalInstance.close($scope.plan_data);
										}
								};
						},
						resolve: {
								modalParams: {
									dataItem: row || {},
									disabled: $scope.uiPS.formDisabled
								}
						}
						}).result.then(function (ret) { 
							if (ret.$$id){
								var row = _.find($scope.plan_data.rows, {$$id:dataItem.$$id});
								if (row) _.extend(row, ret);
							}else{
								ret.$$id = ++$scope.uiPS.rIndex;
								$scope.plan_data.rows.push(ret);
							}
							$scope.savePlanData();
						});
				};


        $scope.savePlanData = function(){
            $scope.DS.save("plan_data", $scope.plan_data).then(function (ret) {
				//toastr.success($translate.instant("Saved Successfully"));
				//$scope.reportDS.read();
				$scope.PDialog.success({ text: $translate.instant("Saved Successfully") }).then(function (ret) {});
				$scope.reportDS.read();
            });
        }
    });


// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// plan
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

app.controller('program_ex_modal_plan',
    function ($scope, $translate, $uibModal, PDialog) {

        if (!$scope.ui.planParams) {
            $scope.ui.planParams = _.extend($scope.generateDataParams({
                audiance_location: 'audiance_location_plan',
                program_location: 'program_location_plan',
                activity_types: 'activity_types_plan'
            }), {
                entity: 'program_rows_plan',
                readonly: $scope.program_data.planReadonly,
                toolbarTemplate: [
                    { 'name': 'batch', template: '<div ng-include="\'modules/programs_ex/blocks/program_ex_modal_grid_bar_plan.html\'"></div>' },
                ],
                defQuery: _.extend({ type: 'plan'}, $scope.ui.defQuery)
            });
			
        }
        $scope.colsParams = $scope.ui.planParams;
        SBLOCK_program_data_shared($scope, $translate, $uibModal, PDialog);

        $scope.reportDS = new kendo.data.DataSource({
            transport: {
                read: function (options) {
                    $scope.UIARGS.selectedRow = null;
                    $scope.DS.get($scope.colsParams.entity, $scope.params.args).then(function (ret) {
                        options.success($scope.prepareRows(ret));
                    });
                },
            },
            schema: {
                model: {
                    id: "id",
                }
            },
            aggregate: $scope.colsParams.aggregate,
            pageSize: 100
        });

        $scope.getMeasureTotal = function (measure, total) {
            return $translate.instant("Total") + ": " + total;
        }

    });

// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// execute
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

app.controller('program_ex_modal_execute',
    function ($scope, $translate, $uibModal, $q, PDialog) {
        if (!$scope.ui.actualParams) {
            debugger;
            _.extend($scope.ui.actualParams = $scope.generateDataParams({
                audiance_location: 'audiance_location_actual',
                program_location: 'program_location_actual',
                activity_types: 'activity_types_actual'
            }), {
                entity: 'program_rows_actual',
                readonly: $scope.program_data.actualReadonly,
                toolbarTemplate: [
                    { 'name': 'batch', template: '<div ng-include="\'modules/programs_ex/blocks/program_ex_modal_grid_bar_actual.html\'"></div>' },
                ],
                defQuery: _.extend({ type: 'actual' }, $scope.ui.defQuery)
            });
        }

        $scope.colsParams = $scope.ui.actualParams;
        $scope.colsParams.actions = [
            { text: "Approve", btnClass: "btn-success", mode: "approve" },
            { text: "Decline", btnClass: "btn-danger", mode: "decline" },
        ];

        SBLOCK_program_data_shared($scope, $translate, $uibModal, PDialog);

        $scope.reportDS = new kendo.data.DataSource({
            transport: {
                read: function (options) {
                    $scope.UIARGS.selectedRow = null;
					var planArgs = angular.copy($scope.params.args);
					planArgs.period = 'YR';

                    $q.all({
                        rows: $scope.DS.get('program_rows_actual', $scope.params.args),
                        plans: $scope.DS.get('program_rows_plan', planArgs)
                    }).then(function (ret) {

                        //summarize plan measures
                        var planMeasures = {};
                        _.each(ret.plans, function (row) {
                            _.each(row.measures, function (val, key) {
                                var field = 'measure_' + key;
                                if (!isNaN(val)) {
                                    if (!planMeasures[field]) planMeasures[field] = Number(val);
                                    else planMeasures[field] += Number(val);
                                }
                            });
                        });
                        $scope.planMeasures = planMeasures;
                        options.success($scope.prepareRows(ret.rows));
                    });
                },
            },
            schema: {
                model: {
                    id: "id",
                }
            },
            aggregate: $scope.colsParams.aggregate,
            pageSize: 100
        });

        $scope.getMeasureTotal = function (measure, total) {
            var plan = $scope.planMeasures[measure] || 0;
            var execute = plan ? Math.round(total / plan * 100) + '%' : "Infinity";
            var ret = $translate.instant("Total") + ": " + total;
            ret += "<div>" + $translate.instant("Planning") + ": " + plan + "<div>";
            ret += "<div>" + $translate.instant("ExecutionP") + ": " + execute + "<div>";
            return ret;
        }

    });


// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// forecast
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

app.controller('program_ex_modal_forecast',
    function ($scope, $translate, $uibModal, $q, PDialog) {
        if (!$scope.ui.forecastParams) {
            
            _.extend($scope.ui.forecastParams = $scope.generateDataParams({
                audiance_location: 'audiance_location_actual',
                program_location: 'program_location_actual',
                activity_types: 'activity_types_actual'
            }), {
                entity: 'program_rows_forecast',
                readonly: $scope.program_data.forecastReadonly,
                toolbarTemplate: null,
                defQuery: _.extend({ type: 'forecast' }, $scope.ui.defQuery)
            });
        }

        $scope.colsParams = $scope.ui.forecastParams;
        $scope.colsParams.actions = [
            { text: "Approve", btnClass: "btn-success", mode: "approve" },
            { text: "Decline", btnClass: "btn-danger", mode: "decline" },
        ];

        SBLOCK_program_data_shared($scope, $translate, $uibModal, PDialog);

        $scope.reportDS = new kendo.data.DataSource({
            transport: {
                read: function (options) {
                    $scope.UIARGS.selectedRow = null;
                    $q.all({
                        rows: $scope.DS.get('program_rows_forecast', $scope.params.args),
                    }).then(function (ret) {
                        options.success($scope.prepareRows(ret.rows));
                    });
                },
            },
            schema: {
                model: {
                    id: "id",
                }
            },
            aggregate: $scope.colsParams.aggregate,
            pageSize: 100
        });

        $scope.getMeasureTotal = function (measure, total) {
            return $translate.instant("Total") + ": " + total;
        }

    });



// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// shared
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

var SBLOCK_program_data_shared = function ($scope, $translate, $uibModal) {

    function generateUIInsert() {
        $scope.uiInsert = _.extend({
            dimensions: {},
            measures: {}
        }, $scope.colsParams.defQuery);
    };
    generateUIInsert();
    SBLOCK_entity_multi($scope, $translate);
    $scope.initArgs({});

    $scope.resetForm = function (_form) {
        $scope.colsParams.submitAttempt = false;
        _form.$setPristine();
        generateUIInsert();
    };

    $scope.addInsertLine = function (_form) {
        if (_form.$valid) {
            $scope.DS.save($scope.colsParams.entity, $scope.uiInsert).then(function (ret) {
				if (ret.msg) {
					$scope.PDialog.warning({text: $translate.instant(ret.msg)}).then(function (ret) {
						return;
					});	
				}
                else {
					$scope.PDialog.success({ text: $translate.instant("Saved Successfully") }).then(function () {
                    $scope.resetForm(_form);
                    $scope.reportDS.read();
					});
				}
            });
        }
    };

    $scope.prepareRows = function (ret) {
        var rows = [];
        _.each(ret, function (row) {
            var newRow = {};
            _.each(row.dimensions, function (val, key) {
                var _val = val.nameX;
                if (!_val) {
                    var o = _.find($scope.meta[val.ent], { id: val.id });
                    if (o) {
                        _val = o.name;
                        val.name = o.name;
                    }
                }
                if (_val) newRow[key] = _val;
            });
            _.each(row.measures, function (val, key) {
                newRow['measure_' + key] = val;
            });
            newRow.data = row;
            rows.push(newRow);
        });
        return rows;
    }

    $scope.gridConfig = {
        selectable: true,
        sortable: true,
        resizable: true,
        reorderable: true,
        pageable: true,
        filterable: $scope.defColumnFilters,
        dataBound: function (e) {
            $scope.onFiltersLoaded();
            var grid = this;
            grid.tbody.find("tr").dblclick(function (e) {
                var dataItem = grid.dataItem(this);
                $scope.editRow(dataItem);
            });
        },
        toolbar: $scope.colsParams.toolbarTemplate,
        columns: $scope.colsParams.cols
    };

    $scope.deleteProgramRow = function (row) {
        if (!row) return;
        $scope.DS.delete($scope.colsParams.entity, row.data, { confirm: true }).then(function (ret) {
            $scope.reportDS.pushDestroy(row);
        }).catch();
    };

    $scope.addLocationRow = function (dimension, insertRow) {
        var modalLocation = $uibModal.open({
            templateUrl: 'modules/programs_ex/blocks/program_ex_modal_location.html',
            windowClass: 'cs-order-modal modal-default',
            animation: false,
            backdtop: "static",
            size: 'sm',
            scope: $scope,
            controller: function ($scope, $uibModalInstance, modalParams, AuthService) {
                $scope.uiLocation = {
                    entities: [
                        {name:"Countries", entity:"countries"},
                        {name:"Cities", entity:"cities"},
                        {name:"Locations", entity:"locations"}
                    ]
                };
                $scope.location = {}
                $scope.apply = function () {
                    if ($scope.form.$valid) {
                        var member = $scope.location.entity;
                        var chkMember = _.find(modalParams.dimension.members, { id: member.id, ent: $scope.location.ent });
                        
                        if (!chkMember){
                            chkMember = {
                                ent: $scope.location.ent,
                                id: member.id,
                                name: member.name
                            }
                            modalParams.dimension.members.push(member);
                        }
                        modalParams.insertRow.dimensions[modalParams.dimension.field] = chkMember;
                        $uibModalInstance.close();
                    };
                };
            },
            resolve: {
                modalParams: {
                    dimension: dimension,
                    insertRow: insertRow
                }
            }
        }).result.then(function (ret) { }).catch(function () { });
    }

	

    $scope.editRow = function (dataItem) {
        var row = dataItem.row
        var modalRow = $uibModal.open({
            templateUrl: 'modules/programs_ex/blocks/program_ex_modal_row.html',
            windowClass: 'cs-order-modal modal-default',
            animation: false,
            backdtop: "static",
            size: 'lg',
            scope: $scope,
            controller: function ($scope, $uibModalInstance, modalParams, AuthService) {
                $scope.uiInsert = modalParams.uiInsert;
                $scope.uiRow = {
                    formDisabled: modalParams.disabled
                };

                $scope.delete = function () {
                    $scope.deleteProgramRow(modalParams.dataItem);
                    $uibModalInstance.close();
                };

                $scope.apply = function () {
                    if ($scope.dform.$valid) {
                        $scope.DS.save($scope.colsParams.entity, $scope.uiInsert).then(function (ret) {
                            $scope.PDialog.success({ text: $translate.instant("Saved Successfully") }).then(function () {
                                $scope.reportDS.read();
                                $uibModalInstance.close(ret);
                            });
                        });
                    };
                };


                // notes  ----------------------------------------------------------------------------->
                $scope.newNote = {};
                $scope.addNote = function () {

                    var desc = $scope.newNote.text;
                    if (!desc || !desc.length) {
                        $scope.PDialog.info({ text: $translate.instant("Please enter note text!") });
                        return;
                    };

                    var newNote = angular.copy($scope.newNote);
                    newNote.by = AuthService.user.id;
                    newNote.createdBy = AuthService.user.name;
                    newNote.created = new Date();

                    var newNote = angular.copy(newNote);
                    var notes = $scope.uiInsert.notes;
                    if (!notes) $scope.uiInsert.notes = notes = [];
                    notes.push(newNote);

                    $scope.newNote = {};
                };

            },
            resolve: {
                modalParams: {
                    uiInsert: angular.copy(dataItem.data),
                    dataItem: angular.copy(dataItem),
                    disabled: dataItem.data.readonly || $scope.colsParams.readonly
                }
            }
        }).result.then(function (ret) { }).catch(function () { });
    };


}