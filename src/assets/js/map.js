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
     * @param name
     * @param title
     * @param type
     * @param cartodbID
     * @param map
     * @param options
     */
    constructor(map, name, title, type, cartodbID, options) {
        this.name = name;
        this.title = title;
        this.type = type;
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
        let mapUrl = `https://wprdc.carto.com/api/v2/viz/${this.cartodbID}/viz.json`;

        cartodb.createLayer(map, mapUrl )
            .addTo(map)
            .on('done', function (layer) {
                self.layer = layer;
                if (typeof self.options != 'undefined') {
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
        if (typeof(options) != 'undefined') {
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
            if (options.hasOwnProperty('featureClick')) {
                layer.on('featureClick', options.featureClick);
            }
            if (options.hasOwnProperty('featureOver')) {
                layer.on('featureOver', options.featureOver);
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
            if (layer.name == layerName) {
                return layer
            }
        }
        return undefined;
    }

    contains(layerName) {
        for (let layer of this.layers) {
            if (layer.name == layerName) {
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
        }
    }

    remove(layer) {
        if (typeof(layer) === 'string') {
            let l = this.getLayer(layerName);
        } else {
            l = layer
        }

        if (typeof(l) != 'undefined') {
            this.map.removeLayer(l.layer);
            let i = this.layers.indexOf(l);
            this.layers.splice(i, 1);
            return true;
        }
        return false
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
    neighborhoods: {
        "id": "5c486850-1c99-11e6-ac7e-0ecd1babdde5",
        "type": "Multipolygon",
        "defaultTitle": "Pittsburgh Neighborhoods",
        "defaultOptions": {}
    },
    municipalities: {
        "id": "af19fee2-234f-11e6-b598-0e3ff518bd15",
        "type": "Multipolygon",
        "defaultTitle": "Allegheny County Municipalities",
        "defaultOptions": {}
    }
};
// Carto SQL engine
const cartoSQL = new cartodb.SQL({user: 'wprdc'});

// Set up basemap
const baseMap = L.tileLayer('http://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

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
const parcelLayer = new Layer(map, "base_parcel", "Parcels", "MultiPolygon", cartoMaps.parcel.id, cartoMaps.parcel.defaultOptions);


layers.add(parcelLayer);

//Define extra layer on which to apply selection highlights
const selectedLayer = L.geoJson().addTo(map);


$('#geo-submit').on('click', function () {
    let layerType = $('#geo-select').val();
    let mapID = cartoMaps[layerType]

    let tempLayer = new Layer(map, layerType, layerType, "Multipolygon", mapID)
    layers.add(tempLayer);
});


