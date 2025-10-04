import cdsapi

dataset = "derived-era5-land-daily-statistics"
client = cdsapi.Client()

months = [f"{m:02d}" for m in range(1, 13)]
for month in months:
    request = {
        "variable": ["2m_dewpoint_temperature", "2m_temperature"],
        "year": "2024",
        "month": month,
        "day": [f"{d:02d}" for d in range(1, 32)],
        "daily_statistic": "daily_mean",
        "time_zone": "utc+00:00",
        "area": [55, -75, -25, 125]  
    }
    outfile = f"era5_land_2024_{month}.nc"
    print(f"Downloading {month} -> {outfile}")
    client.retrieve(dataset, request).download(outfile)
