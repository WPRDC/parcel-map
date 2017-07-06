/**
 * Created by sds25 on 6/21/17.
 */

// When selecting a dataset to style the map with
$('.style-dataset-select').on('change', function () {
    let datasetName = $(this).val();
    let $fieldSelect = $('.style-field-select');

    // populate the field selection dropdown
    $.getJSON('assets/data/map-data.json', function (data) {
        let dataset = data.datasets[datasetName];
        let fields = dataset['fields'];
        $fieldSelect.empty();
        for (let j in fields) {
            if (fields.hasOwnProperty(j)) {
                let field = fields[j];
                $fieldSelect.append(`<option value="${field['id']}"  data-type="${field['type']}" data-info="${field['info']}" >${field['name']}</option>`)
            }
        }
        setupRangeControl($('#rangeSlider'), $('.style-dataset-select').val(), $('.style-field-select').val());
    })
});


$('.style-field-select').on('change', function () {
    setupRangeControl($('#rangeSlider'), $('.style-dataset-select').val(), $('.style-field-select').val())
});


