"""
#############################################################################
### Configuration loader file 
###
### file config_file_loader.py
### Sebastian Russo and Javier Peres
### date: 2025
#############################################################################

This module serves to load all critical data from the config JSON file.
The module loads critical data from the selected JSON config file by reading it
and extracting critical data for proper execution of other modules
"""

import json
import sys
import os

def read_data_from_json(file_path, exit_on_error=True):
    """
    Reads data from a JSON file.

    Parameters:
    file_path (str): The path to the JSON file.

    Returns:
    dict: The configuration data.
    """
    try:
        with open(file_path, "r") as file:
            configuration_data = json.load(file)
        return configuration_data
    except FileNotFoundError:
        if exit_on_error:
            sys.exit(1)
        else:
            return None
    except json.JSONDecodeError:
        if exit_on_error:
            sys.exit(1)
        else:
            return None

#Config file to get the configuration of the system
config_file_path = os.path.join(os.path.dirname(__file__), "config.json")
#Read the configuration data from the config file and adjust the loglevel
config_data = read_data_from_json(config_file_path, exit_on_error=True)

#Sections
general_config = config_data["general"]
data_source_info = config_data["dataSource"]
csv_plot_info = config_data["plotAndCsv"]
