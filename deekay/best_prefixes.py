#!/usr/bin/env python3
"""Finds prefixes that match all URLs in a given list."""

import argparse
import json
import logging
from pathlib import Path

from deekay.utils import init_logging


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

    # The URLs are the keys in the mapping
    urls = list(mapping.keys())

    # Ensure that the set of prefixes matches all URLs
    prefixes = [
        "https://magic.wizards.com/",
    ]
    for url in urls:
        for prefix in prefixes:
            if url.startswith(prefix):
                break
        else:
            log.error("%s does not match any prefix in %s (maps to %s)", url, prefixes, mapping[url])

def run() -> None:
    """Run the main function with logging."""
    init_logging(__file__)
    main()


if __name__ == "__main__":
    run()
