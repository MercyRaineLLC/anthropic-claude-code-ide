# Freight Margin Calculator (PWA)

A lightweight Progressive Web App (PWA) for freight brokers to:

- Enter the shipper charge.
- Automatically calculate:
  - 15% margin walkaway price
  - 20% margin goal price
  - 25% margin goal price
- Save each quote with broker name + timestamp.
- Export logs as CSV for admin retrieval.

## Why this is lowest-cost for phone + PC

This app is a static website and PWA, so it can be hosted cheaply (or free tiers) and installed on:

- iPhone/Android via **Add to Home Screen**
- Windows/macOS/Chromebook via browser **Install App**

No app-store submission is required for internal use.

## Run locally

Because service workers require HTTP(S), run with a simple local server:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Admin retrieval workflow

1. Brokers use the app to create quote entries.
2. Admin opens the app on each device and clicks **Export CSV**.
3. CSV can be imported into Google Sheets/Excel for reporting.

## Recommended next features

- Cloud sync with Supabase/Firebase for central admin view.
- Admin dashboard with filters by broker/date/lane.
- User authentication and role controls.
- Automated backup and retention settings.
