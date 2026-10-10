# Stock Scanner Algo

Live NSE derivatives scanner with a small indicator engine and a single-page web UI.

## What it does

- Pulls live option-chain and quote data from NSE (`nse_service.py`) and caches it (`data_store.py`)
- Computes indicators: Donchian channels, Heikin Ashi, UT Bot, HA "dancing" trend, quantum matrix and custom trend filters
- Scans the F&O universe against configurable rules (`scan_engine.py`, `stock_scanner.py`) and exposes results over a FastAPI server
- Serves a static dashboard from `static/`; deployable to Vercel via `vercel.json`

## Layout

| Path | Purpose |
|---|---|
| `server.py` | FastAPI app and routes |
| `scan_engine.py`, `stock_scanner.py` | Rule evaluation across symbols |
| `indicators.py`, `donchian.py`, `heikin_ashi.py`, `ut_bot.py`, `ha_dancing_trend.py`, `quantum_matrix.py` | Indicator implementations |
| `nse_service.py`, `market_news.py`, `data_store.py` | Data access and caching |
| `trade_predictor.py` | Signal scoring |
| `static/` | Web UI |
| `api/index.py` | Vercel serverless entry point |

## Run locally

```bash
pip install -r requirements.txt
uvicorn server:app --reload
```

Optional live-data integration reads `UPSTOX_ACCESS_TOKEN` from the environment; never commit it.

## Disclaimer

For education and research. Not investment advice.
