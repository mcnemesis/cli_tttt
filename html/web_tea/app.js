/*************************************************************************
 * APP.js
 *------------------------------------------------------------------------
 * Contains the main web app interaction logic
 *-------------------------------------------------------------------------
 * DEV: Joseph W. Lutalo <joewillrich@gmail.com>
 * ***********************************************************************/

// In app.js
import { Utility as U } from './utility.js';
console.log(U.test());

//---[ PAGE READY HOOKS ]
U.ready(function () {
    U.hide('rw_debug'); // hide debug output by default
	U.status("The TEA IDE is ready. You can proceed...");
});

//---[ Event Handlers ]
// Toggle DEBUG MODE 
U.click("switch_debug", function() {
    var is_debug_ON = U.checked('switch_debug');
    if(is_debug_ON){
        U.status_success("DEBUG MODE turned ON");
        U.show('rw_debug');
    }else {
        U.status_warning("DEBUG MODE turned OFF");
        U.hide('rw_debug');
    }
});

// run current TEA program code against available input and present results
U.click("btn_run_prog", function() {
	U.status_info("Initializing execution of TEA...");
    var tinput = U.val('txt_input');
    var tsrc = U.val('txt_code');
    U.updateElement('txt_output', tinput);
    U.console("TODO: actually run code against available input and present the output")
});

// load selected TEA program from localstorage list of TEA programs
U.click("btn_use_prog", function() {
    var prog_name = U.val('sel_prog_list');
	U.status_warning(`Loaded TEA program [${prog_name}]`);
    U.updateElement('txt_code', prog_name);
    U.console("TODO: actually load code and program with given name from local storage")
});


// delete selected TEA program from localstorage list of TEA programs
U.click("btn_del_prog", function() {
    var prog_name = U.val('sel_prog_list');
	U.status_success(`DELETED STORED TEA program [${prog_name}]`);
    U.console("TODO: actually delete code and program with given name from local storage")
});

// Save current TEA program into localstorage list of TEA programs
U.click("btn_save_prog", function() {
    var prog_name = U.val('txt_prog_name');
	U.status_success(`STORED TEA program [${prog_name}]`);
    U.console("TODO: actually store code and program name into local storage")
});


// Copy active TEA program to clipboard
U.click("btn_copy_prog", function() {
    var prog_code = U.val('txt_code');
    U.clipboard(prog_code, ()=>{
        U.status_success("Copied TEA Code to clipboard");
    }, (err) => {
        U.status_error(`Failed to Copy TEA Code to clipboard: ${err}`);
    });
});


// Create shareable session URL for current program input and code?
U.click("btn_share_output", function() {
    var prog_output = U.val('txt_output');
    U.clipboard(prog_output, ()=>{
        U.status_success("Copied Output to clipboard");
    }, (err) => {
        U.status_error(`Failed to Copy Output to clipboard: ${err}`);
    });
});


// Take current output and set it as new input
U.click("btn_back_propagate_output", function() {
    var prog_output = U.val('txt_output');
    U.updateElement('txt_input',prog_output);
    U.status_success("Last Output Set as New Input");
});

// Analyze program and present results
U.click("btn_analyze", function() {
    var prog_output = U.val('txt_output');
    U.updateElement('txt_analytics',`Cardinality of output is ${prog_output.length}`);
    U.status_success("Program Analysis complete");
    U.console("TODO: actually compute necessary analytics on program and output and display them.")
});
