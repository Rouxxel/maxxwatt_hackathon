import sys
import os

# Add src folder to path so imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

# Import your custom logger
from custom_logger.custom_logger import log_handler

def test_logging():
    log_handler.debug("DEBUG message")
    log_handler.info("INFO message")
    log_handler.warning("WARNING message")
    log_handler.error("ERROR message")
    log_handler.critical("CRITICAL message")

if __name__ == "__main__":
    print("Testing custom logger...")
    test_logging()
    print("Finished testing. Check logs folder.")
