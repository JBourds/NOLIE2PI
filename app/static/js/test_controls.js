function startTestReadings() {
    let test_active = document.getElementById("test-active").value;
    let question_id = document.getElementById("question-id").value;
    let selected_question_id = document.getElementById("select-question").value;
    let reading_active = document.getElementById("reading-active");

    if (test_active == 0) {
        alert("No test to start readings for!");
        return;
    } else if (question_id == 0) {
        alert("No active question to start readings for!");
        return;
    } else if (reading_active.value == 1) {
        alert("Readings are already active!");
        return;
    } else if (selected_question_id != question_id) {
        alert("Can only start readings for the active question! Make sure active question is selected!");
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

}

function stopTestReadings() {
    let test_active = document.getElementById("test-active").value;
    let question_id = document.getElementById("question-id").value;
    let selected_question_id = document.getElementById("select-question").value;
    let reading_active = document.getElementById("reading-active");

    // Verify there is a running test
    if (test_active == 0) {
        alert("No test to stop readings for!");
        return;
    } else if (question_id == 0) {
        alert("No active question to stop readings for!");
        return;
    } else if (reading_active.value == 0) {
        alert("Readings are already inactive!");
        return;
    } else if (selected_question_id != question_id) {
        alert("Can only stop readings for the active question! Make sure active question is selected!");
        return;
    }

    // Stop reading
    reading_active.value = 0;

    // Send request to stop reading
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/stop_reading");
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send();

    // Stop charts from displaying new data
    clearInterval(gsr_interval_id);
    clearInterval(hr_interval_id);
    clearInterval(spo2_interval_id);
}

// Allows you to reset the graph to only display data for the given question
function viewQuestionReading() {
    let selected_question = document.getElementById("select-question").value;
    let question_id = document.getElementById("question-id").value;

    if (!validateQuestion()) {
        return;
    } else if (selected_question != question_id) {
        alert("Can only view readings for active question! Make sure selected question is the active question!");
        return;
    }

    displayPastQuestionData();
}

// Used in past tests page
function viewHistoricalQuestionReading() {
    let selected_question_id = document.getElementById("select-question").value;
    document.getElementById("question-id").value = selected_question_id;
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
                    let user_select = document.getElementById("select-user");
                    user_select.innerHTML += '<option id="user-' + response.user_id + '" value="' + response.user_id + '" selected>' + user + '</option>';
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
                    if (document.getElementById("test-" + test_id) != null) {
                        alert("Test for user already exists!");
                        return;
                    } else if (test_id != 0) {
                        alert("Test successfully created!");
                        active_test.value = 1;
                        // Wipe out all questions for previous test
                        hideQuestions();
                    } else {
                        alert("Test failed to be created!");
                        return;
                    }
                    // Add test to select box for a given user.
                    // A user can only have 1 test on a given day so no need to specify since each user's name is unique
                    let test_select = document.getElementById("select-test")
                    test_select.innerHTML += '<option id="test-' + test_id + '" value="' + test_id + '" selected>' + selected_user_name + " - " + formattedDate + ' (Active)</option>';
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
    let test_active = document.getElementById("test-active");
    let reading_active = document.getElementById("reading-active");

    // Stop test, don't reset test_id hidden input as it is the last test to be ran
    if (test_active.value == 0) {
        alert("No running test!");
        return;
    } else if (reading_active.value == 1) {
        alert("Readings are active! Stop readings before completing test");
        return;
    }

    alert("Test completed!");
    test_active.value = 0;

    // Remove the "(Active)" to the running test
    let active_test_id = document.getElementById("test-id").value;
    let active_test = document.getElementById("test-" + active_test_id);
    active_test.textContent = active_test.textContent.replace(" (Active)", "");

    // Change selected option to default test
    document.getElementById("default-test").selected = true;

    // Deactivate current question if there is an active one
    let current_question_id =  document.getElementById("question-id");
    if (current_question_id.value != 0) {
        deactivateQuestion();
    }

    hideQuestions();
}

function activateTest() {
    let test_active = document.getElementById("test-active");
    let selected_test = document.getElementById("select-test");

    // Already an active test running, return
    if (test_active.value == 1) {
        alert("There is already an active test!");
        return;
    }

    // No selected test, return
    if (selected_test.value == 0) {
        alert("No selected test to activate!");
        return;
    }

    // Update the test_active and test_id hidden inputs
    test_active.value = 1;
    document.getElementById("test-id").value = selected_test.value;

    // Add "(Active)" from the running test
    let active_test = document.getElementById("test-" + selected_test.value);
    active_test.textContent += " (Active)";

    showTestQuestions();
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
                let test_option = document.getElementById("test-" + selected_test.value);
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
    // Check if it is null for past tests page
    if (document.getElementById("question") != null) {
        document.getElementById("question").value = "";
    }

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
    }

    // Clear out current question box text
    // Check if it is null because of past tests page
    if (document.getElementById("question") != null) {
        document.getElementById("question").value = "";
    }

    // Set select box option to the default
    document.getElementById("select-question").value = 0;

    // Get all question options
    var questions = document.querySelectorAll("#select-question option");
    // Ignore the first default option
    for (let i = 1; i < questions.length; ++i) {
        // Check to see if the question is a part of this test and display it
        if (questions[i].id.search("test-" + test_id + "-") == 0) {
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
        if (questions[i].id.search("test-" + test_id + "-") == 0) {
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
                questions_box.innerHTML += '<option id="test-'+test_id+'-question-'+question_id+'" value="'+question_id+'" selected>'+question_text+' - Pass (Active)</option>';

                // Remove "(Active)" from current question if there is one
                current_question_id = document.getElementById("question-id").value;
                console.log(current_question_id);

                if (current_question_id != 0) {
                    current_question = document.getElementById("test-" + test_id + "-question-" + current_question_id);
                    current_question.textContent = current_question.textContent.replace(" (Active)", "");
                }

                // Update question-id hidden input with the question_id
                document.getElementById("question-id").value = question_id;
                resetCharts();
                return;
            }
        };
        xhr.send(JSON.stringify({test_id: test_id, question_text: question_text}));
    } catch (e) {
        alert(e);
    }
}

function delQuestion() {
    let test_id = document.getElementById("test-id").value;
    let selected_question_id = document.getElementById("select-question").value;
    let active_question_id = document.getElementById("question-id").value;

    if (!validateQuestion()) {
        return;
    } else if (selected_question_id != active_question_id) {
        alert("Selected question must also be the active question in order to delete it!");
        return;
    }
    deactivateQuestion();

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
                let question_option = document.getElementById("test-" + test_id + "-question-" + selected_question_id);
                question_option.remove();
                return;
            }
        };
        xhr.send(JSON.stringify({question_id: selected_question_id}));
    } catch (e) {
        alert(e);
    }
}

function activateQuestion() {

    // Same validation except validateQuestion checks the question-id hidden input and this button needs to check
    // the select-question input
    let test_active = document.getElementById("test-active").value;
    let test_id = document.getElementById("test-id").value;
    let selected_question_id = document.getElementById("select-question").value;
    let reading_active = document.getElementById("reading-active").value;

    // Check for inactive test
    if (test_active == 0) {
        alert("No active test!");
        return false;
    }
    // Check for no current test_id (value is 0)
    if (test_id == 0) {
        alert("Selected test is not valid!");
        return false;
    }

    // Check for lack of question
    if (selected_question_id == 0) {
        alert("No question selected!");
        return false;
    }

    // Check if the program is currently reading in sensor data
    if (reading_active == 1) {
        alert("Cannot stop question while reading is active!");
        return false;
    }

    let current_question =  document.getElementById("question-id");
    let new_question = document.getElementById("select-question");

    if (current_question.value == new_question.value) {
        return;
    } else if (current_question.value != 0) {
        deactivateQuestion();
    }

    // Update question ID to the selected question ID
    current_question.value = new_question.value

    // Add "(Active)" to selected question
    document.getElementById("test-" + test_id + "-question-" + new_question.value).textContent += " (Active)";

    resetCharts();
    viewQuestionReading();
}

function deactivateQuestion() {
    let active_test = document.getElementById("test-id");
    let active_question_id = document.getElementById("question-id");
    let active_question = document.getElementById("test-" + active_test.value + "-question-" + active_question_id.value);

    if (active_test.value == 0) {
        alert("No active test!");
        return;
    } else if (active_question_id.value == 0) {
        alert("No active question!");
        return;
    }

    // Remove " (Active)" from question text content
    active_question.textContent = active_question.textContent.replace(" (Active)", "");

    // Reset active_question_id to 0
    active_question_id.value = 0;

}

// Reset all the readings associated with the question
function resetQuestion() {
    if (!validateQuestion()) {
        return;
    }

    let question_id =  document.getElementById("question-id").value;
    let selected_question_id = document.getElementById("select-question").value;

    if (selected_question_id != question_id) {
        alert("Selected question must also be the active question in order to clear readings!");
        return;
    }

    try {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/reset_question", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                let response = JSON.parse(xhr.responseText);
                let rows_deleted = response.rows_deleted;
                console.log(rows_deleted);
                if (rows_deleted == -1) {
                    alert("No readings deleted!");
                } else {
                    alert("Readings cleared for question!");
                }
                resetCharts();
                return;
            }
        };
        xhr.send(JSON.stringify({question_id: question_id}));
    } catch (e) {
        alert(e);
    }
}

// Mark the selected question as a pass
function questionPass() {
    let test_id = document.getElementById("test-id").value;
    let question_id = document.getElementById("select-question").value;
    let question = document.getElementById("test-" + test_id + "-question-" + question_id);

    if (!validateQuestion()) {
        return;
    }

    // Check if the question is already marked as "Pass"
    if (question.textContent.search("Pass") != -1) {
        alert("Question already marked as pass!");
        return;
    }

    try {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/question_pass", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                let response = JSON.parse(xhr.responseText);
                let status = response.status;
                console.log(status);
                if (status != "Succeeded") {
                    alert("Error: Failure marking question as a pass!");
                    return;
                }
                // Update question to now show as "Pass"
                question.textContent = question.textContent.replace("Fail", "Pass");
                return;
            }
        };
        xhr.send(JSON.stringify({question_id: question_id}));
    } catch (e) {
        alert(e);
    }
}

function questionFail() {
    let test_id = document.getElementById("test-id").value;
    let question_id = document.getElementById("select-question").value;
    let question = document.getElementById("test-" + test_id + "-question-" + question_id);

    if (!validateQuestion()) {
        return;
    }

    // Check if the question is already marked as "Pass"
    if (document.getElementById("test-" + test_id + "-question-" + question_id).textContent.search("Fail") != -1) {
        alert("Question already marked as fail!");
        return;
    }

    try {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/question_fail", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                let response = JSON.parse(xhr.responseText);
                let status = response.status;
                console.log(status);
                if (status != "Succeeded") {
                    alert("Error: Failure marking question as a fail!");
                    return;
                }
                // Update question to now show as "Pass"
                question.textContent = question.textContent.replace("Pass", "Fail");
                return;
            }
        };
        xhr.send(JSON.stringify({question_id: question_id}));
    } catch (e) {
        alert(e);
    }
}

// Basic question validation
function validateQuestion() {
    let test_active = document.getElementById("test-active").value;
    let test_id = document.getElementById("test-id").value;
    let question_id = document.getElementById("question-id").value;
    let reading_active = document.getElementById("reading-active").value;

    // Check for inactive test
    if (test_active == 0) {
        alert("No active test!");
        return false;
    }
    // Check for no current test_id (value is 0)
    if (test_id == 0) {
        alert("Selected test is not valid!");
        return false;
    }

    // Check for lack of question
    if (question_id == 0) {
        alert("No question selected!");
        return false;
    }

    // Check if the program is currently reading in sensor data
    if (reading_active == 1) {
        alert("Cannot stop question while reading is active!");
        return false;
    }

    return true
}

/**
 * Functions for past tests page
 */

// Function used in tests.html to filter only tests for a certain user
function filterTests() {
    let selected_user = document.getElementById("select-user");
    let user_tests = document.getElementsByName("user-" + selected_user.value + "-tests")
    let tests = document.querySelectorAll("#select-test option");

    if (selected_user.value == 0) {
        alert("No user selected!");
        return;
    }

    // First hide all names
    for (let i = 0; i < tests.length; ++i) {
        tests[i].style.display = 'none';
    }

    // Display all the user's tests
    for (let i = 0; i < user_tests.length; ++i) {
        user_tests[i].style.display = 'block';
    }

    alert("Filter applied!");
}

// Function used to remove all filters on the tests that appear
function removeFilter() {
    let tests = document.querySelectorAll("#select-test option");
    for (let i = 0; i < tests.length; ++i) {
        tests[i].style.display = 'block';
    }
    alert("Filters removed!");
}

// Function to view a new test's question on the past questions page
function viewTest() {
    let test_active = document.getElementById("test-active");

    // Deactivate a running test
    if (test_active.value == 1) {
         test_active.value = 0;
        // Remove the "(Active)" to the running test
        let active_test_id = document.getElementById("test-id").value;
        let active_test = document.getElementById("test-" + active_test_id);
        active_test.textContent = active_test.textContent.replace(" (Active)", "");
        hideQuestions();
    }

    activateTest();

}

// Same as other delTest function, but can only delete "Active" tests in the test history
function delPastTest() {
    let selected_test = document.getElementById("select-test");
    let test_id = document.getElementById("test-id");
    let active_test = document.getElementById("test-active");

    if (test_id.value == 0) {
        alert("Must select test to delete!");
        return;
    } else if (active_test.value == 0) {
        alert("Must activate test to delete!");
        return;
    } else if (selected_test.value != test_id.value) {
        alert("Selected test must be the active test in order to delete!");
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
                let test_option = document.getElementById("test-" + test_id.value);
                test_option.remove();

                // Reset hidden inputs
                active_test.value = 0;
                test_id.value = 0;
                return;
            }
        };
        xhr.send(JSON.stringify({test_id: test_id.value}));
    } catch (e) {
        alert(e);
    }

}

// Same as function from polygraph page but does different question validation
function viewPastQuestionReading() {
    let test_active = document.getElementById("test-active").value;
    let selected_question = document.getElementById("select-question").value;
    let question_id = document.getElementById("question-id");

    if (test_active == 0) {
        alert("No active test being viewed!");
    } else if (selected_question == 0) {
        alert("No question selected!");
        return;
    }

    question_id.value = selected_question;
    displayPastQuestionData();
}
