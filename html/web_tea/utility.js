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
	  this.status(message, "alert alert-error");
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

	static status(message, type) {
	  if (type) {
		this.updateElement("txt_status", message, type);
	  } else {
		this.updateElement("txt_status", message, "alert alert-info");
	  }
	}

	//---[ UTILITY: UPDATE ELEMENT ]
	static updateElement(id, newText, newClass) {
	  const element = this.get(id);
	  if (element) {
		element.textContent = newText; // Sets the visible text
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
