"""
#############################################################################
### Custom logger initialization file 
###
### file custom_logger.py
### Sebastian Russo, Javier Peres
### date: 2025
#############################################################################

This module initializes a custom logger to handle logging for other modules by
reading the config settings from a Json, set up a logging for both stdout and 
a .log file, so log messages are formatted and recorded both in console and in 
a file for debugging purposes
"""

import logging
import datetime
import sys
import os

#Add root directory of project to Python path
sys.path.append(os.path.abspath(
                    os.path.join(
                        os.path.dirname(__file__), "..")))
#Import critical data, must be after root directory
from configuration_files.config_file_loader import config_data

#Create 'logs' directory if it doesn't exist
log_dir = os.path.join(os.path.dirname(__file__), "../../logs")
os.makedirs(log_dir, exist_ok=True)

#Generate log file path inside 'logs' directory
log_file = os.path.join(
    log_dir, datetime.datetime.now().strftime("maxxWattLog_%Y-%m-%dT%H-%M-%S.log")
)

#Logs will be written to stdout and to a file based on the date and time
#Define a custom logger to avoid debug message spam
log_handler= logging.getLogger("log handler")
log_handler.setLevel(logging.DEBUG) #Display all messages
log_format = logging.Formatter(
    "%(asctime)s %(msecs)03dZ | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

#File handler
file_handler = logging.FileHandler(log_file)
file_handler.setFormatter(log_format)
log_handler.addHandler(file_handler)

#Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_format)
log_handler.addHandler(console_handler)
log_handler.critical(f"Logs are written to '{log_file}'")

log_level = config_data["general"]["loggingLevel"].upper()
if log_level not in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]:
    log_handler.critical("The config file specifies an invalid logging "
                        f"level '{log_level}', so staying in the default "
                        "logging level DEBUG.")
    log_handler.critical("Valid logging levels are 'DEBUG', 'INFO', "
                        "'WARNING', 'ERROR', 'CRITICAL'.")
else:
    log_handler.setLevel(config_data["general"]["loggingLevel"].upper())
    log_handler.critical(f"Changing the logging level to {log_level.upper()}"
                        " as specified in the config file.")
