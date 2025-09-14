"""
Pydantic schemas for BESS BMS API data models.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class BMSReading(BaseModel):
    """Single BMS reading with synchronized timestamp"""
    timestamp: datetime = Field(description="Reading timestamp")
    soc: Optional[float] = Field(None, description="State of Charge (%)", ge=0, le=100)
    soh: Optional[float] = Field(None, description="State of Health (%)", ge=0, le=100)
    voltage: Optional[float] = Field(None, description="Total pack voltage (V)", ge=0)
    current: Optional[float] = Field(None, description="Total pack current (A)")
    cell_avg_voltage: Optional[float] = Field(None, description="Cell average voltage (V)", ge=0)
    cell_avg_temp: Optional[float] = Field(None, description="Cell average temperature (°C)")
    cell_max_voltage: Optional[float] = Field(None, description="Max cell voltage (V)", ge=0)
    cell_min_voltage: Optional[float] = Field(None, description="Min cell voltage (V)", ge=0)
    cell_max_temp: Optional[float] = Field(None, description="Max cell temperature (°C)")
    cell_min_temp: Optional[float] = Field(None, description="Min cell temperature (°C)")
    cell_voltage_diff: Optional[float] = Field(None, description="Cell voltage difference (V)", ge=0)
    cell_temp_diff: Optional[float] = Field(None, description="Cell temperature difference (°C)", ge=0)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class BMSResponse(BaseModel):
    """Response model for BMS batch data"""
    device_id: str = Field(description="Device identifier")
    total_records: int = Field(description="Number of records returned", ge=0)
    batch_size: int = Field(description="Requested batch size", ge=1)
    data: List[BMSReading] = Field(description="BMS readings")

class DeviceInfo(BaseModel):
    """Information about a BESS device"""
    device_id: str = Field(description="Device identifier")
    available_metrics: List[str] = Field(description="Available BMS metrics")
    total_rows_per_metric: Dict[str, int] = Field(description="Total rows available per metric")

class DevicesResponse(BaseModel):
    """Response model for available devices"""
    devices: List[DeviceInfo] = Field(description="Available BESS devices")

class PCSReading(BaseModel):
    """Single PCS reading with synchronized timestamp"""
    timestamp: datetime = Field(description="Reading timestamp")
    apparent_power: Optional[float] = Field(None, description="Apparent power output (kW)")
    dc_current: Optional[float] = Field(None, description="DC current (A)")
    dc_voltage: Optional[float] = Field(None, description="DC voltage (V)")
    ac_current_a: Optional[float] = Field(None, description="AC phase A current (A)")
    ac_current_b: Optional[float] = Field(None, description="AC phase B current (A)")
    ac_current_c: Optional[float] = Field(None, description="AC phase C current (A)")
    ac_voltage_ab: Optional[float] = Field(None, description="AC line voltage A-B (V)")
    ac_voltage_bc: Optional[float] = Field(None, description="AC line voltage B-C (V)")
    ac_voltage_ca: Optional[float] = Field(None, description="AC line voltage C-A (V)")
    temp_environment: Optional[float] = Field(None, description="Environmental temperature (°C)")
    temp_ambient: Optional[float] = Field(None, description="Ambient temperature (°C)")
    temp_igbt: Optional[float] = Field(None, description="IGBT temperature (°C)")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PCSResponse(BaseModel):
    """Response model for PCS batch data"""
    device_id: str = Field(description="Device identifier")
    total_records: int = Field(description="Number of records returned", ge=0)
    batch_size: int = Field(description="Requested batch size", ge=1)
    data: List[PCSReading] = Field(description="PCS readings")

class BESSReading(BaseModel):
    """Streamlined BESS reading with essential metrics only"""
    timestamp: datetime = Field(description="Synchronized timestamp")

    # 1. BMS Core KPIs - Battery Management System
    bms_soc: Optional[float] = Field(None, description="State of Charge (%)", ge=0, le=100)
    bms_soh: Optional[float] = Field(None, description="State of Health (%)", ge=0, le=100)
    bms_voltage: Optional[float] = Field(None, description="Pack voltage (V)", ge=0)
    bms_current: Optional[float] = Field(None, description="Pack current (A)")
    bms_cell_ave_v: Optional[float] = Field(None, description="Cell average voltage (V)", ge=0)
    bms_cell_ave_t: Optional[float] = Field(None, description="Cell average temperature (°C)")

    # 2. BMS Cell Health Diagnostics
    bms_cell_max_v: Optional[float] = Field(None, description="Max cell voltage (V)", ge=0)
    bms_cell_min_v: Optional[float] = Field(None, description="Min cell voltage (V)", ge=0)
    bms_cell_v_diff: Optional[float] = Field(None, description="Cell voltage spread (V)", ge=0)
    bms_cell_t_diff: Optional[float] = Field(None, description="Cell temperature spread (°C)", ge=0)

    # 3. PCS Essential Metrics - Power Conversion System
    pcs_apparent_power: Optional[float] = Field(None, description="Apparent power output (kW)")
    pcs_dc_voltage: Optional[float] = Field(None, description="DC voltage (V)")
    pcs_dc_current: Optional[float] = Field(None, description="DC current (A)")
    pcs_ac_current_a: Optional[float] = Field(None, description="AC phase A current (A)")
    pcs_ac_current_b: Optional[float] = Field(None, description="AC phase B current (A)")
    pcs_ac_current_c: Optional[float] = Field(None, description="AC phase C current (A)")
    pcs_ac_voltage_ab: Optional[float] = Field(None, description="AC line voltage A-B (V)")
    pcs_ac_voltage_bc: Optional[float] = Field(None, description="AC line voltage B-C (V)")
    pcs_ac_voltage_ca: Optional[float] = Field(None, description="AC line voltage C-A (V)")
    pcs_temp_igbt: Optional[float] = Field(None, description="IGBT temperature (°C)")
    pcs_temp_environment: Optional[float] = Field(None, description="PCS environment temperature (°C)")

    # 4. Auxiliary & Thermal Systems
    aux_outside_temp: Optional[float] = Field(None, description="Outside temperature (°C)")
    aux_outwater_temp: Optional[float] = Field(None, description="Coolant outlet temperature (°C)")
    aux_return_water_pressure: Optional[float] = Field(None, description="Return water pressure (bar)")
    aux_power_apparent: Optional[float] = Field(None, description="Auxiliary power consumption (kW)")

    # 5. Environmental Sensors
    env_humidity: Optional[float] = Field(None, description="Humidity (%)", ge=0, le=100)
    env_temperature: Optional[float] = Field(None, description="Environmental temperature (°C)")

    # 6. Essential Safety (minimal set)
    safety_smoke_flag: Optional[bool] = Field(None, description="Primary smoke detection flag")

    # Note: Removed 30+ excessive safety sensor fields (CO levels, fire temps, VOC sensors, etc.)
    # Focused on core BESS operational metrics for performance and clarity

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class BESSResponse(BaseModel):
    """Response model for unified BESS data"""
    device_id: str = Field(description="Device identifier")
    total_records: int = Field(description="Number of records returned", ge=0)
    batch_size: int = Field(description="Requested batch size", ge=1)
    data: List[BESSReading] = Field(description="Synchronized BESS readings")

class APIError(BaseModel):
    """Error response model"""
    error: str = Field(description="Error message")
    detail: Optional[str] = Field(None, description="Error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")