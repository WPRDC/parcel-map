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
$slideButton.on('click', function(e){
    let on = toggleButton($(this));
    if(on){
        $slideButton.html('<i class="material-icons">chevron_left</i>');
        $('.off-canvas-absolute').foundation('open', e, this);
    } else {
        $slideButton.html('<i class="material-icons">chevron_right</i>');
        $('.off-canvas-absolute').foundation('close');
    }

    e.stopPropagation();
});

$slideButton.on('hover', function(e){
    e.stopPropagation();
});
