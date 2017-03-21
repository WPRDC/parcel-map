$(document).foundation();


let currentPin = '0028F00194000000';
const defaultParcel = {pin: currentPin};


$(window).resize(function () {
    console.log('resize');
    $('#footer').height(50);
});

$(window).onload = processParcel(null, null, null, defaultParcel, null, true);


$('#top-search-button').on('click', function () {
    let searchString = $('#top-search').val();
    mainSearch(searchString);
});

function mainSearch(searchString) {
    if (searchString.length != 16) {
        alert("Invalid PIN Format")
    }
    else {
        processParcel(null, null, null, {pin: searchString}, null, true);
    }
}


