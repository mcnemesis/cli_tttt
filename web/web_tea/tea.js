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
        static OBSCURE_RC_TIPED = "=TIPED=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=TIPED="
        static OBSCURE_RC_STR_DEL1 = "=STR_DEL1=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=STR_DEL1="
        static STR_DEL1 = '"'
        static TID = "|"
        //static NL = "\n"
        static NL = this.getPlatformLineSeparator()
        static COMH = "#"
        static TCD = ":"
        static TIPED = ":"
        static RETEASTRING1 = /\{.*?\}/s;
        static RETEASTRING2 = /"[^"]*?"/s;
        static RETEAPROGRAM = /([a-zA-Z]\*?!?\.?:.*(:.*)*\|?)+(#.*)*/
        //static RETI = /[ ]*?[a-zA-Z]\.?\*?!?:.*?/
        static RETI = /^\s*[a-zA-Z](?:[\.!\*]|(?:\*!)|(?:\*\.)|(?:!\.)|(?:\*!\.))?:.*$/
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
        this.VERSION = "1.3.3" // this is the version for the WEB TEA implementation
        this.TEA_HOMEPAGE = "https://tea.nuchwezi.com"
        this.status_MESSAGE = "TEA consists of a total of just 26 basic primitive command spaces A:, B:,...., to Z: and each of those might have variants such as A!:, R.:, Z*: etc. that means the command is decorated with one or more of the standard 3 qualifiers: {!,*,.}. Details and how these commands work are in the official documentation for this programming language; the TEA TAZ.";
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

    // reverse TEA String Masking
    unmask_str(val){
        return val
          .replace(new RegExp(TEA_RunTime.OBSCURE_RC_NL,'g'), TEA_RunTime.NL)
          .replace(new RegExp(TEA_RunTime.OBSCURE_RC_COM,'g'), TEA_RunTime.COMH)
          .replace(new RegExp(TEA_RunTime.OBSCURE_RC_TID, 'g'), TEA_RunTime.TID)
          .replace(new RegExp(TEA_RunTime.OBSCURE_RC_TIPED, 'g'), TEA_RunTime.TIPED)
          .replace(new RegExp(TEA_RunTime.OBSCURE_RC_STR_DEL1, 'g'), TEA_RunTime.STR_DEL1);
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

    // Pre-process TEA CODE
    pre_process_TSRC(tsrc){
        // for now, trim all leading and trailing white space
        return tsrc.trim()
    }

    // Function to replace special symbols with OBSCURE Patterns
	maskTEASTRING(matched) {
	  return matched
		.replace(/"/g, TEA_RunTime.OBSCURE_RC_STR_DEL1)
		.replace(/\n/g, TEA_RunTime.OBSCURE_RC_NL)
		.replace(/#/g, TEA_RunTime.OBSCURE_RC_COM)
		.replace(/\|/g, TEA_RunTime.OBSCURE_RC_TID)
		.replace(/\:/g, TEA_RunTime.OBSCURE_RC_TIPED);
	}

    // Clean TEA CODE:
    // Essentially, eliminate all TEA Opaque Lines:
    // - TEA Comments
    // - Non-TEA Instruction Lines
    // and put each TI on its own line, with any leading whitespace removed
    clean_TSRC(tsrc){
        if(TEA_RunTime.is_empty(tsrc)){
            return tsrc
        }
        // remove trailing whitespace
        var _tsrc = tsrc.trim()
        // first, fold multi-line TIL strings
        _tsrc = _tsrc.replace(new RegExp(TEA_RunTime.RETEASTRING1, 'gs'), match => this.maskTEASTRING(match));
        _tsrc = _tsrc.replace(new RegExp(TEA_RunTime.RETEASTRING2, 'gs'), match => this.maskTEASTRING(match));
        // remove all TEA comments
		const reTCOM = /#[^\n]*/g
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
        this.debug(`#${_tsrc_lines.length} of ${JSON.stringify(_tsrc_lines)}`)
        var reTI = TEA_RunTime.RETI // already a regex
        // remove all non-TIL lines
        //this.debug(`|>>> ${JSON.stringify(_tsrc_lines)}`)
		const _tsrc_til_only = _tsrc_lines
		  .filter(line => reTI.test(line))
		  .map(line => line.trimStart());

        //this.debug(`>>> ${JSON.stringify(_tsrc_til_only)}`)
        if(this.DEBUG){
            // reverse string masking...
			const _tsrc_til_only_show = _tsrc_til_only.map(l =>
			  l
				.replace(new RegExp(TEA_RunTime.OBSCURE_RC_NL,'g'), TEA_RunTime.NL)
				.replace(new RegExp(TEA_RunTime.OBSCURE_RC_COM, 'g'), TEA_RunTime.COMH)
				.replace(new RegExp(TEA_RunTime.OBSCURE_RC_TID, 'g'), TEA_RunTime.TID)
			);

            //this.debug(`##${_tsrc_til_only_show.length} of ${JSON.stringify(_tsrc_til_only_show)}`)
        }

        return _tsrc_til_only
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
                                this.debug(`[ERROR] Instruction ${i} trying to duplicate an Existenting Block Name [${cleanlBlockName}]`)
                                this.debug(`[INFO] Current L-BLOCKS: \n${JSON.stringify(labelblocks)}`)
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
            this.debug(`TEA CODE ERRORS FOUND:\n${errors.join(TEA_RunTime.NL)}`)
            return
        }
        else {
            this.debug("+++[NO TEA CODE ERRORS FOUND YET]")
        }
        var otil = this.clean_TSRC(tsrc)
        this.debug(`CLEAN TEA CODE TO PROCESS:\n${otil.join(TEA_RunTime.NL)}`)

        this.debug(`--[#${otil.length} TEA INSTRUCTIONS FOUND]---`)
        return otil
    }



	util_gen_rand(limit, ll=0){
		return limit === ll
			? limit
			: Math.floor(Math.random() * (limit - ll + 1)) + ll;
	}

    util_salt_string(val, salt, injection_limit = null, llimit=null){
        var l_val = val.length
        if(l_val == 0){
            return val // nothing to salt
        }
        l_val = l_val + 1 // so the salt can also become a suffix
        var u_limit = (injection_limit != null) && (injection_limit < l_val) ? injection_limit : l_val
        var injection_index = this.util_gen_rand(u_limit, llimit || 0)
        this.debug(`Salting ${val} of len[${val.length}] at index[${injection_index}]--> ${val.slice(0,injection_index)} + ${salt} + ${val.slice(injection_index)}`)
        var salted_val = String(val.slice(0,injection_index) + salt + val.slice(injection_index))
        return salted_val
    }

    util_unsalt_string(val, salt_pattern=null, deletion_limit = null, llimit=null){
        var l_val = val.length
        if(l_val == 0){
            return val // nothing to unsalt
        }
        if(salt_pattern == null){
            var deletion_index = this.util_gen_rand(l_val)
            var unsalted_val = String(val.slice(0,deletion_index) + val.slice(deletion_index + 1))
            return unsalted_val
        }
        else {
            // get all sections matching pattern in val
			const matches = [...val.matchAll(new RegExp(salt_pattern, 'g'))];
			const l_matches = matches.length;
            if(l_matches == 0){
                return val // nothing to unsalt
            }
            var d_limit = (deletion_limit != null) && (deletion_limit < l_matches) ? deletion_limit : l_matches
            var deletion_index = this.util_gen_rand(d_limit, llimit || 0)
            // Get the start and end positions of the chosen match
            const match = matches[deletion_index];
            const start = match.index;
            const end = match.index + match[0].length;
            this.debug(`UnSalting ${val} of len[${val.length}] between index[${start} and ${end}]--> ${val.slice(0,start)} + ${val.slice(end)}`)
            var unsalted_val = val.slice(0, start) + val.slice(end);
            return unsalted_val
        }
    }

	// util for str.title() equivalent
	toTitleCase(str) {
	  return str
		.toLowerCase()
		.split(" ")
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
	}


    util_get_environment(){
		const now = new Date();

		const weekday = now.toLocaleString('en-US', { weekday: 'long' });
		const day = now.toLocaleString('en-US', { day: '2-digit' });
		const month = now.toLocaleString('en-US', { month: 'long' });
		const year = now.getFullYear();
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');

		const dateStr = `${weekday}, ${day} ${month} ${year}`;
		const timeStr = `${hours}:${minutes}`;

        var config = {
                "PLATFORM": "WEB",
                "DATE": dateStr,
                "TIME": timeStr
                }

        return config
    }

    util_system(cmd, cmdData, show_errors=false){
        var result = null
		try {
			this.debug(`***[SYSTEM CMD]: EVALUATING via JavaScript:\n\n---[START CMD]---\n\n const AI = ${JSON.stringify(cmdData)}; ${cmd} \n\n---[END CMD]---`)
			result = eval(`const AI = ${JSON.stringify(cmdData)}; ${cmd}`);
			this.debug(`***[SYSTEM CMD RESULT]: ${result}`)
		} catch (error) {
			this.debug(`***[SYSTEM CMD ERROR]: ${error.message}`)
			if(show_errors){
				result = `[ERROR]: ${error}`
            }
		}
        return !TEA_RunTime.is_empty(result)? result : TEA_RunTime.EMPTY_STR
    }

    /////////////////////
    // MORE UTILS
    /////////////////////

	static getPlatformLineSeparator() {
		const platform = navigator.platform || navigator.userAgent;

		if (/Win/.test(platform)) {
			return '\n'; // Windows
		} else {
			return '\n'; // Unix-like: Linux, macOS, etc.
		}
	}


    util_fix_url(url){
        if(!url.startsWith("http")){
            return `http://${url}`
        }
        return url
    }

	isDictionary(data) {
		return (
			typeof data === 'object' &&
			data !== null &&
			!Array.isArray(data) &&
			Object.prototype.toString.call(data) === '[object Object]'
		);
	}

	// TODO: what if the browser does not allow us synchronous http calls?
    // FOR NOW, we need it.
	synchronousHTTPGET(full_url) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', full_url, false); // false makes it synchronous
		xhr.send(null);

		if (xhr.status === 200) {
			return xhr.responseText; // UTF-8 by default
		} else {
			throw new Error(`Request failed: ${xhr.statusText}`);
		}
	}

    util_web_get(url, data=null, no_recurse=false){
        var result = null
        try{

            var full_url = url
            if(data != null){
                if(this.isDictionary(data)){
                    // Encode the data as query parameters
                    const query_string = new URLSearchParams(data).toString();
                    full_url = `${url}?${query_string}`
                }
            }

            result = this.synchronousHTTPGET(full_url) // io-blocking
        }
        catch(error){
            var _result = null
            if(!no_recurse){
                _result = this.util_web_get(this.util_fix_url(url), data, true)
            }

            if(_result != null){
                result = _result
            }
            else{
                result = `[ERROR]: ${error}`
            }
        }
        return result
    }

	isDictionary(data) {
		return (
			typeof data === 'object' &&
			data !== null &&
			!Array.isArray(data) &&
			Object.prototype.toString.call(data) === '[object Object]'
		);
	}

	synchronousHTTPPOST(url, data) {
		let encoded_data = null;

		if (this.isDictionary(data)) {
			encoded_data = new URLSearchParams(data).toString();
		} else if (typeof data === 'string') {
			encoded_data = data;
		} 

		const xhr = new XMLHttpRequest();
		xhr.open('POST', url, false); // false = synchronous
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.send(encoded_data); // might send data as null?

		if (xhr.status === 200) {
			return xhr.responseText; // UTF-8 decoded by default
		} else {
			throw new Error(`Request failed: ${xhr.statusText}`);
		}
	}

    util_web_post(url, data=null, no_recurse=false){
        var result = null
        try{
            result = this.synchronousHTTPPOST(url, data) // io-blocking
        }
        catch(error){
            var _result = null
            if(!no_recurse){
                _result = this.util_web_post(this.util_fix_url(url), data, true)
            }

            if(_result != null){
                result = _result
            }
            else{
                result = `[ERROR]: ${error}`
            }
        }

        return result
    }


    util_unique_projection_words_modal_sequence(val, use_pmss=false){
        var mode = use_pmss? "PMSS" : "MSS";
        this.debug(`--[util]-| Computing Unique Word [${mode} Modal Sequence] Projection for [${val}]`)
        var words = val.split(TEA_RunTime.SINGLE_SPACE_CHAR)
        var l_words = words.length
        if(l_words <= 1){
            return val
        }

        const unspecific_symbolset = [...new Set(words)];
        const l_usymbolset = unspecific_symbolset.length;
        // the tally is a computation of ranks as in PMSS:
        //# r_i = (cardinality of usymbolset - I(c_i,usymbolset)) * frequency of c_i in original sequence
        var tally = unspecific_symbolset.map(w => ({'w':w, 'i':(unspecific_symbolset.indexOf(w)+1), 'f':words.filter(wd => wd === w).length, 'r': (l_usymbolset - (unspecific_symbolset.indexOf(w)+1)) * words.filter(wd => wd === w).length}));
        if(use_pmss) {
            tally.sort((a, b) => b['r'] - a['r']); // sort by rank, descending
        }
        else{
            tally.sort((a, b) =>{
                const freqDiff = b['f'] - a['f']; // sort by frequencies, descending
                if(freqDiff !== 0) return freqDiff; // we used frequencies
                else return a['i'] - b['i']; // frequencies tied, we sort by indices ascending
            });
        }

        this.debug(`--[util]-| ${mode} Unique Word Tally [${JSON.stringify(tally)}]`)
        const result = tally.map(data => data['w']).join(TEA_RunTime.GLUE);
        return result;
    }


    util_unique_projection_chars_modal_sequence(val, use_pmss=false){
        var mode = use_pmss? "PMSS" : "MSS";
        this.debug(`--[util]-| Computing Unique Character Projection [${mode} Modal Sequence] for [${val}]`)
        const chars = Array.from(val);
        var l_chars = chars.length
        if(l_chars <= 1){
            return val
        }

        const unspecific_symbolset = [...new Set(chars)];
        const l_usymbolset = unspecific_symbolset.length;
        // the tally is a computation of ranks as in PMSS:
        //# r_i = (cardinality of usymbolset - I(c_i,usymbolset)) * frequency of c_i in original sequence
        var tally = unspecific_symbolset.map(c => ({'c':c, 'i':(unspecific_symbolset.indexOf(c)+1), 'f':chars.filter(ch => ch === c).length, 'r': (l_usymbolset - (unspecific_symbolset.indexOf(c)+1)) * chars.filter(ch => ch === c).length}));
        if(use_pmss) {
            tally.sort((a, b) => b['r'] - a['r']); // sort by rank, descending
        }
        else{
            tally.sort((a, b) =>{
                const freqDiff = b['f'] - a['f']; // sort by frequencies, descending
                if(freqDiff !== 0) return freqDiff; // we used frequencies
                else return a['i'] - b['i']; // frequencies tied, we sort by indices ascending
            });
        }

        this.debug(`--[util]-| ${mode} Unique Char Tally [${JSON.stringify(tally)}]`)
        const result = tally.map(data => data['c']).join(TEA_RunTime.EMPTY_STR);
        return result;
    }

    util_str_align_center(val) {
      /**
       * Centers each line in a multi-line string based on the longest line,
       * padding both left and right so all lines have equal width.
       * This mimics Microsoft Word's center alignment behavior.
       *
       * @param {string} val - A string that may contain multiple lines.
       * @returns {string} - A new string with each line centered and padded to equal width.
       */
      this.debug(`--[util]-| Applying Transform: ALIGN CENTER to [${val}]`)
      if (typeof val !== 'string') return '';

      const lines = val.split(/\r?\n/);
      if (lines.length === 0) return '';

      // Trim each line and find the maximum length
      const trimmedLines = lines.map(line => line.trim());
      const maxWidth = Math.max(...trimmedLines.map(line => line.length));

      // Center each line with equal padding on both sides
      const centeredLines = trimmedLines.map(line => {
        const totalPadding = maxWidth - line.length;
        const leftPadding = Math.floor(totalPadding / 2);
        const rightPadding = totalPadding - leftPadding;
        return ' '.repeat(leftPadding) + line + ' '.repeat(rightPadding);
      });

      return centeredLines.join(TEA_RunTime.NL);
    }


    util_str_trim(val) {
      this.debug(`--[util]-| Applying Transform: TRIM+LEFT ALIGN to [${val}]`)
      if (typeof val !== 'string') return '';

      const lines = val.split(/\r?\n/);
      if (lines.length === 0) return '';

      // Trim each line and find the maximum length
      const trimmedLines = lines.map(line => line.trim());

      return trimmedLines.join(TEA_RunTime.NL);
    }


    // TEA triangular reduction
    util_triangular_reduction(val){
        this.debug(`--[util]-| Applying Transform: LM-TR to [${val}]`)
		const lines = [];
		for (let i = 0; i < val.length; i++) {
			lines.push(val.slice(i));
		}
		return lines.join(TEA_RunTime.NL);
    }


    // TEA right-most triangular reduction
    util_rightmost_triangular_reduction(val){
        this.debug(`--[util]-| Applying Transform: RM-TR to [${val}]`)
		const lines = [];
		for (let i = 0; i < val.length; i++) {
			lines.push(val.slice(0, val.length - i));
		}
		return lines.join(TEA_RunTime.NL);
    }

    static util_braille_projection1(val){
		const rNonWhiteSpace = /\S/g;
		const rWhiteSpace = /[ \t\r\f\v]/g;

		// Remove all non-whitespace characters
		val = val.replace(rNonWhiteSpace, TEA_RunTime.EMPTY_STR);

		// Replace all whitespace except newline with a full stop
		val = val.replace(rWhiteSpace, '.');

		return val;
	}


     util_eval_mathematics(val){
        // fix case where boolean literals are passed with unsuported case...
        val = this.util_smart_replace_all('True', 'true', val);
        val = this.util_smart_replace_all('False', 'false', val);
        // Use host-language mathematics
        this.debug(`***Evaluating MATHEMATICS EXPRESSION: [${val}]`)
        return String(eval(val))

    }

    util_smart_replace(pattern, replacement, value){
            /*
             * Replace pattern with replacement in value just once. First, via naive replacement, and if not effective, via regex
             * */
        var result = value.replace(pattern, replacement);
        if (result !== value){
            this.debug("----[SMART single-REPLACE VIA NAIVE]")
            return result;
        }else {
            this.debug("----[SMART single-REPLACE VIA REGEX]")
            var regex = new RegExp(pattern);
            var result2 = value.replace(regex, replacement);
            return result2;
        }

    }

    util_smart_replace_all(pattern, replacement, value){
            /*
             * Replace pattern with replacement in value everywhere. First, via naive replacement, and if not effective, via regex
             * */
        var result = value.split(pattern).join(replacement);
        if (result !== value){
            this.debug("----[SMART all-REPLACE VIA NAIVE]")
            return result;
        }else {
            this.debug("----[SMART all-REPLACE VIA REGEX]")
            var regex = new RegExp(pattern, 'g')
            var result2 = value.replace(regex, replacement);
            return result2;
        }

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


	util_sort_words_smartly(val){
        const numberRegex = /^[+-]?((\d+(\.\d*)?)|(\.\d+))([eE][+-]?\d+)?$/;
		const parts = val.trim().split(TEA_RunTime.RE_WHITE_SPACE);
        var sortNumeric = true
        for (let s of parts) {
            if(!numberRegex.test(s)){
                sortNumeric = false;
                break
            }
        }
        if(sortNumeric){
            this.debug("----[SMART Sort Words: Numerically]")
        }else{
            this.debug("----[SMART Sort Words: Lexically]")
        }
		const lparts = sortNumeric ? parts.sort((a, b) => parseFloat(a) - parseFloat(b)) : parts.sort();
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


    util_gen_rand_string(size=null,  glue=TEA_RunTime.EMPTY_STR, alphabet=TEA_RunTime.EXTENDED_ALPHABET){
        var instance_limit = this.util_gen_rand(!TEA_RunTime.is_empty(size)? Number(size) : 100,1)
        if(!TEA_RunTime.is_empty(size)){
            instance_limit = size
        }
		var result = [];
		for (let i = 0; i < instance_limit; i++) {
			const randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
			result.push(randomChar);
		}
        result = result.join(TEA_RunTime.EMPTY_STR); // string from list
        if(!TEA_RunTime.is_empty(glue)){
            return result.replace(new RegExp(TEA_RunTime.RE_WHITE_SPACE, 'g'), glue);
        }
        else{
            return result;
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

    util_execute_tea(tsrc, ai){
        if(TEA_RunTime.is_empty(tsrc)){
            return ai
        }

        this.debug(`[INFO] TEA EXEC:\n\tTSRC: [${tsrc}]\n\tAI: [${ai}]\n`)

        var e_runtime = new TEA_RunTime()
        var e_output = e_runtime.run(ai, tsrc, this.DEBUG, this.DEBUG_FN);
        return e_output
    }


    util_inject_tea(tsrc, otil, injection_position, label_blocks){
        if(TEA_RunTime.is_empty(tsrc)){
            return [otil, label_blocks, injection_position]
        }

        this.debug(`[INFO] TEA INJECTION:\n\tTSRC: [${tsrc}]\n\t@ATPI: [${injection_position}]\n`)

        var e_runtime = new TEA_RunTime()
        e_runtime.DEBUG = this.DEBUG;
        e_runtime.DEBUG_FN = this.DEBUG_FN;
        var e_otil = e_runtime._parse_tea_code(tsrc)
        // update instructions list
		var e_otil = [
		  ...otil.slice(0, injection_position),
		  ...e_otil,
		  ...otil.slice(injection_position + 1)
		];
        var e_label_blocks = e_runtime._parse_labelblocks(e_otil, label_blocks)

        return [e_otil, e_label_blocks, injection_position]
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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "D"){
			let dpatterns = tpe_str.split(TEA_RunTime.TIPED);
			for (let dp of dpatterns) {
				io = io.replace(new RegExp(dp, 'g'), TEA_RunTime.EMPTY_STR);
			}
        }
        if(tc == "D."){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
            }else {
                var regex = tpe_str
                io = io.replace(new RegExp(regex, 'g'), TEA_RunTime.EMPTY_STR);
            }
        }
        if(tc == "D!."){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
            }else {
                var regex = tpe_str
                let matches = io.match(new RegExp(regex, 'g')) || [];
                io = matches.join(TEA_RunTime.EMPTY_STR);
            }
        }
        if(tc == "D*."){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
            }else {
                var vREGEX = tpe_str
                var regex = this.vault_get(vREGEX) 
                io = io.replace(new RegExp(regex, 'g'), TEA_RunTime.EMPTY_STR);
            }
        }
        if(tc == "D*!."){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
            }else {
                var vREGEX = tpe_str
                var regex = this.vault_get(vREGEX) 
                let matches = io.match(new RegExp(regex, 'g')) || [];
                io = matches.join(TEA_RunTime.EMPTY_STR);
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
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
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


    // PROCESS E:
    process_e(ti, ai, main_INSTRUCTIONS, main_ATPI, main_LABELBLOCKS){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        this.debug("\n*******[ EXECUTING E-COMMAND ]\n")

        if(tc == "E"){
            if(TEA_RunTime.is_empty(tpe_str)){
                var e_Tsrc = io
                var e_ai = TEA_RunTime.EMPTY_STR
                io = this.util_execute_tea(e_Tsrc, e_ai)
            }
            else {
                var e_Tsrc = this.extract_str(tpe_str) // just in case
                var e_ai = io
                io = this.util_execute_tea(e_Tsrc, e_ai)
            }
        }

        if(tc == "E!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                var e_Tsrc = io
                var e_ai = TEA_RunTime.EMPTY_STR
                var [e_INSTRUCTIONS, e_LABELBLOCKS, e_atpi] = this.util_inject_tea(e_Tsrc, main_INSTRUCTIONS, main_ATPI, main_LABELBLOCKS)

                this.debug("\n*******[ FINISHED E-COMMAND ]\n")
                return [e_ai,e_atpi,e_INSTRUCTIONS,e_LABELBLOCKS]
            }
            else {
                var e_Tsrc = this.extract_str(tpe_str) // just in case
                var e_ai = io
                var [e_INSTRUCTIONS, e_LABELBLOCKS, e_atpi] = this.util_inject_tea(e_Tsrc, main_INSTRUCTIONS, main_ATPI, main_LABELBLOCKS)

                this.debug("\n*******[ FINISHED E-COMMAND ]\n")
                return [e_ai,e_atpi,e_INSTRUCTIONS,e_LABELBLOCKS]
            }
        }

        if(tc == "E*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
            }
            else {
                var vNAME = tpe_str
                var input_str = this.vault_get(vNAME)

                var e_Tsrc = input_str
                var e_ai = io
                io = this.util_execute_tea(e_Tsrc, e_ai)
            }
        }

        if(tc == "E*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
            }
            else {
                var vNAME = tpe_str
                var input_str = this.vault_get(vNAME)
                var e_Tsrc = input_str
                var e_ai = io
                var [e_INSTRUCTIONS, e_LABELBLOCKS, e_atpi] = this.util_inject_tea(e_Tsrc, main_INSTRUCTIONS, main_ATPI, main_LABELBLOCKS)

                this.debug("\n*******[ FINISHED E-COMMAND ]\n")
                return [e_ai,e_atpi,e_INSTRUCTIONS,e_LABELBLOCKS]
            }
        }

        this.debug("\n*******[ FINISHED E-COMMAND ]\n")

        main_ATPI += 1 // move to next instruction if E: didn't already...
        return [io,main_ATPI,main_INSTRUCTIONS,main_LABELBLOCKS]
    }



    // PROCESS: F:
    process_f(ti, ai, _ATPI){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // first wait to extract the string parameter
        var tpe_str = tpe


        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "F"){
            var params = tpe_str.split(TEA_RunTime.TIPED)

            if(params.length == 0){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return [io,_ATPI]
            }

            if(params.length == 1){
                this.debug(`[ERROR] Instruction ${ti} Invoked with No Labels!`)
                this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                throw new Error(`[ERROR] Fork Instruction ${ti} Invoked with No Labels!`)
            }

            if(params.length == 2){
                var rtest = this.extract_str(params[0]) // the pattern
                var tblock = params[1] // where to jump to if matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${tblock}]`)
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
                var rtest = this.extract_str(params[0]) // the pattern
                var tblock = params[1] // where to jump if matched
                var fblock = params[2] // where to jump if not matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${tblock}]`)
                }
                if (!this.LABELBLOCKS.hasOwnProperty(fblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${fblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${fblock}]`)
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

        if(tc == "F*"){
            var params = tpe_str.split(TEA_RunTime.TIPED)

            if(params.length == 0){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return [io,_ATPI]
            }

            if(params.length == 1){
                this.debug(`[ERROR] Instruction ${ti} Invoked with No Labels!`)
                this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                throw new Error(`[ERROR] Fork Instruction ${ti} Invoked with No Labels!`)
            }

            if(params.length == 2){
                var vrtest = this.extract_str(params[0]) // the pattern vault
                var rtest = this.vault_get(vrtest) // the pattern
                var tblock = params[1] // where to jump to if matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${tblock}]`)
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
                var vrtest = this.extract_str(params[0]) // the pattern vault
                var rtest = this.vault_get(vrtest) // the pattern
                var tblock = params[1] // where to jump if matched
                var fblock = params[2] // where to jump if not matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${tblock}]`)
                }
                if (!this.LABELBLOCKS.hasOwnProperty(fblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${fblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${fblock}]`)
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
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return [io,_ATPI]
            }

            if(params.length == 1){
                this.debug(`[ERROR] Instruction ${ti} Invoked with No Labels!`)
                this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                throw new Error(`[ERROR] Fork Instruction ${ti} Invoked with No Labels!`)
            }

            if(params.length == 2){
                var rtest = this.extract_str(params[0]) // the pattern
                var tblock = params[1] // where to jump to if NOT matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${tblock}]`)
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
                var rtest = this.extract_str(params[0]) // the pattern
                var tblock = params[1] // where to jump if matched
                var fblock = params[2] // where to jump if not matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${tblock}]`)
                }
                if (!this.LABELBLOCKS.hasOwnProperty(fblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${fblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${fblock}]`)
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

        if(tc == "F*!"){
            var params = tpe_str.split(TEA_RunTime.TIPED)

            if(params.length == 0){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return [io,_ATPI]
            }

            if(params.length == 1){
                this.debug(`[ERROR] Instruction ${ti} Invoked with No Labels!`)
                this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                throw new Error(`[ERROR] Fork Instruction ${ti} Invoked with No Labels!`)
            }

            if(params.length == 2){
                var vrtest = this.extract_str(params[0]) // the pattern vault
                var rtest = this.vault_get(vrtest) // the pattern
                var tblock = params[1] // where to jump to if NOT matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${tblock}]`)
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
                var vrtest = this.extract_str(params[0]) // the pattern vault
                var rtest = this.vault_get(vrtest) // the pattern
                var tblock = params[1] // where to jump if matched
                var fblock = params[2] // where to jump if not matched
                if (!this.LABELBLOCKS.hasOwnProperty(tblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${tblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${tblock}]`)
                }
                if (!this.LABELBLOCKS.hasOwnProperty(fblock)) {
                        this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${fblock}]`)
                        this.debug(`--- L-BLOCK STATE: \n\t${JSON.stringify(this.LABELBLOCKS)}`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${fblock}]`)
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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

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



        if(tc == "G."){
            if(tpe_str.length == 0){
                io = io.replace(new RegExp(TEA_RunTime.NL,'g'), TEA_RunTime.EMPTY_STR);
            }
            else{
                var glue = this.extract_str(tpe_str)
                io = io.replace(new RegExp(TEA_RunTime.NL, 'g'), glue);
            }
        }

        if(tc == "G!"){
            var params = tpe_str.split(TEA_RunTime.TIPED)
            if(params.length == 0){
                // INERT: do nothing
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
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
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
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
            if(params.length == 1){ //g*!:vGLUE
                var vglue = this.extract_str(params[0])
                var glue = this.vault_get(vglue)
                io = io.replace(new RegExp(TEA_RunTime.RE_WHITE_SPACE, 'g'), glue);
            }
            else{
                if(params.length < 3){
                    // INERT: do nothing
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

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


        if(tc == "I*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // implements interactivity in TEA: displays io as prompt, sets user-input as io
                io = prompt(io) 
            } else {
                if(TEA_RunTime.is_empty(io)){
                    io = tpe_str
                    io = prompt(tpe_str) 
                }
            }
        }

        if(tc == "I*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                io = prompt(io) 
            } else {
                vprompt = tpe_str
                var prompt_str = this.vault_get(vprompt)
                io = prompt(prompt_str) 
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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "J"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
            }
            else{
                var jblock = tpe_str
                if (!this.LABELBLOCKS.hasOwnProperty(jblock)) {
                    this.debug(`[ERROR] Instruction ${ti} trying to access Non-Existent Block [${jblock}]`)
                    throw new Error(`[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK: [${jblock}]`)
                }
                _ATPI = this.LABELBLOCKS[jblock]
                return [io,_ATPI]
            }
        }
        if(tc == "J!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                _ATPI = 0 // start of program
                // detect potential infinite loop and raise error
                if(this.INSTRUCTIONS.length == 1){ //meaning this is the only instruction found
                    this.debug("+++[WARNING] POTENTIAL INFINITE LOOP! J!: invoked as the only instruction in the TEA Program!")
                }
                return [io,_ATPI]
            }
            else{
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(TEA_RunTime.is_empty(io)){
            // INERT
            this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
            return io // essentially, INERT
        }

        if(tc == "K"){
            if(TEA_RunTime.is_empty(tpe_str)){
				// INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io // essentially, INERT
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
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io // essentially, INERT
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
            if(params.length == 0){
				// INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io // essentially, INERT
            }
            else if(params.length == 1){
                var vregex = params[0]
                var regex = this.vault_get(vregex)

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
            else{
                var vregex = params[0]
                var vname = params[1]
                var regex = this.vault_get(vregex)
                var input_str = this.vault_get(vname)

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
            if(params.length == 0){
				// INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io // essentially, INERT
            }
            else if(params.length == 1){
                var vregex = params[0]
                var regex = this.vault_get(vregex)

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
            else{
                var vregex = params[0]
                var vname = params[1]
                var regex = this.vault_get(vregex)
                var input_str = this.vault_get(vname)

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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "L"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // do nothing..
				// INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else {
                var lBlockName = tpe_str
                // prevent duplication of block names
                if (!this.LABELBLOCKS.hasOwnProperty(lBlockName)) {
                    // store current code position under given label block name
                    // but most likely, has already been done during TSRC pre-processing/validation
                    this.LABELBLOCKS[lBlockName] = this.ATPI
                }
            }
        }

        if(tc == "L!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // do nothing..
				// INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else{
                var labels = tpe_str.split(TEA_RunTime.TIPED)
                for(let lBlockName of labels){
                    // prevent duplication of block names
                    if (!this.LABELBLOCKS.hasOwnProperty(lBlockName)) {
                        this.LABELBLOCKS[lBlockName] = this.ATPI
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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

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
                    this.debug(`[ERROR] Instruction ${ti} trying to access DEFAULT VAULT before it is set!`)
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
                    this.debug(`[ERROR] Instruction ${ti} trying to access DEFAULT VAULT before it is set!`)
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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if((tc == "N") || (tc == "N!")){
            if(TEA_RunTime.is_empty(tpe_str)){
                var limit = 9
                io = String(this.util_gen_rand(limit))
            }
            else{
               var params  = tpe_str.split(TEA_RunTime.TIPED)
                if(params.length == 1){
                   var limit = this.extract_str(params[0])
                   io = String(this.util_gen_rand(Number(limit)))
                }
                if(params.length == 2){
                   var limit = this.extract_str(params[0])
                   var llimit = this.extract_str(params[1])
                   io = String(this.util_gen_rand(Number(limit), Number(llimit)))
                }
                if(params.length == 3){
                   var limit = this.extract_str(params[0])
                   var llimit = this.extract_str(params[1])
                   var size = this.extract_str(params[2])
                   var nums = []
                   for(var i=0; i < Number(size); i++){
                       nums.push(String(this.util_gen_rand(Number(limit), Number(llimit))))
                   }
                   io = nums.join(TEA_RunTime.GLUE)
                }
                if(params.length == 4){
                   var limit = this.extract_str(params[0])
                   var llimit = this.extract_str(params[1])
                   var size = this.extract_str(params[2])
                   var glue = this.extract_str(params[3])
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
				// INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else{
               var params  = tpe_str.split(TEA_RunTime.TIPED)
                if(params.length == 1){
                   var vlimit = this.extract_str(params[0])
                   var limit = !TEA_RunTime.is_empty(vlimit) ? this.vault_get(vlimit) : 9
                   io = String(this.util_gen_rand(Number(limit)))
                }
                if(params.length == 2){
                   var vlimit = this.extract_str(params[0])
                   var vllimit = this.extract_str(params[1])

                   limit = !TEA_RunTime.is_empty(vlimit) ? this.vault_get(vlimit) : 9

                   llimit = !TEA_RunTime.is_empty(vllimit) ? this.vault_get(vllimit) : 0

                   io = String(this.util_gen_rand(Number(limit), Number(llimit)))
                }
                if(params.length == 3){
                   var vlimit = this.extract_str(params[0])
                   var vllimit = this.extract_str(params[1])
                   var vsize = this.extract_str(params[2])

                   limit = !TEA_RunTime.is_empty(vlimit) ? this.vault_get(vlimit) : 9

                   llimit = !TEA_RunTime.is_empty(vllimit) ? this.vault_get(vllimit) : 0

                   size = !TEA_RunTime.is_empty(vsize) ? this.vault_get(vsize) : 1

                   var nums = []
                   for(var i=0; i < Number(size); i++){
                       nums.push(String(this.util_gen_rand(Number(limit), Number(llimit))))
                   }
                   io = nums.join(TEA_RunTime.GLUE)
                }
                if(params.length == 4){
                   var vlimit = this.extract_str(params[0])
                   var vllimit = this.extract_str(params[1])
                   var vsize = this.extract_str(params[2])
                   var vglue = this.extract_str(params[3])

                   limit = !TEA_RunTime.is_empty(vlimit) ? this.vault_get(vlimit) : 9

                   llimit = !TEA_RunTime.is_empty(vllimit) ? this.vault_get(vllimit) : 0

                   size = !TEA_RunTime.is_empty(vsize) ? this.vault_get(vsize) : 1

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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "O"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? tpe_str : ai
            io = this.util_sort_words_smartly(input_str)
        }
        if(tc == "O!"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? tpe_str : ai
            io = this.util_sort_chars(input_str)
        }
        if(tc == "O*"){
            var input_str = !TEA_RunTime.is_empty(tpe_str) ? this.vault_get(tpe_str) : ai
            io = this.util_sort_words_smartly(input_str)
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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

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
                    var glue = this.extract_str(params[1])
					io = this.util_gen_rand_string(Number(size), glue)
                }
                else if(params.length == 3){
                    var size = this.extract_str(params[0])
                    var glue = this.extract_str(params[1])
                    var alphabet = this.extract_str(params[2])
					io = this.util_gen_rand_string(Number(size), glue, alphabet)
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
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
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
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else {
                var params = tpe_str.split(TEA_RunTime.TIPED)
                var vSIZE = this.extract_str(params[0])
                var size = this.vault_get(vSIZE)
				if(params.length == 1){
                    io = this.util_gen_rand_string(Number(size))
                }
                else if(params.length == 2){
                    var vGLUE = this.extract_str(params[1])
                    var glue = this.vault_get(vGLUE)
                    io = this.util_gen_rand_string(Number(size), glue)
                }
                else if(params.length == 3){
                    var vGLUE = this.extract_str(params[1])
                    var glue = this.vault_get(vGLUE)
                    var vALPHABET = this.extract_str(params[2])
                    var alphabet = this.vault_get(vALPHABET)
                    io = this.util_gen_rand_string(Number(size), glue, alphabet)
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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

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
        //var tpe_str = this.extract_str(tpe)
        var tpe_str = tpe

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "R"){
            if(TEA_RunTime.is_empty(tpe_str)){
                io = TEA_RunTime.util_braille_projection2(io)
            }
            else {
                var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 1)
                if(params.length != 2){
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                    throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
                else {
                    var regex = this.extract_str(params[0]);
                    var replacement = this.extract_str(params[1])
                    io = this.util_smart_replace(regex, replacement, io)
                }
            }
        }

        if(tc == "R!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                io = TEA_RunTime.util_braille_projection1(io)
            }
            else{
                var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 1)
                if(params.length != 2){
                    this.debug(`[ERROR] Instruction ${ti} Invoked with Invalid Signature`)
                    throw new Error("[SEMANTIC ERROR] Invalid Instruction Signature")
                }
                else{
                    var regex = this.extract_str(params[0]);
                    //this.debug(`--TEST[ regex: ${regex} | param[0]: ${params[0]} | tpe_str: ${tpe_str} | tpe: ${tpe}]`)
                    var replacement = this.extract_str(params[1])
                    io = this.util_smart_replace_all(regex, replacement, io)
                }
            }
        }

        if(tc == "R*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io // essentially, INERT
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
                        var vname = params[0]
                        var vregex = params[1]
                        var vsubstr = params[2]
                        var input_str = this.vault_get(vname)
                        var regex = this.extract_str(this.vault_get(vregex))
                        var replacement = this.extract_str(this.vault_get(vsubstr))
                        io = this.util_smart_replace(regex, replacement, input_str)
                    }
                }
            }
        }

        if(tc == "R*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
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

                        var vname = params[0]
                        var vregex = params[1]
                        var vsubstr = params[2]
                        var input_str = this.vault_get(vname)
                        var regex = this.extract_str(this.vault_get(vregex))
                        var replacement = this.extract_str(this.vault_get(vsubstr))
                        io = this.util_smart_replace_all(regex, replacement, input_str);
                    }
                }
            }
        }

        if(tc == "R."){
            if(TEA_RunTime.is_empty(tpe_str)){
                io = this.util_eval_mathematics(io)
            }
            else{
                io = this.util_eval_mathematics(tpe_str)
            }
        }

        if(tc == "R*."){
            if(TEA_RunTime.is_empty(tpe_str)){
                return io // INERT
            }
            else{
                var vname = tpe_str;
                var input_str = this.vault_get(vname)
                io = this.util_eval_mathematics(input_str)
            }
        }

        return io
    }



    //PROCESS S:
    process_s(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)
        var salt = TEA_RunTime.SINGLE_SPACE_CHAR

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "S"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    // can't salt without input
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    io = this.util_salt_string(io,salt)
                }
            }
            else{
                if(TEA_RunTime.is_empty(io)){
                    // can't salt without input
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 3)
                    if(params.length == 1){
                        salt = this.extract_str(params[0])
                        io = this.util_salt_string(io,salt)
                    }
                    else if(params.length == 2){
                        salt = this.extract_str(params[0])
                        var i_limit = Number(this.extract_str(params[1]))
                        io = this.util_salt_string(io,salt,i_limit)
                    }
                    else if(params.length == 3){
                        salt = this.extract_str(params[0])
                        var i_limit = Number(this.extract_str(params[1]))
                        var l_limit = Number(this.extract_str(params[2]))
                        io = this.util_salt_string(io,salt,i_limit, l_limit)
                    }
                }
            }
        }

        if(tc == "S!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    // can't unsalt without input
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else {
                    io = this.util_unsalt_string(io)
                }
            }
            else {
                if(TEA_RunTime.is_empty(io)){
                    // can't unsalt without input
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else {
                    var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 3)
                    if(params.length == 1){
                        var salt_regex = this.extract_str(params[0])
                        io = this.util_unsalt_string(io,salt_regex)
                    }
                    else if(params.length == 2){
                        var salt_regex = this.extract_str(params[0])
                        var d_limit = Number(this.extract_str(params[1]))
                        io = this.util_unsalt_string(io,salt_regex, d_limit)
                    }
                    else if(params.length == 3){
                        var salt_regex = this.extract_str(params[0])
                        var d_limit = Number(this.extract_str(params[1]))
                        var l_limit = Number(this.extract_str(params[2]))
                        io = this.util_unsalt_string(io,salt_regex, d_limit, l_limit)
                    }
                }
            }
        }

        if(tc == "S*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else {
                var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 3)
                var vault = this.extract_str(params[0])
                var input_str = this.vault_get(vault)
                io = input_str

                if(TEA_RunTime.is_empty(io)){
                    // can't unsalt without input
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else {
                    if(params.length == 2){
                        var vsalt = this.extract_str(params[1])
                        var salt = this.vault_get(vsalt)
                        io = this.util_salt_string(io,salt)
                    }
                    else if(params.length == 3){
                        var vsalt = this.extract_str(params[1])
                        var salt = this.vault_get(vsalt)
                        var vi_limit = this.extract_str(params[2])
                        var i_limit = Number(this.vault_get(vi_limit))
                        io = this.util_salt_string(io,salt,i_limit)
                    }
                    else if(params.length == 4){
                        var vsalt = this.extract_str(params[1])
                        var salt = this.vault_get(vsalt)
                        var vi_limit = this.extract_str(params[2])
                        var i_limit = Number(this.vault_get(vi_limit))
                        var vl_limit = this.extract_str(params[3])
                        var l_limit = Number(this.vault_get(vl_limit))
                        io = this.util_salt_string(io,salt,i_limit, l_limit)
                    }
                }
            }
        }

        if(tc == "S*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else {
                var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED, 3)
                var vault = this.extract_str(params[0])
                var input_str = this.vault_get(vault)
                io = input_str

                if(TEA_RunTime.is_empty(io)){
                    // can't unsalt without input
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else {
                    if(params.length == 2){
                        var vsalt_regex = this.extract_str(params[1])
                        var salt_regex = this.vault_get(vsalt_regex)
                        io = this.util_unsalt_string(io,salt_regex)
                    }
                    else if(params.length == 3){
                        var vsalt_regex = this.extract_str(params[1])
                        var salt_regex = this.vault_get(vsalt_regex)
                        var vd_limit = this.extract_str(params[2])
                        var d_limit = Number(this.vault_get(vd_limit))
                        io = this.util_unsalt_string(io,salt_regex, d_limit)
                    }
                    else if(params.length == 4){
                        var vsalt_regex = this.extract_str(params[1])
                        var salt_regex = this.vault_get(vsalt_regex)
                        var vd_limit = this.extract_str(params[2])
                        var d_limit = Number(this.vault_get(vd_limit))
                        var vl_limit = this.extract_str(params[3])
                        var l_limit = Number(this.vault_get(vl_limit))
                        io = this.util_unsalt_string(io,salt_regex, d_limit, l_limit)
                    }
                }
            }
        }

        return io
    }



    //PROCESS T:
    process_t(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "T"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    this.debug(`[NOT]Processing ${tc} on EMPTY AI [${io}]`)
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    this.debug(`Processing ${tc} on AI=[${io}]`)
                    return this.util_triangular_reduction(io)
                }
            }
            else {
                    var input_str = tpe_str
                    this.debug(`Processing ${tc} on AI=[${io}]`)
                    return this.util_triangular_reduction(input_str)
            }
        }

        if(tc == "T!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    return this.util_rightmost_triangular_reduction(io)
                }
            }
            else{
                    var input_str = tpe_str
                    return this.util_rightmost_triangular_reduction(input_str)
            }
        }

        if(tc == "T*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else {
                var vault = tpe_str
                var input_str = this.vault_get(vault)
                return this.util_triangular_reduction(input_str)
            }
        }

        if(tc == "T*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else{
                var vault = tpe_str
                var input_str = this.vault_get(vault)
                return this.util_rightmost_triangular_reduction(input_str)
            }
        }


        if(tc == "T."){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    return this.util_str_align_center(io)
                }
            }
            else{
                    var input_str = tpe_str
                    return this.util_str_align_center(input_str)
            }
        }

        if(tc == "T!."){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    return this.util_str_trim(io)
                }
            }
            else{
                    var input_str = tpe_str
                    return this.util_str_trim(input_str)
            }
        }

        if(tc == "T*!."){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else{
                var vault = tpe_str
                var input_str = this.vault_get(vault)
                return this.util_str_trim(input_str)
            }
        }

        return io
    }



    //PROCESS U:
    process_u(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "U"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    this.debug(`[NOT]Processing ${tc} on EMPTY AI [${io}]`)
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    this.debug(`Processing ${tc} on AI=[${io}]`)
                    return this.util_unique_projection_words_modal_sequence(io)
                }
            }
            else{
                var input_str = tpe_str
                return this.util_unique_projection_words_modal_sequence(input_str)
            }
        }

        if(tc == "U!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    return this.util_unique_projection_chars_modal_sequence(io) //should compute MSS: modal sequence statistic
                }
            }
            else{
                var input_str = tpe_str
                return this.util_unique_projection_chars_modal_sequence(input_str)
            }
        }

        if(tc == "U*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else{
                var vault = tpe_str
                var input_str = this.vault_get(vault)
                return this.util_unique_projection_words_modal_sequence(input_str)
            }
        }

        if(tc == "U*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else{
                var vault = tpe_str
                var input_str = this.vault_get(vault)
                return this.util_unique_projection_chars_modal_sequence(input_str)
            }
        }


        //----------[The PMSS variations]
        if(tc == "U."){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    this.debug(`[NOT]Processing ${tc} on EMPTY AI [${io}]`)
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    this.debug(`Processing ${tc} on AI=[${io}]`)
                    return this.util_unique_projection_words_modal_sequence(io, true)
                }
            }
            else{
                var input_str = tpe_str
                return this.util_unique_projection_words_modal_sequence(input_str, true)
            }
        }

        if(tc == "U!."){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    return this.util_unique_projection_chars_modal_sequence(io, true) //should compute MSS: modal sequence statistic
                }
            }
            else{
                var input_str = tpe_str
                return this.util_unique_projection_chars_modal_sequence(input_str, true)
            }
        }

        if(tc == "U*."){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else{
                var vault = tpe_str
                var input_str = this.vault_get(vault)
                return this.util_unique_projection_words_modal_sequence(input_str, true)
            }
        }

        if(tc == "U*!."){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else{
                var vault = tpe_str
                var input_str = this.vault_get(vault)
                return this.util_unique_projection_chars_modal_sequence(input_str, true)
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

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

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
                var params = TEA_RunTime.splitWithLimit(input_str,TEA_RunTime.TIPED,1)
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
                    this.debug(`[ERROR] Instruction ${ti} trying to access DEFAULT VAULT before it is set!`)
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
                    var params = TEA_RunTime.splitWithLimit(input_str,TEA_RunTime.TIPED,1)
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


    //PROCESS W:
    process_w(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
        var parts = ti.split(TEA_RunTime.TCD);
        var tc = parts[0];
        var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "W"){
            if(TEA_RunTime.is_empty(tpe_str)){
                var URL = io
                var webRESULT = this.util_web_get(URL)
                return !TEA_RunTime.is_empty(webRESULT) ? webRESULT : TEA_RunTime.EMPTY_STR
            }
            else{
                var URL = tpe_str
                var webRESULT = this.util_web_get(URL)
                return !TEA_RunTime.is_empty(webRESULT) ? webRESULT : TEA_RunTime.EMPTY_STR
            }
        }

        if(tc == "W!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                var URL = io
                var webRESULT = this.util_web_post(URL, null)
                return !TEA_RunTime.is_empty(webRESULT) ? webRESULT : TEA_RunTime.EMPTY_STR
            }
            else{
                var URL = tpe_str
                var webRESULT = this.util_web_post(URL, io)
                return !TEA_RunTime.is_empty(webRESULT) ? webRESULT : TEA_RunTime.EMPTY_STR
            }
        }

        if(tc == "W*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                var URL = io
                var data = this.VAULTS
                var webRESULT = this.util_web_get(URL, data)
                return !TEA_RunTime.is_empty(webRESULT) ? webRESULT : TEA_RunTime.EMPTY_STR
            }
            else{
                var URL = io
                var data = this.VAULTS

                var params = tpe_str.split(TEA_RunTime.TIPED)
                if(params.length == 1){
                    URL = this.vault_get(this.extract_str(params[0]))
                }
                else{
                    URL = this.vault_get(this.extract_str(params[0]))
					const _vaultData = {};
					for (let i = 1; i < params.length; i++) {
						const vNAME = this.extract_str(params[i]);
						_vaultData[vNAME] = this.vault_get(vNAME);
					}
					data = _vaultData;
                }

                var webRESULT = this.util_web_get(URL, data)
                return !TEA_RunTime.is_empty(webRESULT) ? webRESULT : TEA_RunTime.EMPTY_STR
            }
        }

        if(tc == "W*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                var URL = io
                var data = this.VAULTS
                var webRESULT = this.util_web_post(URL, data)
                return !TEA_RunTime.is_empty(webRESULT) ? webRESULT : TEA_RunTime.EMPTY_STR
            }
            else{
                var URL = io
                var data = this.VAULTS

                var params = tpe_str.split(TEA_RunTime.TIPED)
                if(params.length == 1){
                    URL = this.vault_get(this.extract_str(params[0]))
                }
                else{
                    URL = this.vault_get(this.extract_str(params[0]))
					const _vaultData = {};
					for (let i = 1; i < params.length; i++) {
						const vNAME = this.extract_str(params[i]);
						_vaultData[vNAME] = this.vault_get(vNAME);
					}
					data = _vaultData;
                }

                var webRESULT = this.util_web_post(URL, data)
                return !TEA_RunTime.is_empty(webRESULT) ? webRESULT : TEA_RunTime.EMPTY_STR
            }
        }

        return io
    }


    //PROCESS X:
    process_x(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
        var parts = ti.split(TEA_RunTime.TCD);
        var tc = parts[0];
        var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "X"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    this.debug(`Processing ${tc} on AI=[${io}]`)
                    return io + io
                }
            }
            else{
                    var prefix = tpe_str
                    return prefix + io
            }
        }

        if(tc == "X!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if(TEA_RunTime.is_empty(io)){
                    // INERT
                    this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                    return io
                }
                else{
                    this.debug(`Processing ${tc} on AI=[${io}]`)
                    const half = io.slice(0, Math.floor(io.length / 2));
                    return half
                }
            }
            else{
                    var suffix = tpe_str
                    return io + suffix
            }
        }

        if(tc == "X*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else{
                var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED,1)
                var val = io
                if(params.length == 1){
                    var vPREFIX = this.extract_str(params[0])
                    prefix = this.vault_get(vPREFIX)
                    return prefix + val
                }
                else if(params.length == 2){
                    var vPREFIX = this.extract_str(params[0])
                    var vSTR = this.extract_str(params[1])
                    var prefix = this.vault_get(vPREFIX)
                    var val = this.vault_get(vSTR)
                    return prefix + val
                }
            }
        }

        if(tc == "X*!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                // INERT
                this.debug(`~~~[INERT TEA INSTRUCTION FOUND: ${ti}]`)
                return io
            }
            else{
                var params = TEA_RunTime.splitWithLimit(tpe_str,TEA_RunTime.TIPED,1)
                var val = io
                if(params.length == 1){
                    var vSUFFIX = this.extract_str(params[0])
                    var suffix = this.vault_get(vSUFFIX)
                    return val + suffix
                }
                else if(params.length == 2){
                    var vSUFFIX = this.extract_str(params[0])
                    var vSTR = this.extract_str(params[1])
                    var suffix = this.vault_get(vSUFFIX)
                    var val = this.vault_get(vSTR)
                    return val + suffix
                }
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


        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "Y"){
            if(TEA_RunTime.is_empty(tpe_str)){
                if (!this.VAULTS.hasOwnProperty(TEA_RunTime.vDEFAULT_VAULT)) {
                    this.debug(`[ERROR] Instruction ${ti} trying to access DEFAULT VAULT before it is set!`)
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


    //PROCESS Z:
    process_z(ti, ai){
        var io = !TEA_RunTime.is_empty(ai)? ai : TEA_RunTime.EMPTY_STR
		var parts = ti.split(TEA_RunTime.TCD);
		var tc = parts[0];
		var tpe = parts.length > 1 ? parts.slice(1).join(TEA_RunTime.TCD) : "";
        tc = tc.toUpperCase()
        tpe = tpe.trim()
        // extract the string parameter
        var tpe_str = this.extract_str(tpe)

        if(TEA_RunTime.is_empty(ai) && TEA_RunTime.is_empty(tpe_str)){ //NODATA
            this.debug(`+++[WARNING] INSTRUCTION WITH NO DATA TO PROCESS FOUND: ${ti}`)
        }

        if(tc == "Z"){
            if(TEA_RunTime.is_empty(tpe_str)){
                return io.toLowerCase();
            }
            else{
                var CMD = tpe_str
                var cmdDATA = io
                var cmdRESULT = this.util_system(CMD,cmdDATA)
                return !TEA_RunTime.is_empty(cmdRESULT) ? cmdRESULT : TEA_RunTime.EMPTY_STR
            }
        }

        if(tc == "Z!"){
            if(TEA_RunTime.is_empty(tpe_str)){
                return io.toUpperCase();
            }
            else{
                var CMD = tpe_str
                var cmdDATA = io
                var cmdRESULT = this.util_system(CMD,cmdDATA, true)
                return !TEA_RunTime.is_empty(cmdRESULT) ? cmdRESULT : TEA_RunTime.EMPTY_STR
            }
        }

        if(tc == "Z*"){
            if(TEA_RunTime.is_empty(tpe_str)){
                return this.toTitleCase(io)
            }
            else{
                var vCMD = tpe_str
                var CMD = this.vault_get(vCMD)
                var cmdDATA = io
                var cmdRESULT = this.util_system(CMD,cmdDATA)
                return !TEA_RunTime.is_empty(cmdRESULT) ? cmdRESULT : TEA_RunTime.EMPTY_STR
            }
        }

        if(tc == "Z*!"){
                var vCMD = tpe_str
                var CMD = this.vault_get(vCMD)
                var cmdDATA = io
                var cmdRESULT = this.util_system(CMD,cmdDATA, true)
                return !TEA_RunTime.is_empty(cmdRESULT) ? cmdRESULT : TEA_RunTime.EMPTY_STR
        }

        if(tc == "Z."){
                var NAME = tpe_str
                var environment_config = this.util_get_environment()

				if (environment_config.hasOwnProperty(NAME)) {
                    return environment_config[NAME]
                }
                else {
                    var values = [];
                    for(let k in environment_config){
                        if (environment_config.hasOwnProperty(k)) {
                           values.push(`${k}:${environment_config[k]}`)
                        }
                    }
                    return values.join(";");
                }

        }

        if(tc == "Z*."){
                var vNAME = tpe_str
                var NAME = this.vault_get(vNAME)
                var environment_config = this.util_get_environment()

				if (environment_config.hasOwnProperty(NAME)) {
                    return environment_config[NAME]
                }
                else {
                    var values = [];
                    for(let k in environment_config){
                        if (environment_config.hasOwnProperty(k)) {
                           values.push(`${k}:${environment_config[k]}`)
                        }
                    }
                    return values.join(";");
                }

        }

        return io
    }



    //////////////[ END TAZ ]///////////////////


    /* run the given tea source against the given input */
	run(tin, tsrc, DEBUG_ON, debug_fn, run_validation_only, extract_clean_code, minify=false){

        this.DEBUG = DEBUG_ON;
        this.DEBUG_FN = debug_fn != null ? debug_fn : this.DEBUG_FN;

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
            if(minify){
                return this.INSTRUCTIONS.map(line => this.unmask_str(line).trim()).join(TEA_RunTime.TID); 
            }else{
                return this.INSTRUCTIONS.map(line => this.unmask_str(line)).join(TEA_RunTime.NL); 
            }
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

                    // E: Evaluate
                    case "E": {
                        [this.OUTPUT, this.ATPI, this.INSTRUCTIONS, this.LABELBLOCKS] = this.process_e(instruction, this.OUTPUT, this.INSTRUCTIONS, this.ATPI, this.LABELBLOCKS )
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        //ATPI += 1 # e: updates Everything directly...
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
                    // S: Salt
                    case "S": {
                        this.OUTPUT = String(this.process_s(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // T: Transform
                    case "T": {
                        this.OUTPUT = String(this.process_t(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // U: Uniqueify
                    case "U": {
                        this.OUTPUT = String(this.process_u(instruction, this.OUTPUT))
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
                    // W: Web
                    case "W": {
                        this.OUTPUT = String(this.process_w(instruction, this.OUTPUT))
                        this.debug(`RESULTANT MEMORY STATE: (=${this.OUTPUT}, VAULTS:${JSON.stringify(this.VAULTS)})`)
                        this.ATPI += 1
                        continue
                    }
                    // X: Xenograft
                    case "X": {
                        this.OUTPUT = String(this.process_x(instruction, this.OUTPUT))
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
                    // Z: Zap
                    case "Z": {
                        this.OUTPUT = String(this.process_z(instruction, this.OUTPUT))
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
