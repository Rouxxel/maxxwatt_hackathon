"""
BESS API Configuration
======================
Central configuration for the BESS API application.
"""

from pathlib import Path

# API Configuration
API_TITLE = "BESS Battery Energy Storage System API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "Unified optimized BESS data access with core metrics"
API_HOST = "0.0.0.0"
API_PORT = 8002

# Data Configuration
DATA_BASE_PATH = Path("../data/energy_hackathon_data/BESS")
MAX_BATCH_SIZE = 1000
DEFAULT_BATCH_SIZE = 100
DEFAULT_STREAM_INTERVAL = 2.0

# Data Processing Configuration
MAX_RECORDS_PER_FILE = 1000
SAMPLE_SIZE_FOR_TIME_ANALYSIS = 1000
MAX_UNIFIED_RECORDS = 1000
TIME_WINDOW_TOLERANCE_MINUTES = 5

# CORS Configuration
CORS_ORIGINS = ["*"]
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]