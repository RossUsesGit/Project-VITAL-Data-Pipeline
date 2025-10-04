import rasterio
import rasterio.mask
import geopandas as gpd
import numpy as np
import pandas as pd
import json
import os

# Function to convert PM2.5 to WHO category only
def pm25_to_who_category(pm25):
    breakpoints = [
        (0.0, 5.0, "Good"),
        (5.1, 10.0, "Moderate"),
        (10.1, 15.0, "Unhealthy for Sensitive Groups"),
        (15.1, 25.0, "Unhealthy"),
        (25.1, 35.0, "Very Unhealthy"),
        (35.1, 999.9, "Hazardous")
    ]
    
    for C_low, C_high, category in breakpoints:
        if C_low <= pm25 <= C_high:
            return category
    return "Out of Range"

# Paths
raster_path = r"pm2.5_dataextraction/tif/sdei-global-annual-gwr-pm2-5-modis-misr-seawifs-viirs-aod-v5-gl-04-2022-geotiff.tif"
cities_folder = "city_shape_files/cities"

results = []

with rasterio.open(raster_path) as src:
    for city_name in os.listdir(cities_folder):
        city_dir = os.path.join(cities_folder, city_name)
        shp_files = [f for f in os.listdir(city_dir) if f.endswith(".shp")]
        if not shp_files:
            print(f"No shapefile found for {city_name}")
            continue
        shp_path = os.path.join(city_dir, shp_files[0])

        # Load city polygon
        city_gdf = gpd.read_file(shp_path)
        city_geom = [json.loads(city_gdf.to_json())['features'][0]['geometry']]

        # Mask raster with city polygon
        out_image, out_transform = rasterio.mask.mask(src, city_geom, crop=True)
        out_image = out_image[0]

        # Compute mean and max PM2.5 ignoring nodata
        pm25_values = out_image[out_image != src.nodata]
        if len(pm25_values) == 0:
            mean_pm25 = max_pm25 = None
            mean_cat = max_cat = None
        else:
            mean_pm25 = float(np.nanmean(pm25_values))
            max_pm25 = float(np.nanmax(pm25_values))

            # Mean & Max Category
            mean_cat = pm25_to_who_category(mean_pm25)
            max_cat = pm25_to_who_category(max_pm25)

        results.append({
            "city": city_name,
            "mean_pm25": mean_pm25,
            "mean_AQI_Category": mean_cat,
            "max_pm25": max_pm25,
            "max_AQI_Category": max_cat,
        })

# Convert to DataFrame
df = pd.DataFrame(results)

# Create a rounded copy for saving
df_rounded = df.copy()
for col in ["mean_pm25", "max_pm25"]:
    df_rounded[col] = df_rounded[col].round(2)

# Print results for display
for _, row in df.iterrows():
    print(f"\nCity: {row['city']}")
    for prefix in ["mean", "max"]:
        pm25 = row[f"{prefix}_pm25"]
        category = row[f"{prefix}_AQI_Category"]
        if pm25 is not None:
            print(f"{prefix}_pm25: PM2.5= {pm25:.2f} µg/m³ → Category= {category}")
        else:
            print(f"{prefix}_pm25: No data available.")

# Optional: Save results
# df_rounded.to_csv("pm2.5_dataextraction/city_pm25_aqi_categories_mean_max.csv", index=False)
df_rounded.to_excel("pm2.5_dataextraction/city_pm25_aqi_categories_mean_maxaaaa.xlsx", index=False)
