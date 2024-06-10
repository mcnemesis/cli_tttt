#!/usr/bin/env python3
#--------------------------------------------------------------------
# TTTT: TEA Text Transformer Terminal
#--------------------------------------------------------------------
# TEA, which is the TExt Alternating language is implemented here
# using the Python programming language as the base/host language.
#--------------------------------------------------------------------
# The original TEA implementation is found in the TTTT Android app
# accessible via https://bit.ly/grabteas
#
# This commandline implementation of the TTTT is meant to extend the
# access of TEA to all major operating systems, by creating a standalone
# TEA interpreter that can be utilized in scripts or on the commandline.
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

import sys, os

DEBUG = True
INPUT = None #shall either be read from stdin or from the val to -i or -fi
CODE = None #shall either be from INPUT or from the val to -c or -fc
HasSTDIN = False
STDINPUT = None
STDIN_AS_CODE = False

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
GLUE = " "
INSTRUCTIONS = []

if CODE:
    INSTRUCTIONS = CODE.split()

# by default, the input is the output if not touched..
OUTPUT = INPUT

for instruction in INSTRUCTIONS:
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
    elif instruction.upper().startswith("D:"): #// delete: d:PATTERN
        if OUTPUT is None:
            continue
        tokens = instruction.split(":", maxsplit=1)
        if DEBUG:
            print(f"Processing Instruction: {instruction}")
            print(f"Instruction Tokens: {tokens}")
        PATTERN = re.compile(tokens[1])
        OUTPUT = re.sub(PATTERN, "", OUTPUT)
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
    elif instruction.upper().startswith("S:"): #// shuffle: s:
        if OUTPUT is None:
            continue
        if DEBUG:
            print(f"Processing Instruction: {instruction}")
        parts = re.split("\\s+", OUTPUT)
        lparts = random.sample(parts, len(parts))
        OUTPUT = GLUE.join(lparts)
    elif instruction.upper().startswith("A:"): #// anagramize words in place: a:
        if OUTPUT is None:
            continue
        if DEBUG:
            print(f"Processing Instruction: {instruction}")
        parts = re.split("\\s+", OUTPUT)
        lparts = []
        for word in parts:
            lparts.append("".join(random.sample(list(word), len(word))))
        OUTPUT = GLUE.join(lparts)
    elif instruction.upper().startswith("AA:"): #// anagramize input: aa:
        if OUTPUT is None:
            continue
        if DEBUG:
            print(f"Processing Instruction: {instruction}")
        parts = list(OUTPUT)
        OUTPUT = "".join(random.sample(list(parts), len(parts)))
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
    elif instruction.upper().startswith("I:"): #// i:STRING --> inject explicit input STRING as active input
        """
        Given example script:
        i:start
        r:st:p

        And no input, i: shall take whatever is written after the ":" on the line with the command, and set it
        as the active input to any subsequent commands. Thus, the above example script would always output "part" where
        no input was given.

        When multiple instances of the i: command exist in a script, only the first occurrence has effect, and all the
        others are ignored, unless the current output (which is the active input to the next command) at the time the i: is executed
        is blank or null.

        So,

        i:start
        i:west
        r:st:p

        Shall always output "part" where no explicit input was given, but

        i:start
        r:st:p
        d:part
        i:west
        r:w:b

        shall always output "best" where no explicit input was given.
         """

		# set both INPUT and OUTPUT to given input
		# makes sense either if the i: command was the first in the script, or
		# some earlier commands have since set OUTPUT to blank/null -- which would have left subsequent
		# commands with nothing to process...
        tokens = instruction.split(":", maxsplit=1)
        if DEBUG:
            print(f"Processing Instruction: {instruction}")
            print(f"Instruction Tokens: {tokens}")

        if (OUTPUT is None) or (len(OUTPUT) == 0):
            OUTPUT = tokens[1]


print(OUTPUT)
