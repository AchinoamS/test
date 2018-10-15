

var _UITILS = {
    UIreflowCharts: function () {
        try {
            $(Highcharts.charts).each(function (i, chart) {
                chart.reflow();
            });
        }catch(e){}
    },
    parseFilters: function (o, parseArrays) {
        var dr = o.dateRange;
        if (dr) {
            o.DateRange = {
                startDate: this.parseServerDate(dr.startDate),
                endDate: this.parseServerDate(dr.endDate)
            };
        }
        if (parseArrays) {
            o = $.extend({}, o);
            $.each(o, function (key, value) {
                if ($.isArray(value)) {
                    o[key] = value.join(",");
                };
                if (value == "") delete o[key];
            });
            //alert(JSON.stringify(o))
            return o;
        }
    },
    parseServerDate: function (d) {
        return moment(d).format('YYYY-MM-DDTHH:mm:ss');
    },

    prepareEntList: function (data,concat) {
        if (!$.isArray(data)) data = [];
        $.each(data, function (i, o) {
            if (!o.value) o.value = o.Id;
            if (!o.text) o.text = o.Name;
            if (concat){
                o.text = o.Id + " - " + o.Name;
                o.Name = o.text;
            }
        });
        return data;
    },


    kendoROEditor: function (container, options) {
        $('<input class="form-control border-box" readonly data-bind="value:' + options.field + '"/>').appendTo(container);
    },
    kendoNULLEditor: function (container, options) {
        $('<input class="form-control border-box" readonly data-bind="value:' + options.field + '"/>').appendTo(container);
    },
    kendoTAEditor: function (container, options) {
        var $h = $('<textarea class="form-control" rows="3" style="width:90%" data-bind="value: ' + options.field + '"></textarea>');
        if (options.model.required){
            //$h.attr("required", true);
        };
        $h.appendTo(container);
    },
    
    kendoIntegerEditor: function (container, options) {
    $('<input data-bind="value:' + options.field + '"/>')
        .appendTo(container)
        .kendoNumericTextBox({
            min: 0,
            decimals: 0,
            format: "n0"
        });
    },
    kendoNumericEditor: function (container, options) {
        $('<input data-bind="value:' + options.field + '"/>')
            .appendTo(container)
            .kendoNumericTextBox({
                min: options.model.ValMin,
                max: options.model.ValMax,
                decimals: 0,
                
            });
    },

    generate_singleSeries : function(chart, arr) {
        chart.loading = false;
        var cats = [];
        var vals = [];
        var total = 0;
        var colors = [];
        if (jQuery.isArray(arr)) {
            $.each(arr, function (i, o) {
                cats.push(o.name);
                var t = { y: o.value, name: o.name };
                if (!isNaN(o.value)) total += o.value;
                var c = o.color;
                if (c) t.color = c;
                vals.push(t);
            });
        }
        try {
            chart.options.yAxis.plotLines[0].value = total / vals.length;
        } catch (e) { }
        var chk = chart.options
        chart.options.xAxis.categories = cats;
        chart.series[0].data = vals;
    },
    generate_multiSeries : function(chart, arr) {
        chart.loading = false;
        var cats = [];
        var colors = [];
        var oSeries = {};
        var series = [];

        if (jQuery.isArray(arr)) {
            $.each(arr, function (i, o) {
                var s = o.series;
                var _s = oSeries[s];
                if (!_s) {
                    _s = oSeries[s] = {
                        name: s,
                        data: []
                    }
                }
                if (cats.indexOf(o.name) === -1) {
                    cats.push(o.name);
                }
                var t = { y: o.value };
                var c = o.color;
                if (c) t.color = c;
                _s.data.push(t);
            });
            $.each(oSeries, function (key, value) {
                series.push(value);
            });

        }
        chart.options.xAxis.categories = cats;
        chart.series = series;
    },
    triggerResize: function () {
        $(window).trigger("resize");
    },
    triggerResizeDelayed: function (delay) {
        window.setTimeout(function () {
            $(window).trigger("resize");
        }, delay || 800);
    }
};


$(function () {
    if (window.Highcharts) {
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
    };
    window.resizeGrid = function (gridElement) {
        gridElement.css("visibility", "visible");
        var oHeight = gridElement.parent().height();
        var dataArea = gridElement.find(".k-grid-content"),
            gridHeight = gridElement.innerHeight(),
            otherElements = gridElement.children().not(".k-grid-content"),
            otherElementsHeight = 0;


        otherElements.each(function () {
            otherElementsHeight += $(this).outerHeight();
        });
        dataArea.height(oHeight - otherElementsHeight);
    };


    $(window).resize(function () {
        $(".panel-max-container.active ._maxed").each(function () {
            var $this = $(this);
            $this.height($(window).height() - $this.parent().offset().top - 60);
        });
        $(".report-max-container ._maxed").each(function () {
            var $this = $(this);
            $this.height($(window).height() - $this.parent().offset().top - 0);
        });
        $(".grid-wrapper.full-height .k-grid").each(function () { resizeGrid($(this)); });
    });
});