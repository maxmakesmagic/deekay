#!/bin/bash

set -euo pipefail

extension_source=${1:-.}
extension_output=${2:-deekay.zip}

if grep -Fq '0.0.0-semantic-release' "$extension_source/manifest.json"
then
    echo "manifest.json still has its semantic-release placeholder; run npm run build instead" >&2
    exit 1
fi

if ! command -v zip &> /dev/null
then
    echo "zip could not be found, installing..."
    apt-get install -y zip
fi

# Make a zip compatible with Chrome and Firefox
rm -f -- "$extension_output"
(
    cd "$extension_source"
    zip -qr "$extension_output" assets hashes manifest.json deekay.js
)
