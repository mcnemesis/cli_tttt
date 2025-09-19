/*************************************************************************
 * TEA.JS
 *------------------------------------------------------------------------
 * This is the reference implementation of the TEA runtime for JavaScript
 * This implementation is meant to closely adhere to the Python RI
 *-------------------------------------------------------------------------
 * Language ENGINEER: Joseph W. Lutalo <joewillrich@gmail.com>
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
        this.VERSION = "1.0.8" // this is the version for the WEB TEA implementation
        this.TEA_HOMEPAGE = "https://github.com/mcnemesis/cli_tttt"
        this.status_MESSAGE = "Currently with a: b: c: d: f: g: h: i: j: k: l: m: n: o: p: q: r: v: and y: implemented and tested";
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

    static is_empty_dict(dict){
        if(Object.keys(dict).length == 0)
            return true;
        return false;
    }

    static is_empty(str){
        if(str == null)
            return true;
        if(str.length == 0)
            return true;
        return false;
    }

	static splitWithLimit(str, delimiter, maxsplit) {
	  if (maxsplit === undefined || maxsplit < 1) {
		return str.split(delimiter);
	  }

	  const parts = [];
	  let remaining = str;
	  for (let i = 0; i < maxsplit; i++) {
		const index = remaining.indexOf(delimiter);
		if (index === -1) break;
		parts.push(remaining.slice(0, index));
		remaining = remaining.slice(index + delimiter.length);
	  }
	  parts.push(remaining);
	  return parts;
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

    // Pick LABEL BLOCKs from ordered TIL
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
          .replace(new RegExp(TEA_RunTime.OBSCURE_RC_NL,'g'), TEA_RunTime.NL)
          .replace(new RegExp(TEA_RunTime.OBSCURE_RC_COM,'g'), TEA_RunTime.COMH)
          .replace(new RegExp(TEA_RunTime.OBSCURE_RC_TID, 'g'), TEA_RunTime.TID);
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


	util_gen_rand(limit, ll=0){
		return limit === ll
			? limit
			: Math.floor(Math.random() * (limit - ll + 1)) + ll;
	}

    /////////////////////
    // MORE UTILS
    /////////////////////


    static util_braille_projection1(val){
		const rNonWhiteSpace = /\S/g;
		const rWhiteSpace = /[ \t\r\f\v]/g;

		// Remove all non-whitespace characters
		val = val.replace(rNonWhiteSpace, TEA_RunTime.EMPTY_STR);

		// Replace all whitespace except newline with a full stop
		val = val.replace(rWhiteSpace, '.');

		return val;
	}


    static util_braille_projection2(val){
		const rNonWhiteSpace = /\S/g;
		const rWhiteSpace = /[ \t\r\f\v]/g;

		// Replace all non-whitespace characters with '#'
		val = val.replace(rNonWhiteSpace, '#');

		// Replace all whitespace except newline with a full stop
		val = val.replace(rWhiteSpace, '.');

		// Replace '#' with SINGLE_SPACE_CHAR
		val = val.replace(/#/g, TEA_RunTime.SINGLE_SPACE_CHAR);

		return val;
	}

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

    util_mirror_words(val){
		const parts = val.split(TEA_RunTime.RE_WHITE_SPACE);
		const lparts = parts.reverse();
		return lparts.join(TEA_RunTime.GLUE);
	}

    util_mirror_chars(val){
		return ([...val].reverse()).join(TEA_RunTime.EMPTY_STR);
	}


	util_sort_words(val){
		const parts = val.split(TEA_RunTime.RE_WHITE_SPACE);
		const lparts = parts.sort(); // Lexical sort
		return lparts.join(TEA_RunTime.GLUE);
	}

	util_sort_chars(val){
		const lparts = val.split('').sort();
		return lparts.join(TEA_RunTime.EMPTY_STR);
	}


    util_gen_permutations(val, glue=TEA_RunTime.GLUE, limit=100){
        var [iteration, iteration_limit] = [0, limit * 2];
        var instance_limit = this.util_gen_rand(limit,1)
        var permutations = []
        while(permutations.length < instance_limit){
            if(iteration > iteration_limit){
                break
            }
            else{
                iteration += 1
            }
            var vAnagram = this.util_anagramatize_chars(val)
			if (permutations.includes(vAnagram)) {
                continue
            }
            else{
                permutations.push(vAnagram)
            }
        }
        return permutations.join(glue)
    }


    util_gen_rand_string(size=null, alphabet=TEA_RunTime.EXTENDED_ALPHABET, glue=TEA_RunTime.EMPTY_STR){
        var instance_limit = this.util_gen_rand(!TEA_RunTime.is_empty(size)? Number(size) : 100,1)
        if(!TEA_RunTime.is_empty(size)){
            instance_limit = size
        }
		var result = [];
		for (let i = 0; i < instance_limit; i++) {
			const randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
			result.push(randomChar);
		}
        if(!TEA_RunTime.is_empty(glue)){
            return result.join(glue)
        }
        else{
            return result.join(TEA_RunTime.EMPTY_STR);
        }
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
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "C"){
            if(TEA_RunTime.is_empty(tpe_str)){
                io = TEA_RunTime.EMPTY_STR
            }
            else{
                this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
            }
        }
        if(tc == "C!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                for (let vault of Object.keys(this.VAULTS)) {
                    this.VAULTS[vault] = TEA_RunTime.EMPTY_STR
                }
                io = TEA_RunTime.EMPTY_STR
            }else{
                this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
            }
        }

        if((tc == "C*") || (tc == "C*!")){
            if(TEA_RunTime.is_empty(tpe_str)){
                this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
            }
            else {
                var vaults = tpe_str.split(TEA_RunTime.TIPED)
                for(let vault of vaults){
                    this.VAULTS[vault] = TEA_RunTime.EMPTY_STR
                }
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


    // PROCESS: F:
    process_f(ti, ai, _ATPI){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "F"){
            var params = tpe_str.split(TEA_RunTime.TIPED)

            if(params.length == 0){
                return [io,_ATPI]
            }

            if(params.length == 1){
                this.debug(`[ERROR] Instruction ${ti} Invoked with No Labels!`)
                this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(LABELBLOCKS)}`)
                throw new Error(`[ERROR] Fork Instruction ${ti} Invoked with No Labels!`)
            }

            if(params.length == 2){
                var rtest = params[0] // the pattern
                var tblock = params[1] // where to jump to if matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(LABELBLOCKS)}`)
                    throw new Error("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                }

                if (
                    new RegExp(rtest).test(io) ||                     // equivalent to re.search
                    io.match(new RegExp(`^${rtest}`)) ||              // equivalent to re.match
                    rtest === io ||                                   // exact string match
                    io.includes(rtest)                                // substring presence
                ) {
                    _ATPI = this.LABELBLOCKS[tblock];
                } else {
                    _ATPI += 1;
                }

                return [io,_ATPI]
            }
            else {
                var rtest = params[0] // the pattern
                var tblock = params[1] // where to jump if matched
                var fblock = params[2] // where to jump if not matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(LABELBLOCKS)}`)
                    throw new Error("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                }
                if (!this.LABELBLOCKS.hasOwnProperty(fblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${fblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(LABELBLOCKS)}`)
                    throw new Error("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                }

                if (
                    new RegExp(rtest).test(io) ||                     // equivalent to re.search
                    io.match(new RegExp(`^${rtest}`)) ||              // equivalent to re.match
                    rtest === io ||                                   // exact string match
                    io.includes(rtest)                                // substring presence
                ) {
                    _ATPI = this.LABELBLOCKS[tblock];
                } else {
                    _ATPI = this.LABELBLOCKS[fblock];
                }

                return [io,_ATPI]
            }
        }

        if(tc == "F!"){
            var params = tpe_str.split(TEA_RunTime.TIPED)

            if(params.length == 0){
                return [io,_ATPI]
            }

            if(params.length == 1){
                this.debug(`[ERROR] Instruction ${ti} Invoked with No Labels!`)
                this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(LABELBLOCKS)}`)
                throw new Error(`[ERROR] Fork Instruction ${ti} Invoked with No Labels!`)
            }

            if(params.length == 2){
                var rtest = params[0] // the pattern
                var tblock = params[1] // where to jump to if NOT matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(LABELBLOCKS)}`)
                    throw new Error("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                }

                if (!(
                    new RegExp(rtest).test(io) ||                     // equivalent to re.search
                    io.match(new RegExp(`^${rtest}`)) ||              // equivalent to re.match
                    rtest === io ||                                   // exact string match
                    io.includes(rtest)                                // substring presence
                )) {
                    _ATPI = this.LABELBLOCKS[tblock];
                } else {
                    _ATPI += 1;
                }

                return [io,_ATPI]
            }
            else {
                var rtest = params[0] // the pattern
                var tblock = params[1] // where to jump if matched
                var fblock = params[2] // where to jump if not matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(LABELBLOCKS)}`)
                    throw new Error("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                }
                if (!this.LABELBLOCKS.hasOwnProperty(fblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${fblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(LABELBLOCKS)}`)
                    throw new Error("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                }

                if (!(
                    new RegExp(rtest).test(io) ||                     // equivalent to re.search
                    io.match(new RegExp(`^${rtest}`)) ||              // equivalent to re.match
                    rtest === io ||                                   // exact string match
                    io.includes(rtest)                                // substring presence
                )) {
                    _ATPI = this.LABELBLOCKS[tblock];
                } else {
                    _ATPI = this.LABELBLOCKS[fblock];
                }

                return [io,_ATPI]
            }

        }

        _ATPI += 1 //move to next instruction if fork didn't evaluate...
        return [io,_ATPI];
    }

	// PROCESS: G:
    process_g(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "G"){
            var params = tpe_str.split(TEA_RunTime.TIPED)
            if(params.length == 0){
                io = io.replace(new RegExp(TEA_RunTime.RE_WHITE_SPACE,'g'), TEA_RunTime.EMPTY_STR);
            }
            if(params.length == 1){
                var glue = this.extract_str(params[0])
                io = io.replace(new RegExp(TEA_RunTime.RE_WHITE_SPACE, 'g'), glue);
            }
            if(params.length == 2){
                var regex = params[1]
                var glue = this.extract_str(params[0])
                io = io.replace(new RegExp(regex, 'g'), glue);
            }
        }

        if(tc == "G!"){
            var params = tpe_str.split(TEA_RunTime.TIPED)
            if(params.length == 0){
                // INERT: do nothing
            }
            if(params.length == 1){
                var glue = this.extract_str(params[0])
                io = io.replace(new RegExp(TEA_RunTime.RE_WHITE_SPACE_N_PUNCTUATION,'g'), glue);
            }
        }

        if(tc == "G*"){
            var params = tpe_str.split(TEA_RunTime.TIPED)
            if(params.length < 3){
                // INERT: do nothing
            }
            else{
                var glue = this.extract_str(params[0])
                var vaults = params.slice(1)
                var vals = []
                for(let v of vaults){
                    vals.push(this.vault_get(v))
                }
                io = vals.join(glue)
            }
        }

        if(tc == "G*!"){
            var params = tpe_str.split(TEA_RunTime.TIPED)
            if(params.length < 3){
                // INERT: do nothing
            }
            else{
                var glue = this.vault_get(this.extract_str(params[0]))
                var vaults = params.slice(1)
                var vals = []
                for(let v of vaults){
                    vals.push(this.vault_get(v))
                }
                io = vals.join(glue)
            }
        }
        return io
    }


	// PROCESS: H:
    process_h(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "H"){
            if(TEA_RunTime.is_empty(tpe_str)){
                io = Array.from(io).join(TEA_RunTime.SINGLE_SPACE_CHAR);
            }
            else {
				const regex = new RegExp(`(?=${tpe_str})`, 'g');
				const parts = io.split(regex);
				io = parts.join(TEA_RunTime.SINGLE_SPACE_CHAR);
            }
        }
        if(tc == "H!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                io = Array.from(io).join(TEA_RunTime.NL);
            }
            else{
				const regex = new RegExp(`(?=${tpe_str})`, 'g');
				const parts = io.split(regex);
				io = parts.join(TEA_RunTime.NL);
            }
        }
        if(tc == "H*"){
            const params = tpe_str.split(TEA_RunTime.TIPED, 3);
            if(params.length < 2){
                // INERT
            }
            else{
                var vault = params[0]
                var vregex = params[1]
                var input_str = this.vault_get(vault)
                var regex = this.vault_get(vregex)
				regex = new RegExp(`(?=${regex})`, 'g');
				const parts = input_str.split(regex);
				io = parts.join(TEA_RunTime.SINGLE_SPACE_CHAR);
            }
        }
        if(tc == "H*!"){
            const params = tpe_str.split(TEA_RunTime.TIPED, 3);
            if(params.length < 2){
                // INERT
            }
            else{
                var vault = params[0]
                var vregex = params[1]
                var input_str = this.vault_get(vault)
                var regex = this.vault_get(vregex)
				regex = new RegExp(`(?=${regex})`, 'g');
				const parts = input_str.split(regex);
				io = parts.join(TEA_RunTime.NL);
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


    // PROCESS: J:
    process_j(ti, ai, _ATPI){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "J"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
            }
            else{
                jblock = tpe_str
                if (!this.LABELBLOCKS.hasOwnProperty(jblock)) {
                    this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${jblock}]`)
                    this.debug("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                }
                _ATPI = LABELBLOCKS[jblock]
                return [io,_ATPI]
            }
        }
        if(tc == "J!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                _ATPI = 0 // start of program
                return [io,_ATPI]
            }
            else{
                // INERT
            }
        }

        _ATPI += 1 // move to next instruction if jump didn't evaluate...
        return [io,_ATPI]
    }

    //PROCESS K:
    process_k(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(TEA_RunTime.is_empty(io)){
            return io // essentially, INERT
        }

        if(tc == "K"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
            }
            else {
                var regex = tpe_str
                var inputLines = io.split(TEA_RunTime.NL)
                var keptLines = []
                for(let line of inputLines){
                    if (
                        new RegExp(regex).test(line) ||                     // equivalent to re.search
                        line.match(new RegExp(`^${regex}`)) ||              // equivalent to re.match
                        regex === line ||                                   // exact string match
                        line.includes(regex)                                // substring presence
                    ) {
                            keptLines.push(line)
                    }
                }
                io = keptLines.join(TEA_RunTime.NL)
            }
        }

        if(tc == "K!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
            }
            else{
                var regex = tpe_str
                var inputLines = io.split(TEA_RunTime.NL)
                var keptLines = []
                for(let line of inputLines){
                    if (!(
                        new RegExp(regex).test(line) ||                     // equivalent to re.search
                        line.match(new RegExp(`^${regex}`)) ||              // equivalent to re.match
                        regex === line ||                                   // exact string match
                        line.includes(regex)                                // substring presence
                    )) {
                            keptLines.push(line)
                    }
                }
                io = keptLines.join(TEA_RunTime.NL)
            }
        }

        if(tc == "K*"){
            var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 2)
            if(params.length < 2){
                // INERT
            }
            else{
                var vault = params[0]
                var regex = params[1]
                var input_str = this.vault_get(vault)

                var inputLines = input_str.split(TEA_RunTime.NL)
                var keptLines = []
                for(let line of inputLines){
                    if (
                        new RegExp(regex).test(line) ||                     // equivalent to re.search
                        line.match(new RegExp(`^${regex}`)) ||              // equivalent to re.match
                        regex === line ||                                   // exact string match
                        line.includes(regex)                                // substring presence
                    ) {
                            keptLines.push(line)
                    }
                }
                io = keptLines.join(TEA_RunTime.NL)
            }
        }

        if(tc == "K*!"){
            var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 2)
            if(params.length < 2){
                // INERT
            }
            else{
                var vault = params[0]
                var regex = params[1]
                var input_str = this.vault_get(vault)

                var inputLines = input_str.split(TEA_RunTime.NL)
                var keptLines = []
                for(let line of inputLines){
                    if (!(
                        new RegExp(regex).test(line) ||                     // equivalent to re.search
                        line.match(new RegExp(`^${regex}`)) ||              // equivalent to re.match
                        regex === line ||                                   // exact string match
                        line.includes(regex)                                // substring presence
                    )) {
                            keptLines.push(line)
                    }
                }
                io = keptLines.join(TEA_RunTime.NL)
            }
        }
        return io
    }



    //PROCESS L:
    process_l(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "L"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // do nothing..
            }
            else {
                var lBlockName = tpe_str
                // prevent duplication of block names
                if (!this.LABELBLOCKS.hasOwnProperty(lBlockName)) {
                    // store current code position under given label block name
                    // but most likely, has already been done during TSRC pre-processing/validation
                    LABELBLOCKS[lBlockName] = ATPI
                }
            }
        }

        if(tc == "L!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // do nothing..
            }
            else{
                var labels = tpe_str.split(TEA_RunTime.TIPED)
                for(let lBlockName of labels){
                    // prevent duplication of block names
                    if (!this.LABELBLOCKS.hasOwnProperty(lBlockName)) {
                        LABELBLOCKS[lBlockName] = ATPI
                    }
                }
            }
        }

        return io
    }

    //PROCESS M:
    process_m(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "M"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? tpe_str : ai
            io = this.util_mirror_words(input_str)
        }
        if(tc == "M!"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? tpe_str : ai
            io = this.util_mirror_chars(input_str)
        }
        if(tc == "M*"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? this.vault_get(tpe_str) : ai
            if(TEA_RunTime.is_empty(tpe_str)){
                if (!this.VAULTS.hasOwnProperty(TEA_RunTime.vDEFAULT_VAULT)) {
                    debug(`[ERROR] Instruction ${ti} trying to access DEFAULT VAULT before it is set!`)
                    throw new Error("[MEMORY ERROR] ATTEMPT to ACCESS unset DEFAULT VAULT")
                }
                input_str = this.vault_get(TEA_RunTime.vDEFAULT_VAULT)
            }
            io = this.util_mirror_words(input_str)
        }
        if(tc == "M*!"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? this.vault_get(tpe_str) : ai
            if(TEA_RunTime.is_empty(tpe_str)){
                if (!this.VAULTS.hasOwnProperty(TEA_RunTime.vDEFAULT_VAULT)) {
                    debug(`[ERROR] Instruction ${ti} trying to access DEFAULT VAULT before it is set!`)
                    throw new Error("[MEMORY ERROR] ATTEMPT to ACCESS unset DEFAULT VAULT")
                }
                input_str = this.vault_get(TEA_RunTime.vDEFAULT_VAULT)
            }
            io = this.util_mirror_chars(input_str)
        }
        return io
    }


    //PROCESS N:
    process_n(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if((tc == "N") || (tc == "N!")){
            if(TEA_RunTime.is_empty(tpe_str)){
                var limit = 9
                io = String(this.util_gen_rand(limit))
            }
            else{
               var params  = tpe_str.split(TEA_RunTime.TIPED)
                if(params.length == 1){
                   var limit = params[0]
                   io = String(this.util_gen_rand(Number(limit)))
                }
                if(params.length == 2){
                   var [limit,llimit] = params
                   io = String(this.util_gen_rand(Number(limit), Number(llimit)))
                }
                if(params.length == 3){
                   var [limit,llimit,size] = params
                   var nums = []
                   for(var i=0; i < Number(size); i++){
                       nums.push(String(this.util_gen_rand(Number(limit), Number(llimit))))
                   }
                   io = nums.join(TEA_RunTime.GLUE)
                }
                if(params.length == 4){
                   var [limit,llimit,size,glue] = params
                   var nums = []
                   for(var i=0; i < Number(size); i++){
                       nums.push(String(this.util_gen_rand(Number(limit), Number(llimit))))
                   }
                   io = nums.join(glue)
                }
            }
        }

        if((tc == "N*") || (tc == "N*!")){
            if(TEA_RunTime.is_empty(tpe_str)){
                return io
            }
            else{
               var params  = tpe_str.split(TEA_RunTime.TIPED)
                if(params.length == 1){
                   var vlimit = params[0]
                   var limit = !TEA_RunTime.is_empty(vlimit) ? this.vault_get(vlimit) : 9
                   io = String(this.util_gen_rand(Number(limit)))
                }
                if(params.length == 2){
                   var [limit,llimit] = params

                   var vlimit = limit
                   limit = !TEA_RunTime.is_empty(vlimit) ? this.vault_get(vlimit) : 9

                   var vllimit = llimit
                   llimit = !TEA_RunTime.is_empty(vllimit) ? this.vault_get(vllimit) : 0

                   io = String(this.util_gen_rand(Number(limit), Number(llimit)))
                }
                if(params.length == 3){
                   var [limit,llimit,size] = params

                   var vlimit = limit
                   limit = !TEA_RunTime.is_empty(vlimit) ? this.vault_get(vlimit) : 9

                   var vllimit = llimit
                   llimit = !TEA_RunTime.is_empty(vllimit) ? this.vault_get(vllimit) : 0

                   var vsize = size
                   size = !TEA_RunTime.is_empty(vsize) ? this.vault_get(vsize) : 1

                   var nums = []
                   for(var i=0; i < Number(size); i++){
                       nums.push(String(this.util_gen_rand(Number(limit), Number(llimit))))
                   }
                   io = nums.join(TEA_RunTime.GLUE)
                }
                if(params.length == 4){
                   var [limit,llimit,size,glue] = params

                   var vlimit = limit
                   limit = !TEA_RunTime.is_empty(vlimit) ? this.vault_get(vlimit) : 9

                   var vllimit = llimit
                   llimit = !TEA_RunTime.is_empty(vllimit) ? this.vault_get(vllimit) : 0

                   var vsize = size
                   size = !TEA_RunTime.is_empty(vsize) ? this.vault_get(vsize) : 1

                   var vglue = glue
                   glue = !TEA_RunTime.is_empty(vglue) ? this.vault_get(vglue) : TEA_RunTime.GLUE

                   var nums = []
                   for(var i=0; i < Number(size); i++){
                       nums.push(String(this.util_gen_rand(Number(limit), Number(llimit))))
                   }
                   io = nums.join(glue)
                }
            }
        }
        return io
    }


    //PROCESS O:
    process_o(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "O"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? tpe_str : ai
            io = this.util_sort_words(input_str)
        }
        if(tc == "O!"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? tpe_str : ai
            io = this.util_sort_chars(input_str)
        }
        if(tc == "O*"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? this.vault_get(tpe_str) : ai
            io = this.util_sort_words(input_str)
        }
        if(tc == "O*!"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? this.vault_get(tpe_str) : ai
            io = this.util_sort_chars(input_str)
        }
        return io
    }


    //PROCESS P:
    process_p(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

		if(tc == "P"){
            if(TEA_RunTime.is_empty(tpe_str)){
				io = this.util_gen_permutations(ai)
            }
			else{
				var params = tpe_str.split(TEA_RunTime.TIPED)
				if(params.length == 1){
                    var value = this.extract_str(params[0])
					io = this.util_gen_permutations(value)
                }
                else if(params.length == 2){
                    var value = this.extract_str(params[0])
                    var glue = this.extract_str(params[1])
                    io = this.util_gen_permutations(value, glue)
                }
                else if(params.length == 3){
                    var value = this.extract_str(params[0])
                    var glue = this.extract_str(params[1])
                    var limit = this.extract_str(params[2])
                    io = this.util_gen_permutations(value, glue, Number(limit))
                }
                else if(params.length == 4){
                    var value = this.extract_str(params[0])
                    var glue = this.extract_str(params[1])
                    var limit = this.extract_str(params[2])
                    var llimit = this.extract_str(params[3])
                    io = this.util_gen_permutations(value, glue, Number(limit), Number(llimit))
                }
				else{
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
					throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
            }
        }

		if(tc == "P!"){
            if(TEA_RunTime.is_empty(tpe_str)){
				io = this.util_gen_rand_string()
            }
			else{
				var params = tpe_str.split(TEA_RunTime.TIPED)
				if(params.length == 1){
                    var size = this.extract_str(params[0])
					io = this.util_gen_rand_string(Number(size))
                }
                else if(params.length == 2){
                    var size = this.extract_str(params[0])
                    var alphabet = this.extract_str(params[1])
					io = this.util_gen_rand_string(Number(size), alphabet)
                }
                else if(params.length == 3){
                    var size = this.extract_str(params[0])
                    var alphabet = this.extract_str(params[1])
                    var glue = this.extract_str(params[2])
					io = this.util_gen_rand_string(Number(size), alphabet, glue)
                }
				else {
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
					throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
            }
        }

		if(tc == "P*"){
            if(TEA_RunTime.is_empty(tpe_str)){
				// INERT
            }
			else{
				var params = tpe_str.split(TEA_RunTime.TIPED)
				var vNAME = this.extract_str(params[0])
				var input_str = this.vault_get(vNAME)
				if(params.length == 1){
					io = this.util_gen_permutations(input_str)
                }
                else if(params.length == 2){
                    var vGlue = this.extract_str(params[1])
                    var glue  = this.vault_get(vGlue)
					io = this.util_gen_permutations(input_str, glue)
                }
                else if(params.length == 3){
                    var vGlue = this.extract_str(params[1])
                    var glue  = this.vault_get(vGlue)
                    var vLimit = this.extract_str(params[2])
                    var limit  = Number(this.vault_get(vLimit))
					io = this.util_gen_permutations(input_str, glue, limit)
                }
                else if(params.length == 4){
                    var vGlue = this.extract_str(params[1])
                    var glue  = this.vault_get(vGlue)
                    var vLimit = this.extract_str(params[2])
                    var limit  = Number(this.vault_get(vLimit))
                    var vLLimit = this.extract_str(params[3])
                    var llimit  = Number(this.vault_get(vLLimit))
					io = this.util_gen_permutations(input_str, glue, limit, llimit)
                }
				else {
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
					throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
            }
        }

        if(tc == "P*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
				// INERT
            }
            else {
                var params = tpe_str.split(TEA_RunTime.TIPED)
                var vSIZE = this.extract_str(params[0])
                var size = this.vault_get(vSIZE)
				if(params.length == 1){
                    io = this.util_gen_rand_string(Number(size))
                }
                else if(params.length == 2){
                    var vALPHABET = this.extract_str(params[1])
                    var alphabet = this.vault_get(vALPHABET)
                    io = this.util_gen_rand_string(Number(size), alphabet)
                }
                else if(params.length == 3){
                    var vALPHABET = this.extract_str(params[1])
                    var alphabet = this.vault_get(vALPHABET)
                    var vGLUE = this.extract_str(params[2])
                    var glue = this.vault_get(vGLUE)
                    io = this.util_gen_rand_string(Number(size), alphabet, glue)
                }
                else{
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
					throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
            }
        }

		return io
    }



    // PROCESS: Q:
    process_q(ti, ai, _ATPI){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(tc == "Q"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    this.debug("-- Quiting Program because AI is EMPTY")
                    _ATPI = this.INSTRUCTIONS.length + 1 // points to end of program
                }
            }
            else {
                var qregex_test = tpe_str
                if (
                    new RegExp(qregex_test).test(io) ||                     // equivalent to re.search
                    io.match(new RegExp(`^${qregex_test}`)) ||              // equivalent to re.match
                    qregex_test === io ||                                   // exact string match
                    io.includes(qregex_test)                                // substring presence
                ) {
                    this.debug(`Quiting Program because AI[${ai}] matches quit pattern[${qregex_test}]`)
                    _ATPI = this.INSTRUCTIONS.length + 1
                }
            }
        }

        if(tc == "Q!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                this.debug("-- UNCONDITIONALLY Quiting Program")
                _ATPI = this.INSTRUCTIONS.length + 1
                return [io,_ATPI]
            }
            else {
                var qregex_test = tpe_str
                if (!(
                    new RegExp(qregex_test).test(io) ||                     // equivalent to re.search
                    io.match(new RegExp(`^${qregex_test}`)) ||              // equivalent to re.match
                    qregex_test === io ||                                   // exact string match
                    io.includes(qregex_test)                                // substring presence
                )) {
                    this.debug(`Quiting Program because AI[${ai}] does NOT match non-quit pattern[${qregex_test}]`)
                    _ATPI = this.INSTRUCTIONS.length + 1
                }
            }
        }

        if(tc == "Q*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty_dict(this.VAULTS)){
                    this.debug("-- Quiting Program because NO VAULTS were set")
                    _ATPI = this.INSTRUCTIONS.length + 1
                }
            }
            else{
                var vregex = tpe_str
                var qregex_test = this.vault_get(vregex)
                if (
                    new RegExp(qregex_test).test(io) ||                     // equivalent to re.search
                    io.match(new RegExp(`^${qregex_test}`)) ||              // equivalent to re.match
                    qregex_test === io ||                                   // exact string match
                    io.includes(qregex_test)                                // substring presence
                ) {
                    this.debug(`Quiting Program because AI[${ai}] matches quit pattern[${qregex_test}]`)
                    _ATPI = this.INSTRUCTIONS.length + 1
                }
            }
        }

        if(tc == "Q*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if (!this.VAULTS.hasOwnProperty(TEA_RunTime.vDEFAULT_VAULT)) {
                    this.debug("-- Quiting Program because the DEFAULT VAULT  is not set")
                    _ATPI = this.INSTRUCTIONS.length + 1
                }
                else{
                    var default_vault_val = this.vault_get(TEA_RunTime.vDEFAULT_VAULT)
                    if(TEA_RunTime.is_empty(default_vault_val)){ // possible if c!: was invoked earlier on
                        this.debug("-- Quiting Program because the DEFAULT VAULT  is EMPTY!")
                        _ATPI = this.INSTRUCTIONS.length + 1
                    }else{
                        _ATPI += 1 // first move to next instruction if we didn't quit
                    }
                }
                return [io,_ATPI]
            }
            else {
                var vregex = tpe_str
                var qregex_test = this.vault_get(vregex)
                if (!(
                    new RegExp(qregex_test).test(io) ||                     // equivalent to re.search
                    io.match(new RegExp(`^${qregex_test}`)) ||              // equivalent to re.match
                    qregex_test === io ||                                   // exact string match
                    io.includes(qregex_test)                                // substring presence
                )) {
                    this.debug(`Quiting Program because AI[${ai}] does NOT match non-quit pattern[${qregex_test}]`)
                    _ATPI = this.INSTRUCTIONS.length + 1
                }
            }
        }

        _ATPI += 1 // move to next instruction if we didn't quit
        return [io,_ATPI]
    }


    //PROCESS R:
    process_r(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(TEA_RunTime.is_empty(io)){
            return io // essentially, INERT
        }

        if(tc == "R"){
            if(TEA_RunTime.is_empty(tpe_str)){
                io = TEA_RunTime.util_braille_projection1(io)
            }
            else {
                var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 1)
                if(params.length != 2){
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                    throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
                else {
                    var regex = new RegExp(params[0])
                    var replacement = this.extract_str(params[1])
                    io = io.replace(regex, replacement);
                }
            }
        }
        if(tc == "R!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                io = TEA_RunTime.util_braille_projection2(io)
            }
            else{
                var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 1)
                if(params.length != 2){
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                    throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
                else{
                    var regex = new RegExp(params[0],'g')
                    var replacement = this.extract_str(params[1])
                    io = io.replace(regex, replacement);
                }
            }
        }

        if(tc == "R*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
            }
            else{
                var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 2)
                if((params.length == 2) || (params.length > 3)){
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                    throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
                else{
                    if(params.length == 1){
                        var vault = params[0]
                        var input_str = this.vault_get(vault)
                        io = TEA_RunTime.util_braille_projection1(input_str)
                    }
                    else{
                        var vault = params[0]
                        var regex = new RegExp(params[1])
                        var replacement = this.extract_str(params[2])
                        var input_str = this.vault_get(vault)
                        io = input_str.replace(regex, replacement);
                    }
                }
            }
        }

        if(tc == "R*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
            }
            else{
                var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 2)
                if((params.length == 2) || (params.length > 3)){
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                    throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
                else{
                    if(params.length == 1){
                        var vault = params[0]
                        var input_str = this.vault_get(vault)
                        io = TEA_RunTime.util_braille_projection2(input_str)
                    }
                    else{
                        var vault = params[0]
                        var regex = new RegExp(params[1],'g')
                        var replacement = this.extract_str(params[2])
                        var input_str = this.vault_get(vault)
                        io = input_str.replace(regex, replacement);
                    }
                }
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

                    // F: Fork
                    case "F": {
                        [this.OUTPUT,this.ATPI] = this.process_f(instruction, this.OUTPUT, this.ATPI)
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        //ATPI += 1 # f: updates ATPI directly...
                        continue
                    }
                    // G: Glue
                    case "G": {
                        this.OUTPUT = String(this.process_g(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }

                    // H: Hew
                    case "H": {
                        this.OUTPUT = String(this.process_h(instruction, this.OUTPUT))
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
                    // J: Jump
                    case "J": {
                        [this.OUTPUT,this.ATPI] = this.process_j(instruction, this.OUTPUT, this.ATPI)
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        //ATPI += 1 # j: updates ATPI directly...
                        continue
                    }
                    // K: Keep
                    case "K": {
                        this.OUTPUT = String(this.process_k(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }

                    // L: Label
                    case "L": {
                        this.OUTPUT = String(this.process_l(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // M: Mirror
                    case "M": {
                        this.OUTPUT = String(this.process_m(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // N: Number
                    case "N": {
                        this.OUTPUT = String(this.process_n(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // O: Order
                    case "O": {
                        this.OUTPUT = String(this.process_o(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // P: Permutate
                    case "P": {
                        this.OUTPUT = String(this.process_p(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // Q: Quit
                    case "Q": {
                        [this.OUTPUT,this.ATPI] = this.process_q(instruction, this.OUTPUT, this.ATPI)
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        //ATPI += 1 # q: updates ATPI directly...
                        continue
                    }

                    // R: Replace
                    case "R": {
                        this.OUTPUT = String(this.process_r(instruction, this.OUTPUT))
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
