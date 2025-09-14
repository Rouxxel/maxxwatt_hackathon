# BESS Battery Energy Storage System API

A FastAPI-based REST API for accessing Battery Energy Storage System (BESS) data with real-time streaming capabilities, built for the **Berlin Energy Hackathon 2025**. Includes both Battery Management System (BMS) and Power Conversion System (PCS) data access with anomaly detection and forecasting capabilities.

## 📁 Project Structure

```
api/
├── main.py                    # FastAPI application entry point
├── schemas.py                 # Pydantic data models
├── requirements.txt           # Python dependencies
├── bms_dashboard.html        # Test dashboard (HTML/JS)
├── README.md                 # This file
├── routers/
│   ├── __init__.py
│   ├── bms.py                # BMS API endpoints
│   └── pcs.py                # PCS API endpoints  
└── unit_tests/
    ├── __init__.py
    ├── test_bms_endpoints.py  # BMS API endpoint tests
    ├── test_pcs_endpoints.py  # PCS API endpoint tests
    ├── test_schemas.py        # Schema validation tests
    └── test_bms_manager.py    # Data manager tests
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the API Server
```bash
python main.py
```
The server will start on `http://localhost:8002`

### 3. Test the Dashboard
Open `bms_dashboard.html` in your browser to see real-time BMS data streaming.

## 📖 API Documentation

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information and available endpoints |
| **BMS Endpoints** |
| GET | `/bms/devices` | List all available BESS devices with BMS data |
| GET | `/bms/{device_id}` | Get batch BMS data for a device |
| GET | `/bms/{device_id}/stream` | Stream real-time BMS data |
| **PCS Endpoints** |
| GET | `/pcs/devices` | List all available BESS devices with PCS data |
| GET | `/pcs/{device_id}` | Get batch PCS data for a device |
| GET | `/pcs/{device_id}/stream` | Stream real-time PCS data |

### Interactive Documentation
- **Swagger UI**: `http://localhost:8002/docs`
- **ReDoc**: `http://localhost:8002/redoc`

## 🔧 API Usage Examples

### Get Available Devices
```bash
# BMS devices
curl http://localhost:8002/bms/devices

# PCS devices  
curl http://localhost:8002/pcs/devices
```

### Get Batch Data
```bash
# BMS data
curl "http://localhost:8002/bms/ZHPESS232A230002?batch_size=10&skip=0"

# PCS data
curl "http://localhost:8002/pcs/ZHPESS232A230002?batch_size=10&skip=0"
```

### Stream Real-time Data
```bash
# BMS streaming
curl -N "http://localhost:8002/bms/ZHPESS232A230002/stream?interval=2.0"

# PCS streaming  
curl -N "http://localhost:8002/pcs/ZHPESS232A230002/stream?interval=2.0"
```

### JavaScript Frontend Integration
```javascript
// BMS data streaming
const bmsSource = new EventSource('http://localhost:8002/bms/ZHPESS232A230002/stream?interval=2.0');
bmsSource.onmessage = function(event) {
    const bmsData = JSON.parse(event.data);
    console.log('Real-time BMS:', bmsData);
    // Update BMS dashboard here
};

// PCS data streaming
const pcsSource = new EventSource('http://localhost:8002/pcs/ZHPESS232A230002/stream?interval=2.0');
pcsSource.onmessage = function(event) {
    const pcsData = JSON.parse(event.data);
    console.log('Real-time PCS:', pcsData);
    // Update PCS dashboard here
};
```

## 📊 Data Schemas

### BMSReading
```json
{
    "timestamp": "2023-01-01T00:00:00Z",
    "soc": 85.5,                    // State of Charge (%)
    "soh": 95.2,                    // State of Health (%)
    "voltage": 825.3,               // Pack voltage (V)
    "current": -150.5,              // Pack current (A)
    "cell_avg_voltage": 3.25,       // Average cell voltage (V)
    "cell_avg_temp": 25.8,          // Average cell temperature (°C)
    "cell_max_voltage": 3.28,       // Max cell voltage (V)
    "cell_min_voltage": 3.22,       // Min cell voltage (V)
    "cell_voltage_diff": 0.06,      // Voltage spread (V)
    "cell_temp_diff": 5.2           // Temperature spread (°C)
}
```

### PCSReading
```json
{
    "timestamp": "2023-01-01T00:00:00Z",
    "apparent_power": 150.5,        // Apparent power output (kW)
    "dc_current": 200.0,            // DC current (A)
    "dc_voltage": 800.0,            // DC voltage (V)
    "ac_current_a": 120.0,          // AC phase A current (A)
    "ac_current_b": 118.5,          // AC phase B current (A)
    "ac_current_c": 121.2,          // AC phase C current (A)
    "ac_voltage_ab": 400.0,         // AC line voltage A-B (V)
    "ac_voltage_bc": 398.5,         // AC line voltage B-C (V)
    "ac_voltage_ca": 401.2,         // AC line voltage C-A (V)
    "temp_environment": 25.8,       // Environmental temperature (°C)
    "temp_ambient": 24.5,           // Ambient temperature (°C)
    "temp_igbt": 45.2               // IGBT temperature (°C)
}
```

## 🧪 Running Tests

### Run All Tests
```bash
pytest unit_tests/ -v
```

### Run Specific Test Files
```bash
pytest unit_tests/test_bms_endpoints.py -v
pytest unit_tests/test_pcs_endpoints.py -v
pytest unit_tests/test_schemas.py -v
pytest unit_tests/test_bms_manager.py -v
```

### Test Coverage
```bash
pytest unit_tests/ --cov=. --cov-report=html
```

## 🏗️ Architecture

### Key Components

1. **FastAPI Application** (`main.py`)
   - CORS-enabled REST API
   - Auto-generated OpenAPI documentation
   - Async request handling

2. **BMS Router** (`routers/bms.py`)
   - Device discovery and listing
   - Batch data retrieval with pagination
   - Real-time streaming via Server-Sent Events (SSE)

3. **Data Models** (`schemas.py`)
   - Pydantic models with validation
   - Type-safe API contracts
   - Automatic JSON serialization

4. **Data Management**
   - `BMSDataManager`: Batch processing with timestamp synchronization
   - `BMSStreamer`: Real-time data streaming
   - Memory-efficient CSV processing

### Data Processing Features

- **Timestamp Synchronization**: Aligns data from different sampling rates
- **Batch Processing**: Memory-efficient handling of large datasets (6GB+)
- **Real-time Streaming**: Server-Sent Events for live dashboard updates
- **Auto-pagination**: Seamless data cycling for continuous streaming

## 📈 Performance

- **Memory Efficient**: Processes data in configurable batches (default: 100 records)
- **Scalable**: Handles multiple concurrent streaming connections
- **Fast**: Lazy loading and caching for optimal response times

## 🛠️ Development

### Adding New Endpoints
1. Add route functions to `routers/bms.py`
2. Define request/response models in `schemas.py`
3. Add unit tests to `unit_tests/`

### Data Source Configuration
Update `DATA_BASE_PATH` in `routers/bms.py` to point to your BESS data directory.

## 🔍 Troubleshooting

### Common Issues

1. **404 Errors**: Ensure server is running and device IDs are correct
2. **Memory Issues**: Reduce batch size for large datasets
3. **Streaming Disconnects**: Check network stability and browser limits

### Debug Mode
Set environment variable for detailed logging:
```bash
export UVICORN_LOG_LEVEL=debug
python main.py
```

## 📋 Requirements

- Python 3.8+
- FastAPI 0.104.1+
- Pandas 2.1.3+
- Uvicorn 0.24.0+

See `requirements.txt` for complete dependency list.

---

*Built for Berlin Energy Hackathon 2025*