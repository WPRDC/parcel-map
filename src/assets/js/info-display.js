/**
 * Created by SDS25 on 3/3/2017.
 */

const parcelAPIUrl = "http://tools.wprdc.org/property-api/v1/parcels/";


// Tab Listeners
$('#assessment-tab').on('click', function () {
    if (lastVizPins.assessment != currentPin) {
        $.get(parcelAPIUrl + currentPin, function (data) {
            makeAssessment(data.results[0].data.assessments[0])
        })
    }
});
$('#sales-tab').on('click', function () {
    if (lastVizPins.sales != currentPin) {
        $.get(parcelAPIUrl + currentPin, function (data) {
            makeSalesModule(data.results[0].data.assessments[0], data.results[0].data.sales)
        })
    }
});

function displayParcelData(pin, pan) {
    currentPin = pin;

    let $loader = $('#address-container').find('.loader');
    $loader.show();
    $.get(parcelAPIUrl + pin, function (data) {
        if (pan) {
            let latlng = data.results[0].geos.centroid.coordinates.reverse();
            map.setView(latlng, 18)
        }

        const records = data.results[0].data;
        // Build modules
        makeHeading(records);
        makeFrontPage(data.results[0]);
        makeAssessment(records.assessments[0]);
        makeBasicInfo(records.assessments[0]);
        makeRegionsModule(records.centroids_and_geo_info[0]);
        makeCodeViolationsModule(records.pli_violations);
        makeSalesModule(records.assessments[0], records.sales);
        makeLiens(records.tax_liens[0]);

        $loader.hide();
    })
}

function makeLiens(data) {
    let $list = $('#lien-data');
    $list.empty();
    if (typeof(data) !== 'undefined') {
        $list.append("<li><span class='data-title'>Number of Liens:</span><span class='data-result'>" + data.number + "</span></li>");
        $list.append("<li><span class='data-title'>Total Amount:</span><span class='data-result'>" + currency(data.total_amount) + "</span></li>");
    } else {
        $list.append("<li><span class='alert-minor'>No liens were found for this property.</span>")
    }
}


function makeHeading(data) {
    $('#address').html(buildAddress(data.assessments[0]));
    $('#basic-info').html()
}

function makeFrontPage(data) {

    let $loader = $('#front-page').find('.loader');
    $loader.show();

    const $svImg = $('#sv-image');
    $svImg.attr('src', "");
    let records = data.data.assessments[0];
    const streetViewUrl = "https://maps.googleapis.com/maps/api/streetview";
    let centroid = data.geos.centroid.coordinates;
    const params = {
        key: "AIzaSyCcLG-dRLxiRB22U9cSv1jaP6XxoOn5aSY",
        location: records['PROPERTYHOUSENUM'] + " " + records['PROPERTYADDRESS'] + records['PROPERTYCITY'] + ", " + records['PROPERTYSTATE'] + " " + records['PROPERTYZIP'],
        size: "600x300"
    };

    let imgUrl = streetViewUrl + '?' + $.param(params);

    $.get(streetViewUrl + "/metadata?" + $.param(params))
        .done(function (data) {
            if (data.status == 'OK') {
                $loader.hide();
                $svImg.attr('src', imgUrl);
            } else if (data.status == "NOT_FOUND") {
                console.log('using lat/lng backup');
                params.location = centroid[1] + ',' + centroid[0];
                imgUrl = streetViewUrl + '?' + $.param(params);
                $loader.hide();
                $svImg.attr('src', imgUrl);
            }
        });

    let check = 0;
    let $bldg = $("#building");
    $bldg.empty();


    let fields = {
        "STYLEDESC": "Style",
        "STORIES": "Stories",
        "YEARBLT": "Year Built",
        "EXTFINISH_DESC": "Exertior Finish",
        "ROOFDESC": "Roof",
        "BASEMENTDESC": "Basement",
        "GRADEDESC": "Grade",
        "CONDITIONDESC": "Condition",
        "CDUDESC": "CDU"
    };

    for (let key in fields) {
        if (records[key]) {
            $bldg.append("<li><span class='data-title'>" + fields[key] + ": </span><span class='data-result'>" + records[key] + "</span></li>");
            check++;
        }
    }
    if (check === 0) {
        $bldg.append("<li class='alert-minor'>Dwelling characteritics are only available for residential parcels.</li>");
    }
}


function makeAssessment(data) {
    // Assessment values table
    $('#building-val').empty().append(currency(data['COUNTYBUILDING']));
    $('#land-val').empty().append(currency(data['COUNTYLAND']));
    $('#total-val').empty().append(currency(data['COUNTYTOTAL']));

    $('#building-val-local').empty().append(currency(data['LOCALBUILDING']));
    $('#land-val-local ').empty().append(currency(data['LOCALLAND']));
    $('#total-val-local').empty().append(currency(data['LOCALTOTAL']));

    $('#building-val-fair').empty().append(currency(data['FAIRMARKETBUILDING']));
    $('#land-val-fair ').empty().append(currency(data['FAIRMARKETLAND']));
    $('#total-val-fair').empty().append(currency(data['FAIRMARKETTOTAL']));

    // Reduction Flags
    let flagMatchings = {
        'HOMESTEADFLAG': '#homestead',
        'CLEANGREEN': '#cleangreen',
        'FARMSTEADFLAG': '#farmstead',
        'ABATEMENT': '#abatement'
    };

    for (let key in flagMatchings) {
        if (data[key]) {
            $(flagMatchings[key]).html('<i class="material-icons md-24 green">check</i>');
        } else {
            $(flagMatchings[key]).html('<i class="material-icons md-24 red">close</i>');
        }
    }

    // Comparison histogram
    if (isTabActive('#assessment-tab')) {
        makeAssmtDist(data['PROPERTYZIP'], data['COUNTYTOTAL'], '#asmt-chart')
    }

}

function makeBasicInfo(data) {
    let check = 0;
    const $info = $("#basic-info");
    const fields = {
        "OWNERDESC": "Owner Type",
        "CLASSDESC": "Use Class",
        "USEDESC": "Land Use",
        "LOTAREA": "Lot Size"
    };

    $info.empty();
    $info.append("<li><span class='data-title'>" + "Parcel ID" + ": </span><span class='data-result'>" + currentPin + "</span></li>");

    for (let key in fields) {
        if (fields.hasOwnProperty(key)) {
            if (key == "LOTAREA") {
                data[key] = commafy(data[key]) + "  ft<sup>2</sup>"
            }
            $info.append("<li><span class='data-title'>" + fields[key] + ": </span><span class='data-result'>" + data[key] + "</span></li>");
            check++;
        }
    }
    if (check === 0) {
        $info.append("<li class='alert-minor'>Looks like something went wrong!</li>");
    }
}

function makeCodeViolationsModule(data) {
    let $codeViolations = $('#code-violations'),
        violations = {};

    const fields = {
        "CASE_NUMBER": "Case No",
        "INSPECTION_RESULT": "Inspection result",
        "VIOLATION": "Violation",
        "LOCATION": "Location on Property"
    };

    $codeViolations.empty();


    if (data.length === 0) {
        $codeViolations.append("<p class='alert-minor'>No Violations found for this property.</p>");
    }
    else {
        for (let i = 0; i < data.length; i++) {
            let record = data[i];
            if (!(record['CASE_NUMBER'] in violations)) {
                violations[record['CASE_NUMBER']] = []
            }

            let obj = {};
            for (let field in fields) {
                obj[field] = record[field]
            }
            violations[record['CASE_NUMBER']].push(obj)
        }


        for (let caseNo in violations) {
            if (violations.hasOwnProperty(caseNo)) {
                $codeViolations.append("<h5> Case #: " + caseNo + "</h5>");
                for (let k = 0; k < violations[caseNo].length; k++) {
                    let $newList = $("<ul class='data-list' id='" + caseNo + "-" + k + "'></ul>");
                    $codeViolations.append($newList);
                    for (let key in fields) {
                        if (key != 'CASE_NUMBER') {
                            $newList.append("<li><span class='data-title'>" + fields[key] + ": </span><span class='data-result'>" + violations[caseNo][k][key] + "</span></li>")

                        }
                    }
                }

            }
        }
    }
}

/**
 * Builds address from assessment data
 *
 * @param data - assessment data object
 */
function buildAddress(data) {
    return '<p>' + data['PROPERTYHOUSENUM'] + " " + data['PROPERTYADDRESS'] + " </p><p>"
        + data['PROPERTYCITY'] + ", " + data['PROPERTYSTATE'] + " " + data['PROPERTYZIP'] + "</p>";
}


function makeRegionsModule(data) {
    if (data['geo_name_nhood'] == "" || data['geo_name_nhood'] == " ") {
        data['geo_name_nhood'] = "N/A"
    }

    const fields = {
        "geo_name_cousub": "Municipality",
        "geo_name_schooldist": "School District",
        "geo_name_nhood": "Pittsburgh Neighborhood",
        "geo_id_tract": "2010 Census Tract Number",
        "geo_name_blockgp": "2010 Census Blockgroup Number",
        "geo_name_HousePA": "State House District",
        "geo_name_SenatePA": "State Senate District",
        "geo_name_countycouncil": "Allegheny County Council District"
    };

    $("#zones").empty();
    for (let key in fields) {
        if (data[key]) {
            if (key == "geo_name_blockgp") {
                data[key] = data['geo_name_blockgp'].split(' ').slice(-1)[0];
            }
            if (key == "MAPBLOCKLO") {
                $("#mapblocklo").empty().append(records[key])
            } else {
                $("#zones").append("<p class='small-margin'><span class='data-title'>" + fields[key] + ": </span><span class='data-result'>" + data[key] + "</span></p>");
            }
        }
    }
}


function makeSalesModule(asmtData, salesData) {
    let $salesTable = $('#sales-table');
    let $newSales = $('#new-sales');
    $salesTable.empty();
    $newSales.empty();
    let salesTableData = [];

    if (asmtData["PREVSALEDATE2"]) {
        salesTableData.push({'d': asmtData["PREVSALEDATE2"], 'p': asmtData["PREVSALEPRICE2"]});
    }
    if (asmtData["PREVSALEDATE"]) {
        salesTableData.push({'d': asmtData["PREVSALEDATE"], 'p': asmtData["PREVSALEPRICE"]});
    }
    if (asmtData["SALEDATE"]) {
        salesTableData.push({'d': asmtData["SALEDATE"], 'p': asmtData["SALEPRICE"]});
    }

    $salesTable.empty();
    // If there are records, create the table
    if (salesTableData.length) {
        $salesTable.append('<table class="responsive"></table>');
        $salesTable.find('table').append('<thead><tr><th>Sale Date</th><th>Price</th></tr></thead><tbody></tbody>');
        for (let i = 0; i < salesTableData.length; i++) {
            let record = salesTableData[i];
            // var saledate = moment(record['SALEDATE']);
            $salesTable.find('tbody').append('<tr>' + '<td>' + record['d'] + '</td>' + '<td> $' + commafy(record['p']) + '</td>' + '</tr>');
        }
    } else {
        $('#sales-table').append("<p class='alert-minor'>There are no recent sales records for this property.</p>");
    }

    if (isTabActive('#sales-tab')) {
        makeSalesChart(salesTableData);
    }
    $newSales.append("<h3>Recent Sales</h3>");
    if(salesData.length){

        for (let idx= 0; idx < salesData.length; idx++) {
            let datum = salesData[idx];
            $newSales.append("<h5>" + datum['SALEDATE'] + "</h5>");
            $newSales.append("<ul class='data-list' id='sale"+idx+"'></ul>");
            $newSales.find("#sale"+idx).append("<li><span class='data-title'>Price: </span><span class='data-result'>" + datum['PRICE'] + "</span></li>");
            $newSales.find("#sale"+idx).append("<li><span class='data-title'>Sale Code: </span><span class='data-result'>" + datum['SALECODE'] + "(" + datum['SALEDESC'] + ")</span></li>")
        }
    } else {
        $newSales.append("<p class='alert-minor'>There are no recent (post 2012) sales for this property.</p>")
    }

}
