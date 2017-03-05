/**
 * Created by SDS25 on 3/3/2017.
 */

const parcelAPIUrl = "http://tools.wprdc.org/property-api/parcel/";


function displayParcelData(pin) {
    console.log(pin);
    $.get(parcelAPIUrl + pin, function (data) {
        const records = data.data;
        // Build modules
        makeHeading(records);
        makeAssessment(records.assessments);
        makeBasicInfo(records.assessments);
        makeFrontPage(data);
    })
}


function makeHeading(data) {
    console.log('2', data);

    $('#address').html(buildAddress(data.assessments))
    $('#basic-info').html()
}

function makeFrontPage(data) {
    const $svImg = $('#sv-image');
    $svImg.attr('src', "");
    let records = data.data.assessments;
    const streetViewUrl = "https://maps.googleapis.com/maps/api/streetview";
    let centroid = data.geo.centroid.coordinates;
    const params = {
        key: "AIzaSyCcLG-dRLxiRB22U9cSv1jaP6XxoOn5aSY",
        location: records['PROPERTYHOUSENUM'] + " " + records['PROPERTYADDRESS'] + records['PROPERTYCITY'] + ", " + records['PROPERTYSTATE'] + " " + records['PROPERTYZIP'],
        size: "600x300"
    };

    let imgUrl = streetViewUrl + '?' + $.param(params);
    $.get(streetViewUrl + "/metadata?" + $.param(params))
        .done(function (data) {
            if (data.status == 'OK' && records['PROPERTYHOUSENUM'].charAt(0) != '0') {
                $svImg.attr('src', imgUrl);
            } else if (data.status == "NOT_FOUND") {
                console.log('using lat/lng backup');
                params.location = centroid[1] + ',' + centroid[0];
                imgUrl = streetViewUrl + '?' + $.param(params);
                $svImg.attr('src', imgUrl);
            }
        })

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
    makeAssmtDist(data['PROPERTYZIP'], data['COUNTYTOTAL'], '#asmt-chart')


}

function makeBasicInfo(data) {
    let check = 0;
    const $info = $("#basic-info");
    const fields = {
        "PARID": "PIN",
        "OWNERDESC": "Owner Type",
        "CLASSDESC": "Use Class",
        "USEDESC": "Land Use",
        "LOTAREA": "Lot Size"
    };

    $info.empty();
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
};

/**
 * Builds address from assessment data
 *
 * @param data - assessment data object
 */
function buildAddress(data) {
    return '<p>' + data['PROPERTYHOUSENUM'] + " " + data['PROPERTYADDRESS'] + " </p><p>"
        + data['PROPERTYCITY'] + ", " + data['PROPERTYSTATE'] + " " + data['PROPERTYZIP'] + "</p>";
}

