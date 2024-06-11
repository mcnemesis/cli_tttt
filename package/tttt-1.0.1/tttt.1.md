% tttt(1) tttt 1.0.0
% Joseph W. Lutalo
% June 2024

# NAME
tttt - The TEA language interpreter

# SYNOPSIS
**tttt** [-h] [-d] [-i INPUT | -fi INPUT_FILE] [-c CODE | -fc CODE_FILE]

# DESCRIPTION
**tttt** accepts any valid TEA program or script, and runs it, leveraging standard input and output based on method of invocation.

# OPTIONS

TTTT is a command line interpreter for the TEA language that's capable of being run on the command line using the command style:

> echo INPUT | tttt 

For which INPUT could be any valid TEA program already containing its input

Or with

> echo INPUT | tttt -c TEAS

Where INPUT is treated as input data and the TEA program is read from the string TEAS

Or with

> echo INPUT | tttt -fc TEAS

Where INPUT is treated as input data and the TEA program is read from the file path TEAS

Or with

> tttt -i INPUT -c TEAS

Where INPUT is treated as input data and the TEA program is read from the string TEAS

Or with

> tttt -i INPUT -fc TEAS

Where INPUT is treated as input data and the TEA program is read from the file path TEAS

Or with

> tttt -fi INPUT -fc TEAS

Where INPUT is treated as data input file path and the TEA program is read from the file path TEAS

In all situations, the TTTT interpreter executes the available TEA program on the available input data and outputs the final result via standard output, and does nothing else but quit.

As a final aspect of using CLI TTTT, note that we can expect that some users shall wish to invoke/use TTTT in the context of other tools, or rather,
in sticking with the UNIX philosophy of building generic, re-usable tools, we can expect that TTTT could process input from other tools or produce
output for other tools/processes. In this regard, we should also note that CLI TTTT can use utilized as such:

> echo INPUT | tttt

In which case INPUT (or whatever it is that is piped to TTTT) shall get treated as:

1. DATA in case no other explicit data was specified to TTTT (like via the -i or -fi arguments)
2. CODE in case no explicit code was specified to TTTT (such as with -c or -fc arguments)

And since TEA CODE can also carry its own data (as with the i: command), this input could be both the DATA and CODE. Try tttt -h or man tttt for more.

# EXAMPLES
**echo -n STAR | tttt -c aa:**
: Takes the input word "STAR" and returns its anagrams such as "RATS", "ARTS", etc

**echo -n STAR | tttt -c r:$:T**
: Takes the input and replaces all line endings with the letter "T", such as returning "START" in this example

More examples of TEA programs are included in the project's Github: https://github.com/mcnemesis/cli_tttt/tree/master/sample_TEA_programs
