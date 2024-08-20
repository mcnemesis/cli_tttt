#!/usr/bin/env python3
#--------------------------------------------------------------------
# TTTT: TEA Text Transformer Terminal
#--------------------------------------------------------------------
# TEA, which is the Transforming Executable Alphabet language is implemented here
# using the Python programming language as the base/host language.
#--------------------------------------------------------------------
# The original/historically older TEA implementation is found in the TTTT Android app
# accessible via https://bit.ly/grabteas
#
# This commandline implementation of the TTTT is meant to extend the
# access of TEA to all major operating systems, by creating a standalone
# TEA interpreter that can be utilized in scripts, standalone programs
# and/or on the commandline.
#---------------------------------------------------------------------
# IMPLIMENTOR: Joseph W. Lutalo (jwl@nuchwezi.com, joewillrich@gmail.com)
#---------------------------------------------------------------------

#==================== CLI TTTT Design ================================
"""

echo INPUT | tttt

INPUT is considered to be a valid TEA program (possibly already containing its input), and is executed as such

Or with

echo INPUT | tttt -c CODE

Where INPUT is treated as input data and the TEA program is read from the string CODE

Or with

echo INPUT | tttt -fc FCODE

Where INPUT is treated as input data and the TEA program is read from the file path FCODE

Or with

tttt -i INPUT -c CODE

Where INPUT is treated as input data and the TEA program is read from the string CODE

Or with

tttt -i INPUT -fc FCODE

Where INPUT is treated as input data and the TEA program is read from the file path FCODE

Or with

tttt -fi INPUT -fc FCODE

Where INPUT is treated as data input file path and the TEA program is read from the file path FCODE

In all situations, the TTTT interpreter executes the available TEA program on the available input data and outputs the final result via standard output, and does nothing else but quit.
"""

def run_tttt():
    import sys, os

    DEBUG = True
    INPUT = None #shall either be read from stdin or from the val to -i or -fi
    CODE = None #shall either be from INPUT or from the val to -c or -fc
    HasSTDIN = False
    STDINPUT = None
    STDIN_AS_CODE = False
    OBSCURE_RC_NL = "=NL=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=NL="
    OBSCURE_RC_COM = "=COM=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=COM="
    OBSCURE_RC_TID = "=TID=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=TID="
    TID = "|"
    NL = "\n"
    COMH = "#"
    TCD = ":"
    TIPED = ":"
    RETEASTRING1 = r'\{.*?\}'
    RETEASTRING2 = r'"[^"]*?"'
    VAULTS = {}
    GLUE = " "
    SINGLE_SPACE_CHAR = " "
    RE_WHITE_SPACE = r'\s+'
    RE_WHITE_SPACE_N_PUNCTUATION = r'[\s\W]+'
    EMPTY_STR = ""
    # we shall store label block pointers as such:
    #    label_name: label_position + 1
    #    such that, jumping to label_name allows us to
    #    proceed execution from instruction at index label_position +1
    LABELBLOCKS = {}

# in case data was input via STDIN (such as via a pipe)
    if os.isatty(sys.stdin.fileno()):
        INPUT = None
        STDINPUT = None
    else:
        STDINPUT = os.linesep.join(sys.stdin.readlines())
        HasSTDIN = True


#-----------------------------
# UTILS
#-----------------------------

# Function to read all lines from a file
    def read_file(file_path):
        try:
            with open(file_path, 'r') as file:
                return os.linesep.join(file.readlines())
        except BaseException:
            return None

# TEA triangular reduction
    def triangular_reduction(data):
        lines = []
        for i in range(len(data)):
            lines.append(data[i:])
        return os.linesep.join(lines)


# TEA right-most triangular reduction
    def rightmost_triangular_reduction(data):
        lines = []
        for i in range(len(data)):
            lines.append(data[:(len(data)-i)])
        return os.linesep.join(lines)

# TEA mirror transform
    def mirror(data):
        return "".join(reversed(data))

# Pre-process TEA CODE
    def pre_process_TSRC(tsrc):
# for now, trim all leading and trailing white space
        return tsrc.strip()

# Validate TEA CODE:
# Essentially, check if:
# - Code contains at least one valid TEA Instruction Line:
# ([a-zA-Z]!?*?:.*(:.*)*|?)+(#.*)*
    def validate_TSRC(tsrc):
        reTEAPROGRAM = re.compile("([a-zA-Z]!?\*?:.*(:.*)*\|?)+(#.*)*")
        errors = []
        _tsrc = tsrc.strip()
        isValid = False if len(_tsrc) == 0 else True
        if not isValid:
            errors.append("[ERROR] TEA Source is Empty!")
            return isValid, errors
        isValid = re.search(reTEAPROGRAM,_tsrc) is not None
        if not isValid:
            errors.append("[ERROR] TEA Source is INVALID!")
            return isValid, errors
        else:
            return isValid, errors

# Function to replace newlines with OBSCURE Pattern
    def maskTEASTRING(mObj):
        return mObj.group().replace('\n', OBSCURE_RC_NL).replace('#',OBSCURE_RC_COM).replace('|',OBSCURE_RC_TID)


# Clean TEA CODE:
# Essentially, eliminate all TEA Opaque Lines:
# - TEA Comments
# - Non-TEA Instruction Lines
# and put each TI on its own line, with any leading whitespace removed
    def clean_TSRC(tsrc):
        if len(tsrc) == 0:
            return tsrc
        # remove trailing whitespace
        _tsrc = tsrc.strip()
        # first, fold multi-line TIL strings
        _tsrc = re.sub(RETEASTRING1, maskTEASTRING, _tsrc, flags=re.DOTALL)
        _tsrc = re.sub(RETEASTRING2, maskTEASTRING, _tsrc, flags=re.DOTALL)
        # remove all TEA comments
        reTCOM = re.compile("#[^\n]*")
        _tsrc = re.sub(reTCOM,"",_tsrc)
        # first, split by newline
        _tsrc_lines = _tsrc.split(NL)
        _tils = []
        # process multiple tils on same line
        for l  in _tsrc_lines:
            # split a line by TID
            if TID in l:
                _tis = l.split(TID)
                _tils.extend(_tis)
            else:
                _tils.append(l)
        _tsrc_lines = _tils
        if DEBUG:
            print(f"#{len(_tsrc_lines)} of {(_tsrc_lines)}")
        reTI = re.compile('[ ]*?[a-zA-Z]!?\*?:.*?')
        # remove all non-TIL lines
        _tsrc_til_only = [l.lstrip() for l in _tsrc_lines if reTI.match(l)]
        if DEBUG:
            # reverse string masking...
            _tsrc_til_only_show = [l.
                    replace(OBSCURE_RC_NL,NL)
                    .replace(OBSCURE_RC_COM,COMH)
                    .replace(OBSCURE_RC_TID,TID) for l in _tsrc_til_only]
            print(f"##{len(_tsrc_til_only_show)} of {(_tsrc_til_only_show)}")
        _tsrc = NL.join(_tsrc_til_only)
        return _tsrc

    # reverse TEA String Masking
    def unmask_str(val):
        return val.replace(OBSCURE_RC_NL,NL).replace(OBSCURE_RC_COM,COMH).replace(OBSCURE_RC_TID,TID)

    # Extract a string from a TEA expression
    def extract_str(val):
        if val.startswith("{") and val.endswith("}"):
            val = val.lstrip("{").rstrip("}")
            return unmask_str(val)
        if val.startswith("\"") and val.endswith("\""):
            val = val.lstrip("\"").rstrip("\"")
            return unmask_str(val)
        return unmask_str(val)

    def util_anagramatize_words(val):
        parts = re.split(RE_WHITE_SPACE, val)
        lparts = random.sample(parts, len(parts))
        return GLUE.join(lparts)

    def util_anagramatize_chars(val):
        parts = list(val)
        return EMPTY_STR.join(random.sample(list(parts), len(parts)))

    def util_unique_chars(val):
        unique_chars = ""
        for char in val:
            if char not in unique_chars:
                unique_chars += char
        return unique_chars


#-----------------------------
# TAZ Implementation
#-----------------------------
    def process_a(ti, ai):
        io = ai
        tc, tpe = ti.split(TCD, maxsplit=1)
        tc = tc.upper()
        tpe = tpe.strip()
        # extract the string parameter
        tpe_str = extract_str(tpe)

        if tc == "A":
            input_str = tpe_str if len(tpe_str) > 0 else ai
            io = util_anagramatize_words(input_str)
        if tc == "A!":
            input_str = tpe_str if len(tpe_str) > 0 else ai
            io = util_anagramatize_chars(input_str)
        if tc == "A*":
            if not (tpe_str in VAULTS):
                if DEBUG:
                    print(f"[ERROR] Instruction {ti} trying to access Non-Existent Vault [{tpe_str}]")
                raise ValueError("[MEMORY ERROR] ATTEMPT to ACCESS NON-EXISTENT VAULT")
            input_str = VAULTS.get(tpe_str,"") if len(tpe_str) > 0 else ai
            io = util_anagramatize_words(input_str)
        if tc == "A*!":
            if not (tpe_str in VAULTS):
                if DEBUG:
                    print(f"[ERROR] Instruction {ti} trying to access Non-Existent Vault [tpe_str]")
                raise ValueError("[MEMORY ERROR] ATTEMPT to ACCESS NON-EXISTENT VAULT")
            input_str = VAULTS.get(tpe_str,"") if len(tpe_str) > 0 else ai
            io = util_anagramatize_chars(input_str)
        return io


    def process_b(ti, ai):
        io = ai
        tc, tpe = ti.split(TCD, maxsplit=1)
        tc = tc.upper()
        tpe = tpe.strip()
        # extract the string parameter
        tpe_str = extract_str(tpe)

        if tc == "B":
            input_str = tpe_str if len(tpe_str) > 0 else ai
            io = util_unique_chars(input_str)
        if tc == "B!":
            input_str = tpe_str if len(tpe_str) > 0 else ai
            io = EMPTY_STR.join(sorted(util_unique_chars(input_str)))
        if tc == "B*":
            if not (tpe_str in VAULTS):
                if DEBUG:
                    print(f"[ERROR] Instruction {ti} trying to access Non-Existent Vault [{tpe_str}]")
                raise ValueError("[MEMORY ERROR] ATTEMPT to ACCESS NON-EXISTENT VAULT")
            input_str = VAULTS.get(tpe_str,"") if len(tpe_str) > 0 else ai
            io = util_unique_chars(input_str)
        if tc == "B*!":
            if not (tpe_str in VAULTS):
                if DEBUG:
                    print(f"[ERROR] Instruction {ti} trying to access Non-Existent Vault [tpe_str]")
                raise ValueError("[MEMORY ERROR] ATTEMPT to ACCESS NON-EXISTENT VAULT")
            input_str = VAULTS.get(tpe_str,"") if len(tpe_str) > 0 else ai
            io = EMPTY_STR.join(sorted(util_unique_chars(input_str)))
        return io


    def process_c(ti, ai):
        io = EMPTY_STR
        tc, tpe = ti.split(TCD, maxsplit=1)
        tc = tc.upper()

        if tc == "C":
            pass
        if tc == "C!":
            for vault in VAULTS:
                VAULTS[vault] = EMPTY_STR
        return io


    def process_d(ti, ai):
        io = ai
        tc, tpe = ti.split(TCD, maxsplit=1)
        tc = tc.upper()
        tpe = tpe.strip()
        # extract the string parameter
        tpe_str = extract_str(tpe)

        if tc == "D":
            dpatterns = tpe_str.split(TIPED)
            for dp in dpatterns:
                io = re.sub(dp, EMPTY_STR, io)
        if tc == "D!":
            if len(tpe_str) == 0:
                io = re.sub(RE_WHITE_SPACE, EMPTY_STR, io)
            else:
                dpatterns = tpe_str.split(TIPED)
                dfilter = "|".join(dpatterns)
                matches = re.findall(dfilter,io)
                io = GLUE.join(matches)
        return io


    def process_e(ti, ai):
        io = ai
        tc, tpe = ti.split(TCD, maxsplit=1)
        tc = tc.upper()
        tpe = tpe.strip()
        # extract the string parameter
        tpe_str = extract_str(tpe)

        raise ValueError("E: not yet implemented")

        return io


    def process_f(ti, ai):
        io = ai
        tc, tpe = ti.split(TCD, maxsplit=1)
        tc = tc.upper()
        tpe = tpe.strip()
        # extract the string parameter
        tpe_str = extract_str(tpe)

        if tc == "F":
            params = tpe_str.split(TIPED)
            if len(params) == 0:
                return io
            if len(params) == 1:
                if DEBUG:
                    print(f"[ERROR] Instruction {ti} Invoked with No Labels!")
                raise ValueError(f"[ERROR] Fork Instruction {ti} Invoked with No Labels!")
            if len(params) == 2:
                rtest = re.compile(params[0])
                tblock = params[1]
                if not (tblock in LABELBLOCKS):
                    if DEBUG:
                        print(f"[ERROR] Instruction {ti} trying to access Non-Existent Block [{tblock}]")
                    raise ValueError("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                if rtest.match(io):
                    ATPI = LABELBLOCKS[tblock]
                else:
                    ATPI += 1
                return io
            else:
                rtest = re.compile(params[0])
                tblock = params[1]
                fblock = params[2]
                if not (tblock in LABELBLOCKS):
                    if DEBUG:
                        print(f"[ERROR] Instruction {ti} trying to access Non-Existent Block [{tblock}]")
                    raise ValueError("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                if not (fblock in LABELBLOCKS):
                    if DEBUG:
                        print(f"[ERROR] Instruction {ti} trying to access Non-Existent Block [{fblock}]")
                    raise ValueError("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                if rtest.match(io):
                    ATPI = LABELBLOCKS[tblock]
                else:
                    ATPI = LABELBLOCKS[fblock]
                return io

        if tc == "F!":
            params = tpe_str.split(TIPED)
            if len(params) == 0:
                return io
            if len(params) == 1:
                if DEBUG:
                    print(f"[ERROR] Instruction {ti} Invoked with No Labels!")
                raise ValueError(f"[ERROR] Fork Instruction {ti} Invoked with No Labels!")
            if len(params) == 2:
                rtest = re.compile(params[0])
                tblock = params[1]
                if not (tblock in LABELBLOCKS):
                    if DEBUG:
                        print(f"[ERROR] Instruction {ti} trying to access Non-Existent Block [{tblock}]")
                    raise ValueError("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                if not rtest.match(io):
                    ATPI = LABELBLOCKS[tblock]
                else:
                    ATPI += 1
                return io
            else:
                rtest = re.compile(params[0])
                tblock = params[1]
                fblock = params[2]
                if not (tblock in LABELBLOCKS):
                    if DEBUG:
                        print(f"[ERROR] Instruction {ti} trying to access Non-Existent Block [{tblock}]")
                    raise ValueError("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                if not (fblock in LABELBLOCKS):
                    if DEBUG:
                        print(f"[ERROR] Instruction {ti} trying to access Non-Existent Block [{fblock}]")
                    raise ValueError("[CODE ERROR] ATTEMPT to ACCESS NON-EXISTENT BLOCK")
                if not rtest.match(io):
                    ATPI = LABELBLOCKS[tblock]
                else:
                    ATPI = LABELBLOCKS[fblock]
                return io

        ATPI += 1 #move to next instruction if fork didn't evaluate...
        return io


    def process_g(ti, ai):
        io = ai
        tc, tpe = ti.split(TCD, maxsplit=1)
        tc = tc.upper()
        tpe = tpe.strip()
        # extract the string parameter
        tpe_str = extract_str(tpe)

        if tc == "G":
            params = tpe_str.split(TIPED)
            if len(params) == 0:
                io = re.sub(RE_WHITE_SPACE, EMPTY_STR, io)
            if len(params) == 1:
                glue = params[0]
                io = re.sub(RE_WHITE_SPACE, glue, io)
            if len(params) == 2:
                regex = re.compile(params[1])
                glue = params[0]
                io = re.sub(regex, glue, io)
        if tc == "G!":
            params = tpe_str.split(TIPED)
            if len(params) == 0:
                pass
            if len(params) == 1:
                glue = params[0]
                io = re.sub(RE_WHITE_SPACE_N_PUNCTUATION, glue, io)
        if tc == "G*":
            params = tpe_str.split(TIPED)
            if len(params) < 3:
                pass
            else:
                glue = params[0]
                vaults = params[1:]
                vals = []
                for v in vaults:
                    if not (v in VAULTS):
                        if DEBUG:
                            print(f"[ERROR] Instruction {ti} trying to access Non-Existent Vault [{v}]")
                        raise ValueError("[MEMORY ERROR] ATTEMPT to ACCESS NON-EXISTENT VAULT")
                    else:
                        vals.append(VAULTS[v])
                io = glue.join(vals)
        return io


    def process_h(ti, ai):
        io = ai
        tc, tpe = ti.split(TCD, maxsplit=1)
        tc = tc.upper()
        tpe = tpe.strip()
        # extract the string parameter
        tpe_str = extract_str(tpe)

        if tc == "H":
            if len(tpe_str) == 0:
                io = SINGLE_SPACE_CHAR.join(list(io))
            else:
                regex = r'(?=' + tpe_str + ')'
                parts = re.split(regex, io)
                io = SINGLE_SPACE_CHAR.join(parts)
        if tc == "H!":
            if len(tpe_str) == 0:
                io = NL.join(list(io))
            else:
                regex = r'(?=' + tpe_str + ')'
                parts = re.split(regex, io)
                io = NL.join(parts)
        if tc == "H*":
            params = tpe_str.split(TIPED, maxsplit=2)
            if len(params) < 2:
                pass
            else:
                vault = params[0]
                regex = params[1]
                if not (vault in VAULTS):
                    if DEBUG:
                        print(f"[ERROR] Instruction {ti} trying to access Non-Existent Vault [{vault}]")
                    raise ValueError("[MEMORY ERROR] ATTEMPT to ACCESS NON-EXISTENT VAULT")
                input_str = VAULTS.get(vault)
                io = SINGLE_SPACE_CHAR.join(list(input_str))
        if tc == "H*!":
            params = tpe_str.split(TIPED, maxsplit=2)
            if len(params) < 2:
                pass
            else:
                vault = params[0]
                regex = params[1]
                if not (vault in VAULTS):
                    if DEBUG:
                        print(f"[ERROR] Instruction {ti} trying to access Non-Existent Vault [{vault}]")
                    raise ValueError("[MEMORY ERROR] ATTEMPT to ACCESS NON-EXISTENT VAULT")
                input_str = VAULTS.get(vault)
                regex = r'(?=' + regex + ')'
                parts = re.split(regex, input_str)
                io = NL.join(parts)
        return io


    def process_i(ti, ai):
        io = ai
        tc, tpe = ti.split(TCD, maxsplit=1)
        tc = tc.upper()
        tpe = tpe.strip()
        # extract the string parameter
        tpe_str = extract_str(tpe)

        if tc == "I":
            if len(tpe_str) == 0:
                pass
            else:
                if (len(io) == 0) or (io is None):
                    io = tpe_str
        if tc == "I!":
            if len(tpe_str) == 0:
                io = EMPTY_STR
            else:
                io = tpe_str
        return io



#-----------------------------
# CLI Interface
#-----------------------------

# let us setup cli processing...
    import argparse
    parser = argparse.ArgumentParser(
                        prog='tttt',
                        description='tttt is an interpreter for the TEA language',
                        epilog="""
    NOTE: tttt can also accept input from other processes via standard input such
    piping the output of other programs to tttt:
    <<

    echo INPUT | tttt

    >>
    In this case, with no other arguments to tttt, it is assumed INPUT is a TEA program
    (with or without in-code inputs), otherwise, if either -i or -fi are used in this mode
    such as with
    <<

    echo INPUT | tttt -i DATA

    >>
    <<

    echo INPUT | tttt -fi FDATA

    >>
    DATA or the text from FDATA take precendence as INPUT to tttt unless they are found to
    be blank or Null -- such as with a none-existent/inaccessible FDATA. Also, in these two
    cases, if no -c or -fc option was specified, then tttt assumed INPUT is the TEA program
    """)

    group_i = parser.add_mutually_exclusive_group()
    group_c = parser.add_mutually_exclusive_group()

    parser.add_argument("-d", "--debug", help="Turn debugging ON", action="store_true")

    group_i.add_argument("-i", "--input", type=str, help="use INPUT as input")
    group_i.add_argument("-fi", "--input-file", type=str, help="read input from INPUT_FILE")

    group_c.add_argument("-c", "--code", type=str, help="use CODE as TEA program")
    group_c.add_argument("-fc", "--code-file", type=str, help="read TEA program from CODE_FILE")

    args = parser.parse_args()

    DEBUG = True if args.debug else False # allow user to toggle debugging


    if args.code:
        CODE = args.code
    elif args.code_file:
        if DEBUG:
            print(f"Reading CODE from: {args.code_file}")
        CODE = read_file(args.code_file)
    else:
        if HasSTDIN:
            CODE = STDINPUT
            STDIN_AS_CODE = True
        if DEBUG:
            print("Using INPUT as CODE")


    if args.input:
        INPUT = args.input
    elif args.input_file:
        if DEBUG:
            print(f"Reading INPUT from: {args.input_file}")
        INPUT = read_file(args.input_file)
    else:
        if not STDIN_AS_CODE:
            INPUT = STDINPUT
            if DEBUG:
                print("No explicit INPUT found, using STDIN!")
        else:
            if DEBUG:
                print("No explicit INPUT found!")


    if DEBUG:
        print(f"INPUT:{os.linesep} {INPUT}")

    if DEBUG:
        if CODE is None:
            print("No CODE found!")
        else:
            print(f"CODE:{os.linesep} {CODE}")



#-----------------------------
# TEA Processing
#-----------------------------
    import re
    import random

    OUTPUT = None
    INSTRUCTIONS = []

    if CODE:
        TSRC = pre_process_TSRC(CODE)
        isTSRCValid,errors = validate_TSRC(TSRC)
        if not isTSRCValid:
            if DEBUG:
                print("TEA CODE ERRORS FOUND:\n%s" % "\n".join(errors))
            exit()
        onlyTILTSRC = clean_TSRC(TSRC)
        if DEBUG:
            print(f"CLEAN TEA CODE TO PROCESS:\n{onlyTILTSRC}")

        INSTRUCTIONS = onlyTILTSRC.split(NL)

        if len(INSTRUCTIONS) == 0:
            if DEBUG:
                print(f"NO TEA Instruction Lines Found!")
                exit()
    else:
        if DEBUG:
            print("NO TEA CODE FOUND")
        exit()

# by default, the input is the output if not touched..
    OUTPUT = INPUT

    TI_index = 0
    for i in INSTRUCTIONS:
        if i.upper().startswith("L"):
            params = i.split(TCD)
            for p in params[1:]:
                LABELBLOCKS[p] = TI_index + 1
        TI_index += 1


    ATPI = 0 # Active TI POSITION INDEX
    while(True):
        # detect end of program and quit
        if ATPI >= len(INSTRUCTIONS):
            break

        if DEBUG:
            print(f"Executing Instruction#{ATPI} (out of {len(INSTRUCTIONS)})")

        instruction = INSTRUCTIONS[ATPI]

        TC = instruction.upper()[0]

        # A: Anagrammatize
        if TC == "A":
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = process_a(instruction, OUTPUT)
            ATPI += 1
            continue

        # B: Basify
        if TC == "B":
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = process_b(instruction, OUTPUT)
            ATPI += 1
            continue

        # C: Clear
        if TC == "C":
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = process_c(instruction, OUTPUT)
            ATPI += 1
            continue

        # D: Delete
        if TC == "D":
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = process_d(instruction, OUTPUT)
            ATPI += 1
            continue

        # E: Evaluate
        if TC == "E":
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = process_e(instruction, OUTPUT)
            ATPI += 1
            continue

        # F: Fork
        if TC == "F":
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = process_f(instruction, OUTPUT)
            #ATPI += 1 # f: updates ATPI directly...
            continue

        # G: Glue
        if TC == "G":
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = process_g(instruction, OUTPUT)
            ATPI += 1
            continue

        # H: Hew
        if TC == "H":
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = process_h(instruction, OUTPUT)
            ATPI += 1
            continue

        # I: Input
        if TC == "I":
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = process_i(instruction, OUTPUT)
            ATPI += 1
            continue


        # J: Jump

        # K: Keep
        elif instruction.upper().startswith("K:"): #// keep: k:PATTERN
            if OUTPUT is None:
                continue
            tokens = instruction.split(":", maxsplit=1)
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
                print(f"Instruction Tokens: {tokens}")
            inputLines = OUTPUT.split(os.linesep)
            keptLines = []
            PATTERN = re.compile(tokens[1])
            for line in inputLines:
                if re.match(PATTERN, line):
                    keptLines.append(line)
            OUTPUT = os.linesep.join(keptLines)

        # L: Label

        # M: Mirror
        elif instruction.upper().startswith("M:"): #// laterally invert words in place (mirror): m:
            if OUTPUT is None:
                continue
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            parts = re.split("\\s+", OUTPUT)
            lparts = []
            for word in parts:
                lparts.append(mirror(word))
            OUTPUT = GLUE.join(lparts)
        elif instruction.upper().startswith("MM:"): #// laterally invert everything (mirror): mm:
            if OUTPUT is None:
                continue
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = mirror(OUTPUT)

        # N: Number

        # O: Order

        # P: Permutate

        # Q: Quit

        # R: Replace
        if instruction.upper().startswith("R:"): #// replace: r:PATTERN:replace
            if OUTPUT is None:
                continue
            tokens = instruction.split(":", maxsplit=2)
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
                print(f"Instruction Tokens: {tokens}")
            PATTERN = re.compile(tokens[1])
            replacement = tokens[2]
            OUTPUT = re.sub(PATTERN, replacement, OUTPUT)

        # S: Salt
        elif instruction.upper().startswith("S:"): #// shuffle: s:
            if OUTPUT is None:
                continue
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            parts = re.split("\\s+", OUTPUT)
            lparts = random.sample(parts, len(parts))
            OUTPUT = GLUE.join(lparts)

        # T: Transform
        elif instruction.upper().startswith("T:"): #// triangular reduction: t:
            if OUTPUT is None:
                continue
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = triangular_reduction(OUTPUT)

        elif instruction.upper().startswith("RT:"): #// rightmost triangular reduction: rt:
            if OUTPUT is None:
                continue
            if DEBUG:
                print(f"Processing Instruction: {instruction}")
            OUTPUT = rightmost_triangular_reduction(OUTPUT)
        # U: Uniqueify

        # W: Webify

        # X: Xenograft

        # Y: Yank

        # Z: Zap


    print(OUTPUT)


if __name__ == "__main__":
    run_tttt()
