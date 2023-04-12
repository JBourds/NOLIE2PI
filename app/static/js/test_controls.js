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
      xhr.onreadystatechange = function() {
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
        xhr.onreadystatechange = function() {
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