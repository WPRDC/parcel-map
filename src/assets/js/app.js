$(document).foundation();
$(document).ready(function () {
    positionMapButtons();
})

let currentPin = '0028F00194000000';
const defaultParcel = {pin: currentPin};
const cartoAccount = "wprdc-editor";
let cartoData = {};

$(window).resize(function () {
    $('#footer').height("2.5rem");
});

$(window).onload = processParcel(null, null, null, defaultParcel, null, true);


// Close the dropdown when we click anything other than the dropdown
$(document).on('click', function (event) {
    // If we click outside of this element...

    if (!areElementsUnderEvent(event, [$('#search-dropdown'), $('#search-menu-button'), $('#search-tab-content'), $('.ui-autocomplete')])) {
        closeDropdown($('#search-dropdown'));
    }
    // if clicked outside of style-dropdown && clicked oustide of style-menu
    if (!areElementsUnderEvent(event, [$('#style-dropdown'), $('#style-menu-button'),$('.simplecolorpicker')])) {
        closeDropdown($('#style-dropdown'));
    }
    if (!areElementsUnderEvent(event, [$('#layer-dropdown'), $('#layer-menu-button')])) {
        closeDropdown($('#layer-dropdown'));
    }
});

$('.toggle-button').on('click', function(){
    if($(this).hasClass('toggle-on')){
        $(this).removeClass('toggle-on');
    } else {
        $(this).addClass('toggle-on');
    }
});


/**
 * Checks any elements in `elems` are under event
 *
 * @param {event} event - usualy mouse event like click
 * @param {array} elems - list of JQuery selectors
 * @returns {number}
 */
function areElementsUnderEvent(event, elems) {
    let result = 0;
    for (let i = 0; i < elems.length; i++) {
        result += $(event.target).closest(elems[i]).length;
    }
    return !!+result;
}


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


$('#rangeSlider').on('moved.zf.slider', function () {
    let v = $('#cutoffPoint').val();
    $('#rangeValue').text(v);
});


/**
 * Populate Map Style Controller with options
 */
$.getJSON('assets/data/map-data.json', function (data) {
    cartoData = data;
    let $datasetSelects = $('.style-dataset-select');
    let $fieldSelects = $('.style-field-select');
    let datasets = data['datasets'];
    let first = true;
    for (let i in datasets) {
        if (datasets.hasOwnProperty(i)) {
            let dataset = datasets[i];
            $datasetSelects.append(`<option value="${i}">${dataset['title']}</option>`)


            if (first && dataset.hasOwnProperty('fields')) {
                let fields = dataset['fields'];

                for (let j in fields) {
                    if (fields.hasOwnProperty(j)) {
                        let field = fields[j];
                        $fieldSelects.append(`<option value="${field['id']}"  data-type="${field['type']}" data-info="${field['info']}" >${field['name']}</option>`)
                    }
                }
                first = false;
            }
        }
    }
    setupRangeControl($('#rangeSlider'), $('.style-dataset-select').val(), $('.style-field-select').val())

});

/**
 * Configure Cut-Off controller based on field of interest
 *
 * @param {jQuery} $slider - selector of slider to be modified
 * @param {string} dataset - id of carto dataset containing field
 * @param {field} field - carto field name (column name)
 */
function setupRangeControl($slider, dataset, field) {
    let dataSetData = cartoData['datasets'][dataset];
    let table = dataSetData['cartoTable'];
    let account = dataSetData['cartoAccount'];
    let range = [];
    let valFn = '', valBase = 1;
    for (let i in dataSetData['fields']) {
        let fld = dataSetData['fields'][i];
        if (fld.id === field) {
            range = fld.range;
            if(fld.hasOwnProperty('valueFunction')){
                valFn = fld.valueFunction;
                valBase = 2;
                console.log(valFn, valBase)
            }
            if(fld.hasOwnProperty('base')){
                valBase = fld.base;
            }

        }
    }
    console.log(valFn, valBase);
    if (!range.length) {
        getCartoMinMax(field, table, account)
            .then(function (data) {
                console.log("___",valFn, valBase);

                console.log({
                    end: data.max,
                    start: data.min,
                    positionValueFunction: "log",
                    nonLinearBase: valBase,
                    initialStart: Math.floor((data.min + data.max) / 4),
                    initialEnd: Math.floor((data.min + data.max) * 3 / 4)
                });

                $slider = new Foundation.Slider($slider,
                    {
                        positionValueFunction: "log",
                        nonLinearBase: +valBase,
                        end: data.max,
                        start: data.min,
                        initialStart: Math.floor((data.min + data.max) / 4),
                        initialEnd: Math.floor((data.min + data.max) * 3 / 4)
                    })
            });
    }
    else {
        $slider = new Foundation.Slider($slider,
            {
                positionValueFunction: valFn,
                nonLinearBase: valBase,
                end: range[1],
                start: range[0],
                initialStart: Math.floor((range[0] + range[1]) / 4),
                initialEnd: Math.floor((range[0] + range[1]) * 3 / 4)
            })
    }
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

        if (typeof(field) === 'undefined')
            reject("no field provided");
        if (typeof(table) === 'undefined')
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


$('#style-button').on('click', function () {
    let styleType = $('#style-tabs').find('.is-active').data('style-type');
    let dataSet = cartoData['datasets'][$('.style-dataset-select').val()];
    let field = $('.style-field-select').val();
    let options = {};
    let styleLayer = {};
    switch (styleType) {
        case "range":
            let min = $('#rangeStart').val();
            let max = $('#rangeEnd').val();
            let color = $('select[name="colorpicker"]').val();

            options = {
                legends: true,
                css: `${dataSet.parcelID}{  polygon-fill: ${color};  polygon-opacity: 0.0;  line-color: #000; line-width: .5; [zoom < 15]{line-width: 0;}   line-opacity: 1;} ${dataSet.parcelID}[ ${field} <= ${max}] { polygon-opacity: 1;} ${dataSet.parcelID}[ ${field} < ${min}] { polygon-opacity: 0;} ${dataSet.parcelID}[ ${field} > ${max}] { polygon-opacity: 0;}`
            };
            console.log(options);
            styleLayer = new Layer(map, 'style_parcel', "", "MultiPolygon", cartoAccount, dataSet.mapId, options);
            layers.add(styleLayer);
            addCustomLegend(`${dataSet.title}: ${field}`, [{name: `${min} - ${max}`, value: color}]);
            break;
        case "category":

            break;

        case "choropleth":
            let bins = $('#bins').val();
            let quant = $('#quantification').val();
            let clr = $('#choropleth-color').val();
            let colors = choropleths[clr][bins];
            console.log(colors);
            options = {
                legends: true,
                css: `${dataSet.parcelID}{
                polygon-opacity: 1.0;  line-color: #000;  line-width: .5; [zoom < 15]{line-width: 0;}   line-opacity: 1;
                polygon-fill: ramp([${field}], ${colorsToString(colors)}, ${quant}(${bins}))
                }`
            };
            console.log(options);
            styleLayer = new Layer(map, 'style_parcel', "", "MultiPolygon", cartoAccount, dataSet.mapId, options);
            layers.add(styleLayer);

            getCartoMinMax(field, dataSet.cartoTable, dataSet.cartoAccount)
                .then(function (data) {
                    addChoroplethLegend(`${dataSet.title}: ${field}`, data.min, data.max, colors);
                });

            break;
    }
    closeDropdown($('#style-dropdown'));
});


function addChoroplethLegend(title, left, right, colors) {
    let $legends = $(".legends");
    let legend = new cdb.geo.ui.Legend.Choropleth({
        title: title,
        left: String(left), right: String(right), colors: colors
    });
    $legends.empty();
    $legends.append(legend.render().$el);
    $legends.find('.cartodb-legend').css('width', '320px');
}

function addCustomLegend(title, data) {
    let $legends = $(".legends");
    let customLegend = new cdb.geo.ui.Legend.Custom({
        title: title,
        data: data
    });
    $legends.empty();
    $legends.append(customLegend.render().$el);
    $legends.find('.cartodb-legend').css('width', '160px')
}

$(document).ready(function () {
    console.log('color picker');
    $('select[name="colorpicker"]').simplecolorpicker({picker: true});
});


function colorsToString(colors) {
    let result = '(';
    for (let i = 0; i < colors.length; i++) {
        result += colors[i];
        if (i < colors.length - 1) {
            result += ','
        }
    }
    result += ')';
    return result;
}

$('.dropdown-pane').on('click dblclick', function (e) {
    console.log('w00000t');
    e.stopPropagation();
});



function positionMapButtons() {
    let $map = $('#map');
    let $buttons = $('#map-buttons');
    let t = $map.position().top + 10;
    let l = $map.position().left + $map.width() - $buttons.width() - 10;
    $buttons.css({'top': t, 'left': l, 'position': 'absolute'});
    $buttons.show();
}

$('.dropdown-pane').on("show.zf.dropdownmenu", function (ev, $el){
    console.log('-------------' + $el.attr('class'));
})