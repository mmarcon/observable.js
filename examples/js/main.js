(function($, OO){
    var APP = window.APP = {};
    APP.map = null;

    APP.conf = {
        flickrBaseURL: 'http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=7a6c65a1eb9553ef5f23c252282a9016&min_upload_date=1356886856&lat={LATITUDE}&lon={LONGITUDE}&extras=geo&format=json&per_page=500&nojsoncallback=1',
        foursquareBaseURL: 'https://api.foursquare.com/v2/venues/search?radius=1500&ll={LATITUDE},{LONGITUDE}&limit=50&client_id=ORIQ5J0OX5QKKIWXFGEEADVVKI0DUKHW10QV2LCKC4KYC3SU&client_secret=4VSNLFBMRRED1ISQF5FNC4RBDSXAJJL11ZMJZP4XUMTRS51G&v=20130126'
    };

    APP.Models = {};
    APP.observer = OO.Observer();
    APP.Views = {};

    var Intent = {
        timer: null,
        execute: function(fn){
            this.timer = setTimeout(fn, 200);
        },
        stop: function(){
            clearTimeout(this.timer);
        }
    };

    APP.Views.Flickr = function(){
        this.photo.forEach(function(photo){
            var photoURL = ['http://farm', photo.farm,
                            '.staticflickr.com/', photo.server,
                            '/', photo.id, '_',
                            photo.secret, '_q.jpg'].join('');
            APP.map.jHERE('marker', [photo.latitude, photo.longitude], {
                icon: './img/flickr.png',
                mouseover: function(){
                    Intent.execute(function(){
                        APP.map.jHERE('bubble', [photo.latitude, photo.longitude], {
                            content: $('<img src="' + photoURL + '" width="150" height="150">'),
                            closable: false
                        });
                    });
                },
                mouseout: function(){
                    Intent.stop();
                    APP.map.jHERE('nobubbles');
                },
                anchor: {x: 8, y: 16}
            });
        });
    };

    APP.Views.Foursquare = function(){
        this.venues.forEach(function(venue){
            var category = venue.categories[0],
                iconURL = (category && category.icon) ? [category.icon.prefix, '32', category.icon.suffix].join('') : null;
            if(iconURL) {
                APP.map.jHERE('marker', [venue.location.lat, venue.location.lng], {
                    icon: './img/foursquare.png',
                    mouseover: function(){
                        Intent.execute(function(){
                            APP.map.jHERE('bubble', [venue.location.lat, venue.location.lng], {
                                content: $('<div class="fsq-name" style="background-image:url(' + iconURL + ')">' + venue.name + '</div>'),
                                closable: false
                            });
                        });
                    },
                    mouseout: function(){
                        Intent.stop();
                        APP.map.jHERE('nobubbles');
                    },
                    anchor: {x: 8, y: 16}
                });
            }
        });
    };

    APP.locationFound = function(position){
        bind();
        APP.map = $('.map');
        APP.map.jHERE({center: position.coords, zoom: 14, type: 'smart', enable: ['behavior', 'zoombar', 'positioning']});
    };
    APP.locationNotFound = function(){};

    APP.flickr = function(){
        var props = APP.map.jHERE(), currentURL, model;
        if(!props.center) { return; }
        currentURL = APP.conf.flickrBaseURL.replace('{LATITUDE}', props.center.latitude).
                                            replace('{LONGITUDE}', props.center.longitude);
        if(!APP.Models.Flickr) {
            APP.Models.Flickr = OO.Model({
                model: {
                    photo: []
                },
                mapper: function(data){
                    return {
                        photo: data.photos.photo
                    };
                }
            });
            APP.observer.observe(APP.Models.Flickr, APP.Views.Flickr);
        }
        model = APP.Models.Flickr;
        model.source = currentURL;
    };

    APP.foursquare = function(){
        var props = APP.map.jHERE(), currentURL, model;
        if(!props.center) { return; }
        currentURL = APP.conf.foursquareBaseURL.replace('{LATITUDE}', props.center.latitude).
                                            replace('{LONGITUDE}', props.center.longitude);
        if(!APP.Models.Foursquare) {
            APP.Models.Foursquare = OO.Model({
                model: {
                    venues: []
                },
                mapper: function(data){
                    return {
                        venues: data.response.venues
                    };
                }
            });
            APP.observer.observe(APP.Models.Foursquare, APP.Views.Foursquare);
        }
        model = APP.Models.Foursquare;
        model.source = currentURL;
    };

    function bind(){
        $('nav li').on('click', function(){
            var fn = $(this).data('fn');
            console.log(fn);
            if($.isFunction(APP[fn])) {
                APP[fn].call();
            }
        });
    }

})(jQuery, OO);

$(window).on('load', function(){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(APP.locationFound, APP.locationNotFound);
    }
    else {
        APP.locationNotFound();
    }
});