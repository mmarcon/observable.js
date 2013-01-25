(function($, OO){
    var APP = window.APP = {};
    APP.map = null;

    APP.conf = {
        flickrBaseURL: 'http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=f5ef449218ed507a3e715e54216621a3&min_upload_date=1356886856&lat={LATITUDE}&lon={LONGITUDE}&extras=geo&format=json&per_page=500&nojsoncallback=1'
    };

    APP.Models = {};
    APP.observer = OO.Observer();
    APP.Views = {};

    APP.Views.flickr = function(){
        this.photo.forEach(function(photo){
            APP.map.jHERE('marker', [photo.latitude, photo.longitude], {
                icon: './img/flickr.png'
            });
        });
    };

    APP.locationFound = function(position){
        bind();
        APP.map = $('.map');
        APP.map.jHERE({center: position.coords, zoom: 14, type: 'smart', enable: ['behavior']})
               .jHERE('marker', position.coords, {
                    icon: './img/batman.png',
                    anchor: {x: 24, y: 48}
               });
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
            APP.observer.observe(APP.Models.Flickr, APP.Views.flickr);
        }
        model = APP.Models.Flickr;
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