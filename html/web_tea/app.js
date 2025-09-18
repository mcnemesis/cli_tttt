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
var DARK_UI = false;
var DARK_UI_CLASS = "dark";
var THEME_DARK = "dark";
var THEME_LIGHT = "light";
var ACTIVE_THEME = THEME_LIGHT;
var IDE_status_message = "IDE in a usable state. Also with dark and light mode. One can save and reload TEA programs. Complete IDE documentation available. WEB IDE REST API working, and more! Work still on-going...";
var SETTING_THEME = 'UI_MODE';
var SETTING_PROGRAMS = 'TEA_PROGRAMS';
var SETTING_STANDARD_PROGRAMS = 'STANDARD_TEA_PROGRAMS';
var SETTING_USE_STANDARD_PROGRAMS = "USE_STANDARD_PROGRAMS";
var use_STANDARD_PROGRAMS = false;
var stored_PROGRAMS_DICTIONARY = {};
const DEFAULT_TEA_PROG_EXT = '.tea';
const DEFAULT_TEA_PROGRAM_SAMPLES_URI = "https://raw.githubusercontent.com/mcnemesis/cli_tttt/refs/heads/master/sample_TEA_programs/tea_tttt_transformer_sets/Reference_TEA_TTTTT_TransformerConfigurationSet.json";
const DEFAULT_WEB_IDE_FQDN = "tea.nuchwezi.com";
const DEFAULT_WEB_IDE_FQDN_URL = "https://" + DEFAULT_WEB_IDE_FQDN;

// can support html tags in docs brief
const WEB_IDE_DOCS_BRIEF = "<h3>TEA WEB IDE DOCS</h3>" +
    "<ul>"+
    "<li>"+ "For convenience, the full docs in summary have been loaded into the TEA input space." + "</li>"+
    "<li>"+ "Note that this IDE supports INITIAL CONFIGURATION via a REST API" + "</li>"+
    "<li>"+ "This IDE supports working in a harsh environment or on the move: all text input, whether data, code or outputs wont be lost in case the browser crashes, user switches context to other apps or accidentally closes/reloads the page." + "</li>"+
    "<li>"+ "This tool is still under development. So, in case of any errors, bugs or feature requests, contact the developers via the GitHub Project link on the MENU" + "</li>"+
    "</ul>";


// full docs should only be plain text
const WEB_IDE_DOCS_COMPLETE = "---[ TEA WEB IDE DOCS ]---\n\n" +
    "Welcome to the Transforming Executable Alphabet [TEA] WEB Integrated Development Environment." + "\n\n"+
    "Note that this IDE can be [re-]configured based on parameters you specify via the URL used to invoke the IDE. The WEB IDE REST API is explained below in brief:" + "\n\n"+
    "--[TEA WEB IDE REST API]:" + "\n\n"+
    "0. RUN TEA PROGRAM by DEFAULT: ?run" + "\n\n"+
    "The RUN API parameter is most useful when combined with the other API parameters below. Essentially, when say explicit TEA program code is set like via '?c=' or '?fc=', and if some input was specified too, then adding the parameter '?run' shall COMPEL the TEA WEB IDE to automatically go ahead and run/execute the provided TEA program, thus also producing output and/or effects as either TEA Output or debugging output depending on context and other parameters. Please use this with precaution when loading remote TEA code via '?fc='." + "\n\n"+
    "EXAMPLE: "+ DEFAULT_WEB_IDE_FQDN_URL +"/?i=THIS+is+a+TEST&c=a!:&d=1&run" + "\n\n"+
    "1. SET DEFAULT INPUT EXPLICITLY: ?i=INPUT" + "\n\n"+
    "That shall initialize the IDE's TEA Input space as whatever you specify in the INPUT parameter value." + "\n\n"+
    "EXAMPLE: "+ DEFAULT_WEB_IDE_FQDN_URL +"/?i=THIS+is+a+TEST" + "\n\n"+
    "2. SET DEFAULT INPUT via REMOTE URL CONTENT : ?fi=INPUT_URL" + "\n\n"+
    "The IDE shall fetch the text content at the specified url INPUT_URL and load it as the initial TEA Input" + "\n\n"+
    "EXAMPLE: "+ DEFAULT_WEB_IDE_FQDN_URL +"/?fi=https://lorem-api.com/api/lorem" + "\n\n"+
    "3. SET DEFAULT TEA CODE EXPLICITLY: ?c=CODE" + "\n\n"+
    "That shall initialize the IDE's TEA Code space as whatever you specify in the CODE parameter value." + "\n\n"+
    "EXAMPLE: "+ DEFAULT_WEB_IDE_FQDN_URL +"/?c=i!:{Hello }|i:|a!:" + "\n\n"+
    "4. SET DEFAULT TEA CODE via REMOTE URL CONTENT : ?fc=CODE_URL" + "\n\n"+
    "The IDE shall fetch the text content at the specified url CODE_URL and load it as the initial TEA Code." + "\n\n"+
    "EXAMPLE: "+ DEFAULT_WEB_IDE_FQDN_URL +"/?fc=https://gist.githubusercontent.com/mcnemesis/97caf6d0573f7447a807cf635fd8128f/raw/zha.tea" + "\n\n"+
    "5. SET DEFAULT WEB IDE THEME : ?t=LD" + "\n\n"+
    "Useful if you wish to force the IDE to load with a particular theme. Only TWO THEMES are supported; LIGHT (use t=l) or DARK (use t=d)" + "\n\n"+
    "EXAMPLE: "+ DEFAULT_WEB_IDE_FQDN_URL +"/?t=l" + "\n\n"+
    "6. FORCE the WEB IDE to RUN in DEBUG ModE: ?d=01" + "\n\n"+
    "Useful if you wish to force the IDE to run with DEBUGGING ON or OFF by default. Only TWO MODES are supported; ON (use d=1) or OFF (use d=0)" + "\n\n"+
    "EXAMPLE: "+ DEFAULT_WEB_IDE_FQDN_URL +"/?d=0" + "\n\n"+
    "--[TEA WEB IDE FUNCTIONS]:" + "\n\n"+
    "The rest of the functionality supported by the IDE is pretty clear; each button or control knob comes with some helpful text that shows what it's meant for --- easy to see if working via a laptop or desktop with mouse. Otherwise, the default functions are as follows:" + "\n\n"+
    "1. RELOAD: click to reload the WEB IDE interface. Shall also reload with last set configurations after processing both REST API and stored settings." + "\n\n"+
    "2. MENU: The menu contains several links to either documentation about TEA, or buttons/links that trigger certain functionalities such as showing this documentation or changing the active THEME." + "\n\n"+
    "3. TEA Input: Use that space to manually enter or preview text content that is meant to be passed on as default input to whatever TEA program you later specify." + "\n\n"+
    "4. STANDARD PROGRAMS: When you use the MENU to load STANDARD TEA PROGRAMs, then clicking this switch shall allow you to toggle between two lists of SAVED PROGRAMS; one, the list of programs that you the user manually store or create, then the other a list of TEA Programs that are loaded by the IDE as part of the standard examples of TEA Programs. You can freely switch between these, but note that all user stored or modified programs (even when originating from the STANDARD LIST) get stored on the user's program list." + "\n\n"+
    "5. USE: Click 'USE' to load the code of the named program currently selected as the active TEA program, into the TEA Code space." + "\n\n"+
    "6. DEL: Click 'DEL' to remove the named program currently selected from either the User Program List or the stored STANDARD TEA Programs LIST." + "\n\n"+
    "7. TEA Code: Use this space to manually compose or preview a TEA Program's source code, and which code is the main program to be executed when the IDE is compelled to RUN, VALIDATE or SANITIZE later on." + "\n\n"+
    "8. Program Name: Use this space to manually enter or edit the name of a TEA Program to be stored in the User's Programs LIST. Note that, for convenience, when a name is entered without the '.tea' extension, then the IDE automatically adds that to the program name upon saving. Also, in case the stored list of programs already contains a program name as what is specified, then the IDE automatically suffixes the specified name with the CURRENT TIME-STAMP too. For cases where you wish to save a program without explicitly specifying a name, the IDE knows how to generate a useful name automatically, so this field can also be used while it is blank!" + "\n\n"+
    "9. VALIDATE: Click the button 'VALIDATE' to check whether the currently specified TEA Program Code is VALID and whether it shall run as expected against the provided TEA Input. Note that, VALIDATE can work with either just TEA Input, TEA Code, both or neither! Also, in this mode, much as the inputs are parsed and lexical/static analysis is done, no actual execution of the TEA program shall occur." + "\n\n"+
    "9. SANITIZE: Click the button 'SANITIZE' to Reformat the provided TEA Code into the simplest, clean and comment-free program code. No actual execution of the program occurs, and the results of the sanitization are automatically set as the TEA Output so that it becomes easy to copy and paste that as either input or code if desired." + "\n\n"+
    "10. CLEAR: Click the button 'CLEAR' to empty the TEA Code space. A similar, though more global option is 'RESET WEB IDE' that is found on the MENU --- it clears all fields and restores the WEB IDE to its defaults." + "\n\n"+
    "11. RUN: Click this to Execute the currently active/specified TEA Input against the specified TEA Code. Shall also display debugging information if DEBUG MODE is ON, and the results of running the TEA program shall be displayed in the TEA Output space." + "\n\n"+
    "12. SAVE: Clicking SAVE shall store the current text in TEA Code space as a stored program on the users program list, using the name in 'Program Name' or the adjusted/automatic name. These stored programs remain available in the same browser across reloads, and require no user login. Thus, if you work on a mobile phone, and later switch to a laptop, the list of saved programs in the mobile browser and laptop or even for different web browsers on the same physical device won't be the same, but shall remain persistent until when manually emptied." + "\n\n"+
    "13. COPY: Click this to copy into your system clipboard, the text currently loaded in the TEA Code space." + "\n\n"+
    "14. PASTE: Click this to paste into the TEA Code space, text that is currently in your system clipboard." + "\n\n"+
    "15. TEA Output: This space contains all the text output returned as the FINAL result of executing your TEA Code and nothing else." + "\n\n"+
    "16. SHARE: Click this to copy the text in TEA Output to your system clipboard." + "\n\n"+
    "17. BACK PROPAGATE: Click to copy and load the text currently in TEA Output space as the new text in the TEA Input space. This functionality is great for iteratively building Text/Sequence Transformers that can be chained; where, one program operates on some input, produces output, then (in case you save that program), another program can be written that takes the input of the previous program and further operates on it to produce yet another kind of output, etc. Such programs can then later be either [re-]composed into one long TEA program, or can be invoked using Linux/Unix piping-style, with one program's output feeding into the next, etc. to solve some nontrivial problem (Transformatics anyone?)" + "\n\n"+
    "18. ANALYZE: The analyze function is just supplementary language support. Currently it only performs basic analysis of the TEA Output, but shall later help to compute some useful metrics about the entire active TEA execution session --- inputs, code, outputs, etc." + "\n\n"+
    "---[FURTHER DOCS | TEA RESEARCH]" + "\n\n"+
    "In case you still wish to explore more concerning TEA, this WEB IDE, or any other aspects of the TEA project, definitely start by visiting the TEA GitHub Project [linked to on the MENU], or visit the TEA Research and TEA Community links as provided on the MENU." + "\n\n";


//---[ PAGE THEME/MODE SETTINGS ]
//---[ SYSTEM DATABASE for ANY SETTINGS ]
const DATABASE = {
  set: (key, value) => {
    localStorage.setItem(key, value);
  },
  get: (key) => {
    const value = localStorage.getItem(key);
      try{
        return JSON.parse(value);
      }catch(err){
          return value;
      }
  }
};



// TOGGLE DARK THEME ON
function toggle_dark_theme(){
    var is_darkmode_ON = true
    var elBody = U.get("elBody");
    var elAnim = U.get("elDarkAnim");
    var elControlPanel = U.get("elControlPanel");
    DARK_UI = true;
    //U.show('elDarkAnim');
    elBody.classList.add(DARK_UI_CLASS);
    elAnim.classList.add(DARK_UI_CLASS);
    elControlPanel.classList.add(DARK_UI_CLASS);
    elControlPanel.classList.remove('text-bg-light');
    elControlPanel.classList.add('text-bg-dark');
    U.get('elNavMenu').classList.add('bg-dark');
    document.body.setAttribute('data-bs-theme', ACTIVE_THEME);

    DATABASE.set(SETTING_THEME, THEME_DARK);
    U.status_success("DARK MODE turned ON");
}

// TOGGLE LIGHT THEME ON
function toggle_light_theme(){
    var is_darkmode_ON = false;
    var elBody = U.get("elBody");
    var elAnim = U.get("elDarkAnim");
    var elControlPanel = U.get("elControlPanel");
    U.hide('elDarkAnim');
    DARK_UI = false;
    elBody.classList.remove(DARK_UI_CLASS);
    elAnim.classList.remove(DARK_UI_CLASS);
    elControlPanel.classList.remove(DARK_UI_CLASS);
    elControlPanel.classList.remove('text-bg-dark');
    elControlPanel.classList.add('text-bg-light');
    U.get('elNavMenu').classList.remove('bg-dark');
    document.body.setAttribute('data-bs-theme', ACTIVE_THEME);

    DATABASE.set(SETTING_THEME, THEME_LIGHT);
    U.status_success("DARK MODE turned OFF");
}

// LOAD STORED TEA PROGRAMS
function reloadSTOREDPROGRAMS(){
    // RELOAD STORED PROGRAMS: user programs by default
    use_STANDARD_PROGRAMS = DATABASE.get(SETTING_USE_STANDARD_PROGRAMS) || false;

    if(use_STANDARD_PROGRAMS){
        stored_PROGRAMS_DICTIONARY = DATABASE.get(SETTING_STANDARD_PROGRAMS) || {};
    }else{
        stored_PROGRAMS_DICTIONARY = DATABASE.get(SETTING_PROGRAMS) || {};
    }

    U.configureSelectFromDictionary('sel_prog_list',stored_PROGRAMS_DICTIONARY);
}



//---[ INITIALIZE WEB IDE FUNCTIONALITY and restore SETTINGS ]

// make text editors sticky...
U.makeStickyEditor('txt_input');
U.makeStickyEditor('txt_code');
U.makeStickyEditor('txt_debug');
U.makeStickyEditor('txt_output');
U.makeStickyEditor('txt_prog_name');
U.makeStickyEditor('txt_analytics');

//---[ PAGE READY HOOKS ]
U.ready(function () {
    U.hide('rw_debug'); // hide debug output by default
    //U.hide('elDarkAnim');
    // display version of WEB TEA in use..
    var TEART = new TEA();
    U.updateElement('webTEAVersion', TEART.get_version());

    // load last user-configured theme and settings
	const last_mode = DATABASE.get(SETTING_THEME);
    ACTIVE_THEME = last_mode;

    if(ACTIVE_THEME == THEME_LIGHT){
        toggle_light_theme();
    }else{
        toggle_dark_theme();
        U.trigger(U.get('switch_dark_ui'),'click'); // simulate toggle dark on..
    }

    // load last user-configured program list setting
	use_STANDARD_PROGRAMS = DATABASE.get(SETTING_USE_STANDARD_PROGRAMS);
    if(use_STANDARD_PROGRAMS){
        U.trigger(U.get('switch_programs'),'click'); 
    }    
    // RELOAD STORED PROGRAMS
    reloadSTOREDPROGRAMS();


	//---[ PROCESS IDE REST API ]
    // API:DEFAULT INPUT:i 
    var defaultINPUT = U.getURLFlag('i');
    if(defaultINPUT){
        //i=EXPLICIT_RAW_INPUT_TEXT
        U.updateElement('txt_input',defaultINPUT);
    }
    // API:DEFAULT INPUT URL:fi 
    var defaultINPUT_URL = U.getURLFlag('fi');
    if(defaultINPUT_URL){
        //fi=URL_TO_WEB_RESOURCE_for_INPUT
        //e.g: ?fi=https://lorem-api.com/api/lorem
        U.httpGET(defaultINPUT_URL, (text)=> {
            U.updateElement('txt_input',text);
        }, (err)=>{
            U.status_error("ERORR processing REST API PARAMETER [fi]:" + err); 
        });
    }

    // API:DEFAULT CODE:c
    var defaultCODE = U.getURLFlag('c');
    if(defaultCODE){
        //c=EXPLICIT_RAW_TEA_CODE_TEXT
        U.updateElement('txt_code',defaultCODE);
    }
    // API:DEFAULT CODE URL:fc
    var defaultCODE_URL = U.getURLFlag('fc');
    if(defaultCODE_URL){
        //fc=URL_TO_WEB_RESOURCE_for_TEA_CODE
        //e.g: ?fc=https://gist.githubusercontent.com/mcnemesis/97caf6d0573f7447a807cf635fd8128f/raw/b46d4416da8d6fa9fa275ce171783149b6d20627/zha.tea
        U.httpGET(defaultCODE_URL, (text)=> {
            U.updateElement('txt_code',text);
        }, (err)=>{
            U.status_error("ERORR processing REST API PARAMETER [fc]:" + err); 
        });
    }


    // API:DEFAULT DEBUG MODE:d
    var defaultDEBUG_ON = U.getURLFlag('d');
    if(defaultDEBUG_ON){
        defaultDEBUG_ON = (defaultDEBUG_ON == "1") || (defaultDEBUG_ON == 1) ? true : false;
        if(DEBUG){
            if(!defaultDEBUG_ON){
                DEBUG = false; //override
                U.hide('rw_debug'); 
                U.trigger(U.get('switch_debug'),'click'); 
            }
        }else{
            if(defaultDEBUG_ON){
                DEBUG = true; //override
                U.show('rw_debug'); 
                U.trigger(U.get('switch_debug'),'click'); 
            }

        }
    }


    // API:DEFAULT THEME MODE:t
    var defaultTHEME = U.getURLFlag('t');
    if(defaultTHEME){
        defaultTHEME = (defaultTHEME == "l")? THEME_LIGHT : THEME_DARK;
        if(ACTIVE_THEME == THEME_LIGHT){
            if(defaultTHEME == THEME_DARK) {
                toggle_dark_theme(); // override
            }
        }else if(ACTIVE_THEME == THEME_DARK){
            if(defaultTHEME == THEME_LIGHT) {
                toggle_light_theme(); // override
            }
            //U.trigger(U.get('switch_dark_ui'),'click'); // simulate toggle dark on..
        }
    }

    // API:DEFAULT to RUN MODE:run
    var defaultRUN = U.isSETURLFlag('run');
    if(defaultRUN){
        run_TEA_program();
    }


    // user ready to start working..
    // load status message from tool developers...
    U.status('<b>UPDATES:<b/><br/><ul><li>' 
        + 'You are using v'+ TEART.get_version() +' of WEB TEA.</li><li>' 
        + TEART.get_status_message() +'</li><li>' 
        + IDE_status_message +'</li></ul>'
        + 'The TEA IDE is ready. You can proceed...'
        , null, true);
});

//---[ Event Handlers ]
// Toggle DARK MODE 
U.click("switch_dark_ui", function() {
    var is_darkmode_ON = U.checked('switch_dark_ui');
    if(is_darkmode_ON){
        toggle_dark_theme();
        location.reload();
    }else {
        toggle_light_theme();
    }
    location.reload();
});


// SHOW WEB IDE DOCUMENTATION: esp. WEB IDE REST API
U.click("trig_web_ide_docs", function() {
    U.updateElement('txt_input',WEB_IDE_DOCS_COMPLETE);
    U.status(WEB_IDE_DOCS_BRIEF, 'primary', true);
});


// RESET WEB IDE
U.click("trig_reset_ide", function() {
    // clear all text areas..
    U.clear('txt_input');
    U.clear('txt_code');
    U.clear('txt_debug');
    U.clear('txt_output');
    U.clear('txt_prog_name');
    U.clear('txt_analytics');
    toggle_light_theme();
    location.reload();
});

// LOAD STANDARD TEA PROGRAMS
U.click("trig_load_standard_programs", function(){
    U.status_info("Wait as we load STANDARD TEA programs...");
    U.httpGET(DEFAULT_TEA_PROGRAM_SAMPLES_URI, (txt)=>{
        var jsonPROGARRAY = JSON.parse(txt);
        var jsonSTANDARDTEAPROGS = {}
        for(let proConf of jsonPROGARRAY){
            debugger
            var parts = proConf.split("<>",2);
            jsonSTANDARDTEAPROGS[parts[0]] = parts[1];
        }
        // also store these into database
        DATABASE.set(SETTING_STANDARD_PROGRAMS,JSON.stringify(jsonSTANDARDTEAPROGS));
        use_STANDARD_PROGRAMS = true;
        DATABASE.set(SETTING_USE_STANDARD_PROGRAMS,use_STANDARD_PROGRAMS);
        var is_USE_STANDARD_ON = U.checked('switch_programs');
        if(!is_USE_STANDARD_ON){
            U.trigger(U.get('switch_programs'),'click'); 
        }    
        // RELOAD STORED PROGRAMS
        reloadSTOREDPROGRAMS();
        U.status_success("STANDARD TEA Programs have been fetched and are now loaded.");
    }, (error)=>{
        U.status("Failed to load STANDARD TEA programs. ERROR:<br/>" + "<i>" + error + "</i>", 'danger', true);
    });
});

// Toggle USE STANDARD PROGRAMS
U.click("switch_programs", function() {
    use_STANDARD_PROGRAMS = U.checked('switch_programs');
    if(use_STANDARD_PROGRAMS){
        DATABASE.set(SETTING_USE_STANDARD_PROGRAMS, true);
        U.status_success("Stored Program List switched to STANDARD TEA Programs");
    }else {
        DATABASE.set(SETTING_USE_STANDARD_PROGRAMS, false);
        U.status_success("Stored Program List switched to USER Programs");
    }

    // RELOAD STORED PROGRAMS
    reloadSTOREDPROGRAMS();
});



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
    U.clear('txt_analytics');
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
    U.clear('txt_output');
    U.clear('txt_analytics');

	U.status_success("TEA Program validation complete. Consult DEBUGGING OUTPUT to view validation results...");
});

// run current TEA program code against available input and present results
function run_TEA_program(){
	U.status_info("Initializing execution of TEA...");
    U.updateElement('txt_debug',''); // clear debug info
    var tinput = U.val('txt_input');
    var tsrc = U.val('txt_code');
    var TEART = new TEA();
    //try{
        var result = TEART.run(tinput, tsrc, DEBUG, debug_writer);
        U.updateElement('txt_output', result);
        U.status_success("TEA Program execution complete.");
   // }catch(err){
   //     U.status_error(`TEA Program execution FAILED: ${err}`);
    //}
}

U.click("btn_run_prog", function() {
    run_TEA_program();
});

// load selected TEA program from localstorage list of TEA programs
U.click("btn_use_prog", function() {
    var prog_name = U.val('sel_prog_list');
    U.updateElement('txt_code', stored_PROGRAMS_DICTIONARY[prog_name]);
    U.updateElement('txt_prog_name', prog_name);
	U.status_warning(`Loaded TEA program [${prog_name}]`);
});


// delete selected TEA program from localstorage list of TEA programs
U.click("btn_del_prog", function() {
    var prog_name = U.val('sel_prog_list');

    delete stored_PROGRAMS_DICTIONARY[prog_name];

    if(use_STANDARD_PROGRAMS){
        DATABASE.set(SETTING_STANDARD_PROGRAMS,JSON.stringify(stored_PROGRAMS_DICTIONARY));
    }else{
        DATABASE.set(SETTING_PROGRAMS,JSON.stringify(stored_PROGRAMS_DICTIONARY));
    }

    // RELOAD STORED PROGRAMS
    reloadSTOREDPROGRAMS();

	U.status_success(`DELETED STORED TEA program [${prog_name}]`);
});

// Save current TEA program into localstorage list of USER TEA programs
U.click("btn_save_prog", function() {
    var prog_name = U.val('txt_prog_name');
    var prog_code = U.val('txt_code');

    var auto_prog_name = U.timestamp(true); // better than random

    if(TEA.is_empty(prog_name))
        prog_name = 'PROG-' + auto_prog_name + DEFAULT_TEA_PROG_EXT;

    if(!prog_name.endsWith(DEFAULT_TEA_PROG_EXT))
        prog_name = prog_name + DEFAULT_TEA_PROG_EXT; 

    //build and store entry into DB
    //we shall store programs as a json dictionary with structure:
    //{ prog_name: progr_code, p1: pc1, p2: pc2,... pn: pcn }
    var settingPROGRAMS = DATABASE.get(SETTING_PROGRAMS) || {};
    if(prog_name in settingPROGRAMS){
        var new_prog_name = U.stripSuffix(prog_name,DEFAULT_TEA_PROG_EXT) + '-' + auto_prog_name + DEFAULT_TEA_PROG_EXT;
        settingPROGRAMS[new_prog_name] = prog_code;
        prog_name = new_prog_name;
    } else {
        settingPROGRAMS[prog_name] = prog_code;
    }
    DATABASE.set(SETTING_PROGRAMS,JSON.stringify(settingPROGRAMS));

    // RELOAD STORED PROGRAMS
    reloadSTOREDPROGRAMS();

	U.status_success(`STORED TEA program [${prog_name}]`);
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
