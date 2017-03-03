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
L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CartoDB</a>'
}).addTo(map);


// Add cartodb named map to map
cartodb.createLayer(map, mapUrl)
    .addTo(map)
    .on('done', function (layer) {
        let parcels = layer.getSubLayer(0);
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

