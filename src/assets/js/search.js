/**
 * Created by SDS25 on 3/21/2017.
 */
/**
 * Address Search
 */
$('#search-button').on('click', function () {
    // TODO: validate entries
    let num = $('#num').val(),
        street = $('#street').val().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toUpperCase(),
        city = $('#city').val().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toUpperCase(),
        zip = $('#zip').val();
    console.log(num, street, city, zip);
    lookup_parsed_address(num, street, city, zip);
});



/**
 * Looks up address based on sperated address parts
 *
 * @param number - house number
 * @param street - street name
 * @param city - city name used in address (may vary from actual m
 * @param zip
 */
function lookup_parsed_address(number, street, city, zip) {
    if (!number) {
        number = "%";
    }
    if (!zip) {
        zip = "%";
    }

    let stmt = "SELECT \"PARID\", \"PROPERTYHOUSENUM\", \"PROPERTYADDRESS\", \"PROPERTYCITY\", \"PROPERTYZIP\" FROM \"518b583f-7cc8-4f60-94d0-174cc98310dc\" WHERE " +
        "\"PROPERTYHOUSENUM\" LIKE \'" + number + "\' AND " +
        "\"PROPERTYADDRESS\" LIKE \'" + street + "\' AND " +
        "\"PROPERTYCITY\" LIKE \'" + city + "\' AND " +
        "\"PROPERTYZIP\" LIKE \'" + zip + "\';";

    console.log("DOING STUFF");
    $.ajax({
        url: "https://data.wprdc.org/api/action/datastore_search_sql?",
        data: {sql: stmt},
        crossDomain: true,
        dataType: "jsonp"
    }).done(function (data) {
        // if results, then display them
        console.log(data);
        if (data.result.records.length) {
            display_search(data.result.records);
        }
        // if not, try a more general search
        else if (number.indexOf("%") < 0) {
            var new_num = ('' + number)[0] + "%";
            // console.log(new_num, street, city, zip);
            lookup_parsed_address(new_num, street, city, zip);
        }
        // a more general search failed, so quit with no results
        else {
            display_search(null);
        }
    }).fail(function () {
        console.log("fail");
        display_search(null);
    })
}

function display_search(results) {
    let $display = $("#search-results");
    let $section = $("#search-section");
    let $premsg = $('#search-premsg');
    let $msg = $('#search-msg');
    $display.empty();
    $msg.empty();
    $premsg.empty();
    // console.log(results);
    if (!results || !results.length) {
        $display.append("<p class='alert-minor'>No properties with that address found")
    }
    else if (results.length == 1) {
        processParcel(null, null, null, {pin: results[0]['PARID']}, null, true);
        $('#search-dropdown').foundation('close');
    }
    else {
        $premsg.append("<p class='alert-minor'>Exact match not found, is it one of these: </p>");
        $display.append(
            $("<tr/>").html(
                "<th>Parcel ID</th><th>Address</th>"
            )
        );
        for (let i = 0; i < results.length; i++) {

            let result = results[i];
            let address = result['PROPERTYHOUSENUM'] + " " + result['PROPERTYADDRESS'] + " " + result['PROPERTYCITY'] + ", PA " + result['PROPERTYZIP'];
            $display.append(
                $("<tr/>")
                    .addClass("search-result")
                    .html(
                        "<td class='search-pin' pin=" + result['PARID'] + ">" + result['PARID'] + "</td>" +
                        "<td class='search-addr'>" + address + "</td>"
                    )
            );
            // When there're too many results
            if (i == 10 && results.length > 15) {
                $msg.append(
                    $("<p/>").addClass("alert-minor").text("... and " + (results.length - 10) + " more results! Please refine your search.")
                );
                break;
            }
        }
        // console.log(results);
    }
}

$("#search-results").on("click", ".search-pin", function () {
    // console.log($(this).text());
    $("#search-results").empty();
    $("#search-premsg").empty();
    $("#search-msg").empty();
    processParcel(null, null, null, {pin: $(this).text()}, null, true);
});


$('#pin-search-button').on('click', function () {
    let searchString = $('#pin-search-box').val();
    mainSearch(searchString);
    $('#search-dropdown').foundation('close');
});

function mainSearch(searchString) {
    if (searchString.length != 16) {
        alert("Invalid PIN Format")
    }
    else {
        processParcel(null, null, null, {pin: searchString}, null, true);
    }
}