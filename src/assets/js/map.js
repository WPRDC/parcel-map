/**
 * Created by SDS25 on 3/3/2017.
 */

// Generate Base Map
const mapUrl = 'https://wprdc.carto.com/api/v2/viz/75f76f2a-5e3a-11e6-bd76-0e3ff518bd15/viz.json';
const map = new L.Map('map', {
    center: [40.45, -79.9959],
    zoom: 13
});
//Define extra layer on which to apply selection highlights
const selectedLayer = L.geoJson().addTo(map); //add empty geojson layer for selections

// Set up basemap
const baseMap =  L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

const Stamen_TonerLabels = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
});

baseMap.addTo(map);

Stamen_TonerLabels.addTo(map);

// Add cartodb named map to map
cartodb.createLayer(map, mapUrl)
    .addTo(map)
    .on('done', function (layer) {
        let parcels = layer.getSubLayer(0);
        console.log(parcels.get('cartocss'));

        let parcelCSS = "#allegheny_county_parcel_boundaries{" +
            "polygon-fill: #FFFFFF;" +
            "polygon-opacity: 0.2;" +
            "line-color: #0e0e0e;" +
            "line-width: 0.5;" +
            "line-opacity: 0;" +
            "[zoom >= 15] {line-opacity: .8;}" +
            "}";

            parcels.setCartoCSS(parcelCSS)

        console.log(parcels);
        parcels.on('featureClick', processParcel);
    });

// When a parcel is clicked, highlight it
function processParcel(e, latlng, pos, data, layer) {
    console.log(data);
    selectedLayer.clearLayers();
    const sql = new cartodb.SQL({user: 'wprdc'});
    sql.execute("SELECT the_geom FROM allegheny_county_parcel_boundaries WHERE pin = '{{id}}'",
        {
            id: data.pin
        },
        {
            format: 'geoJSON'
        }
    ).done(function (data) {
        selectedLayer.addData(data);

    });
    displayParcelData(data.pin)
}

