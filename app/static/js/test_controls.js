function startTestReadings() {

    let test_active = document.getElementById("test-active");
    if (test_active.value == 0) {
        test_active.value = 1;

        var ctx = document.getElementById("gsr_chart").getContext('2d');
        // Clear canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        create_gsr_chart(ctx);
        update();
        setInterval(update, 1000);


        let user_id;
        let select_user = document.getElementById("select-user").value;
        let add_user = document.getElementById("user").value;
        let question = document.getElementById("question").value;
        if (select_user == 0 && add_user == "") {
            alert("Must select or enter user. Test NOT started.");
        } else if (question == "") {
            alert("Must enter yes/no question for the test.");
        }
        // User entered a new user, get their user_id to use
        if (select_user == 0) {
            user_id = addUser();
        } else {
            user_id = select_user;
        }

        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/start_reading");
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify({user_id: user_id, question: question}));
    } else {
        alert("Test already active!");
    }
}

function stopTestReadings() {
    let test_active = document.getElementById("test-active");
    if (test_active.value == 1) {
        test_active.value = 0;
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/stop_reading");
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send();
    } else {
        alert("No test running!");
    }
}

function addUser() {
    let user = document.getElementById("user").value;
    let user_list = document.querySelectorAll("#select-user option");
    let duplicate_user = false;

    for (let i = 0; i < user_list.length; ++i) {
        if (user_list[i].textContent.toLowerCase() == user.toLowerCase()) {
            alert("Duplicate user! Select existing user or enter new name!");
            duplicate = true;
        }
    }

    if (!duplicate_user) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/create_user", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                let response = JSON.parse(xhr.responseText);
                console.log(response);
                if (response.user_id != 0) {
                    alert("User successfully created!");
                } else {
                    alert("User failed to be created!");
                }
                // Add user to select box
                let user_select = document.getElementById("select-user")
                user_select.innerHTML += '<option value="' + response.user_id + '" selected>' + user + '</option>';
                user_select.value = response.user_id;
                // Return their user_id
                return response.user_id;
            }
        };
        xhr.send(JSON.stringify({user: user}));
    }

}

function delUser() {
    let selected_user = document.getElementById("select-user").value;
    let entered_user = document.getElementById("user").value;

    // Don't allow user to enter a user's name to delete them
    if (entered_user != "" || selected_user == 0) {
        alert("Cannot only delete users from select list");
        document.getElementById("user").value = "";
    } else {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/delete_user", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                let response = xhr.responseText;
                if (response == "Succeeded") {
                    alert("Successfully deleted user!");
                } else {
                    alert("Failed to delete user!");
                }
                // console.log(response);
                // Delete user from select box
                document.getElementById("user-" + selected_user).remove();
            }
        };
        // Send selected user's ID
        json_object = JSON.stringify({user: selected_user});
        // Debugging
        /*
      console.log(selected_user);
      console.log(json_object);
      */
        xhr.send(json_object);
    }
}

function addTest() {
    // User ID to associate test with
    let selected_user_id = document.getElementById("select-user").value;
    let selected_user_name = document.getElementById("user-" + selected_user_id).textContent;
    let active_test = document.getElementById("test-active");

    if (selected_user_id == 0) {
        alert("Must select user to conduct test on!");
        return;
    }

    if (active_test.value == 1) {
        alert("Test already active! Must complete current test first before starting a new one!");
    } else {
        active_test.value = 1;
        let today = new Date();
        // ChatGPT
        // Format the date as YYYY-MM-DD
        var formattedDate = today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');

        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/create_test", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                let response = JSON.parse(xhr.responseText);
                test_id = response.test_id;
                console.log(test_id);
                if (test_id != 0) {
                    alert("Test successfully created!");
                } else {
                    alert("Test failed to be created!");
                }
                // Add test to select box for a given user.
                // A user can only have 1 test on a given day so no need to specify since each user's name is unique
                let test_select = document.getElementById("select-test")
                test_select.innerHTML += '<option id="test-' + test_id + '" value="' + test_id + '" selected>' + selected_user_name + '</option>';
                test_select.value = test_id;
                // Return the test_id
                return test_id;
            }
        };
        xhr.send(JSON.stringify({user_id: selected_user_id}));
    }

}

function completeTest() {
    var active_test = document.getElementById("test-active");

    // Stop test
    if (active_test.value == 1) {
        alert("Test completed!");
        active_test.value = 0;
    } else {
        alert("No running test!");
    }

    // Change selected option to default test
    document.getElementById("default-test").selected = true;
}

function delTest() {
    // Check for currently active or selected test
    let selected_test = document.getElementById("select-test");
    let active_test = document.getElementById("test-active");

    if (active_test.value == 1) {
        alert("Must complete current test before trying to delete test.");
        return;
    } else if (selected_test.value == 0) {
        alert("Must select test to delete!");
        return;
    }

    // Delete the test
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/delete_test", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            let response = JSON.parse(xhr.responseText);
            let rows_deleted = response.rows_deleted;
            console.log(rows_deleted);
            if (rows_deleted == 1) {
                alert("Test successfully deleted!");
            } else if (rows_deleted == 0) {
                alert("Test failed to be deleted!");
            } else {
                alert("Error: Extra tests were deleted!");
            }
            // Delete test from select box
            let test_option = document.getElementById("test-" + test_id);
            test_option.remove();
            return status;
        }
    };
    xhr.send(JSON.stringify({test_id: selected_test.value}));
}

function addQuestion() {

}

function delQuestion() {

}

