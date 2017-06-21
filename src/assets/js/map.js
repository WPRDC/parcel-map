/**
 * Created by SDS25 on 3/3/2017.
 */

/*
 * ============================================================================
 * | CLASSES AND FUNCTIONS |
 * ============================================================================
 */

class Layer {
    /**
     * Map Layer
     *
     * @param {string} name - identifier for layer
     * @param {string} title - human readable name of the layer to display on page
     * @param {string} type -
     * @param cartodbID
     * @param map
     * @param options
     */
    constructor(map, name, title, type, cartodbAccount, cartodbID, options) {
        this.name = name;
        this.title = title;
        this.geomType = type;
        this.account= cartodbAccount
        this.cartodbID = cartodbID;
        this.map = map;
        this.options = options;
        if (options) {
            this.defaultOptions = JSON.parse(JSON.stringify(options));  // hack way to make a deep copy
        }
        this.z = null;
        this.layer = {}
    }

    addTo(map) {
        let self = this;
        let mapUrl = `https://wprdc-maps.carto.com/u/${this.account}/api/v2/viz/${this.cartodbID}/viz.json`;

        cartodb.createLayer(map, mapUrl, {legends: true})
            .addTo(map)
            .on('done', function (layer) {
                self.layer = layer;
                if (typeof self.options !== 'undefined') {
                    console.log('modifying');
                    self.modify(self.options);
                }
            });
    }

    reset() {
        modify(this.defaultOptions)
    }

    modify(options) {
        this.options = options;
        let layer = this.layer;
        let shape;
        if (typeof(options) !== 'undefined') {
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
            if (options.hasOwnProperty('interactivity')) {
                shape.setInteractivity(options.interactivity);
            }
            if (options.hasOwnProperty('interaction')) {
                shape.setInteraction(options.ineraction);
            }
            if (options.hasOwnProperty('featureClick')) {
                layer.on('featureClick', options.featureClick);
            }
            if (options.hasOwnProperty('featureOver')) {
                layer.on('featureOver', options.featureOver);
            }
            if (options.hasOwnProperty('legends')){
                shape.set({'legends': true})
            }
        }
    }

    setZIndex(z) {
        this.z = z;
        this.layer.setZIndex(z);
    }

    hide() {

    }
}

class LayerList {
    constructor(map) {
        this.map = map;
        this.layers = []
    }

    getLayer(layerName) {
        for (let layer of this.layers) {
            if (layer.name === layerName) {
                return layer
            }
        }
        return undefined;
    }

    contains(layerName) {
        for (let layer of this.layers) {
            if (layer.name === layerName) {
                return true;
            }
        }
        return false
    }

    /**
     * Add layer to list and Map.
     * @param layer
     */
    add(layer) {

        if (!this.contains(layer.name)) {
            this.layers.push(layer);
            layer.addTo(map);
        } else {
            this.replace(layer.name, layer);
        }
    }

    remove(layer) {
        let l;
        if (typeof(layer) === 'string') {
            l = this.getLayer(layer);
        } else {
            l = layer
        }

        if (typeof(l) !== 'undefined') {
            this.map.removeLayer(l.layer);
            let i = this.layers.indexOf(l);
            this.layers.splice(i, 1);
            return true;
        }
        return false
    }

    replace(layerName, layer) {
        if (this.contains(layerName)) {
            this.remove(layerName);
            this.add(layer);
        }
    }
}


// When a parcel is clicked, highlight it
function processParcel(e, latlng, pos, data, layer, pan) {
    console.log("THE DATA", data);
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

/*
 * ============================================================================
 * | CONSTANTS AND SETTINGS |
 * ============================================================================
 */

const cartoMaps = {
    parcel: {
        "id": "75f76f2a-5e3a-11e6-bd76-0e3ff518bd15",
        "account": "wprdc",
        "type": "Multipolygon",
        "defaultTitle": "Parcels",
        "defaultOptions": {
            locked: true,
            main_sublayer: 0,
            legends: false,
            css: "#allegheny_county_parcel_boundaries{" +
            "polygon-fill: #FFFFFF;" +
            "polygon-opacity: 0.2;" +
            "line-color: #4d4d4d;" +
            "line-width: 0.5;" +
            "line-opacity: 0;" +
            "[zoom >= 15] {line-opacity: .8;}}",
            interactivity: 'cartodb_id, address, pin',
            featureClick: processParcel
        }
    },

    // Region boundaries
    pgh_hoods: {
        "id": "5c486850-1c99-11e6-ac7e-0ecd1babdde5",
        "account": "wprdc",
        "type": "Multipolygon",
        "defaultTitle": "Pittsburgh Neighborhoods",
        "defaultOptions": {
            'css': "#layer{polygon-fill: #FFFFFF; polygon-opacity: 0; line-width: 3; [zoom <13]{line-width: 2} line-color: #000000; line-opacity: 0.8;}",
            'interaction': false
        }
    },
    municipalities: {
        "id": "af19fee2-234f-11e6-b598-0e3ff518bd15",
        "account": "wprdc",
        "type": "Multipolygon",
        "defaultTitle": "Allegheny County Municipalities",
        "defaultOptions": {
            'css': "#layer{polygon-fill: #FFFFFF; polygon-opacity: 0; line-width: 3; [zoom <13]{line-width: 2} line-color: #000000; line-opacity: 0.8;}",
            'interaction': false
        }
    },

    // Parcel Styling Layers
    liens: {
        "id": "2ac98314-c5b9-4730-ae79-71c80dbd8790",
        "account": "wprdc-editor",
        "type": "Multipolygon",
        "defaultTitle": "Allegheny County Tax Liens",
        "defaultOptions": {
            'legends': true,
            'interaction': false
        },
    },
    sales: {
        "id": "5b2d4b7c-003a-11e7-b36e-0ee66e2c9693",
        "account": "wprdc",
        "type": "Multipolygon",
        "defaultTitle": "Allegheny County Real Estate Sales",
        "defaultOptions": {'interaction': false}
    },
    homestead: {
        "id": "0642c99a-1483-11e7-b428-0e3ff518bd15",
        "account": "wprdc",
        "type": "Multipolygon",
        "defaultTitle": "Allegheny County Real Estate Sales",
        "defaultOptions": {'interaction': false}
    },

    // Point Layers
    trees: {
        "id": "5333373d-d413-4459-93b7-e93186c799f4",
        "account": "wprdc",
        "type": "Point",
        "defaultTitle": "City Owned Trees",
        "defaultOptions": {'interaction': false}
    },
    intersections: {
        "id": "899611da-ff11-11e6-9875-0e3ff518bd15",
        "account": "wprdc",
        "type": "Point",
        "defaultTitle": "Signalized Intersections",
        "defaultOptions": {'interaction': false}
    },
    water_features: {
        "id": "8238b908-ff0f-11e6-af2d-0e3ebc282e83",
        "account": "wprdc",
        "type": "Point",
        "defaultTitle": "City Water Features",
        "defaultOptions": {'interaction': false}
    },
    pat_stops: {
        "id": "3e27bdae-ae88-11e6-8268-0e3ebc282e83",
        "account": "wprdc",
        "type": "Point",
        "defaultTitle": "Port Authority Transit Stops",
        "defaultOptions": {'interaction': false}
    }
};


const basemaps = {
    openStreetMap: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),
    openMapSurfer: L.tileLayer('http://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),
    positron: L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }),
    stamenToner: L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png'
    }),
    stamenWatercolor: L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 1,
        maxZoom: 16,
        ext: 'png'
    })
};


// Carto SQL engine
const cartoSQL = new cartodb.SQL({user: 'wprdc'});

// Set up basemap
let baseMap = basemaps.openMapSurfer;

// const baseMap = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
//     attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//     subdomains: 'abcd',
//     minZoom: 0,
//     maxZoom: 20,
//     ext: 'png'
// });

/*

 * ============================================================================
 * | MAP INITIALIZATION |
 * ============================================================================
 */

// Instantiate main leaflet Map
const map = new L.Map('map', {
    center: [40.45, -79.9959],
    zoom: 13,
    maxZoom: 18
});


baseMap.addTo(map);

// Instantiate LayerList
const layers = new LayerList(map);

// Main parcel layer for selection and so on
const parcelLayer = new Layer(map, "base_parcel", "Parcels", "MultiPolygon", cartoMaps.parcel.account, cartoMaps.parcel.id, cartoMaps.parcel.defaultOptions);


layers.add(parcelLayer);


//Define extra layer on which to apply selection highlights
const selectedLayer = L.geoJson().addTo(map);


$('.style-button').on('click', function () {
    let layerName = this.id.split('-')[1];
    let buttonOn = toggleButton($(this));
    layers.remove('style_parcel');
    if (buttonOn) {
        let styleLayer = new Layer(map, 'style_parcel', "", "MultiPolygon", cartoMaps[layerName].account, cartoMaps[layerName].id, cartoMaps[layerName].defaultOptions);
        layers.add(styleLayer);
    }

});

$('.style-select').on('change', function () {
    let layerType = this.id.split('-')[0];
    let layerName = $(this).val();
    layers.remove(layerType);
    if (layerName) {
        let styleLayer = new Layer(map, layerType, "", "MultiPolygon", cartoMaps[layerName].account, cartoMaps[layerName].id, cartoMaps[layerName].defaultOptions);
        layers.add(styleLayer);
    }
});

$('#basemap-select').on('change', function () {
    let newBaseMap = basemaps[$(this).val()];
    console.log($(this).val());
    newBaseMap.setZIndex(-1000);
    map.removeLayer(baseMap);
    baseMap = newBaseMap;
    baseMap.addTo(map, true);
});