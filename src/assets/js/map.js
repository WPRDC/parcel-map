/**
 * Created by SDS25 on 3/3/2017.
 */

// Generate Base Map
const maps = {
    parcel: {
        id: '75f76f2a-5e3a-11e6-bd76-0e3ff518bd15',
        options: {
            main_sublayer: 0,
            css: "#allegheny_county_parcel_boundaries{" +
            "polygon-fill: #FFFFFF;" +
            "polygon-opacity: 0.2;" +
            "line-color: #4d4d4d;" +
            "line-width: 0.5;" +
            "line-opacity: 0;" +
            "[zoom >= 15] {line-opacity: .8;}" +
            "}"
        }
    },
    neighborhoods: {
        id: '4c688fe6-f773-11e5-9fd3-0e3ff518bd15',
        options: {
            main_sublayer: 0,
            sql: 'SELECT *, (objectid % 5) as color_code FROM pittsburgh_neighborhoods',
            css: "#neighborhood{" +
            "polygon-fill: ramp([color_code], (#5BC0EB, #FDE74C, #9BC53D, #E55934, #FA7921), quantiles);" +
            "polygon-opacity: 0.3;" +
            "line-color: #5BC0EB;" +
            "line-width: 2;" +
            "line-opacity: 1;" +
            "}",
        }
    }
};


let layers = {};


const mapUrls = {
    parcel: 'https://wprdc.carto.com/api/v2/viz/75f76f2a-5e3a-11e6-bd76-0e3ff518bd15/viz.json',
    neighborhoods: 'https://wprdc.carto.com/api/v2/viz/4c688fe6-f773-11e5-9fd3-0e3ff518bd15/viz.json'
};

const map = new L.Map('map', {
    center: [40.45, -79.9959],
    zoom: 13
});
//Define extra layer on which to apply selection highlights
const selectedLayer = L.geoJson().addTo(map); //add empty geojson layer for selections

// Set up basemap
const baseMap = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
});


baseMap.addTo(map);

const cartoSQL = new cartodb.SQL({user: 'wprdc'});

// Add parcel layer
cartodb.createLayer(map, mapUrls.parcel)
    .addTo(map)
    .on('done', function (layer) {
        let parcels = layer.getSubLayer(0);

        let parcelCSS = "#allegheny_county_parcel_boundaries{" +
            "polygon-fill: #FFFFFF;" +
            "polygon-opacity: 0.2;" +
            "line-color: #4d4d4d;" +
            "line-width: 0.5;" +
            "line-opacity: 0;" +
            "[zoom >= 15] {line-opacity: .8;}" +
            "}";

        parcels.setCartoCSS(parcelCSS)
        parcels.on('featureClick', processParcel);
    });


/**
 * Create Carto Map as layer to `map`
 *
 * @param {Map}     map - a Leaflet Map object.
 * @param {String}  layerID - identifier used to keep track of layer
 * @param {String}  cartoMapId - string representation of UUID of Carto map to add as layer
 * @param {Object}  options - options for data and styling layer
 */
function addCustomLayer(map, layerID, cartoMapId, options) {
    if (layers.hasOwnProperty(layerID)) {
        modifyCartoLayer(layerID, options)
    } else {
        let mapUrl = `https://wprdc.carto.com/api/v2/viz/${cartoMapId}/viz.json`;
        cartodb.createLayer(map, mapUrl)
            .addTo(map, 0)
            .on('done', function (layer) {
                console.log(layer);
                layers[layerID] = layer;
                if (typeof options != 'undefined') {
                    modifyCartoLayer(layer, options);
                }
            });
    }
}

function modifyCustomLayer(layerID, options) {
    let layer = layers[layerID];
    modifyCartoLayer(layer, options);
}


function modifyCartoLayer(layer, options) {
    let shape;
    if (typeof(options) != 'undefined'){
        if (options.hasOwnProperty('main_sublayer')) {
            shape = layer.getSubLayer(options.main_sublayer);
        } else {
            shape = layer.getSubLayer(0);
        }
        if (options.hasOwnProperty('sql')) {
            shape.setSQL(options.sql);
        }
        if (options.hasOwnProperty('css')) {
            shape.setCartoCSS(options.css);
        }
    }
}

//let myLayer = addCustomLayer(map, maps.neighborhoods.id, maps.neighborhoods.options);

// When a parcel is clicked, highlight it
function processParcel(e, latlng, pos, data, layer, pan) {
    selectedLayer.clearLayers();
    cartoSQL.execute("SELECT the_geom FROM allegheny_county_parcel_boundaries WHERE pin = '{{id}}'",
        {
            id: data.pin
        },
        {
            format: 'geoJSON'
        }
    ).done(function (data) {
        selectedLayer.addData(data);

    });
    if (pan) {

    }
    displayParcelData(data.pin, pan)
}
