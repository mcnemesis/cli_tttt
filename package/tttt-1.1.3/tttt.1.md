% tttt(1) tttt 1.1.0
% Joseph W. Lutalo
% SEPT 2025

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
5. **TEA WEB IDE**: Not only that one can try out TEA programs directly over the internet/web, but there is lots of examples and documentation links on the TEA WEB IDE via: https://tea.nuchwezi.com

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

This Reference Implementation comes with many useful test cases, test programs and input data included in the official project's repository. This, so anyone trying out TEA for the first time, or advanced users in need of forking the project, testing edge-cases, implementing advanced TEA integration into their own projects and such, can have somewhere to start. Check the official test cases via the tests/ path on the project's official Git Repository.

https://github.com/mcnemesis/cli_tttt/tree/master/tests/

# APPLICATIONS

Starting with v1.0.7 of the TTTT package, TEA now comes with a special example application of TEA in real-life in the form of a command-line personal assistant known as ZHA (Zee Hacker Assistant). This PA is introduced in a paper linked to on the TEA project's home page:

https://github.com/mcnemesis/cli_tttt/README.md

And illustrations of how to use or invoke it after installing the TTTT package are likewise detailed there. However, in brief, after installing the tttt package, the "zha" command likewise becomes globally available so that, invoking the ZHA personal assistant via any of the following invocation methods launches an interactive session on the CLI via which one can interact with the interesting multi-turn, offline-capable personal assistant. 


**zha**
: Invoke the ZHA personal assistant without an explicit target entity name


**zha -i NAME**
: Invoke the ZHA personal assistant NAME as the explicit target entity name - basically, the session shall involve your conversation with some entity known as NAME

Note that ZHA is still under active
development, and so, any glitches or bugs encountered need be reported to the current maintainer: Joseph W. Lutalo <joewillrich@gmail.com>

# Running TEA Anywhere, Without Installation?:

Currently (or since v1.1.0), TEA can not only be used via the command-line as with the `tttt` package and utility, but anyone with a browser that is decent, can just go over to the official TEA WEB IDE (https://tea.nuchwezi.com), and from there write the same code they would have run on the CLI version of TEA, directly via the browser --- basically, no more worry about operating system compartibility, or package dependencies, etc. 

BUT, there's one caveat: WEB TEA is implemented on-top of the JavaScript platform, and so, unlike the case of CLI TEA running in a shell and hosted by Python3, WEB TEA can't allow TEA programs that were meant to run shell commands with z: to work as expected without tweak. So, for those who wish to exploit the ZAP capabilities of TEA, note that, while the WEB TEA implementation allows one to write programs such as:

i!:3|v:vCMD:{Number(AI) + 2}|z*:vCMD 

which would essentially allow TEA to do math via underlying JavaScript environment and return result "5", attempts to run that same exact program on the CLI TEA wouldn't work as expected. So, likewise, the following [equivalent] TEA program that would work on the commandline, and which is meant to do the same thing as the above version, will not work in WEB TEA:

i!:2|x!:{ + 3}|v:vOP|x:{echo "}|x!:{"|bc}|v:vCMD|i!:|z*:vCMD|g:

So, as you can then see, sometimes, it might be easier to do certain things using TEA on the WEB, while in other cases, one might prefer TEA on the command-line.

Perhaps also, the only other case where TEA on the WEB and CLI TEA might vary is with the W: TEA command. Because, when contacting some servers using http clients, those running via CLI TEA might sometimes be able to pass some tests such as CORS restrictions, while some servers/APIs might block some requests conducted via the Web TEA's AJAX-like calls with W: So, for those interested, to explore, go to the tests/ section of the project's GitHub, and look for tests/test_w_*.tea files, to
see what is possible where and what is not.

That said, any other functionality in TEA, A: to Z:, is but the same, and entirely Platform Agnostic! So that, any program you write for CLI TEA, if pasted in the WEB TEA, or run against tea.js, shall likewise produce the same results. A great demonstration of this is the way the WEB TEA IDE can impressively run the ZHA.tea chatbot program directly using the Linux/Unix shell program script originally meant for CLI TEA/tttt.

# BUGS and Feature Requests?

Contact the TEA Core TEAM: tech@nuchwezi.com
Or TEA Inventor Himself: jwl@nuchwezi.com | joewillrich@gmail.com
