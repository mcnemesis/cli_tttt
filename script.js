//---[ PAGE READY HOOKS ]
window.addEventListener("load", function () {
  status("The TEA IDE is ready. You can proceed...");
});

//---[ Event Handlers ]
document.getElementById("btn_run_prog").addEventListener("click", function() {
	status_info("Initializing execution of TEA...");
});

//---[ UTILITIES: STATUS ]
function status_error(message) {
  status(message, "alert alert-error");
}

function status_info(message) {
  status(message, "alert alert-info");
}

function status_success(message) {
  status(message, "alert alert-success");
}
function status_warning(message) {
  status(message, "alert alert-warning");
}

function status(message, type) {
  if (type) {
    updateElement("txt_status", message, type);
  } else {
    updateElement("txt_status", message, "alert alert-info");
  }
}

//---[ UTILITY: UPDATE ELEMENT ]
function updateElement(id, newText, newClass) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = newText; // Sets the visible text
    if (newClass) {
      element.className = newClass; // Replaces all existing classes
    }
  } else {
    console.warn(`Element with id "${id}" not found.`);
  }
}
