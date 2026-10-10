# Trading — NSE Bhavcopy & Live Option Scanner

A high-performance automated API and web scanner for the National Stock Exchange of India (NSE) F&O options market.

Deployed live on Vercel at `rajan-tradingvercel`.

## What this project does

- Downloads official NSE bhavcopy files and makes them searchable
- Scans live option chains for intraday setups
- Applies filter rules like day-low range, previous-close range, O=L/O=H, and OI thresholds
- Supports both NSE live data and alternate market data sources

## Key Features

1. **Automated Bhavcopy Downloader (Daily EOD)**
   - Queries NSE's `/api/daily-reports?key=FO` to detect the latest available trading date and files
   - Downloads the official `BhavCopy_NSE_FO_0_0_0_YYYYMMDD_F_0000.csv.zip`
   - Cross-references today's and previous day's bhavcopy for OI% and previous-close changes
   - Caches parsed data locally in `data_cache/` for fast reloads

2. **Live Market Scanner (Intraday Option Chains)**
   - Uses NSE's updated v3 options pipeline
   - Supports index options: `NIFTY`, `BANKNIFTY`, `FINNIFTY`, `MIDCPNIFTY`
   - Supports stock derivatives such as `RELIANCE`, `HDFCBANK`, and more
   - Configurable auto-refresh during active trading hours

3. **Advanced Option Scanning Engine**
   - Day Low in range
   - Previous Close in range
   - Open = Low and Open = High detection
   - Minimum Open Interest threshold
   - Nearest expiry or all expiries
   - Filter by instrument type and option type

4. **Manual Upload Fallback**
   - Upload your own bhavcopy CSV files anytime

## Tech Stack

- Python
- FastAPI
- uvicorn
- Node.js

## How to Run

```powershell
python -m uvicorn api.index:app --host 0.0.0.0 --port 8000
```

Then visit:
```text
http://localhost:8000
```

## Status

Deployed on Vercel; active development.
