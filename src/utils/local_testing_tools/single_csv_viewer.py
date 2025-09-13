"""
#############################################################################
### Single CSV EDA viewer file 
###
### file single_csv_viewer.py
### Sebastian Russo
### date: 04/2025
#############################################################################

This module provides a class for doing an EDA on the provided .csv file by ...

"""

import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import pandas as pd
import sys
import os

#Add root directory of project to Python path
sys.path.append(os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
))
#Import custom logger and critical data, must be after root directory
from custom_logger.custom_logger import log_handler
from configuration_files.config_file_loader import (
    config_data,
    )

#Class exclusive for calculating force based on sensor displacement
class SingleFileEdaTesting:
    def __init__(self):
        #TODO: determine if necessary self._variable = x
        pass

    def csv_eda(self,
                file_path, 
                delimiter=config_data["dataSource"]["delimiter"],
                decimal_separator=config_data["dataSource"]["decimalSeparator"],
                thousand_separator=config_data["dataSource"]["thousandSeparator"],
                comment_char=config_data["dataSource"]["commentCharacter"],
                show_interact_plot=False,
                save_plot=True
                ):
        """
        Perform basic EDA on a CSV file with a timestamp column and a numeric value column.

        Parameters:
            file_path (str): Path to the CSV file
            delimiter (str): CSV delimiter
            decimal_separator (str): Decimal separator in numeric values
            thousand_separator (str): Thousand separator in numeric values
            comment_char (str): Comment character in CSV
            show_interact_plot (bool): Whether to display the plot interactively
            save_plot (bool): Whether to save the plot to file

        Returns:
            pd.DataFrame: Loaded DataFrame
            str: Path to generated plot image

        Raises:
            KeyError, AttributeError, ValueError, Exception
        """
        try: 
            #Load CSV
            df = pd.read_csv(
                file_path,
                delimiter=delimiter,
                decimal=decimal_separator,
                thousands=thousand_separator,
                comment=comment_char,
                parse_dates=['ts']  # Parse timestamp column
            )
            log_handler.info(f"csv_eda() Loaded CSV file: {file_path}")
            log_handler.info(f"csv_eda() Number of rows: {len(df)}, columns: {df.columns.tolist()}")
            
            #Check missing values
            missing = df.isnull().sum()
            log_handler.info(f"csv_eda() Missing values:\n{missing}")
            
            #Basic statistics
            numeric_col = df.columns[1]  #second column is the numeric value
            stats = df[numeric_col].describe()
            log_handler.info(f"csv_eda() Basic stats for {numeric_col}:\n{stats}")
            
            #Time range
            time_range = df['ts'].min(), df['ts'].max()
            log_handler.info(f"csv_eda() Time range: {time_range[0]} to {time_range[1]}")
            
            #Create test_results folder in project root
            ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
            results_dir = os.path.join(ROOT_DIR, "test_results")
            os.makedirs(results_dir, exist_ok=True)
            
            #Plotting: use ts column as-is
            plt.figure(figsize=(10, 5))
            plt.plot(df['ts'], df[numeric_col], marker='o', linestyle='-', markersize=3)
            plt.xlabel('Time')
            plt.ylabel(numeric_col)
            plt.title(f'{numeric_col} over Time')
            plt.grid(True)
            plt.tight_layout()

            #Format x-axis to show only HH:MM:SS
            #plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))
            #plt.gcf().autofmt_xdate()
            
            #Save and/or show plot
            plot_file = os.path.join(results_dir, os.path.basename(file_path).replace(".csv", "_plot.png"))
            if save_plot:plt.savefig(plot_file)
            if show_interact_plot:plt.show()
            plt.close()
            log_handler.info(f"csv_eda() Plot saved as: {plot_file}")
            
            return df, plot_file

        except KeyError as e:
            log_handler.error(f"csv_eda() KeyError processing {file_path} file: {e}")
            raise
        except AttributeError as e:
            log_handler.error(f"csv_eda() AttributeError processing {file_path} file: {e}")
            raise
        except ValueError as e:
            log_handler.error(f"csv_eda() ValueError processing {file_path} file: {e}")
            raise
        except Exception as e:
            log_handler.error(f"csv_eda() Unexpected error processing {file_path} file: {e}")
            raise

if __name__ == "__main__":
    # Create an instance of the class
    eda = SingleFileEdaTesting()
    
    # Path to your CSV file (update this to an actual CSV you have)
    test_csv_path = os.path.abspath(os.path.join(
        os.path.dirname(__file__), "../../../data/BESS/ZHPESS232A230002/ac1_outside_t.csv"
    ))

    # Run csv_eda
    try:
        df, plot_file = eda.csv_eda(test_csv_path, show_interact_plot=False, save_plot=True)
        print(f"CSV loaded successfully, plot saved at: {plot_file}")
        print(df.head())  # show first few rows
    except Exception as e:
        print(f"Error running csv_eda: {e}")

