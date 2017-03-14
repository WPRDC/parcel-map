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
        if(options){
            this.defaultOptions = JSON.parse(JSON.stringify(options));  // hack way to make a deep copy
        }
        this.z = null;
        this.layer = {}
    }

    addTo(map){
        let self = this;
        let mapUrl = `https://wprdc.carto.com/api/v2/viz/${this.cartodbID}/viz.json`;

        cartodb.createLayer(map, mapUrl)
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
            if (options.hasOwnProperty('featureClick')) {
                layer.on('featureClick', options.featureClick);
            }
            if (options.hasOwnProperty('featureOver')) {
                layer.on('featureOver', options.featureOver);
            }
        }
    }

    setZIndex(z){
        this.z = z;
        this.layer.setZIndex(z);
    }

    hide(){

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

    add(layer) {
        if (!this.contains(layer.name)) {
            this.layers.push(layer);
            layer.addTo(map);
        }
    }

    remove(layer) {
        if (typeof(layer) === 'string'){
            let l = this.getLayer(layerName);
        } else{
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

function mysize(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};



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

/*
 * ============================================================================
 * | CONSTANTS AND SETTINGS |
 * ============================================================================
 */

const cartoMaps = {
    parcel: "75f76f2a-5e3a-11e6-bd76-0e3ff518bd15",
    neighborhoods: "5c486850-1c99-11e6-ac7e-0ecd1babdde5",
    municipalities: "af19fee2-234f-11e6-b598-0e3ff518bd15"
};
// Carto SQL engine
const cartoSQL = new cartodb.SQL({user: 'wprdc'});

// Set up basemap
const baseMap = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
});

/*
 * ============================================================================
 * | MAP INITIALIZATION |
 * ============================================================================
 */

// Instantiate main leaflet Map
const map = new L.Map('map', {
    center: [40.45, -79.9959],
    zoom: 13
});


baseMap.addTo(map);


const layers = new LayerList(map);

// Main parcel layer for selection and so on
const parcelLayer = new Layer(map, "base_parcel", "Parcels", "MultiPolygon", cartoMaps.parcel,
    {
        locked: true,
        main_sublayer: 0,
        css: "#allegheny_county_parcel_boundaries{" +
        "polygon-fill: #FFFFFF;" +
        "polygon-opacity: 0.2;" +
        "line-color: #4d4d4d;" +
        "line-width: 0.5;" +
        "line-opacity: 0;" +
        "[zoom >= 15] {line-opacity: .8;}}",
        featureClick: processParcel
    });

layers.add(parcelLayer);

//Define extra layer on which to apply selection highlights
const selectedLayer = L.geoJson().addTo(map);


let hoodLayer = new Layer(map, "neighborhood", "Neighborhoods", "MultiPolygon", cartoMaps.neighborhoods);



