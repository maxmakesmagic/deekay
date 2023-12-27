#!/usr/bin/env python3
"""Finds prefixes that match all URLs in a given list."""

import argparse
import json
import logging
from pathlib import Path
import random
import re
from typing import Dict
from urllib.parse import urlparse
from deekay.bloom_filter import BloomFilter

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
    # needed; for the input side, that's the URL path, and for the output side,
    # that's the wayback number.
    perfect_mapping = {}

    for input_url, wayback_url in mapping.items():
        # Parse the input URL
        p = urlparse(input_url)
        input_path = p.path

        # Parse the wayback URL
        m = WAYBACK_URL.match(wayback_url)
        if not m:
            raise RuntimeError(f"Could not parse wayback URL {wayback_url}")

        # Store the mapping
        perfect_mapping[input_path] = m.group(1)

    log.info("Read %d URLs", len(perfect_mapping))

    # Get the keys
    keys = list(perfect_mapping.keys())

    # Create a bloom filter of the correct size
    bloom_filter = BloomFilter(len(keys), 1/10000)

    # For each entry in the keys, add it to the bloom filter
    for key in keys:
        bloom_filter.add(key)

    # Select a random set of keys
    random_keys = random.choices(keys, k=1000)
    for random_key in random_keys:
        if random_key not in bloom_filter:
            log.error("%s not in bloom filter", random_key)

def run() -> None:
    """Run the main function with logging."""
    init_logging(__file__)
    main()


if __name__ == "__main__":
    run()
