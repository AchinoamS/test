

app.controller('app_simple_entity',
    function ($scope, $q, $uibModal, $translate, MetaService, DataService, entity_service, args) {
        SBLOCK_entity_multi($scope, $translate);
        entityName = args.entityName;
        entityType = args.entityType;
        var isReadOnly = MetaService.ro_entities[entityType];

        var params = {
            fields: {
				id: {editable: false},
				defaultPlan: {editable: false},
				defaultActual: {editable: false},
                name: { validation: { required: true } },
                name_eng: { validation: { required: true } },
            },
            columns: [
				{
                    field: "name",
                    title: $translate.instant("Name"),
                    //width: 250,
                }, {
                    field: "name_eng",
                    title: $translate.instant("English Name"),
                    //width: 250,
                }, {
                    field: "id",
                    title: $translate.instant("ID"),
                    //width: 250,
                }
            ],
            commands: {
                command: ["edit"/*, {
                    text: $translate.instant("Delete"),
                    className: "btn-destroy",
                    click: function (e) {
                        e.preventDefault();
                        var data = this.dataItem($(e.currentTarget).closest("tr"));
                        DataService.delete(entityType, data, { confirm: true }).then(function (ret) {
                            $scope.reportDS.pushDestroy(data);
                        }).catch();
                    }
                }*/],
                title: ""
            }
        };
        switch (entityType) {
            case "referants":
                params.fields.nt_name = { validation: { required: true } };
                params.columns.push({ field: "nt_name", title: $translate.instant("English Name"), width: 150, });
                break;
			case "work_periods":
                params.columns.push({ 
					field: "defaultPlan", 
					title: $translate.instant("Plan Default"), 
					//width: 150,
					template: '<div ng-if="dataItem.defaultPlan" class="text-success text-center"><i class="fa fa-check"></i></div><div ng-if="!dataItem.defaultPlan" class="text-danger text-center"><i class="fa fa-times"></i></div>'
				});
				params.columns.push({ 
					field: "defaultActual", 
					title: $translate.instant("Actual Default"), 
					//width: 150,
					template: '<div ng-if="dataItem.defaultActual" class="text-success text-center"><i class="fa fa-check"></i></div><div ng-if="!dataItem.defaultActual" class="text-danger text-center"><i class="fa fa-times"></i></div>'
				});
                break;
			
        }
        if (isReadOnly){
            params.columns.push({});
        }else{
            params.columns.push(params.commands);
        };
        


        $scope.initArgs({
            name: $translate.instant(entityName),
        });

        $scope.reportDS = new kendo.data.DataSource({
            transport: {
                read: function (options) {
                    $scope.UIARGS.selectedRow = null;
                    DataService.get(entityType, null).then(function (ret) {
                        options.success(ret);
                    });
                },
                update: function (e) {
                    if (isReadOnly) return;
                    var data = e.data;
                    DataService.save(entityType, data).then(function (ret) {
                        e.success(data);
                        $scope.PDialog.success({ 
							text: $translate.instant("Updated Successfully") 
						}).then(function(){
							$scope.reportDS.read();
						});
                    }).catch(function (error) {
                        console.error('update failed');
                        e.error(error, 123, 'update failed');
                    });
                },
                create: function (e) {
                    if (isReadOnly) return;
                    var data = _.extend({}, e.data, { id: null });
                    DataService.save(entityType, data).then(function (ret) {
                        e.success(data);
                        $scope.PDialog.success({ 
							text: $translate.instant("Save Successfully") 
						}).then(function() {
							$scope.reportDS.read();
						});
                    }).catch(function (error) {
                        console.error('save failed', error);
                        e.error(error, 123, 'save failed');
                    });

                },
            },
            schema: {
                model: {
                    id: "id",
                    fields: params.fields
                }
            },
            pageSize: 100
        });

        $scope.gridConfig = {
            toolbar: !isReadOnly && ["create"],
            selectable: true,
            sortable: true,
            resizable: true,
            reorderable: true,
            pageable: true,
            filterable: _.extend({ mode: "row" }, $scope.defColumnFilters),
            editable: !isReadOnly && {
                mode: "popup",
                window: {
                    title: $translate.instant(entityName),
                }
            },
            columns: params.columns
        };


        $scope.deleteDI = function (dataItem) {
            if (!dataItem) return;
            DataService.delete(entityType, dataItem, { confirm: true }).then(function (ret) {
                $scope.reportDS.pushDestroy(dataItem);
            }).catch();
        };
        $scope.addEditDI = function (dataItem) {
            entity_service.addEditDI(dataItem && dataItem.id).then(function () {
                $scope.reportDS.read();
            }).catch(function () { });
        };


    });
