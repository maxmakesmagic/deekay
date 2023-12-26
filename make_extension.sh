#!/bin/bash

# Make a Chrome zip
rm -f deekay.chrome.zip
cp manifest.chrome.json manifest.json
zip -r deekay.chrome.zip assets hashes manifest.json deekay.js

# Make a Firefox zip
rm -f deekay.firefox.zip
cp manifest.firefox.json manifest.json
zip -r deekay.firefox.zip assets hashes manifest.json deekay.js

rm manifest.json
