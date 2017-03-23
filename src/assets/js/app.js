$(document).foundation();


let currentPin = '0028F00194000000';
const defaultParcel = {pin: currentPin};


$(window).resize(function () {
    console.log('resize');
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