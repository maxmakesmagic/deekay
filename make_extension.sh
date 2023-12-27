#!/bin/bash

# Make a zip compatible with Chrome and Firefox
rm -f deekay.zip
zip -r deekay.zip assets hashes manifest.json deekay.js
