"""
BESS (Battery Energy Storage System) API router.
Optimized unified data access with core metrics focus.
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pathlib import Path
import pandas as pd
import numpy as np
import json
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from models.schemas import BESSResponse, BESSReading, DevicesResponse, DeviceInfo, APIError
from core.data_manager import SimpleBESSDataManager
from core.config import DATA_BASE_PATH, MAX_BATCH_SIZE, DEFAULT_BATCH_SIZE, DEFAULT_STREAM_INTERVAL

router = APIRouter()

# Global cache for managers to avoid recreating datasets
_manager_cache = {}

class SimpleBESSManager:
    """
    Simple BESS Manager that provides real data with good coverage
    """
    def __init__(self, device_id: str, target_date: str = None):
        self.device_id = device_id
        self.device_path = DATA_BASE_PATH / device_id
        self.target_date = target_date
        
        if not self.device_path.exists():
            raise ValueError(f"Device {device_id} not found")
        
        # Initialize the simple data manager with target date
        self.data_manager = SimpleBESSDataManager(device_id, DATA_BASE_PATH, target_date)
        
        # Cache unified data
        self._unified_data = None
        self._summary = None
        
        print(f"Initialized simple BESS manager for {device_id}")
    
    def _ensure_data_loaded(self):
        """Load unified data if not already loaded"""
        if self._unified_data is None:
            print(f"Creating unified dataset for {self.device_id}...")
            self._unified_data = self.data_manager.create_unified_dataset()
            self._summary = self.data_manager.get_summary()
            print(f"Loaded {len(self._unified_data)} records with {len(self._unified_data.columns)-1} metrics")
    
    def get_data(self, batch_size: int = 100, skip: int = 0) -> BESSResponse:
        """
        Get BESS data with real values and minimal nulls
        """
        self._ensure_data_loaded()
        
        if self._unified_data is None or self._unified_data.empty:
            return BESSResponse(
                device_id=self.device_id,
                total_records=0,
                batch_size=batch_size,
                data=[]
            )
        
        # Get requested batch
        start_idx = skip
        end_idx = skip + batch_size
        batch_df = self._unified_data.iloc[start_idx:end_idx].copy()
        
        # Convert to BESS readings
        bess_data = []
        for _, row in batch_df.iterrows():
            # Create reading data
            reading_data = {"timestamp": row['timestamp']}
            
            # Add all available metrics, converting numpy types to Python types
            for col in batch_df.columns:
                if col != 'timestamp':
                    value = row[col]
                    if pd.notna(value):
                        # Convert numpy types to Python types
                        if isinstance(value, (np.integer, np.floating)):
                            reading_data[col] = float(value)
                        else:
                            reading_data[col] = value
                    # Don't add null/NaN values - let Pydantic handle defaults
            
            # Create BESS reading
            try:
                bess_reading = BESSReading(**reading_data)
                bess_data.append(bess_reading)
            except Exception as e:
                print(f"Warning: Could not create BESSReading: {e}")
                # Create a minimal reading with just timestamp
                try:
                    minimal_reading = BESSReading(timestamp=row['timestamp'])
                    bess_data.append(minimal_reading)
                except Exception as e2:
                    print(f"Error: Could not create minimal reading: {e2}")
                    continue
        
        return BESSResponse(
            device_id=self.device_id,
            total_records=len(bess_data),
            batch_size=batch_size,
            data=bess_data
        )
    
    def get_available_metrics(self):
        """Get list of available BESS metrics for this device"""
        self._ensure_data_loaded()
        
        if self._unified_data is None:
            return {
                "bms_metrics": [],
                "pcs_metrics": [],
                "aux_metrics": [],
                "env_metrics": [],
                "safety_metrics": [],
                "total_bms": 0,
                "total_pcs": 0,
                "total_aux": 0,
                "total_env": 0,
                "total_safety": 0,
                "total_systems": 0
            }
        
        all_columns = [col for col in self._unified_data.columns if col != 'timestamp']
        
        return {
            "bms_metrics": [m for m in all_columns if m.startswith('bms_')],
            "pcs_metrics": [m for m in all_columns if m.startswith('pcs_')],
            "aux_metrics": [m for m in all_columns if m.startswith('aux_')],
            "env_metrics": [m for m in all_columns if m.startswith('env_')],
            "safety_metrics": [m for m in all_columns if m.startswith('safety_')],
            "total_bms": len([m for m in all_columns if m.startswith('bms_')]),
            "total_pcs": len([m for m in all_columns if m.startswith('pcs_')]),
            "total_aux": len([m for m in all_columns if m.startswith('aux_')]),
            "total_env": len([m for m in all_columns if m.startswith('env_')]),
            "total_safety": len([m for m in all_columns if m.startswith('safety_')]),
            "total_systems": len([prefix for prefix in ['bms_', 'pcs_', 'aux_', 'env_', 'safety_'] 
                                 if any(m.startswith(prefix) for m in all_columns)])
        }
    
    def get_total_rows(self):
        """Get total rows available"""
        self._ensure_data_loaded()
        
        if self._unified_data is None:
            return {}
        
        # All metrics have same number of rows in unified data
        total_rows = len(self._unified_data)
        all_columns = [col for col in self._unified_data.columns if col != 'timestamp']
        
        return {metric: total_rows for metric in all_columns}
    
    def get_summary(self):
        """Get summary information"""
        self._ensure_data_loaded()
        return self._summary or {}


class SimpleBESSStreamer:
    def __init__(self, device_id: str):
        self.manager = SimpleBESSManager(device_id)
        self.current_position = 0
        self.batch_size = 1  # Stream one record at a time
        
    async def stream_data(self, interval: float = 2.0):
        """Stream BESS data with real values"""
        while True:
            try:
                # Get next batch of data
                batch_response = self.manager.get_data(
                    batch_size=self.batch_size, 
                    skip=self.current_position
                )
                
                if batch_response.data:
                    # Get the single record
                    reading = batch_response.data[0]
                    
                    # Keep the original timestamp from the CSV data
                    # This preserves the actual date/time when the data was recorded
                    
                    # Convert to JSON and yield
                    yield f"data: {json.dumps(reading.model_dump(), default=str)}\n\n"
                    
                    self.current_position += 1
                    
                    # Log progress occasionally
                    if self.current_position % 100 == 0:
                        print(f"Simple BESS Stream: {self.current_position} records streamed for {self.manager.device_id}")
                else:
                    # Reset to beginning when we reach the end
                    self.current_position = 0
                    print(f"Resetting simple BESS stream position for device {self.manager.device_id}")
                
                await asyncio.sleep(interval)
                
            except Exception as e:
                print(f"Simple BESS Stream error: {e}")
                error_data = {
                    "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "position": self.current_position
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                await asyncio.sleep(interval)

@router.get("/devices", response_model=DevicesResponse)
def get_bess_devices():
    """Get all available devices with their BESS metrics"""
    devices = []
    
    for device_dir in DATA_BASE_PATH.iterdir():
        if device_dir.is_dir():
            try:
                manager = SimpleBESSManager(device_dir.name)
                metrics_info = manager.get_available_metrics()
                
                device_info = DeviceInfo(
                    device_id=device_dir.name,
                    available_metrics=metrics_info["bms_metrics"] + metrics_info["pcs_metrics"],
                    total_rows_per_metric=manager.get_total_rows()
                )
                devices.append(device_info)
            except Exception as e:
                print(f"Error processing device {device_dir.name}: {e}")
                continue
    
    return DevicesResponse(devices=devices)

def get_cached_manager(device_id: str, target_date: str = None) -> SimpleBESSManager:
    """Get cached manager or create new one"""
    cache_key = f"{device_id}_{target_date or 'auto'}"
    if cache_key not in _manager_cache:
        print(f"Creating new manager for {device_id} with date {target_date or 'auto'}")
        _manager_cache[cache_key] = SimpleBESSManager(device_id, target_date)
    return _manager_cache[cache_key]

@router.get("/{device_id}", response_model=BESSResponse)
def get_bess_data(
    device_id: str,
    batch_size: int = Query(DEFAULT_BATCH_SIZE, description="Number of records per batch", ge=1, le=MAX_BATCH_SIZE),
    skip: int = Query(0, description="Number of records to skip", ge=0),
    date: Optional[str] = Query(None, description="Target date for data (YYYY-MM-DD or YYYY-MM)", regex="^(\\d{4}-\\d{2}(-\\d{2})?)$")
):
    """
    Get BESS data with real values and minimal nulls
    
    - **device_id**: Device identifier (e.g., ZHPESS232A230002)
    - **batch_size**: Number of records to return (1-1000)
    - **skip**: Number of records to skip (for pagination)
    - **date**: Target date (YYYY-MM for month, YYYY-MM-DD for specific day)
    
    Returns data from the specified date period or optimal time period with maximum data coverage.
    """
    try:
        manager = get_cached_manager(device_id, date)
        return manager.get_data(batch_size=batch_size, skip=skip)
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing BESS data: {str(e)}")


@router.get("/{device_id}/stream")
async def stream_bess_data(
    device_id: str,
    interval: float = Query(DEFAULT_STREAM_INTERVAL, description="Interval between data points in seconds", ge=0.1, le=10.0),
    date: Optional[str] = Query(None, description="Target date for data (YYYY-MM-DD or YYYY-MM)", regex="^(\\d{4}-\\d{2}(-\\d{2})?)$")
):
    """
    Stream real-time BESS data with real values using Server-Sent Events (SSE)
    
    - **device_id**: Device identifier (e.g., ZHPESS232A230002)  
    - **interval**: Time between data points in seconds (0.1-10.0)
    - **date**: Target date (YYYY-MM for month, YYYY-MM-DD for specific day)
    
    Returns a continuous stream of BESS readings with real data values from the specified date.
    Perfect for real-time BESS monitoring dashboards.
    """
    try:
        # Use cached manager for streaming too
        manager = get_cached_manager(device_id, date)
        streamer = SimpleBESSStreamer(device_id)
        streamer.manager = manager  # Use cached manager
        
        return StreamingResponse(
            streamer.stream_data(interval=interval),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting BESS stream: {str(e)}")