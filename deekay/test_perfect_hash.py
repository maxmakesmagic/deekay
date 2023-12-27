#!/usr/bin/env python3
"""Finds prefixes that match all URLs in a given list."""

import argparse
import json
import logging
from pathlib import Path
import re
from typing import Dict
from urllib.parse import urlparse

from deekay.utils import init_logging

log = logging.getLogger(__name__)

# Calculates a distinct hash function for a given string. Each value of the
# integer d results in a different hash value.
def fnv_hash(d, str):
    if d == 0:
        d = 0x01000193

    # Use the FNV algorithm from http://isthe.com/chongo/tech/comp/fnv/
    for c in str:
        d = ((d * 0x01000193) ^ ord(c)) & 0xFFFFFFFF

    return d

# Look up a value in the hash table, defined by G and V.
def PerfectHashLookup(G, V, key):
    d = G[fnv_hash(0, key) % len(G)]
    if d < 0:
        return V[-d - 1]
    return V[fnv_hash(d, key) % len(V)]


def main() -> None:
    """Main function."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("hash_file", type=Path, help="JSON file with perfect hash mapping")
    parser.add_argument("lookup_url")
    args = parser.parse_args()

    # Read the JSON file
    hash_file: Path = args.hash_file
    with hash_file.open(encoding="utf-8") as f:
        data = json.load(f)

    # Extract G and V
    G = data["G"]
    V = data["V"]

    # Parse the URL
    url = args.lookup_url
    p = urlparse(url)
    path = p.path

    log.info("Searching for path %s", path)

    # Look up the path
    value = PerfectHashLookup(G, V, path)
    log.info("Returned value: %s", value)

    wayback_url = f"https://web.archive.org/web/{value}/{url}"
    log.info("Wayback URL: %s", wayback_url)

def run() -> None:
    """Run the main function with logging."""
    init_logging(__file__)
    main()


if __name__ == "__main__":
    run()
