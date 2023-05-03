// Global variables used to control the data
var latest_timestamp = "0";
var question_id = 0;
var gsr_interval_id = -1;
var hr_interval_id = -1;
var spo2_interval_id = -1;

// Used in create_gsr_chart
var gsr_chart;
var hr_chart;
var spo2_chart;

// Used in add_gsr_to_chart
var gsr_y_min = 0;
var gsr_y_max = 1;

var hr_y_min = 40;
var hr_y_max = 125;

var spo2_y_min = .9;
var spo2_y_max = 1;

// Function used to update the question_id variable and update graph display
function displayQuestionData() {
    new_question_id = document.getElementById("question-id").value;
    var gsr_cht = document.getElementById("gsr-chart").getContext('2d');
    var hr_cht = document.getElementById("hr-chart").getContext('2d');
    var spo2_cht = document.getElementById("spo2-chart").getContext('2d');
    // Clear canvas if question IDs don't match
    if (new_question_id != question_id) {
        question_id = new_question_id;
        resetCharts();
        update_gsr();
        update_hr();
        update_spo2();
    }
    gsr_interval_id = setInterval(update_gsr, 1000);
    hr_interval_id = setInterval(update_hr, 1000);
    spo2_interval_id = setInterval(update_spo2, 1000);
}

// Doesn't update every second
function displayPastQuestionData() {
    new_question_id = document.getElementById("question-id").value;
    var gsr_cht = document.getElementById("gsr-chart").getContext('2d');
    var hr_cht = document.getElementById("hr-chart").getContext('2d');
    var spo2_cht = document.getElementById("spo2-chart").getContext('2d');
    // Clear canvas if question IDs don't match
    if (new_question_id != question_id) {
        question_id = new_question_id;
        resetCharts();
        update_gsr();
        update_hr();
        update_spo2();
    }
}

function resetCharts() {
    var gsr_cht = document.getElementById("gsr-chart").getContext('2d');
    var hr_cht = document.getElementById("hr-chart").getContext('2d');
    var spo2_cht = document.getElementById("spo2-chart").getContext('2d');

    gsr_chart.destroy();
    hr_chart.destroy();
    spo2_chart.destroy();

    create_gsr_chart(gsr_cht)
    create_hr_chart(hr_cht);
    create_spo2_chart(spo2_cht);

    document.getElementById("gsr-tbody").innerHTML = "";
    document.getElementById("hr-tbody").innerHTML = "";
    document.getElementById("spo2-tbody").innerHTML = "";
    latest_timestamp = "0";
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

function get_hr_data(callback, since) {
    var data = {};
    if (since !== undefined) {
        data.since = since
    }
    $.ajax({
        url: "/hr",
        type: "GET",
        data: data,
        dataType: "json",
        success: function(response) {
            if (callback !== undefined) {
                var hr_datas = [];
                for (var i in response) {
                    var hr_list = response[i];
                    var hr_data = {
                        hr_id: hr_list[0],
                        question_id: hr_list[1],
                        reading: hr_list[2],
                        timestamp: hr_list[3]
                    };
                    hr_datas.push(hr_data);
                }
                callback(hr_datas);
            }
        }
    });
}

function get_spo2_data(callback, since) {
    var data = {};
    if (since !== undefined) {
        data.since = since
    }
    $.ajax({
        url: "/spo2",
        type: "GET",
        data: data,
        dataType: "json",
        success: function(response) {
            if (callback !== undefined) {
                var spo2_datas = [];
                for (var i in response) {
                    var spo2_list = response[i];
                    var spo2_data = {
                        spo2_id: spo2_list[0],
                        question_id: spo2_list[1],
                        reading: spo2_list[2],
                        timestamp: spo2_list[3]
                    };
                    spo2_datas.push(spo2_data);
                }
                callback(spo2_datas);
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

function get_new_hr_data(callback) {
    get_hr_data(function(hrs) {
        if (hrs.length > 0) {
            latest_timestamp = hrs[hrs.length - 1].timestamp;
            console.log(latest_timestamp);
        }
        callback(hrs);
    }, latest_timestamp)
}

function get_new_spo2_data(callback) {
    get_spo2_data(function(spo2s) {
        if (spo2s.length > 0) {
            latest_timestamp = spo2s[spo2s.length - 1].timestamp;
            console.log(latest_timestamp);
        }
        callback(spo2s);
    }, latest_timestamp)
}

function create_gsr_chart(gsr_cht) {
    gsr_chart = new Chart(gsr_cht, {
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
                        max: gsr_y_max,
                        min: gsr_y_min
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

function create_hr_chart(hr_cht) {
    hr_chart = new Chart(hr_cht, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: "HR Reading",
                data: []
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        max: hr_y_max,
                        min: hr_y_min
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

function create_spo2_chart(spo2_cht) {
    spo2_chart = new Chart(spo2_cht, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: "SPO2 Reading",
                data: []
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        max: spo2_y_max,
                        min: spo2_y_min
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

function add_gsr_to_chart(gsr_reading, time_label) {
    if (gsr_reading > gsr_y_max - 10) {
        gsr_y_max = gsr_reading + 10;
        gsr_chart.options.scales.yAxes[0].ticks.max = gsr_y_max;
    }

    gsr_chart.data.datasets[0].data.push(gsr_reading);
    gsr_chart.data.labels.push(time_label);
}

function add_hr_to_chart(hr_reading, time_label) {
    if (hr_reading > hr_y_max - 10) {
        hr_y_max = hr_reading + 10;
        hr_chart.options.scales.yAxes[0].ticks.max = hr_y_max;
    }

    hr_chart.data.datasets[0].data.push(hr_reading);
    hr_chart.data.labels.push(time_label);
}

function add_spo2_to_chart(spo2_reading, time_label) {
    spo2_chart.data.datasets[0].data.push(spo2_reading);
    spo2_chart.data.labels.push(time_label);
}

function update_gsr_chart() {
    gsr_chart.update();
}

function update_hr_chart() {
    hr_chart.update();
}

function update_spo2_chart() {
    spo2_chart.update();
}

function update_gsr() {
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
                "</tr>").prependTo($("#gsr-tbody"));

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

function update_hr() {
    get_new_hr_data(function(hrs) {
        for (var i in hrs) {
            // Only use the data if it matches the question ID
            var hr = hrs[i];

            if (hr.question_id == question_id) {
                $("<tr>" +
                "<td>" + hr.hr_id + "</td>" +
                "<td>" + hr.question_id + "</td>" +
                "<td>" + hr.reading + "</td>" +
                "<td>" + hr.timestamp + "</td>" +
                "</tr>").prependTo($("#hr-tbody"));

                var date = new Date(hr.timestamp);
                var time_label = date.getMonth() + 1 + "/" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();

                add_hr_to_chart(hr.reading, time_label);
            }


        }
        if (hrs.length > 0) {
            update_hr_chart();
        }
    });
}

function update_spo2() {
    get_new_spo2_data(function(spo2s) {
        for (var i in spo2s) {
            // Only use the data if it matches the question ID
            var spo2 = spo2s[i];

            if (spo2.question_id == question_id) {
                $("<tr>" +
                "<td>" + spo2.spo2_id + "</td>" +
                "<td>" + spo2.question_id + "</td>" +
                "<td>" + spo2.reading + "</td>" +
                "<td>" + spo2.timestamp + "</td>" +
                "</tr>").prependTo($("#spo2-tbody"));

                var date = new Date(spo2.timestamp);
                var time_label = date.getMonth() + 1 + "/" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();

                add_spo2_to_chart(spo2.reading, time_label);
            }


        }
        if (spo2s.length > 0) {
            update_spo2_chart();
        }
    });
}

$(document).ready(function() {
    // Initialize empty graphs
    var gsr_cht = document.getElementById("gsr-chart").getContext('2d');
    var hr_cht = document.getElementById("hr-chart").getContext('2d');
    var spo2_cht = document.getElementById("spo2-chart").getContext('2d');

    create_gsr_chart(gsr_cht)
    create_hr_chart(hr_cht);
    create_spo2_chart(spo2_cht);
});
