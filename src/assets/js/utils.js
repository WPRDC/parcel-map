/**
 * Created by Steve on 3/3/2017.
 */

function currency(value){
    return"$" + value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

function commafy(number) {
    while (/(\d+)(\d{3})/.test(number.toString())) {
        number = number.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
    }
    return number;
}


function isTabActive(tabId) {
    let classes = $(tabId).attr('class').split(' ');
    for (let i = 0; i < classes.length; i++){
        if (classes[i] == 'is-active') {
            return true
        }
    }
    return false
}