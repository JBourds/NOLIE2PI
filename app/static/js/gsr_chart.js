// Global variables used to control the data
var latest_timestamp = "0";
var question_id = 0;

// Function used to update the question_id variable and update graph display
function displayQuestionData() {
    question_id = document.getElementById("question-id");
    var ctx = document.getElementById("gsr_chart").getContext('2d');
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    create_gsr_chart(ctx);
    update(question_id);
    setInterval(update, 1000);
}

function get_gsr_data(callback, since) {
    var data = {};
    if (since !== undefined) {
        data.since = since
    }
    $.ajax({
        url: "/gsr",
        type: "GET",
        data: data,
        dataType: "json",
        success: function(response) {
            if (callback !== undefined) {
                var gsr_datas = [];
                for (var i in response) {
                    var gsr_list = response[i];
                    var gsr_data = {
                        gsr_id: gsr_list[0],
                        question_id: gsr_list[1],
                        reading: gsr_list[2],
                        timestamp: gsr_list[3]
                    };
                    gsr_datas.push(gsr_data);
                }
                callback(gsr_datas);
            }
        }
    });
}

function get_new_gsr_data(callback) {
    get_gsr_data(function(gsrs) {
        if (gsrs.length > 0) {
            latest_timestamp = gsrs[gsrs.length - 1].timestamp;
            console.log(latest_timestamp);
        }
        callback(gsrs);
    }, latest_timestamp)
}

var gsr_chart;

function create_gsr_chart(ctx) {
    gsr_chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: "GSR Reading",
                data: []
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        max: y_max,
                        min: y_min
                    }
                }],
                xAxes: [{
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 20
                    }
                }]
            }
        }
    });
}

var y_min = 0;
var y_max = 1;

function add_gsr_to_chart(gsr_reading, time_label) {
    if (gsr_reading > y_max - 10) {
        y_max = gsr_reading + 10;
        gsr_chart.options.scales.yAxes[0].ticks.max = y_max;
    }

    gsr_chart.data.datasets[0].data.push(gsr_reading);
    gsr_chart.data.labels.push(time_label);
}

function update_gsr_chart() {
    gsr_chart.update();
}

function update() {
    get_new_gsr_data(function(gsrs) {
        for (var i in gsrs) {
            // Only use the data if it matches the question ID
            var gsr = gsrs[i];

            if (gsr.question_id == question_id) {
                $("<tr>" +
                "<td>" + gsr.gsr_id + "</td>" +
                "<td>" + gsr.question_id + "</td>" +
                "<td>" + gsr.reading + "</td>" +
                "<td>" + gsr.timestamp + "</td>" +
                "</tr>").prependTo($("#gsr_tbody"));

                var date = new Date(gsr.timestamp);
                var time_label = date.getMonth() + 1 + "/" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();

                add_gsr_to_chart(gsr.reading, time_label);
            }


        }
        if (gsrs.length > 0) {
            update_gsr_chart();
        }
    });
}

$(document).ready(function() {
    // Initialize graphs

    // Create GSR graph
    var ctx = document.getElementById("gsr_chart").getContext('2d');
    create_gsr_chart(ctx);

    // TODO: Create HR & SP02 Graphs


    // update();
    // setInterval(update, 1000);


});
