% tttt(1) tttt 1.0.6
% Joseph W. Lutalo
% OCT 2024

# NAME
tttt - The TEA language interpreter

# SYNOPSIS
**tttt** [-h] [-d] [-i INPUT | -fi INPUT_FILE] [-c CODE | -fc CODE_FILE] [-v] 

# DESCRIPTION
**tttt** accepts any valid TEA program or script, and runs it, leveraging standard input and output based on method of invocation.

# OPTIONS

TTTT is the official interpreter for the TEA language and it offers the following command line interface:

> echo INPUT | tttt 

For which INPUT could be any valid TEA program already containing its input

Or with

> echo INPUT | tttt -c TEAS

Where INPUT is treated as input data and the TEA program is read from the string TEAS

Or with

> echo INPUT | tttt -fc fTEAS

Where INPUT is treated as input data and the TEA program is read from the file path fTEAS

Or with

> tttt -i INPUT -c TEAS

Where INPUT is treated as input data and the TEA program is read from the string TEAS

Or with

> tttt -i INPUT -fc fTEAS

Where INPUT is treated as input data and the TEA program is read from the file path fTEAS

Or with

> tttt -fi fINPUT -fc fTEAS

Where fINPUT is treated as data input file path and the TEA program is read from the file path fTEAS

In all situations, this TEA interpreter executes the available TEA program on the available input data, and outputs the final result via standard output, doing nothing else but quit.

As a final aspect of using TTTT, note that we can expect that some users shall wish to invoke/use TTTT in the context of other tools, or rather,
in sticking with the UNIX philosophy of building generic, re-usable tools, we can expect that TTTT could process input from other tools or produce
output for other tools/processes. In this regard, we should also note that TTTT can be utilized as such:

> echo INPUT | tttt

In which case INPUT (or whatever it is that is piped to TTTT) shall get treated as:

1. DATA in case no other explicit data was specified to TTTT (like via the -i or -fi arguments)
2. CODE in case no explicit code was specified to TTTT (such as with -c or -fc arguments)

And since TEA CODE can also carry its own data (as with the i:, w: and creative use of v:, x:, z: and other input containers or importing commands), this input could be either or both the DATA and CODE - note that with the e: command, data can become TEA code! When in doubt about what is going on in any of the above cases, or with any TTTT invocation, just pass the `-d` DEBUG flag to the TEA interpreter, and it shall display detailed, helpful information about what TTTT considers to be the TEA CODE, DATA, and the internal state of the run-time before during and after execution of each instruction in the TEA program. 


Try tttt -h or man tttt for more, or go read the official TEA documentation manual: 

# Recommended TEA Documentation:

1. tttt -h
2. This manual
3. The docs/ path under the RI for TEA: https://github.com/mcnemssis/cli_tttt
4. **The TAZ**: https://bit.ly/thetaz

# EXAMPLES
**tttt -c "i:Hello World"**

**tttt -c "i:{What is your name please? }|i:|x:{Hello }"**

: Are two minimal Hello World programs in TEA, the second, also demonstrating how TEA program correctly prompt for user-input at runtime.

**echo -n STAR | tttt -c "a!":**
: Takes the input word "STAR" and returns its anagrams by character such as "RATS", "ARTS", etc

**echo -n STAR | tttt -c r:$:T**
: Takes the input and replaces all line endings with the letter "T", such as returning "START" in this example

More examples of TEA programs are included in the project's Git Repository: https://github.com/mcnemesis/cli_tttt/tree/master/sample_TEA_programs


# TESTS

This Reference Implementation comes with several useful test cases, test programs and input data included in the official project's repository. This, so anyone trying out TEA for the first time, or advanced users in need of forking the project, testing edge-cases, implementing advanced TEA integration into their own projects and such, can have somewhere to start. Check the official test cases via the tests/ path on the project's official Git Repository.

https://github.com/mcnemesis/cli_tttt/tree/master/tests/

