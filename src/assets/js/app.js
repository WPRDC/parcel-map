$(document).foundation();


let currentPin = '0028F00194000000';
const defaultParcel = {pin: currentPin};


$(window).resize(function () {
    $('#footer').height("2.5rem");
});

$(window).onload = processParcel(null, null, null, defaultParcel, null, true);


// Close the dropdown when we click anything other than the dropdown
$(document).on('click', function (event) {
    // If we click outside of this element...
    if (!$(event.target).closest('#search-dropdown').length && !$(event.target).closest('#search-menu-button').length && !$(event.target).closest('#search-tab-content').length && !$(event.target).closest('.ui-autocomplete').length) {
        // ...then use Foundation to trigger the dropdown close
        closeSearch();
    }
});

let $slideButton = $('#slide-button');
$slideButton.on('click', function (e) {
    let on = toggleButton($(this));
    if (on) {
        $slideButton.html('<i class="material-icons">chevron_left</i>');
        $('.off-canvas-absolute').foundation('open', e, this);
    } else {
        $slideButton.html('<i class="material-icons">chevron_right</i>');
        $('.off-canvas-absolute').foundation('close');
    }

    e.stopPropagation();
});

$slideButton.on('hover', function (e) {
    e.stopPropagation();
});


$('#cutoffSlider').on('moved.zf.slider', function () {
    console.log('woot');
    let v = $('#cutoffPoint').val();
    $('#cutoffPointText').text(v);
});


let cartoData = {};
/**
 * Populate Map Style Controller with options
 */
$.getJSON('assets/data/map-data.json', function (data) {
    cartoData = data;
    let $datasetSelects = $('.style-dataset-select');
    let $fieldSelects = $('.style-field-select');
    let datasets = data['datasets'];

    for (let i in datasets) {
        if (datasets.hasOwnProperty(i)) {
            let dataset = datasets[i];
            $datasetSelects.append(`<option value="${i}">${dataset['title']}</option>`)


            if (dataset.hasOwnProperty('fields')) {
                let fields = dataset['fields'];

                for (let j in fields) {
                    if (fields.hasOwnProperty(j)) {
                        let field = fields[j]
                        $fieldSelects.append(`<option value="${j}"  data-type="${field['type']}" data-info="${field['info']}" >${field['name']}</option>`)
                    }
                }
            }
        }
    }
});

/**
 * Configure Cut-Off controller based on field of interest
 *
 * @param {$} $slider - selector of slider to be modified
 * @param {string} dataset - id of carto dataset containing field
 * @param {field} field - carto field name (column name)
 */
function setupCutoffControl($slider, dataset, field) {
    let table = cartoData['datasets'][dataset]['cartoTable'];
    let account = cartoData['datasets'][dataset]['cartoAccount'];
    getCartoMinMax(field, table, account)
        .then(function (data) {
            $slider.attr({
                "min": data.min,
                "max": data.max,
                "style": "width: 100%"
            });
            $slider.val(Math.floor((data.min+data.max)/2))
        });
}


/**
 * Get the minimum and maximum values for a field in a carto dataset.
 *
 * @param {string} field - column name in carto dataset from which we want min and max values
 * @param {string} table - carto dataset ID
 * @param {string} account - carto account
 * @returns {Promise}
 */
function getCartoMinMax(field, table, account) {
    let sql = `SELECT min(${field}), max(${field}) FROM ${table}`

    return new Promise((resolve, reject) => {

        if(typeof(field) === 'undefined')
            reject("no field provided");
        if(typeof(table) === 'undefined')
            reject('no table provided');

        getCartoQuery(sql, account)
            .then(function (data) {
                resolve(data['rows'][0])
            }, function (err) {
                reject(err)
            })
    });
}

/**
 * Get data from Carto's SQL API
 *
 * @param {string} sql - SQL query
 * @param {string} account - carto account that owns the data pertaining to the query in sql
 * @returns {Promise} - resolves: data, rejects: error
 */
function getCartoQuery(sql, account) {

    if (typeof(account) === 'undefined') {
        account = 'wprdc-editor';
        console.log('using default carto account: ' + account)
    }
    if (typeof(sql) === 'undefined') {
        reject('no query provided')
    }
    return new Promise((resolve, reject) => {
        $.getJSON(`https://${account}.carto.com/api/v2/sql?q=${sql}`)
            .done(function (data) {
                resolve(data);
            })
            .fail(function (err) {
                reject(err);
            })
    });
}
