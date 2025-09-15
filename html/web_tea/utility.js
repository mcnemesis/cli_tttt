/*************************************************************************
 * UTILITY.JS
 *------------------------------------------------------------------------
 * Contains the basic utility interface to be used across the system
 * simplifying DOM operations and low-level stuff without libs like jQuery
 *-------------------------------------------------------------------------
 * DEV: Joseph W. Lutalo <joewillrich@gmail.com>
 * ***********************************************************************/

export class Utility {
    /* get some element by its id */
	static get(id){
		return document.getElementById(id);
	}

    static trigger(el, eventType) {
      if (typeof eventType === 'string' && typeof el[eventType] === 'function') {
        el[eventType]();
      } else {
        const event =
          typeof eventType === 'string'
            ? new Event(eventType, {bubbles: true})
            : eventType;
        el.dispatchEvent(event);
      }
    }

    // strip suffix from strings
	static stripSuffix(str, suffix) {
	  return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str;
	}


    /* cause element to scroll to content to last item at the bottom*/
	static scrollToBottom(id) {
		  const el = this.get(id);
		  if (el) {
			el.scrollTop = el.scrollHeight;
		  } else {
			console.warn(`Element with ID "${id}" not found.`);
		  }
	}


    /* check if element is checked */
	static checked(id) {
        var el = this.get(id);
        return el.checked;
	}

    /* get value from some form element */
	static val(id) {
        var el = this.get(id);
        if (el.options && el.multiple) {
            return el.options
              .filter((option) => option.selected)
              .map((option) => option.value);
        } else {
            return el.value;
        }
	}

	//---[ UTILITIES: STATUS ]
	static status_error(message) {
	  this.status(message, "alert alert-danger");
	}

	static status_info(message) {
	  this.status(message, "alert alert-info");
	}

	static status_success(message) {
	  this.status(message, "alert alert-success");
	}
	static status_warning(message) {
	  this.status(message, "alert alert-warning");
	}

	static makeStickyEditor(id){
		document.addEventListener("DOMContentLoaded", () => {
		  const el = this.get(id);
		  const storageKey = "sticky_editor_key_" + id;

		  // Load saved content
		  const saved = localStorage.getItem(storageKey);
		  if (saved !== null) el.value = saved;

		  // Save on input
		  el.addEventListener("input", () => {
			localStorage.setItem(storageKey, el.value);
		  });

		});
	}

	static humaneTimestamp() {
	  const now = new Date();
	  const dd = String(now.getDate()).padStart(2, '0');
	  const MMM = now.toLocaleString('en-US', { month: 'short' });
	  const YYYY = now.getFullYear();
	  const HH = String(now.getHours()).padStart(2, '0');
	  const mm = String(now.getMinutes()).padStart(2, '0');
	  const ss = String(now.getSeconds()).padStart(2, '0');
	  const sss = String(now.getMilliseconds()).padStart(3, '0');

	  return `${dd}${MMM}${YYYY}-${HH}${mm}${ss}${sss}`;
	}


	static timestamp(humane) {
        if(humane){
            return this.humaneTimestamp();
        }
        const secondsSinceEpoch = Math.floor(Date.now() / 1000);
        return secondsSinceEpoch;
	}

    static configureSelectFromDictionary(id,dictionary){
		const selectElement = this.get(id);
        selectElement.options.length = 0;

		for (const [key, value] of Object.entries(dictionary)) {
		  const option = document.createElement("option");
		  option.value = key;
		  option.textContent = key;
		  selectElement.appendChild(option);
		}
    }

	static status(message, type, htmlON) {
	  if (type) {
		this.updateElement("txt_status", message, type);
	  } else {
		this.updateElement("txt_status", message, "alert alert-info");
	  }

        if(htmlON){
            this.get("txt_status").innerHTML = message;
        }
	}

	//---[UTILITY: HTTP GET]
	static async httpGET(url, fnSUCCESS, fnERROR) {
	  try {
		const response = await fetch(url);
		if (!response.ok) {
		  if (fnERROR) fnERROR(response.statusText);
		} else {
		  const body = await response.text();
		  if (fnSUCCESS) fnSUCCESS(body);
		}
	  } catch (err) {
		if (fnERROR) fnERROR(err.message);
	  }
	}


	//---[ UTILITY: CLEAR ELEMENT CONTENT ]
	static clear(id) {
        this.updateElement(id,'');
    }

	//---[ UTILITY: UPDATE ELEMENT ]
	static updateElement(id, newText, newClass) {
	  const element = this.get(id);
	  if (element) {
		element.textContent = newText; // Sets the visible text
		element.value = newText; // Also Sets the value text
        // esp. for text areas and editors, want to trigger change
        this.trigger(element,'input');
		if (newClass) {
		  element.className = newClass; // Replaces all existing classes
		}
	  } else {
		console.warn(`Element with id "${id}" not found.`);
	  }
	}

	//---[ UTILITY: SHOW/HIDE ELEMENT ]
	static show(id) {
	  const element = this.get(id);
	  element.style.display = ''; 
	}
	static hide(id) {
	  const element = this.get(id);
	  element.style.display = 'none'; 
	}

    /* for correct exec of functions after full document load... */
    static ready(fn) {
      if (document.readyState !== 'loading') {
        fn();
      } else {
        document.addEventListener('DOMContentLoaded', fn);
      }
    }

    /* copy things to the clipboard */
    static clipboard(text, fnOK, fnERROR){
         navigator.clipboard.writeText(text)
          .then(fnOK)
          .catch(err => { fnERROR(err); }); 
    }


    /* write to the console */
    static console(msg){
        console.log(msg);
    }


    /* for on-click handlers... */
    static click(id, fn) {
        this.get(id).addEventListener("click", fn);
    }

    /* just a test func */
	static test(){ return 1; }
}
