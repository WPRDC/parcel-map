$(document).foundation();

const defaultParcel = {pin: '0028F00194000000'};


$(window).resize(function(){
    console.log('resize');
    $('#footer').height(50);
});

$(window).onload = processParcel(null, null, null, defaultParcel, null);