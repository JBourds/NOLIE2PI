function startTestReadings() {
    let test_active = document.getElementById("test-active").value;
    let question_id = document.getElementById("question-id").value;
    let reading_active = document.getElementById("reading-active");

    // Verify there is a running test
    if (test_active == 0) {
        alert("No test to start readings for!");
        return;
    }

    // Check if there is an active question
    if (question_id == 0) {
        alert("No active question to start readings for!");
        return;
    }

    // Check if the readings are already active
    if (reading_active.value == 1) {
        alert("Readings are already active!");
        return;
    }

    // If all the previous conditions work, start the readings and display the data
    reading_active.value = 1;

    // Update graphs
    displayQuestionData();

    // Send request to start recording data
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/start_reading");
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({question_id: question_id}));

    alert("Readings started!");
}

function stopTestReadings() {
    let test_active = document.getElementById("test-active").value;
    let question_id = document.getElementById("question-id").value;
    let reading_active = document.getElementById("reading-active");

    // Verify there is a running test
    if (test_active == 0) {
        alert("No test to stop readings for!");
        return;
    }

    // Check if there is an active question
    if (question_id == 0) {
        alert("No active question to stop readings for!");
        return;
    }

    // Check if the readings are already inactive
    if (reading_active.value == 0) {
        alert("Readings are already inactive!");
        return;
    }

    // Stop reading
    reading_active.value = 0;

    // Send request to stop reading
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/stop_reading");
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send();

    alert("Readings stopped!");
}

// Allows you to reset the graph to only display data for the given question
function viewQuestionReading() {
    let test_active = document.getElementById("test-active").value;
    let selected_question = document.getElementById("select-question").value;
    let question_id = document.getElementById("question-id");
    let reading_active = document.getElementById("reading-active").value;

    if (test_active == 0) {
        alert("No test to view reading for!");
        return;
    }

    if (reading_active == 1) {
        alert("Already viewing reading!");
        return;
    }

    question_id.value = selected_question;
    displayPastQuestionData();
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
        try {
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
        } catch (e) {
            alert(e);
        }

    }

}

function delUser() {
    let selected_user = document.getElementById("select-user").value;
    let entered_user = document.getElementById("user").value;

    // Don't allow user to enter a user's name to delete them
    if (entered_user != "" || selected_user == 0) {
        alert("Cannot only delete users from select list");
        document.getElementById("user").value = "";
        return;
    }

    try {
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
    } catch (e) {
        alert(e);
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
        
        try {
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
                        // Wipe out all questions for previous test
                        hideQuestions();
                    } else {
                        alert("Test failed to be created!");
                    }
                    // Add test to select box for a given user.
                    // A user can only have 1 test on a given day so no need to specify since each user's name is unique
                    let test_select = document.getElementById("select-test")
                    test_select.innerHTML += '<option id="test-' + test_id + '" value="' + test_id + '" selected>' + selected_user_name + '</option>';
                    test_select.value = test_id;
    
                    // Update hidden test_id input
                    document.getElementById("test-id").value = test_id;
    
                    // Return the test_id
                    return test_id;
                }
            };
            xhr.send(JSON.stringify({user_id: selected_user_id}));
        } catch (e) {
            alert(e);
        }
        
    }

}

function completeTest() {
    var active_test = document.getElementById("test-active");

    // Stop test, don't reset test_id hidden input as it is the last test to be ran
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
    
    try {
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
                return;
            }
        };
        xhr.send(JSON.stringify({test_id: selected_test.value}));
    } catch (e) {
        alert(e);
    }
    
}

// Function to hide all questions from a test
function hideQuestions() {
    // Clear out current question box text
    document.getElementById("question").value = "";

    // Set select box option to the default
    document.getElementById("select-question").value = 0;

    // Get all question options then hide them
    var questions = document.querySelectorAll("#select-question option");
    // Ignore the first default option
    for (let i = 1; i < questions.length; ++i) {
        questions[i].style.display = 'none';
    }
}

// Function to only display questions from a specific test
function showTestQuestions() {
    let test_active = document.getElementById("test-active").value;
    // Get active test id
    let test_id = document.getElementById("select-test").value;

    if (test_active.value == 1) {
        alert("Must finish current test before selecting another test!");
        return;
    }

    if (test_id == 0) {
        alert("Invalid test selection!");
        return;
    }

    let question_count = getTestQuestionCount(test_id);
    if (question_count == 0) {
        alert("No questions to show for test!");
        return;
    } else {
        alert("Showing " + question_count + " questions!");
    }

    // Clear out current question box text
    document.getElementById("question").value = "";

    // Set select box option to the default
    document.getElementById("select-question").value = 0;

    // Get all question options
    var questions = document.querySelectorAll("#select-question option");
    // Ignore the first default option
    for (let i = 1; i < questions.length; ++i) {
        // Check to see if the question is a part of this test and display it
        if (questions[i].id.search("test-" + test_id) == 0) {
            questions[i].style.display = 'block';
        } else {
            questions[i].style.display = 'none';
        }
    }
}

// Helper function to determine how many questions a test has
function getTestQuestionCount(test_id) {
    let question_count = 0;

    // Get all question options
    var questions = document.querySelectorAll("#select-question option");
    // Ignore the first default option
    for (let i = 1; i < questions.length; ++i) {
        // Check to see if the question is a part of this test and display it
        if (questions[i].id.search("test-" + test_id) == 0) {
            ++question_count;
        }
    }

    return question_count;
}

// Function used to add a question to a running test
function addQuestion() {
    let test_active = document.getElementById("test-active").value;
    let test_id = document.getElementById("test-id").value;

    // Check for inactive test
    if (!test_active) {
        alert("No active test!");
        return;
    }
    // Check for no current test_id (value is 0)
    if (!test_id) {
        alert("Selected test is not valid!");
        return;
    }

    // Parse the question text to make sure it is not empty
    question_text = document.getElementById("question").value;

    if (question_text.trim() == "") {
        alert("Question cannot be blank");
        return;
    }

    try {
        // Create question in database and initialize the question_id
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/create_question", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                let response = JSON.parse(xhr.responseText);
                let question_id = response.question_id;
                console.log(question_id);
                if (question_id > 0) {
                    alert("Question added successfully");
                } else {
                    alert("Question failed to be added");
                    return;
                }
                // Add question to select box
                var questions_box = document.getElementById("select-question");
                questions_box.innerHTML += '<option id="test-'+test_id+'-question-'+question_id+'" value="'+question_id+'" selected>'+question_text+'</option>';

                // Update question-id hidden input with the question_id
                document.getElementById("question-id").value = question_id;
                return;
            }
        };
        xhr.send(JSON.stringify({test_id: test_id, question_text: question_text}));
    } catch (e) {
        alert(e);
    }


}

function delQuestion() {
    let test_active = document.getElementById("test-active").value;
    let test_id = document.getElementById("test-id").value;
    let question_id = document.getElementById("select-question").value;
    let reading_active = document.getElementById("reading-active").value;

    // Check for inactive test
    if (test_active == 0) {
        alert("No active test!");
        return;
    }
    // Check for no current test_id (value is 0)
    if (test_id == 0) {
        alert("Selected test is not valid!");
        return;
    }

    // Check for lack of question
    if (question_id == 0) {
        alert("No question selected!");
        return;
    }

    // Check if the program is currently reading in sensor data
    if (reading_active == 1) {
        alert("Cannot stop question while reading is active!");
        return;
    }

    try {
        // Send request to delete the question
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/delete_question", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                let response = JSON.parse(xhr.responseText);
                let rows_deleted = response.rows_deleted;
                console.log(rows_deleted);
                if (rows_deleted == 1) {
                    alert("Question successfully deleted!");
                } else if (rows_deleted == 0) {
                    alert("Question failed to be deleted!");
                } else {
                    alert("Error: Extra questions were deleted!");
                }
                // Remove question from select box
                let question_option = document.getElementById("test-" + test_id + "-question-" + question_id);
                question_option.remove();
                return;
            }
        };
        xhr.send(JSON.stringify({question_id: question_id}));
    } catch (e) {
        alert(e);
    }


}

