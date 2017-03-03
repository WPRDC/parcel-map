$(document).foundation();

$(window).resize(function(){
    console.log('resize');
    $('#footer').height(500)
});