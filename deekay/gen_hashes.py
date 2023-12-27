#!/usr/bin/env python3
"""Finds prefixes that match all URLs in a given list."""

import argparse
import hashlib
import json
import logging
from pathlib import Path
import re
from typing import Dict
from urllib.parse import urlparse

from deekay.utils import init_logging


WAYBACK_URL = re.compile("https://web.archive.org/web/([^/]+)/https?://")

log = logging.getLogger(__name__)


def main() -> None:
    """Main function."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_file", type=Path, help="JSON file with URLs")
    args = parser.parse_args()

    # Read the JSON file
    json_file: Path = args.json_file
    with json_file.open(encoding="utf-8") as f:
        mapping = json.load(f)

    # Iterate over the mapping. We want to store the least amount of information
    # needed; for the input side, that's a hash of the URL, and for the output side,
    # that's the wayback number. We further differentiate by the first two characters
    # of the hash
    hash_mapping: Dict[str, Dict[str, str]] = {}

    for input_url, wayback_url in mapping.items():
        # SHA-1 the input URL. We don't need a cryptographic hash.
        url_hash = hashlib.sha1(input_url.encode("utf-8")).hexdigest()

        # Parse the wayback URL
        m = WAYBACK_URL.match(wayback_url)
        if not m:
            raise RuntimeError(f"Could not parse wayback URL {wayback_url}")

        # Store the mapping
        prefix = url_hash[:2]
        suffix = url_hash[2:]
        if prefix not in hash_mapping:
            hash_mapping[prefix] = {}

        # Store the data
        hash_mapping[prefix][suffix] = m.group(1)

    # For each prefix, write a file
    for prefix, suffix_mapping in hash_mapping.items():
        # Write the file
        output_file = Path("hashes") / f"{prefix}.json"
        with output_file.open("w", encoding="utf-8") as f:
            json.dump(suffix_mapping, f, indent=4, sort_keys=True)

        # Log
        log.info(f"Wrote {len(suffix_mapping)} entries to {output_file}")


def run() -> None:
    """Run the main function with logging."""
    init_logging(__file__)
    main()


if __name__ == "__main__":
    run()
