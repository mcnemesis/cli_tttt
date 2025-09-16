/*************************************************************************
 * TEA.JS
 *------------------------------------------------------------------------
 * This is the reference implementation of the TEA runtime for JavaScript
 * This implementation is meant to closely adhere to the Python RI
 *-------------------------------------------------------------------------
 * DEV: Joseph W. Lutalo <joewillrich@gmail.com>
 * ***********************************************************************/

export class TEA_RunTime {

        //-------------------------------------
        // CONSTANTS
        //-------------------------------------
        // Important CONSTANTS for the runtime
        static OBSCURE_RC_NL = "=NL=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=NL="
        static OBSCURE_RC_COM = "=COM=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=COM="
        static OBSCURE_RC_TID = "=TID=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=TID="
        static TID = "|"
        static NL = "\n"
        static COMH = "#"
        static TCD = ":"
        static TIPED = ":"
        static RETEASTRING1 = /\{.*?\}/s;
        static RETEASTRING2 = /"[^"]*?"/s;
        static RETEAPROGRAM = /([a-zA-Z]\*?!?:.*(:.*)*\|?)+(#.*)*/
        static RETI = /[ ]*?[a-zA-Z]\*?!?:.*?/
        static SINGLE_SPACE_CHAR = " "
        static ALPHABET = "abcdefghijklmnopqrstuvwxyz"
        static EXTENDED_ALPHABET = this.ALPHABET + this.SINGLE_SPACE_CHAR
        static RE_WHITE_SPACE = /\s+/
        static RE_WHITE_SPACE_N_PUNCTUATION = /[\s\W]+/
        static GLUE = this.SINGLE_SPACE_CHAR
        static EMPTY_STR = ""
        static vDEFAULT_VAULT = this.EMPTY_STR

    // RUNTIME Constructor --- takes no parameters
    constructor(){
        this.VERSION = "1.0.2" // this is the version for the WEB TEA implementation
        this.TEA_HOMEPAGE = "https://github.com/mcnemesis/cli_tttt"
        this.status_MESSAGE = "Currently with a:, b:, c:, d: i:, v: and y: implemented and tested";
        this.DEBUG = false; 
        this.CODE = null; 
        this.STDIN_AS_CODE = false;
        this.DEBUG_FN = (txt) => { console.log(`T: ${txt}`) } // just in case no debug info printer is provided


    }

    get_version(){
        return this.VERSION;
    }

    get_status_message(){
        return this.status_MESSAGE;
    }

    static is_empty(str){
        if(str == null)
            return true;
        if(str.length == 0)
            return true;
        return false;
    }


    // Conditionally print debug info...
    debug(txt){
        if(this.DEBUG)
            this.DEBUG_FN(txt);
    }


    // Pre-process TEA CODE
    pre_process_TSRC(tsrc){
        // for now, trim all leading and trailing white space
        return tsrc.trim()
    }

    // Function to replace newlines with OBSCURE Pattern
	maskTEASTRING(matched) {
	  return matched
		.replace(/\n/g, TEA_RunTime.OBSCURE_RC_NL)
		.replace(/#/g, TEA_RunTime.OBSCURE_RC_COM)
		.replace(/\|/g, TEA_RunTime.OBSCURE_RC_TID);
	}

    // Clean TEA CODE:
    // Essentially, eliminate all TEA Opaque Lines:
    // - TEA Comments
    // - Non-TEA Instruction Lines
    // and put each TI on its own line, with any leading whitespace removed
    clean_TSRC(tsrc){
        if(TEA_RunTime.is_empty(tsrc))
            return tsrc
        // remove trailing whitespace
        var _tsrc = tsrc.trim()
        // first, fold multi-line TIL strings
        _tsrc = _tsrc.replace(TEA_RunTime.RETEASTRING1, match => this.maskTEASTRING(match));
        _tsrc = _tsrc.replace(TEA_RunTime.RETEASTRING2, match => this.maskTEASTRING(match));
        // remove all TEA comments
		const reTCOM = /#[^\n]*/gm
		_tsrc = _tsrc.replace(reTCOM, "");
        // first, split by newline
        var _tsrc_lines = _tsrc.split(TEA_RunTime.NL)
        var _tils = []
        // process multiple tils on same line
		for (let l of _tsrc_lines) {
            // split a line by TID
            if (l.includes(TEA_RunTime.TID)) {
                var _tis = l.split(TEA_RunTime.TID)
                _tils = _tils.concat(_tis);
            }
            else
                _tils.push(l)
        }
        _tsrc_lines = _tils
        this.debug(`${_tsrc_lines.length} of ${JSON.stringify(_tsrc_lines)}`)
        var reTI = new RegExp(TEA_RunTime.RETI)
        // remove all non-TIL lines
		const _tsrc_til_only = _tsrc_lines
		  .filter(line => reTI.test(line))
		  .map(line => line.trimStart());

        if(this.DEBUG){
            // reverse string masking...
			const _tsrc_til_only_show = _tsrc_til_only.map(l =>
			  l
				.replace(TEA_RunTime.OBSCURE_RC_NL, TEA_RunTime.NL)
				.replace(TEA_RunTime.OBSCURE_RC_COM, TEA_RunTime.COMH)
				.replace(TEA_RunTime.OBSCURE_RC_TID, TEA_RunTime.TID)
			);

            this.debug(`#${_tsrc_til_only_show.length} of ${JSON.stringify(_tsrc_til_only_show)}`)
        }
        _tsrc = _tsrc_til_only.join(TEA_RunTime.NL)
        return _tsrc
	}


    // Validate TEA CODE:
    // Essentially, check if:
    // - Code contains at least one valid TEA Instruction Line:
    // ([a-zA-Z]!?*?:.*(:.*)*|?)+(#.*)*
    validate_TSRC(tsrc){
        var reTEAPROGRAM = TEA_RunTime.RETEAPROGRAM
        var errors = []
        var _tsrc = tsrc.trim()
        var isValid = TEA_RunTime.is_empty(_tsrc) ? false : true
        if(!isValid){
            errors.push("[ERROR] TEA Source is Empty!")
            return [isValid, errors]
        }
        isValid = reTEAPROGRAM.test(_tsrc);
        if(!isValid){
            errors.push("[ERROR] TEA Source is INVALID!")
            return [isValid, errors]
        }
        else
            return [isValid, errors]
    }


    _parse_labelblocks(otil, initial_labelblocks){
        var TI_index = 0
        var labelblocks = initial_labelblocks ? initial_labelblocks : {}

        if(TEA_RunTime.is_empty(otil))
            return labelblocks

		for (let i of otil) {
            if(i.toUpperCase().startsWith("L")){
                var params = i.split(TEA_RunTime.TCD)
                for(let lBlockName of params.slice(1)){
                    var cleanlBlockName = lBlockName.trim()
                    if (labelblocks.hasOwnProperty(cleanlBlockName)) {
                        if (!initial_labelblocks.hasOwnProperty(cleanlBlockName)) {
                                debug(`[ERROR] Instruction ${i} trying to duplicate an Existenting Block Name [${cleanlBlockName}]`)
                                debug(`[INFO] Current L-BLOCKS: \n${JSON.stringify(labelblocks)}`)
                                throw new Error("[SEMANTIC ERROR] ATTEMPT to DUPLICATE EXISTING BLOCK LABEL")
                        } else{
                            // allow to override
                        }
                    }
                    labelblocks[cleanlBlockName] = TI_index + 1 // so we ref next instruction in program, after the label
                }
            }
            TI_index += 1
        }


        this.debug(`\n---<< EXTRACTED TEA LABEL BLOCKS:\n${JSON.stringify(labelblocks)}\n`)

        return labelblocks
    }


    // PARSE TEA CODE
    _parse_tea_code(code){
        var otil = []
        var tsrc = this.pre_process_TSRC(code)
        var val_res = this.validate_TSRC(tsrc)
        var isTSRCValid = val_res[0], errors = val_res[1];
        if(!isTSRCValid){
            this.debug(`TEA CODE ERRORS FOUND:\n${errors.join("\n")}`)
            return
        }
        var onlyTILTSRC = this.clean_TSRC(tsrc)
        this.debug(`CLEAN TEA CODE TO PROCESS:\n${onlyTILTSRC}`)

        var otil = onlyTILTSRC.split(TEA_RunTime.NL)
        return otil
    }

    // reverse TEA String Masking
    unmask_str(val){
        return val
          .replace(TEA_RunTime.OBSCURE_RC_NL, TEA_RunTime.NL)
          .replace(TEA_RunTime.OBSCURE_RC_COM, TEA_RunTime.COMH)
          .replace(TEA_RunTime.OBSCURE_RC_TID, TEA_RunTime.TID);
    }

	// Extract a string from a TEA expression
	extract_str(val){
        if (val.startsWith("{") && val.endsWith("}")) {
            val = val.replace(/^\{/, "").replace(/\}$/, "");
			return this.unmask_str(val)
        }
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.replace(/^"/, "").replace(/"$/, "");
			return this.unmask_str(val)
        }
		return this.unmask_str(val)
    }

    /////////////////////
    // MORE UTILS
    /////////////////////
	shuffle_fisher_yates(arr) {
	  for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]]; // swap
	  }
	  return arr;
	}

    util_anagramatize_words(val){
        const parts = val.split(TEA_RunTime.RE_WHITE_SPACE)
        var lparts = this.shuffle_fisher_yates(parts) // we are using Fisher-Yates algorithm for now
        return lparts.join(TEA_RunTime.GLUE)
    }

    util_anagramatize_chars(val){
        const parts = [...val]; // handles Unicode safely
        var lparts = this.shuffle_fisher_yates(parts) // we are using Fisher-Yates algorithm for now
        return lparts.join(TEA_RunTime.EMPTY_STR)
    }

    util_unique_chars(val){
		let uniqueChars = "";
		for (let char of val) {
			if (!uniqueChars.includes(char)) {
				uniqueChars += char;
			}
		}
		return uniqueChars;
	}


    //-----------------------------
    // VAULT/MEMORY utils
    //-----------------------------

    vault_store(vNAME, vVAL){
        this.VAULTS[vNAME] = vVAL
        this.debug(`--[INFO] Wrote VAULT[${vNAME} = [${vVAL}]]`)
    }

    vault_get(vNAME){
        if (!this.VAULTS.hasOwnProperty(vNAME)) {
            this.debug(`[ERROR] Instruction trying to access VAULT[${vNAME}] before it is set!`)
            throw new Error(`[MEMORY ERROR] ATTEMPT to ACCESS unset VAULT[${vNAME}]`)
        }
        else{
            this.debug(`--[INFO] Reading VAULT[${vNAME}]`)
            return this.VAULTS[vNAME]
        }
    }


//-----------------------------
// TAZ Implementation
//-----------------------------
    // PROCESS: A:
    process_a(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "A"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? tpe_str : ai
            io = this.util_anagramatize_words(input_str)
        }

        if(tc == "A!"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? tpe_str : ai
            io = this.util_anagramatize_chars(input_str)
        }

        if(tc == "A*"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? this.vault_get(tpe_str) : ai
            io = this.util_anagramatize_words(input_str)
        }

        if(tc == "A*!"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? this.vault_get(tpe_str) : ai
            io = this.util_anagramatize_chars(input_str)
        }

        return io
    }


    // PROCESS: B:
    process_b(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "B"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? tpe_str : ai
            io = this.util_unique_chars(input_str)
        }
        if(tc == "B!"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? tpe_str : ai
            io = [...this.util_unique_chars(input_str)].sort().join(TEA_RunTime.EMPTY_STR);
        }
        if(tc == "B*"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? this.vault_get(tpe_str) : ai
            io = this.util_unique_chars(input_str)
        }
        if(tc == "B*!"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? this.vault_get(tpe_str) : ai
            io = [...this.util_unique_chars(input_str)].sort().join(TEA_RunTime.EMPTY_STR);
        }
        return io
    }


    // PROCESS: C:
    process_c(ti, ai){
        var io = TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
        tc = tc.toUpperCase()

        if(tc == "C"){
            // io already set to empty str
        }
        if(tc == "C!"){
            for(let vault in this.VAULTS){
                this.VAULTS[vault] = TEA_RunTime.EMPTY_STR
            }
        }
        return io
    }


    // PROCESS: D:
    process_d(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)


        if(tc == "D"){
			let dpatterns = tpe_str.split(TEA_RunTime.TIPED);
			for (let dp of dpatterns) {
				io = io.replace(new RegExp(dp, 'g'), TEA_RunTime.EMPTY_STR);
			}
        }
        if(tc == "D!"){
            if(TEA_RunTime.is_empty(tpe_str)){
				io = io.replace(new RegExp(TEA_RunTime.RE_WHITE_SPACE, 'g'), TEA_RunTime.EMPTY_STR);
            }
            else{
                let dpatterns = tpe_str.split(TEA_RunTime.TIPED);
                let dfilter = dpatterns.join("|");
                let matches = io.match(new RegExp(dfilter, 'g')) || [];
                io = matches.join(TEA_RunTime.EMPTY_STR);
            }
        }

        if((tc == "D*") || (tc == "D*!")){
            if(TEA_RunTime.is_empty(tpe_str)){
                return io
            }
            else {
                if(tc == "D*"){
                   var params  = tpe_str.split(TEA_RunTime.TIPED)
                   if(params.length == 1){
                       var vREGEX = params[0]
                       if(vREGEX.length > 0){
                           var dp = this.vault_get(vREGEX) 
                           io = io.replace(new RegExp(dp, 'g'), TEA_RunTime.EMPTY_STR);
                       }
                   }
                   else{
                        var dpatterns = []
                        for(let vRX of params){
                            if(vRX.length > 0){
                               dpatterns.push(this.vault_get(vRX))
                            }
                        }
                        for(let dp of dpatterns){
                            io = io.replace(new RegExp(dp, 'g'), TEA_RunTime.EMPTY_STR);
                        }
                   }
                }
                if (tc == "D*!") {
                    var params  = tpe_str.split(TEA_RunTime.TIPED)
                    var dpatterns = []
                    for(let vRX of params){
                        if(vRX.length > 0){
                           dpatterns.push(this.vault_get(vRX))
                        }
                    }
                    let dfilter = dpatterns.join("|");
                    let matches = io.match(new RegExp(dfilter, 'g')) || [];
                    io = matches.join(TEA_RunTime.EMPTY_STR);
                }
            }
        }
        return io
    }


	// PROCESS: I:
    process_i(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "I"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // implements interactivity in TEA: displays io as prompt, sets user-input as io
                io = prompt(io) // okay, this makes one smile :)
            } else {
                if(TEA_RunTime.is_empty(io)){
                    io = tpe_str
                }
            }
        }

        if(tc == "I!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                io = TEA_RunTime.EMPTY_STR
            } else {
                io = tpe_str
            }
        }

        return io
    }

    //PROCESS V:
    process_v(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "V"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    this.vault_store(TEA_RunTime.vDEFAULT_VAULT,TEA_RunTime.EMPTY_STR)
                }
                else {
                    this.debug(`Processing ${tc} on AI=[${io}]`)
                    this.vault_store(TEA_RunTime.vDEFAULT_VAULT,io)
                }
            }
            else {
                var input_str = tpe_str
                var params = input_str.split(TEA_RunTime.TIPED)
                if(params.length > 2){
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                    throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
                else{
                    if(params.length == 2){
                        var vNAME = params[0]
                        var vVALUE = this.extract_str(params[1])
                        this.vault_store(vNAME,vVALUE)
                    }
                    else if(params.length == 1){
                        var vNAME = params[0]
                        var vVALUE = io
                        this.vault_store(vNAME,vVALUE)
                    }
                }
            }
        }

        if(tc == "V!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if (!this.VAULTS.hasOwnProperty(TEA_RunTime.vDEFAULT_VAULT)) {
                    debug(`[ERROR] Instruction ${ti} trying to access DEFAULT VAULT before it is set!`)
                    throw new Error("[MEMORY ERROR] ATTEMPT to ACCESS unset DEFAULT VAULT")
                }
                var vVALUE = this.vault_get(TEA_RunTime.vDEFAULT_VAULT)
                this.debug(`[INFO] Returning Length of string  in DEFAULT VAULT [${vVALUE}]`)
                return vVALUE.length
            }
            else{
                    var input_str = tpe_str
                    this.debug(`[INFO] Returning Length of string [${input_str}]`)
                    return input_str.length
            }
        }

        if(tc == "V*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
            }
            else {
                    var input_str = tpe_str
                    var params = input_str.split(TEA_RunTime.TIPED)
                    if(params.length > 2){
                        this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                        throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                    }
                    else{
                        if(params.length == 2){
                            [vNAME,vVALUE] = params
                            this.vault_store(vNAME,vVALUE)
                        }
                        else if(params.length == 1){
                            var vNAME = params[0]
                            var vVALUE = io
                            this.vault_store(vNAME,vVALUE)
                        }
                    }
            }
        }

        if(tc == "V*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if (!this.VAULTS.hasOwnProperty(TEA_RunTime.vDEFAULT_VAULT)) {
                    this.debug(`[ERROR] Instruction ${ti} trying to access DEFAULT VAULT before it is set!`)
                    throw new Error("[MEMORY ERROR] ATTEMPT to ACCESS unset DEFAULT VAULT")
                }

                var vVALUE = this.vault_get(TEA_RunTime.vDEFAULT_VAULT)
                this.debug(`[INFO] Returning Length of string  in DEFAULT VAULT [${vVALUE}]`)
                return vVALUE.length
            }
            else {
                var vNAME = tpe_str
                var vVALUE = this.vault_get(vNAME)
                this.debug(`[INFO] Returning Length of string  in VAULT[${vNAME} = [${vNAME}]]`)
                return vVALUE.length
            }
        }

        return io
    }


    //PROCESS Y:
    process_y(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "Y"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if (!this.VAULTS.hasOwnProperty(TEA_RunTime.vDEFAULT_VAULT)) {
                    debug(`[ERROR] Instruction ${ti} trying to access DEFAULT VAULT before it is set!`)
                    throw new Error("[MEMORY ERROR] ATTEMPT to ACCESS unset DEFAULT VAULT")
                }
                var vVALUE = this.vault_get(TEA_RunTime.vDEFAULT_VAULT)
                this.debug(`[INFO] Returning string  in DEFAULT VAULT [${vVALUE}]`)
                return vVALUE
            }
            else {
                var vNAME = tpe_str
                var vVALUE = this.vault_get(vNAME)
                this.debug(`[INFO] Returning string in VAULT [${vNAME}]`)
                return vVALUE
            }
        }

        if(tc == "Y!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if (!this.VAULTS.hasOwnProperty(TEA_RunTime.vDEFAULT_VAULT)) {
                    debug(`[ERROR] Instruction ${ti} trying to access DEFAULT VAULT before it is set!`)
                    throw new Error("[MEMORY ERROR] ATTEMPT to ACCESS unset DEFAULT VAULT")
                }
                var vVALUE = this.vault_get(TEA_RunTime.vDEFAULT_VAULT)
                this.debug(`[INFO] Returning Length of string  in DEFAULT VAULT [${vVALUE}]`)
                return vVALUE.length
            }
            else {
                var vNAME = tpe_str
                var vVALUE = this.vault_get(vNAME)
                this.debug(`[INFO] Returning Length of string  in VAULT[${vNAME}]`)
                return vVALUE.length
            }
        }

        if(tc == "Y*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                this.debug("[INFO] Returning ORIGINAL INPUT to the TEA PROGRAM")
                return this.ORIGINAL_INPUT
            } else {
                var vNAME = tpe_str
                var vVALUE = this.vault_get(vNAME)
                this.debug(`[INFO] Returning string  in VAULT[${vNAME}]`)
                return vVALUE
            }
        }

        if(tc == "Y*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                this.debug("[INFO] Returning Length of ORIGINAL INPUT to the TEA PROGRAM")
                return TEA_RunTime.is_empty(this.ORIGINAL_INPUT) ? 0: this.ORIGINAL_INPUT.length
            } else {
                var vNAME = tpe_str
                var vVALUE = this.vault_get(vNAME)
                this.debug(`[INFO] Returning Length of string  in VAULT[${vNAME}]`)
                return vVALUE.length
            }
        }

        return io
    }



    //////////////[ END TAZ ]///////////////////


    /* run the given tea source against the given input */
	run(tin, tsrc, DEBUG_ON, debug_fn, run_validation_only, extract_clean_code){

        this.DEBUG = DEBUG_ON;
        this.DEBUG_FN = debug_fn;

        this.INPUT = tin
        this.CODE = tsrc 
        this.STDIN_AS_CODE = false
        this.VAULTS = {}

        // we shall store label block pointers as such:
        //    label_name: label_position + 1
        //    such that, jumping to label_name allows us to
        //    proceed execution from instruction at index label_position +1
        this.LABELBLOCKS = {}
        this.ATPI = 0 // Active TI POSITION INDEX

        // first, get the code: the TEA source to use
        if(!TEA_RunTime.is_empty(tsrc))
            this.CODE = tsrc;
        else{
            this.debug("No explicit CODE found")
            if(!TEA_RunTime.is_empty(tin)){
                this.CODE = tin
                this.STDIN_AS_CODE = true;
                this.debug("Using INPUT as CODE")
            }
        }

        // Next, get the input to process
        if(!TEA_RunTime.is_empty(tin)){
            this.INPUT = tin
        }else{
            this.debug("No explicit INPUT found")
        }

        //what's in the input?
        this.debug(`INPUT:\n ${this.INPUT}`)


        if(this.CODE == null)
            this.debug("No CODE found!")
        else
            this.debug(`CODE:\n ${this.CODE}`)

/*-----------------------------
 * TEA Processing
 *-----------------------------*/

        this.debug("---------[ IN TEA RUNTIME ]\n");

        this.OUTPUT = null; // initialize output to the input...
        this.INSTRUCTIONS = []

        if(this.CODE){
            this.INSTRUCTIONS = this._parse_tea_code(this.CODE);
            if((TEA_RunTime.is_empty(this.INSTRUCTIONS))){
                this.debug("NO TEA Instruction Lines Found!")
                return this.OUTPUT;
            }
        }else{
            this.debug("NO TEA CODE FOUND")
            return this.OUTPUT;
        }


        // By default, we set AI to the EMPTY STRING is if it was None or not set
        this.INPUT = TEA_RunTime.is_empty(this.INPUT)? TEA_RunTime.EMPTY_STR : this.INPUT
        // we store original input just in case we might need it later in the TEA program : see Y*:
        this.ORIGINAL_INPUT = this.INPUT
        // by default, the input is the output if not touched..
        this.OUTPUT = this.INPUT

        this.LABELBLOCKS = this._parse_labelblocks(this.INSTRUCTIONS, {})

        //---------------------------------------
        // MAIN TEA Execution/Processing Loop
        //--------------------------------------
        if(extract_clean_code){
            return this.INSTRUCTIONS.map(line => this.unmask_str(line)).join(TEA_RunTime.NL); 
        }

        if(run_validation_only){
            return TEA_RunTime.is_empty(this.OUTPUT) ? TEA_RunTime.EMPTY_STR : this.OUTPUT // in TEA, None is the EMPTY_STR
        }

        if(!TEA_RunTime.is_empty(this.INSTRUCTIONS)){
            while(true){
                // detect end of program and quit
                if(this.ATPI >= this.INSTRUCTIONS.length)
                    break

                this.debug(`Executing Instruction#${this.ATPI} (out of ${this.INSTRUCTIONS.length})`)

                var instruction = this.INSTRUCTIONS[this.ATPI]

                this.debug(`Processing Instruction: ${instruction}`)
                this.debug(`PRIOR MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)

                var TC = instruction.toUpperCase()[0]

                switch(TC){
                    // A: Anagrammatize
                    case "A": {
                        this.OUTPUT = String(this.process_a(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // B: Basify
                    case "B": {
                        this.OUTPUT = String(this.process_b(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // C: Clear
                    case "C": {
                        this.OUTPUT = String(this.process_c(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // D: Delete
                    case "D": {
                        this.OUTPUT = String(this.process_d(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }


                    // I: Interact
                    case "I": {
                        this.OUTPUT = String(this.process_i(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // V: Vault
                    case "V": {
                        this.OUTPUT = String(this.process_v(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // Y: Yank
                    case "Y": {
                        this.OUTPUT = String(this.process_y(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                }
            } // end while

            return TEA_RunTime.is_empty(this.OUTPUT) ? TEA_RunTime.EMPTY_STR : this.OUTPUT // in TEA, None is the EMPTY_STR
        }
	}
}
