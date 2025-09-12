/*************************************************************************
 * APP.js
 *------------------------------------------------------------------------
 * Contains the main web app interaction logic
 *-------------------------------------------------------------------------
 * DEV: Joseph W. Lutalo <joewillrich@gmail.com>
 * ***********************************************************************/

// In app.js
import { Utility as U } from './utility.js';
import { TEA_RunTime as TEA } from './tea.js';

console.log(U.test());

var DEBUG = false;

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
        DEBUG = true;
        U.status_success("DEBUG MODE turned ON");
        U.show('rw_debug');
    }else {
        DEBUG = false;
        U.status_warning("DEBUG MODE turned OFF");
        U.hide('rw_debug');
    }
});

function debug_writer(txt){
    var debug_info = U.val('txt_debug');
    U.updateElement('txt_debug', debug_info + '\n' + txt);
    U.scrollToBottom('txt_debug');
}

// Clear out currently loaded TEA program code
U.click("btn_clear_prog", function() {
    U.updateElement('txt_code','');
    U.updateElement('txt_code','');
    U.status_success("TEA Code Editor Reset...");
});


// sanitize current TEA program code 
U.click("btn_sanitize_prog", function() {
	U.status_info("Running Sanitizer against current TEA program code...");
    U.updateElement('txt_debug',''); // clear debug info
    var tinput = U.val('txt_input');
    var tsrc = U.val('txt_code');
    var TEART = new TEA();
    var onlyValidate = true;
    var extract_clean_code = true;
    var result = TEART.run(tinput, tsrc, DEBUG, debug_writer, onlyValidate, extract_clean_code);
    U.updateElement('txt_output',result);
	U.status_success("TEA Program sanitization complete. Clean TEA Program Code loaded into Editor.");
});

// validate current TEA program code 
U.click("btn_validate_prog", function() {
	U.status_info("Running Lexer against current TEA program code...");
    var is_debug_ON = U.checked('switch_debug');
    if(!is_debug_ON){
        U.trigger(U.get('switch_debug'),'click'); // simulate toggle debug on..
    }
    U.updateElement('txt_debug',''); // clear debug info
    var tinput = U.val('txt_input');
    var tsrc = U.val('txt_code');
    var TEART = new TEA();
    var onlyValidate = true;
    var result = TEART.run(tinput, tsrc, DEBUG, debug_writer, onlyValidate);
    U.updateElement('txt_output', "");
	U.status_success("TEA Program validation complete. Consult DEBUGGING OUTPUT to view validation results...");
});

// run current TEA program code against available input and present results
U.click("btn_run_prog", function() {
	U.status_info("Initializing execution of TEA...");
    U.updateElement('txt_debug',''); // clear debug info
    var tinput = U.val('txt_input');
    var tsrc = U.val('txt_code');
    var TEART = new TEA();
    var result = TEART.run(tinput, tsrc, DEBUG, debug_writer);
    U.updateElement('txt_output', result);
	U.status_success("TEA Program execution complete.");
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


/* read things from clipboard*/
async function readClipboardText() {
  try {
    const text = await navigator.clipboard.readText();
    console.log("Clipboard contents:", text);
    return text;
  } catch (err) {
    console.error("Failed to read clipboard:", err);
    return null;
  }
}

// Paste program from clipboard into editor
U.click("btn_paste_prog", function() {
    readClipboardText().then( str => {
        if(str){
            U.updateElement('txt_code',str);
            U.status_success("Finished loading code from clipboard.");
        } else {
            U.status_error("Failed loading code from clipboard.");
        }
    });
});

// Analyze program and present results
U.click("btn_analyze", function() {
    var prog_output = U.val('txt_output');
    U.updateElement('txt_analytics',`Cardinality of output is ${prog_output.length}`);
    U.status_success("Program Analysis complete");
    U.console("TODO: actually compute necessary analytics on program and output and display them.")
});
