var red_button = $("#red_led_button");
red_button.click(function() {
    console.log(red_button.text());
    if (red_button.text() === "Red LED On") {
        $.ajax({
            url: "/led_on?pin=18",
            type: "post",
            success: function(response) {
                console.log(response);
                red_button.text("Red LED Off");
            }
        });
    } else {
        $.ajax({
            url: "/led_off?pin=18",
            type: "post",
            success: function() {
                red_button.text("Red LED On");
            }
        })
    }
});

// https://stackoverflow.com/questions/52459953/passing-variable-from-javascript-to-flask-using-ajax
var yellow_button = $("#yellow_led_button");
yellow_button.click(function() {
    console.log(yellow_button.text());
    if (yellow_button.text() === "Yellow LED On") {
        $.ajax({
            url: "/led_on?pin=17",
            type: "post",
            success: function(response) {
                console.log(response);
                yellow_button.text("Yellow LED Off");
            }
        });
    } else {
        $.ajax({
            url: "/led_off?pin=17",
            type: "post",
            success: function() {
                yellow_button.text("Yellow LED On");
            }
        })
    }
});

var blinking_button = $("#blinking_button");
blinking_button.click(function() {
    console.log(blinking_button.text());
    if (blinking_button.text() === "Start Blinking") {
        blinking_button.text("Stop Blinking");
        $.ajax({
            url: "/start_blinking?red=18&yellow=17",
            type: "post",
            success: function(response) {
                console.log(response);
            }
        });
    } else {
        $.ajax({
            url: "/stop_blinking",
            type: "post",
            success: function() {
                blinking_button.text("Start Blinking");
            }
        })
    }
});





