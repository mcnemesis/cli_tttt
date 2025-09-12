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
        this.VERSION = "1.0.8"
        this.TEA_HOMEPAGE = "https://github.com/mcnemesis/cli_tttt"
        this.DEBUG = false; 
        this.CODE = null; 
        this.STDIN_AS_CODE = false;
        this.DEBUG_FN = (txt) => { console.log(`T: ${txt}`) } // just in case no debug info printer is provided


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

    /* run the given tea source against the given input */
	run(tin, tsrc, DEBUG_ON, debug_fn){


        this.DEBUG = DEBUG_ON;
        this.DEBUG_FN = debug_fn;

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

        return this.OUTPUT;
	}
}
