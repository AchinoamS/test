
(function () {
    var sweetDialog;
    sweetDialog = angular.module("sweetDialog", ['ng',"pascalprecht.translate"]);

    sweetDialog.factory('PDialog',
	    ['$window', '$q', '$translate', function ($window, $q, $translate) {

		    var swal = $window.swal;

		    var self = {
		        swal: function (_options) {

		            var options = $.extend({
		                confirmButtonText: $translate.instant("OK"),
                        cancelButtonText: $translate.instant("Cancel")
		            },_options);

			        var defer = $q.defer();
                    if (!options.title)options.title = "";
				    swal(options, function (isConfirm) {
					    if (!isConfirm) {
						    defer.reject();
					    } else {
						    defer.resolve();
					    }
				    });
				    return defer.promise;
			    },
			    success: function(options) {
				    options.type = 'success';
				    return self.swal(options);
			    },
			    error: function(options) {
				    options.type = 'error';
				    return self.swal(options);
			    },
			    warning: function(options) {
			        options.type = 'warning';
                    options.confirmButtonColor = "#DD6B55";
				    return self.swal(options);
			    },
			    info: function(options) {
				    options.type = 'info';
				    return self.swal(options);
			    }
		    };

		    return self;
	    }]);


}).call(this);

