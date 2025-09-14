export interface Device {
  device_id: string;
  available_metrics: string[];
  total_rows_per_metric: Record<string, number>;
}

export interface DeviceReading {
  timestamp: string;
  bms?: {
    soc?: number;
    soh?: number;
    voltage?: number;
    current?: number;
    cell_diagnostics?: Record<string, any>;
  };
  pcs?: {
    dc_voltage?: number;
    dc_current?: number;
    ac_voltage?: number;
    ac_current?: number;
    power?: number;
    igbt_temp?: number;
  };
  aux?: {
    hvac_temp?: number;
    water_pressure?: number;
    auxiliary_power?: number;
  };
  env?: {
    humidity?: number;
    temperature?: number;
  };
  safety?: {
    smoke?: boolean;
    fire?: boolean;
    co?: number;
    voc?: number;
    error_codes?: string[];
  };
}

export interface DeviceData {
  device_id: string;
  total_records: number;
  batch_size: number;
  data: DeviceReading[];
}

export type AlertLevel = 'normal' | 'warning' | 'critical';

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  timestamp: string;
}