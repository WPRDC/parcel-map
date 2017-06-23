/**
 * Created by sds25 on 6/21/17.
 */

// When selecting a dataset to style the map with
$('.style-dataset').on('change', function () {
    let dataset = $(this).val();
    let $fieldSelect = $(this).parent().find('.style-field');

    // populate the field selection dropdown
    $.getJSON('assets/data/styles/' + dataset + '.json', function (data) {
        for (let field in data.fields) {
            $fieldSelect.append(`<option value="${field}">${field}</option>`)
        }
        $fieldSelect.show();
        udateStyelControl($(this).parent());
    })
});


$('.style-field').on('change', function () {
    udateStyelControl($(this).parent());
});

function updateStyleControl($section) {
    field = $section.find('.style-field').val();

}


class StyleModule {
    constructor() {
        this.methods = []
    }


    renderMethodForm(){
        let methodOptions;
        for (let method in this.methods){
            methodOptions += `<option value="${method}">${method}></option>`
        }
        return `<select class="style-method">${methodOptions}</select>`
    }
}

class IntegerModule extends StyleModule {
    constructor() {
        super();
        this.methods += ['choropleth', 'category']
    }
}
