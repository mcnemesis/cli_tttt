## Formatting TEA Program Lists, Sets or Collections

The new supported structure (esp. as per WEB TEA semantics) follows the following rules:

1. The standard configurations and program collections are picked from the file at the path: "https://raw.githubusercontent.com/mcnemesis/cli_tttt/refs/heads/master/sample_TEA_programs/tea_tttt_transformer_sets/Reference_TEA_TTTTT_TransformerConfigurationSet.json" 
2. The contents of that file are meant to be a JSON Array containing strings with the config/program/doc files formatted as such:
[
	"FILE NAME<>FILE CONTENTS",
	"PROGRAM NAME<>PROGRAM CODE",
...
]

UPDATE: Because of HTTP errors (429 Too Many Requests) issued by GitHub concerning this mode of access to the file. We are shifting this configuration file into the WEB TEA directory, especially since the WEB IDE is the cannonical user/processor of that file.

The new PATH is: 

web/web_tea/resources/code/Reference_TEA_StandardPrograms_Set.json

and via URLs:

https://raw.githubusercontent.com/mcnemesis/cli_tttt/web/web_tea/resources/code/Reference_TEA_StandardPrograms_Set.json

or (relative to WEB IDE root)

resources/code/Reference_TEA_StandardPrograms_Set.json
