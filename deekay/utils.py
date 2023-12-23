"""Utility functions."""


import logging
import sys
from pathlib import Path

def init_logging(path: str) -> None:
    """Initialises the logging system."""

    mod_path = Path(path)

    fmt = logging.Formatter("%(asctime)s %(levelname)-5.5s %(message)s")

    streamhandler = logging.StreamHandler(stream=sys.stdout)
    streamhandler.setLevel(logging.INFO)
    streamhandler.setFormatter(fmt)
    filehandler = logging.FileHandler(filename=f"{mod_path.name}.log", mode="w")
    filehandler.setLevel(logging.DEBUG)
    filehandler.setFormatter(fmt)
    errorhandler = logging.FileHandler(filename=f"{mod_path.name}.errors.log", mode="w")
    errorhandler.setLevel(logging.ERROR)
    errorhandler.setFormatter(fmt)
    root_logger = logging.getLogger()
    root_logger.addHandler(streamhandler)
    root_logger.addHandler(filehandler)
    root_logger.addHandler(errorhandler)
    root_logger.setLevel(logging.DEBUG)

    # Reduce spam from requests and urllib3
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
