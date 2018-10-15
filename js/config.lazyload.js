// lazyload config

angular.module('app')
  .constant('JQ_CONFIG', {
      slimScroll:     ['vendor/jquery/slimscroll/jquery.slimscroll.min.js'],
      filestyle:      ['vendor/jquery/file/bootstrap-filestyle.min.js'],
      TouchSpin:      ['vendor/jquery/spinner/jquery.bootstrap-touchspin.min.js',
                          'vendor/jquery/spinner/jquery.bootstrap-touchspin.css'],
      }
  )
    .constant('LAZY_LOAD_CONFIG', [
            {
                name: 'dndLists',
                module: true,
                files: [
                    'vendor/modules/angular-drag-and-drop-lists/angular-drag-and-drop-lists.min.js'
                ]
            }, {
                name: 'jkuri.gallery',
                module: true,
                files: [
                    'vendor/modules/ng-gallery/ngGallery.js',
                    'vendor/modules/ng-gallery/ngGallery.css'
                ]
            }, 
            {
                name: 'ui.map',
                module: true,
                files: [
                    'vendor/modules/angular-ui-map/load-google-maps.js',
                    'vendor/modules/angular-ui-map/ui-map.js'
                ]
            },
        ]
    )
    .config(['$ocLazyLoadProvider', 'LAZY_LOAD_CONFIG', function ($ocLazyLoadProvider, LAZY_LOAD_CONFIG) {
        $ocLazyLoadProvider.config({
            debug: false,
            events: false,
            modules: LAZY_LOAD_CONFIG
        });
    }]);
