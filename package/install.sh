#!/usr/bin/env bash
PACKAGE_URI=https://github.com/mcnemesis/cli_tttt/releases/download/tttt-1.4.9/tttt_1.4.9_amd64.deb
PACKAGE_FILE=package.deb
wget -O $PACKAGE_FILE $PACKAGE_URI && sudo dpkg -i $PACKAGE_FILE
if command -v tttt &> /dev/null
then
	echo "TTTT, ZHA, AMC & Lexicon installation was successful."
    rm $PACKAGE_FILE
	echo "=====-------||| WELCOME TO TEA ||-------====="
	echo "INSTALLED: tttt <- command to run TEA programs"
	echo "INSTALLED: zha <- command to run TEA app: Zee Hacker Assistant, a chatbot"
	echo "INSTALLED: amc <- command to run TEA app: Advanced Mathematics Computer, a calculator"
	echo "INSTALLED: lexicon <- command to run TEA app: Free Lexicon, a dictionary"
	echo "=====-------||| ENJOY TEA ||-------====="
	# so we can immediately test if it is working fine
	tttt -h
	echo "=====-----------------------------------====="
else
	echo "=====----<< THANKS FOR LOVING TEA >>----====="
	echo "TTTT installation was not successful"
	echo "=====-----------------------------------====="
    [ -f "$PACKAGE_FILE" ] && rm "$PACKAGE_FILE"
fi
