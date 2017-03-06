/**
 *
 */
let lastVizPins = {assessment: "", sales: ""};

let svgWidth = $('#info-container').width() - parseInt($('.tabs-panel').css('padding-left'), 10) * 2;
console.log('svgWidth', svgWidth);


function makeAssmtDist(zip, asmtVal, svgSelector) {
    $(svgSelector).empty();
    // console.log("THE ZIP", zip);
    const qry = "SELECT \"COUNTYTOTAL\" FROM \"518b583f-7cc8-4f60-94d0-174cc98310dc\" WHERE \"PROPERTYZIP\" = '" + zip + "' AND \"USEDESC\" = 'SINGLE FAMILY' AND  \"COUNTYBUILDING\" <> 0";
    let data = [];
    $.ajax({
        url: "https://data.wprdc.org/api/action/datastore_search_sql?",
        data: {sql: qry},
        crossDomain: true,
        dataType: "jsonp"
    })
        .done(function (d) {
            for (let i = 0; i < d.result.records.length; i++) {
                let item = d.result.records[i];
                data.push(item.COUNTYTOTAL)
            }

            $("#asmt-dist").empty();
            let mean = d3.mean(data),
                sd = d3.deviation(data),
                maxVal = mean + (2 * sd),
                minVal = Math.max(0, mean - (2 * sd));

            if (asmtVal > maxVal) {

            }

            let svg = d3.select(svgSelector),
                margin = {top: 10, right: 3, bottom: 30, left: 3},
                width = svgWidth - 5,
                height = parseInt(svg.style('height'), 10) - margin.top - margin.bottom,
                g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            let x = d3.scaleLinear()
                .rangeRound([0, width])
                .domain([minVal, maxVal]);


            let bins = d3.histogram()
                .domain(x.domain())
                .thresholds(x.ticks(22))
                (data);

            let y = d3.scaleLinear()
                .domain([0, d3.max(bins, function (d) {
                    return d.length;
                })])
                .range([height, 0]);

            let bar = g.selectAll(".bar")
                .data(bins)
                .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function (d) {
                    return "translate(" + x(d.x0) + "," + y(d.length) + ")";
                });

            bar.append("rect")
                .attr("x", 1)
                .style("fill", function (d) {
                })
                .attr("class", function (d) {
                    if (asmtVal > d.x0 && asmtVal < d.x1) {
                        return "hi";
                    }
                })
                .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
                .attr("height", function (d) {
                    return height - y(d.length);
                });

            bar.append("text")
                .attr("dy", ".75em")
                .attr("y", 6)
                .attr("x", (x(bins[0].x1) - x(bins[0].x0)) / 2)
                .attr("text-anchor", "middle");

            g.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));
        })
        .fail(function () {
            alert('it failed')
        });
    lastVizPins.assessment = currentPin;
}

function makeSalesChart(data) {
    $('#sales-chart').empty()
    console.log("salesChart", data);

    if (data.length <= 1) {
        return
    }

    let svg = d3.select("#sales-chart"),
        margin = {top: 20, right: 5, bottom: 30, left: 50},
        width = svgWidth - margin.left - margin.right - 5,
        height = parseInt(svg.style('height'), 10) - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let parseTime = d3.timeParse("%m-%d-%Y");

    for (let i = 0; i < data.length; i++) {
        data[i].d = parseTime(data[i].d);
        data[i].p = +data[i].p;
        console.log(data[i]);
    }
    console.log(data);

    let x = d3.scaleTime()
        .rangeRound([0, width]);

    let y = d3.scaleLinear()
        .rangeRound([height, 0]);

    let line = d3.line()
        .x(function (d) {
            return x(d.d);
        })
        .y(function (d) {
            return y(d.p);
        });


    x.domain(d3.extent(data, function (d) {
        return d.d;
    }));
    y.domain(d3.extent(data, function (d) {
        return d.p;
    }));

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(6))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("text-anchor", "end")
        .text("Price ($)");

    g.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);

    lastVizPins.sales = currentPin;
}