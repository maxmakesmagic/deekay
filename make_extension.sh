#!/bin/bash

if ! command -v zip &> /dev/null
then
    echo "zip could not be found, installing..."
    apt-get install -y zip
fi

# Make a zip compatible with Chrome and Firefox
rm -f deekay.zip
zip -r deekay.zip assets hashes manifest.json deekay.js
