## Formatting TEA Program Lists, Sets or Collections

The new supported structure (esp. as per WEB TEA semantics) follows the following rules:

1. The standard configurations and program collections are picked from the file at the path: "https://raw.githubusercontent.com/mcnemesis/cli_tttt/refs/heads/master/sample_TEA_programs/tea_tttt_transformer_sets/Reference_TEA_TTTTT_TransformerConfigurationSet.json" 
2. The contents of that file are meant to be a JSON Array containing strings with the config/program/doc files formatted as such:
[
	"FILE NAME<>FILE CONTENTS",
	"PROGRAM NAME<>PROGRAM CODE",
...
]
