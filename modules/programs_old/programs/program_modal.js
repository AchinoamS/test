

app.controller('program_modal',
    function ($scope, MetaService, DataService, entity_service, $uibModalInstance, modalParams, $timeout, $translate, PDialog, $uibModal) {
        $scope.meta = MetaService;
        $scope.DS = DataService;
        $scope.params = modalParams;
        $scope.ES = entity_service;

        $scope.ui = {
            loading: true,
            tab: 'G',
            "taskInsert": { status: "C" },

            locationEnts: [
                { key: "audiance_location_plan", name: "Audiance Location Plan" },
                { key: "audiance_location_actual", name: "Audiance Location Actual" },
                { key: "program_location_plan", name: "Program Location Plan" },
                { key: "program_location_actual", name: "Program Location Actual" }
            ],
            actvityEnts: [
                { key: "activity_types_plan", name: "Activity Types Plan" },
                { key: "activity_types_actual", name: "Activity Types Actual" }
            ],

            model: {
                active: true,
                audiance_location_plan: {},
                audiance_location_actual: {},
                program_location_plan: {},
                program_location_actual: {},
                activity_types_plan: {},
                activity_types_actual: {}
            },
            partnerInsert: {}
        };

        $scope.program = _.extend($scope.ui.model, modalParams.program);
        $scope.ui.formDisabled = $scope.program.readonly || modalParams.readonly;

        _.each($scope.program.statusReasons, function (stat) {
            stat.$$status = _.find(MetaService.taskStatus, { value: stat.status });
        });
		$scope.programOriginal = JSON.stringify($scope.program);
		
		$scope.close = function(){
			if($scope.programOriginal !== JSON.stringify($scope.program)){
				//console.log("something has changed");
				PDialog.warning({
					text: $translate.instant("Are you sure you want to exit?"),
					showCancelButton: true,
					confirmButtonText: $translate.instant("Yes")
				}).then(function (ret) {
					$uibModalInstance.close(ret);
				});	
			}
			else{
				$scope.$dismiss();
			}
		}

        $scope.apply = function () {
            var program = $scope.program;
            var wasError = false;
            if (!program.hierarchy) wasError = true;
            _.each($scope.ui.locationEnts, function (ent) {
                var model = program[ent.key];
                if (model.mandatory && model.mandatory != 'N') {
                    if (!_.get(model, 'countries[0]') &&
                        !_.get(model, 'cities[0]') &&
                        !_.get(model, 'locations[0]')) {
                        ent.error = true;
                        wasError = true;
                    } else {
                        delete ent.error;
                    }
                };
            });
            _.each($scope.ui.actvityEnts, function (ent) {
                var model = program[ent.key];
                if (model.mandatory && model.mandatory != 'N') {
                    if (!_.get(model, 'activity_types[0]')) {
                        ent.error = true;
                        wasError = true;
                    } else {
                        delete ent.error;
                    }
                };
            });
            if (wasError) return;

            if ($scope.dform.$valid) {

                DataService.save("programs", $scope.program).then(function (ret) {
                    $scope.PDialog.success({ text: $translate.instant("Saved Successfully") }).then(function () {
						$scope.program.id = ret.id;
						$scope.programOriginal = JSON.stringify($scope.program);
                        //$uibModalInstance.close(ret);
                    });
                });
            }
        };

        // ----------------------------------------------------------------------------->
        // tabs
        // ----------------------------------------------------------------------------->

        $scope.setTab = function (sTab) {
            $scope.ui.submitAttempt = true;
            if ($scope.dform.$valid) {
                switch ($scope.ui.tab) {
                    case "G":
                        //if (!$scope.SITE.location) { return; }
                        break;
                };
                $scope.ui.tab = sTab;
                $scope.ui.submitAttempt = false;
            }
        };


        // --------------------------------------------------------------------------------------->
        // partners
        // --------------------------------------------------------------------------------------->

        $scope.addPartner = function () {
            var partner = $scope.ui.partnerInsert;
            if (!partner.partner || !partner.value) return;
            if (!$scope.program.partners) $scope.program.partners = [];
            $scope.program.partners.push(partner);
            $scope.ui.partnerInsert = {};
        }
        $scope.deletePartner = function (index) {
            PDialog.warning({
                text: $translate.instant("Are you sure you wish to delete this record?"),
                showCancelButton: true,
                confirmButtonText: $translate.instant("DELETE")
            }).then(function () {
                $scope.program.partners.splice(index, 1);
            });
        }

        // --------------------------------------------------------------------------------------->
        // hierarchy
        // --------------------------------------------------------------------------------------->

        $scope.openHierarchyDialog = function () {
            var modalHier = $uibModal.open({
                templateUrl: 'modules/programs/hierarchy_modal.html',
                controller: 'program_modal_hierarchy',
                windowClass: "modal-flat",
                animation: false,
                size: 'sm',
                resolve: {
                    modalParams: {
                        member: {}
                    }
                }
            });

            modalHier.result.then(function (ret) {
                $scope.program.hierarchy = ret;
            }).catch(function () { });

        }
    });


app.controller('program_modal_hierarchy',
    function ($scope, MetaService, modalParams, $uibModalInstance) {
        $scope.meta = MetaService;

        $scope.apply = function () {
            var _node = $scope.selectedNode;
            if (!_node) return;

            var node = _.find(MetaService.programs_tree, { id: _node.id });
            var _node = node;
            var ret = {}
            var arr = [];
            do {
                if (_node) {
                    arr.push(_node.name);
                    switch (_node.level) {
                        case 0: ret.unit = _node.id; break;
                        case 1: ret.sub_unit = _node.id; break;
                        case 2: ret.subject = _node.id; break
                    }
                }
                var _node = _.find(MetaService.programs_tree, { id: _node.parentId });
            } while (_node);
            ret.name = arr.reverse().join(" > ");

            console.log(ret);
            $uibModalInstance.close(ret);

        };

        $scope.on_tree_selected = function (node) {
            $scope.selectedNode = node;
        }

        $scope.searchValue = "";
        $scope.treeViewOptions = {
            loadOnDemand: false,
            dataSource: 'inline',
            dataTextField: "name",
            expandAll: true,
            dataSource: {
                sort: { field: "name", dir: "asc" },
                data: MetaService.processTableToTree(MetaService.programs_tree, null)
            }
        }

        $scope.searchKeyUp = function (keyEvent) {
            filter($scope.treeView.dataSource, keyEvent.target.value.toLowerCase());
        };

        function filter(dataSource, query) {
            var hasVisibleChildren = false;
            var data = dataSource instanceof kendo.data.HierarchicalDataSource && dataSource.data();
            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                var text = item.name.toLowerCase();
                var itemVisible =
                    query === true // parent already matches
                    || query === "" // query is empty
                    || text.indexOf(query) >= 0; // item text matches query

                var anyVisibleChildren = filter(item.children, itemVisible || query); // pass true if parent matches
                hasVisibleChildren = hasVisibleChildren || anyVisibleChildren || itemVisible;
                item.hidden = !itemVisible && !anyVisibleChildren;
            }

            if (data) {
                // re-apply filter on children
                dataSource.filter({ field: "hidden", operator: "neq", value: true });
            }

            return hasVisibleChildren;
        }



    });