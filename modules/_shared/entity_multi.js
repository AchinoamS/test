


var SBLOCK_entity_multi = function ($scope, $translate) {

    $scope.UIARGS = {
        dateOpts: {
            _opens: 'near',
            locale: { format: 'MMM D, YY' },
            ranges: {
                'Last Day': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                "This Month": [moment().date(1), moment()],
                'Previous Month': [moment().date(0).date(1), moment().date(0)],
            }
        },
        boxed: false,
        maxFiltersWidth: null,
        enableExport: true,
        enablePDF: false,
        enableExcel: true,
        enableRefresh: true,
        enableMaximize: true,
        filtersTemplate: 'modules/_shared/entity_multi_filters_container.html',
        viewerType: 'grid',
        name: 'Missing Report Name',
        filterLoaded: false,
        filterDesign: {},
        filter: {}
    }

    $scope.initArgs = function (args) {
        $scope.UIARGS = _.extend($scope.UIARGS, args);
        window.setTimeout(function () {$(window).trigger('resize');}, 400);
    }

    $scope.validateCriteria = function (form) {
        var isValid = true;
        if (form.$valid) {

            var reff = $scope.UIARGS.filter;
            _.each($scope.UIARGS.filterDesign.rows, function (i, row) {
                _.each(row.filters, function (j, filter) {
                    if (filter.requiered) {
                        switch (filter.type) {
                            case "listMulti":
                                var t = reff[filter.field];
                                if (!t || !$.isArray(t) || !t.length) return toastError();
                                break;
                            default:
                                if (filter.field && !reff[filter.field]) return toastError();
                        }
                    }
                });
            });
            return isValid;
        }
        toastError();
        function toastError() {
            isValid = false;
            toastr.warning($translate.instant("Please fill in requiered fields"));
            return false;
        }
    }

    $scope.defColumnFilters = {
        extra: false,
        operators: {
            string: {
                contains: $translate.instant("Contains"),
                startswith: $translate.instant("Starts with"),
                eq: $translate.instant("Is equal to"),
                neq: $translate.instant("Is not equal to")
            }
        }
    };

    $scope.onFiltersLoaded = function () {
        $scope.UIARGS.filterLoaded = true;
        window.setTimeout(function () {
            $(window).trigger('resize');
        }, 400);

    }
    $scope.toggleExtraFilter = function () {
        $scope.UIARGS.showExtraFilters = !$scope.UIARGS.showExtraFilters;
        $scope.onFiltersLoaded();
    }
    $scope.doExport_Excel = function (targetGrid) {
        if (!targetGrid) targetGrid = "#reportGrid";
        $(targetGrid).getKendoGrid().saveAsExcel();
    };
    $scope.doExport_PDF = function (targetGrid) {
        if (!targetGrid) targetGrid = "#reportGrid";
        $(targetGrid).getKendoGrid().saveAsPDF();
    };
    $scope.onRowSelect = function (row) {
        $scope.UIARGS.selectedRow = row;
    };


}