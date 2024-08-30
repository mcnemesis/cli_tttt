#!/usr/bin/env bash
PACKAGE_URI=https://github.com/mcnemesis/cli_tttt/releases/download/tttt-1.0.3/tttt_1.0.3_amd64.deb
PACKAGE_FILE=package.deb
wget -O $PACKAGE_FILE $PACKAGE_URI && sudo dpkg -i $PACKAGE_FILE
if command -v tttt &> /dev/null
then
	echo "TTTT installation was successful."
    rm $PACKAGE_FILE
	echo "=====-------||| WELCOME TO TEA ||-------====="
	# so we can immediately test if it is working fine
	tttt -h
	echo "=====-----------------------------------====="
else
	echo "=====----<< THANKS FOR LOVING TEA >>----====="
	echo "TTTT installation was not successful"
	echo "=====-----------------------------------====="
    [ -f "$PACKAGE_FILE" ] && rm "$PACKAGE_FILE"
fi
