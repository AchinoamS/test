

app.controller('group_modal',
    function ($scope, MetaService, DataService, entity_service, $uibModalInstance, modalParams, $timeout, $http, $locale, $translate) {
        $scope.meta = MetaService;
        $scope.DS = DataService;
        $scope.params = modalParams;
        $scope.ES = entity_service;
        $scope.group = modalParams.group || {};
        $scope.isNew = !$scope.group.id;


        $scope.apply = function () {
            if ($scope.form.$valid) {
                DataService.save("groups", $scope.group).then(function (ret) {
                    $scope.PDialog.success({ text: $translate.instant("Group Saved Successfully") }).then(function () {
                        $uibModalInstance.close(ret);
                    });
                });
            }
        };

        $scope.close = function () {
            $uibModalInstance.close();
        }

        // ----------------------------------------------------------------------------->
        // tabs
        // ----------------------------------------------------------------------------->
        $scope.ui = {
            tabs: [
                { text: "Group Details & Users", icon: "fa-vcard-o", key: "D" },
                { text: "Portal Premissions", icon: "fa-vcard-o", key: "P" }
            ],
            tab: 'D'
        };

        $scope.setTab = function (sTab) {
            $scope.ui.tab = sTab;
            $scope.ui.submitAttempt = false;
        };
    });





// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// Group Details & Users
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

app.controller('group_modal_details',
    function ($scope, $translate, $uibModal, PDialog) {
        $scope.uiD = {
            formDisabled: false
        }
        if (!$scope.group.users) $scope.group.users = [];

        $scope.reportDS = new kendo.data.DataSource({
            transport: {
                read: function (options) {
                    $scope.uiD.selectedRow = null;
                    
                    //prepare users here ??
                    var users = [];
                    _.each($scope.group.users, function (userId) {
                        var userData = null;
                        userData = _.find($scope.meta.users, { id: userId });
                        if (userData) users.push(userData);
                    });
                    options.success(users);
                },
            },
            pageSize: 20
        });


        $scope.gridConfig = {
            selectable: true,
            sortable: true,
            resizable: true,
            reorderable: true,
            pageable: true,
            filterable: $scope.defColumnFilters,

            toolbar: [
                { 'name': 'new', template: '<button type="button" class="btn btn-default" ng-click="handleUserRow()"><i class="fa fa-fw fa-plus"></i>{{"Add" | translate}}</button>' },
                { 'name': 'delete', template: '<button type="button" class="btn btn-default" ng-click="deleteUserRow(uiD.selectedRow)" ng-disabled="!uiD.selectedRow"><i class="fa fa-fw fa-trash"></i>{{"Delete" | translate}}</button>' }
            ],

            dataBound: function (e) {
                window.setTimeout(function () {
                    $(window).trigger('resize');
                }, 400);

                var grid = this;

                grid.tbody.find("tr").dblclick(function (e) {
                    var dataItem = grid.dataItem(this);
                    $scope.handleUserRow(dataItem);
                });
            },

            height: 350,

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
                    field: "userType",
                    title: $translate.instant("User Type"),
                    width: 70,
                    values: $scope.meta.user_types
                }
            ] 
        };

        $scope.onRowSelect = function (dataItem) {
            $scope.uiD.selectedRow = dataItem;
        };


        $scope.deleteUserRow = function (dataItem) {
            PDialog.warning({
                text: $translate.instant("Are you sure you wish to delete this user?"),
                showCancelButton: true,
                confirmButtonText: $translate.instant("DELETE")
            }).then(function () {
                var index = $scope.group.users.indexOf(dataItem.id);
                $scope.group.users.splice(index, 1);
                $scope.saveGroupData();
            });
        };
        
        $scope.handleUserRow = function (dataItem) {

            //edit
            if (dataItem) {
                var index = $scope.group.users.indexOf(dataItem.id);
                var row = angular.copy($scope.group.users[index]);
            }

            var modalRow = $uibModal.open({
                templateUrl: 'modules/portalGroups/blocks/group_modal_details_modal_row.html',
                windowClass: 'cs-order-modal modal-default',
                animation: false,
                backdtop: "static",
                scope: $scope,
                controller: function ($scope, $uibModalInstance, modalParams, AuthService) {
                    $scope.user_data = modalParams.dataItem;
                    $scope.uiD = {
                        formDisabled: modalParams.disabled
                    };

                    $scope.apply = function () {
                        if ($scope.dform.$valid) {
                            $uibModalInstance.close($scope.user_data);
                        }
                    };
                },
                resolve: {
                    modalParams: {
                        dataItem: row || {},
                        disabled: $scope.uiD.formDisabled
                    }
                }
            }).result.then(function (ret) {
                //debugger;
                if (ret.id) {
                    var index = $scope.group.users.indexOf(ret.id);
                    if (index == -1) {
                        $scope.group.users.push(ret.id);
                    } else {
                        $scope.PDialog.error({ text: $translate.instant("Error, user exists in group") }).then(function (ret) { });
                        return;
                    }
                } /*else {
                    ret.id = ++$scope.uiD.rIndex;
                    $scope.group.users.push(ret.id);
                }*/
                $scope.saveGroupData();
                });

        };

        $scope.saveGroupData = function () {
            $scope.DS.save("groups", $scope.group).then(function (ret) {
                $scope.PDialog.success({ text: $translate.instant("Saved Successfully") }).then(function (ret) { });
                $scope.reportDS.read();
            });
        };
    });

// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->
// Portal Premissions
// --------------------------------------------------------------------------------------->
// --------------------------------------------------------------------------------------->

app.controller('group_modal_portal_premissions',
    function ($scope, $translate, $uibModal, PDialog) {
        $scope.uiP = {
            formDisabled: false
        }

        $scope.searchValue = "";

        
        $scope.treeViewOptions = {
            loadOnDemand: false,
            dataSource: 'inline',
            dataTextField: "name",
            expandAll: true,
            check: $scope.onCheck,
            checkboxes: true,
            checkboxes: {
                checkChildren: true
            },
            dataSource: {
                sort: { field: "name", dir: "asc" },
                data: $scope.meta.processTableToTree($scope.meta.portal_tree, null)
            }
        };
        

        $scope.on_tree_selected = function (node) {
            $scope.selectedNode = node;
        };

        //AHINAM SAMPLE

        
        $scope.treeData = new kendo.data.HierarchicalDataSource({
            //sort: { field: "index", dir: "asc" },
            transport: {
                read: function (options) {
                    $scope.ui.selectNode = null;
                    options.success($scope.set && $scope.set.tree || []);
                }
            },
            schema: {
                model: {
                    children: "items"
                }
            }
        });

        var treeData = $scope.treeData.data();
        var flatData = getFlatSet(treeData, true);

        function getFlatSet(ds, doIndex) {
            var index = -1;
            var arr = [];
            nodeToJson(ds, null);
            return arr;
            function nodeToJson(nodes, parent_id) {
                _.each(nodes, function (node) {
                    var cNode = getCleanTxtNode(node);//
                    cNode.parent_id = parent_id;
                    if (doIndex) cNode.index = ++index;
                    arr.push(cNode);
                    if (node.hasChildren) {
                        nodeToJson(node.items, node.id);
                    }
                })
            };
        }

        function getCleanTxtNode(treeNode) {
            var atts = ["id", "parent_id", "name", "display_name", "checked"];
            var ret = {};
            _.each(atts, function (att) {
                var v = treeNode[att];
                if (!_.isUndefined(v)) ret[att] = v;
            })
            return ret;
        }


         ///////////////////



        

        

        $scope.searchKeyUp = function (keyEvent) {
            filter($scope.treeView.dataSource, keyEvent.target.value.toLowerCase());
        };

        $scope.apply = function () {
            console.log($scope);
            /*
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
           */
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
        };

        
    });