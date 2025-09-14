"""
BESS Data Manager
=================
Optimized data processing that finds optimal time periods with maximum data overlap
and provides clean, synchronized data with excellent coverage.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Optional, List, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class SimpleBESSDataManager:
    """
    Simple approach: Find the best overlapping time period and use actual data.
    Much better than forcing synchronization across completely different time periods.
    """
    
    def __init__(self, device_id: str, data_base_path: Path, target_date: str = None):
        self.device_id = device_id
        self.device_path = data_base_path / device_id
        self.target_date = target_date  # Format: "YYYY-MM-DD" or "YYYY-MM" for month
        
        # Essential BESS metrics only - streamlined for performance and clarity
        self.core_metrics = {
            # 1. BMS Core KPIs - Battery Management System
            "bms_soc": "bms1_soc.csv",                      # State of Charge (critical KPI)
            "bms_soh": "bms1_soh.csv",                      # State of Health (critical KPI)
            "bms_voltage": "bms1_v.csv",                    # Pack voltage
            "bms_current": "bms1_c.csv",                    # Pack current
            "bms_cell_ave_v": "bms1_cell_ave_v.csv",        # Cell average voltage
            "bms_cell_ave_t": "bms1_cell_ave_t.csv",        # Cell average temperature

            # 2. PCS Essential Metrics - Power Conversion System
            "pcs_apparent_power": "pcs1_ap.csv",            # Apparent power (can be +/-)
            "pcs_dc_voltage": "pcs1_dcv.csv",               # DC voltage
            "pcs_dc_current": "pcs1_dcc.csv",               # DC current
            "pcs_ac_current_a": "pcs1_ia.csv",              # AC phase A current
            "pcs_ac_voltage_ab": "pcs1_uab.csv",            # AC line voltage AB
            "pcs_temp_igbt": "pcs1_t_igbt.csv",             # IGBT temperature (thermal monitoring)

            # 3. Essential Environmental & Thermal
            "aux_outside_temp": "ac1_outside_t.csv",        # Outside temperature
            "env_humidity": "dh1_humi.csv",                 # Humidity sensor
            "env_temperature": "dh1_temp.csv",              # Environmental temperature
        }
        
        # Additional engineering metrics - focused on essential diagnostics only
        self.additional_metrics = {
            # BMS Cell Health Diagnostics
            "bms_cell_max_v": "bms1_cell_max_v.csv",             # Max cell voltage (imbalance check)
            "bms_cell_min_v": "bms1_cell_min_v.csv",             # Min cell voltage (imbalance check)
            "bms_cell_v_diff": "bms1_cell_v_diff.csv",           # Voltage spread (health indicator)
            "bms_cell_t_diff": "bms1_cell_t_diff.csv",           # Temperature spread (cooling effectiveness)

            # PCS 3-Phase AC Monitoring (Complete Power Quality Picture)
            "pcs_ac_current_b": "pcs1_ib.csv",                   # AC phase B current
            "pcs_ac_current_c": "pcs1_ic.csv",                   # AC phase C current
            "pcs_ac_voltage_bc": "pcs1_ubc.csv",                 # AC line voltage BC
            "pcs_ac_voltage_ca": "pcs1_uca.csv",                 # AC line voltage CA
            "pcs_temp_environment": "pcs1_t_env.csv",            # PCS environment temperature

            # Auxiliary & Thermal Systems
            "aux_outwater_temp": "ac1_outwater_t.csv",           # Coolant outlet temperature
            "aux_return_water_pressure": "ac1_rtnwater_pre.csv", # Cooling system pressure
            "aux_power_apparent": "aux_m_ap.csv",                # Auxiliary power consumption

            # Essential Safety Monitoring (minimal set)
            "safety_smoke_flag": "fa1_smokeFlag.csv",            # Primary smoke detection alert

            # Note: Reduced from 25+ safety sensors to just 1 essential smoke detector
            # All other safety sensor arrays (fa1-fa5 CO, fire levels, VOC, temp sensors) removed
        }
        
        self.unified_data = None
        self.data_quality = {}
        
    def get_target_date_range(self):
        """Get start and end dates based on target_date parameter"""
        if not self.target_date:
            return None, None
            
        try:
            if len(self.target_date) == 7:  # YYYY-MM format
                from datetime import datetime
                year, month = self.target_date.split('-')
                start_date = datetime(int(year), int(month), 1)
                
                # Get last day of month
                if int(month) == 12:
                    end_date = datetime(int(year) + 1, 1, 1)
                else:
                    end_date = datetime(int(year), int(month) + 1, 1)
                    
            elif len(self.target_date) == 10:  # YYYY-MM-DD format
                from datetime import datetime, timedelta
                start_date = datetime.strptime(self.target_date, '%Y-%m-%d')
                end_date = start_date + timedelta(days=1)
                
            else:
                print(f"Invalid date format: {self.target_date}. Use YYYY-MM or YYYY-MM-DD")
                return None, None
                
            return start_date, end_date
            
        except Exception as e:
            print(f"Error parsing target date {self.target_date}: {e}")
            return None, None
        
    def find_best_time_period(self, sample_size: int = 1000) -> Tuple[datetime, datetime]:
        """
        Find the time period with the most overlapping data from core metrics.
        If target_date is specified, filter to that specific date/month.
        """
        print(f"Finding best time period for {self.device_id}...")
        
        # Check if we have a specific target date
        target_start, target_end = self.get_target_date_range()
        if target_start and target_end:
            print(f"Filtering to target date range: {target_start} to {target_end}")
        
        # Load samples from core metrics to find overlap
        time_ranges = []
        
        for metric, filename in self.core_metrics.items():
            file_path = self.device_path / filename
            if file_path.exists():
                try:
                    # When we have a target date, read entire file to ensure we find the data
                    if target_start and target_end:
                        # For target dates, read entire file to ensure we don't miss data
                        df_sample = pd.read_csv(file_path)
                        df_sample['ts'] = pd.to_datetime(df_sample['ts'])
                        
                        # Filter by target date
                        mask = (df_sample['ts'] >= target_start) & (df_sample['ts'] < target_end)
                        df_filtered = df_sample[mask]
                        
                        if len(df_filtered) == 0:
                            print(f"WARNING: No data for {metric} in target date range")
                            continue
                            
                        df_sample = df_filtered
                    else:
                        # For general queries without target date, use sample
                        df_sample = pd.read_csv(file_path, nrows=sample_size * 5)
                        df_sample['ts'] = pd.to_datetime(df_sample['ts'])
                    
                    time_ranges.append({
                        'metric': metric,
                        'start': df_sample['ts'].min(),
                        'end': df_sample['ts'].max(),
                        'count': len(df_sample)
                    })
                    
                except Exception as e:
                    print(f"WARNING: Could not sample {metric}: {e}")
                    continue
        
        if not time_ranges:
            raise ValueError("No core metrics available for time period analysis")
        
        # Find the period with most overlap
        # Look for the most common time period across metrics
        all_starts = [tr['start'] for tr in time_ranges]
        all_ends = [tr['end'] for tr in time_ranges]
        
        # Use the period that captures most of the data
        # Take the latest start and earliest end that still gives us data
        common_start = max(all_starts)
        common_end = min(all_ends)
        
        # If no overlap, use the period with the most metrics
        if common_start >= common_end:
            print("WARNING: No perfect overlap found, using period with most available data")
            # Group by similar time periods and pick the one with most metrics
            start_dates = sorted(set(tr['start'].date() for tr in time_ranges))
            best_date = max(start_dates, key=lambda d: sum(1 for tr in time_ranges if tr['start'].date() == d))
            
            # Use data from that date period
            date_ranges = [tr for tr in time_ranges if tr['start'].date() == best_date]
            common_start = min(tr['start'] for tr in date_ranges)
            common_end = max(tr['end'] for tr in date_ranges)
        
        print(f"Selected time period: {common_start} to {common_end}")
        print(f"Available metrics in period: {len([tr for tr in time_ranges if tr['start'] <= common_end and tr['end'] >= common_start])}")
        
        return common_start, common_end
    
    def load_data_for_period(self, start_time: datetime, end_time: datetime, max_records: int = 5000) -> Dict[str, pd.DataFrame]:
        """
        Load actual data for the specified time period.
        If target_date is specified, prioritize that date range.
        """
        # Use target date range if specified, otherwise use provided times
        target_start, target_end = self.get_target_date_range()
        if target_start and target_end:
            start_time, end_time = target_start, target_end
            print(f"Loading data for TARGET DATE: {start_time.date()} to {end_time.date()}")
        else:
            print(f"Loading data for period {start_time} to {end_time}...")
        
        loaded_data = {}
        all_metrics = {**self.core_metrics, **self.additional_metrics}
        
        for metric, filename in all_metrics.items():
            file_path = self.device_path / filename
            if not file_path.exists():
                continue
                
            try:
                # When we have a specific target date, we need to read the entire file
                # to ensure we don't miss data that might be located anywhere in the file
                if target_start:
                    # For target dates, read the entire file to ensure we find all data
                    df = pd.read_csv(file_path)
                else:
                    # For general queries, limit to reasonable chunk size
                    df = pd.read_csv(file_path, nrows=max_records)
                
                df['ts'] = pd.to_datetime(df['ts'])
                
                # Filter to our time period
                mask = (df['ts'] >= start_time) & (df['ts'] <= end_time)
                df_filtered = df[mask].copy()
                
                if not df_filtered.empty:
                    # Keep more data for better interpolation, but limit to reasonable size
                    if len(df_filtered) > 2000:
                        # Sample evenly to keep data distributed across the time period
                        step = len(df_filtered) // 2000
                        df_filtered = df_filtered.iloc[::step].reset_index(drop=True)
                    
                    # Remove duplicates and sort
                    df_filtered = df_filtered.drop_duplicates(subset=['ts']).sort_values('ts').reset_index(drop=True)
                    loaded_data[metric] = df_filtered
                    print(f"SUCCESS {metric}: {len(df_filtered)} records from {df_filtered['ts'].min()} to {df_filtered['ts'].max()}")
                else:
                    print(f"EMPTY {metric}: No data in time period {start_time} to {end_time}")
                    
            except Exception as e:
                print(f"ERROR loading {metric}: {e}")
                continue
        
        return loaded_data
    
    def create_unified_dataset(self, max_records: int = 1000) -> pd.DataFrame:
        """
        Create a unified dataset with the best available data
        """
        print(f"Creating unified dataset for {self.device_id}...")
        
        # Check if we have a target date specified
        target_start, target_end = self.get_target_date_range()
        if target_start and target_end:
            print(f"Using TARGET DATE range: {target_start} to {target_end}")
            start_time, end_time = target_start, target_end
        else:
            print("No target date specified, finding best overlapping period...")
            # Find best time period only if no target date
            start_time, end_time = self.find_best_time_period()
        
        # Load data for that period
        raw_data = self.load_data_for_period(start_time, end_time, max_records * 2)
        
        if not raw_data:
            raise ValueError("No data available for the selected time period")
        
        # Find the metric with the most regular timestamps to use as base
        base_metric = max(raw_data.keys(), key=lambda k: len(raw_data[k]))
        base_df = raw_data[base_metric].copy()
        
        print(f"Using {base_metric} as base timeline ({len(base_df)} records)")
        
        # Create unified dataframe starting with base timeline
        unified_df = base_df[['ts']].copy()
        unified_df = unified_df.rename(columns={'ts': 'timestamp'})
        
        # Add data from base metric
        value_col = [col for col in base_df.columns if col != 'ts'][0]
        unified_df[base_metric] = base_df[value_col].values
        
        # Add other metrics by finding closest timestamps with improved interpolation
        for metric, df in raw_data.items():
            if metric == base_metric:
                continue
                
            value_col = [col for col in df.columns if col != 'ts'][0]
            
            # For each timestamp in our unified timeline, find the closest data point
            unified_values = []
            for target_time in unified_df['timestamp']:
                # Find closest timestamp within a reasonable window
                time_diffs = abs(df['ts'] - target_time)
                closest_idx = time_diffs.idxmin()
                min_diff = time_diffs.iloc[closest_idx]
                
                # Use wider time window (10 minutes) for better data coverage
                # but prioritize closer matches
                if min_diff <= pd.Timedelta(minutes=10):
                    closest_value = df.loc[closest_idx, value_col]
                    # Skip NaN/invalid values
                    if pd.notna(closest_value) and closest_value != '' and str(closest_value).lower() != 'nan':
                        unified_values.append(float(closest_value))
                    else:
                        unified_values.append(None)
                else:
                    unified_values.append(None)
            
            unified_df[metric] = unified_values
            
            # Track data quality
            non_null_count = sum(1 for v in unified_values if v is not None)
            coverage = non_null_count / len(unified_values) if len(unified_values) > 0 else 0
            self.data_quality[metric] = {
                'coverage': coverage,
                'total_points': len(unified_values),
                'valid_points': non_null_count,
                'avg_time_diff': min_diff.total_seconds() if len(unified_values) > 0 else 0
            }
        
        # Limit the final dataset size
        if len(unified_df) > max_records:
            unified_df = unified_df.iloc[:max_records].copy()
        
        print(f"Created unified dataset with {len(unified_df)} records and {len(unified_df.columns)-1} metrics")
        
        # Show data quality summary with time alignment info
        print("\nData Quality Summary:")
        for metric, quality in self.data_quality.items():
            coverage = quality['coverage']
            if coverage > 0.8:
                status = "Excellent"
            elif coverage > 0.5:
                status = "Good"
            elif coverage > 0.2:
                status = "Fair"
            else:
                status = "Poor"
            
            avg_diff = quality.get('avg_time_diff', 0)
            time_info = f" (avg {avg_diff:.0f}s offset)" if avg_diff > 0 else ""
            print(f"   {metric}: {coverage:.1%} coverage {status}{time_info}")
        
        self.unified_data = unified_df
        return unified_df
    
    def get_batch_data(self, batch_size: int = 100, skip: int = 0):
        """
        Get a batch of unified data
        """
        if self.unified_data is None:
            self.create_unified_dataset()
        
        start_idx = skip
        end_idx = skip + batch_size
        
        return self.unified_data.iloc[start_idx:end_idx].copy()
    
    def get_summary(self):
        """
        Get summary of available data
        """
        if self.unified_data is None:
            self.create_unified_dataset()
        
        summary = {
            'device_id': self.device_id,
            'total_records': len(self.unified_data),
            'time_range': {
                'start': self.unified_data['timestamp'].min(),
                'end': self.unified_data['timestamp'].max()
            },
            'available_metrics': [col for col in self.unified_data.columns if col != 'timestamp'],
            'data_quality': self.data_quality
        }
        
        return summary


def test_simple_manager():
    """Test the simple data manager"""
    try:
        from pathlib import Path
        
        data_path = Path("../data/energy_hackathon_data/BESS")
        device_id = "ZHPESS232A230002"
        
        manager = SimpleBESSDataManager(device_id, data_path)
        
        # Create unified dataset
        unified_data = manager.create_unified_dataset()
        
        print(f"\nSuccess! Created dataset with {len(unified_data)} records")
        print(f"Time range: {unified_data['timestamp'].min()} to {unified_data['timestamp'].max()}")
        print(f"Metrics: {len(unified_data.columns) - 1}")
        
        # Show sample data
        print(f"\nSample data (first 3 records):")
        sample = unified_data.head(3)
        for idx, row in sample.iterrows():
            print(f"\n{row['timestamp']}:")
            non_null_values = {k: v for k, v in row.items() if k != 'timestamp' and pd.notna(v)}
            print(f"   Data points: {len(non_null_values)}")
            if non_null_values:
                print(f"   Sample values: {dict(list(non_null_values.items())[:3])}")
        
        return True
        
    except Exception as e:
        print(f"Test failed: {e}")
        return False


if __name__ == "__main__":
    test_simple_manager()