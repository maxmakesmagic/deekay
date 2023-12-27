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


WAYBACK_URL = re.compile("https://web.archive.org/web/([^/]+)/https?://")

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


# Computes a minimal perfect hash table using the given python dictionary. It
# returns a tuple (G, V). G and V are both arrays. G contains the intermediate
# table of values needed to compute the index of the value in V. V contains the
# values of the dictionary.
def CreateMinimalPerfectHash(input_dict: Dict[str, str]):
    size = len(input_dict)

    # Step 1: Place all of the keys into buckets
    buckets = [[] for i in range(size)]
    G = [0] * size
    values = [None] * size

    for key in input_dict.keys():
        buckets[fnv_hash(0, key) % size].append(key)

    # Step 2: Sort the buckets and process the ones with the most items first.
    buckets.sort(key=len, reverse=True)
    for b in range(size):
        bucket = buckets[b]
        if len(bucket) <= 1:
            break

        d = 1
        item = 0
        slots = []

        # Repeatedly try different values of d until we find a hash function
        # that places all items in the bucket into free slots
        while item < len(bucket):
            slot = fnv_hash(d, bucket[item]) % size
            if values[slot] != None or slot in slots:
                d += 1
                item = 0
                slots = []
            else:
                slots.append(slot)
                item += 1

        G[fnv_hash(0, bucket[0]) % size] = d
        for i in range(len(bucket)):
            values[slots[i]] = input_dict[bucket[i]]

        if (b % 1000) == 0:
            log.info("bucket %d complete", b)

    # Only buckets with 1 item remain. Process them more quickly by directly
    # placing them into a free slot. Use a negative value of d to indicate
    # this.
    freelist = []
    for i in range(size):
        if values[i] == None:
            freelist.append(i)

    for b in range(b, size):
        bucket = buckets[b]
        if len(bucket) == 0:
            break
        slot = freelist.pop()
        # We subtract one to ensure it's negative even if the zeroeth slot was
        # used.
        G[fnv_hash(0, bucket[0]) % size] = -slot - 1
        values[slot] = input_dict[bucket[0]]
        if (b % 1000) == 0:
            log.info("bucket %d complete", b)

    return (G, values)


# Look up a value in the hash table, defined by G and V.
def PerfectHashLookup(G, V, key):
    d = G[fnv_hash(0, key) % len(G)]
    if d < 0:
        return V[-d - 1]
    return V[fnv_hash(d, key) % len(V)]


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

    with open("perfect_mapping_naive.json", "w", encoding="utf-8") as f:
        json.dump(perfect_mapping, f, sort_keys=True)

    log.info("Read %d URLs", len(perfect_mapping))

    # Run the dictionary through the perfect mapping function
    log.info("Creating perfect hash")

    (G, V) = CreateMinimalPerfectHash(perfect_mapping)
    log.info("G: %s", G)
    log.info("V: %s", V)

    # Write out G and V to file
    with open("perfect_hash.json", "w", encoding="utf-8") as f:
        json.dump({"G": G, "V": V}, f, sort_keys=True)

def run() -> None:
    """Run the main function with logging."""
    init_logging(__file__)
    main()


if __name__ == "__main__":
    run()
