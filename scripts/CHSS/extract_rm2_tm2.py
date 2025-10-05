import xarray as xr
import rioxarray
import geopandas as gpd
import pandas as pd
import os
import numpy as np
from pathlib import Path


# Configuration (Update paths as needed)

nc_folder = r"D:\Downloads\Programming\Python\NASA Space Apps\heat_risk_dataextraction\era5-land-unzipped"
cities_folder = r"D:\Downloads\Programming\Python\NASA Space Apps\city_shape_files\cities"
output_folder = r"D:\Downloads\Programming\Python\NASA Space Apps\heat_risk_dataextraction\city_daily_csv"

os.makedirs(output_folder, exist_ok=True)

# ERA5-Land bounds from your CDS download script
ERA5_BOUNDS = (-75, -25, 125, 55)  # (min_lon, min_lat, max_lon, max_lat)
ERA5_CRS = "EPSG:4326"

# Expected variables (adjust if print(ds.data_vars) shows different names)
VARIABLES = {"t2m": "temperature files", "d2m": "dewpoint files"}

# Discover Files (Precise Globs to Avoid Overlap)

temp_files = sorted(Path(nc_folder).glob("2m_temperature_2024*_daily-mean.nc"))  # Only t2m (12 files)
dewpoint_files = sorted(Path(nc_folder).glob("2m_dewpoint_temperature_2024*_daily-mean.nc"))  # Only d2m (12 files)

print(f"Found {len(temp_files)} {VARIABLES['t2m']}: {[f.name for f in temp_files[:3]]}..." if temp_files else "No t2m files")
print(f"Found {len(dewpoint_files)} {VARIABLES['d2m']}: {[f.name for f in dewpoint_files[:3]]}..." if dewpoint_files else "No d2m files")

if len(temp_files) == 0 or len(dewpoint_files) == 0:
    print("Error: No files for one or both variables. Run fixed unzipper and check paths.")
    exit(1)

if len(temp_files) != 12 or len(dewpoint_files) != 12:
    print(f"Warning: Expected 12 files per variable (full 2024), found {len(temp_files)} t2m and {len(dewpoint_files)} d2m. Proceeding...")

# Map variable to its files
nc_files = {
    "t2m": temp_files,
    "d2m": dewpoint_files
}

# -----------------------------
# Step 2: Process Cities and Shapefiles
# -----------------------------
for city_name in os.listdir(cities_folder):
    city_path = os.path.join(cities_folder, city_name)
    if not os.path.isdir(city_path):
        continue

    print(f"\n=== Processing city: {city_name} ===")
    city_records = []

    # Loop over shapefiles in city folder
    for shp_file in os.listdir(city_path):
        if not shp_file.endswith(".shp"):
            continue

        # Prefer fixed/reprojected version if exists (from manual verification)
        fixed_shp = shp_file.replace(".shp", "_fixed.shp")
        shp_path = os.path.join(city_path, fixed_shp if os.path.exists(os.path.join(city_path, fixed_shp)) else shp_file)
        print(f"  Processing shapefile: {os.path.basename(shp_path)}")

        # Load and prepare shapefile
        gdf = gpd.read_file(shp_path)

        # Paris-specific debug
        is_paris = "paris" in city_name.lower() or "paris" in shp_file.lower()
        if is_paris:
            print(f"    Paris DEBUG: Original CRS: {gdf.crs}")
            print(f"    Paris DEBUG: Num geometries: {len(gdf)}")
            print(f"    Paris DEBUG: Original bounds: {gdf.total_bounds}")

        # Validate and repair geometries
        gdf['geometry'] = gdf['geometry'].buffer(0)  # Fixes invalid polygons
        gdf = gdf[gdf.geometry.is_valid].reset_index(drop=True)
        if gdf.empty:
            print(f"    Error: No valid geometries after repair. Skipping {shp_file}.")
            continue
        if is_paris:
            print(f"    Paris DEBUG: After validation: {len(gdf)} geometries")

        # Reproject to ERA5 CRS (fixes out-of-bounds)
        original_crs = gdf.crs
        if gdf.crs is None:
            print(f"    Warning: No CRS—setting to {ERA5_CRS} (assuming lat/lon).")
            gdf = gdf.set_crs(ERA5_CRS)
        elif gdf.crs != ERA5_CRS:
            print(f"    Reprojecting from {original_crs} to {ERA5_CRS}.")
            gdf = gdf.to_crs(ERA5_CRS)

        # Get bounds in lon/lat
        bounds = gdf.total_bounds  # [min_lon, min_lat, max_lon, max_lat]
        if is_paris:
            print(f"    Paris DEBUG: After reprojection bounds (lon/lat): {bounds}")
            sample_centroid = gdf.geometry.iloc[0].centroid
            print(f"    Paris DEBUG: Sample centroid (lon/lat): {sample_centroid.x:.4f}, {sample_centroid.y:.4f}")

        # Quick global overlap check with ERA5 download bounds
        global_overlap = (bounds[0] < ERA5_BOUNDS[2] and bounds[2] > ERA5_BOUNDS[0] and
                          bounds[1] < ERA5_BOUNDS[3] and bounds[3] > ERA5_BOUNDS[1])
        if not global_overlap:
            print(f"    Error: No overlap with ERA5 bounds {ERA5_BOUNDS}. Shapefile: {bounds}. Skipping {shp_file}.")
            continue
        if is_paris:
            print(f"    Paris DEBUG: Global overlap with ERA5? {global_overlap}")

        # Process variables and monthly files
        total_records = 0
        for var, monthly_files in nc_files.items():
            print(f"    Processing {var} ({len(monthly_files)} monthly files)")
            var_records = 0
            skipped_files = 0

            for nc_path in monthly_files:
                try:
                    ds = xr.open_dataset(nc_path, engine='h5netcdf')
                except Exception as e:
                    print(f"      Skip {nc_path.name}: {e}")
                    skipped_files += 1
                    continue

                # Check variable exists
                if var not in ds.data_vars:
                    print(f"      Skip {nc_path.name}: {var} not found. Available: {list(ds.data_vars.keys())}")
                    ds.close()
                    skipped_files += 1
                    continue

                da = ds[var]
                da = da.rio.write_crs(ERA5_CRS, inplace=False)

                # Dataset bounds for this file
                ds_bounds = (float(da.longitude.min()), float(da.latitude.min()),
                             float(da.longitude.max()), float(da.latitude.max()))
                file_overlap = (bounds[0] < ds_bounds[2] and bounds[2] > ds_bounds[0] and
                                bounds[1] < ds_bounds[3] and bounds[3] > ds_bounds[1])
                if is_paris:
                    print(f"      Paris DEBUG: {nc_path.name} bounds: {ds_bounds}")
                    print(f"      Paris DEBUG: File overlap? {file_overlap}")

                if not file_overlap:
                    print(f"      Skip {nc_path.name}: No spatial overlap. Shapefile: {bounds}, Data: {ds_bounds}")
                    ds.close()
                    skipped_files += 1
                    continue

                # Clip to shapefile
                try:
                    clipped = da.rio.clip(gdf.geometry, gdf.crs, drop=True, all_touched=True)
                    if clipped.notnull().sum().item() == 0 or clipped.size == 0:
                        raise ValueError("Clipped data empty (no overlap or all NaN)")

                    # Auto-detect time dim (valid_time or time)
                    time_dim = next((dim for dim in clipped.dims if dim in ['valid_time', 'time']), None)
                    if time_dim is None:
                        raise ValueError(f"No time dim found. Dims: {list(clipped.dims)}")

                    # Process daily time steps
                    num_times = len(clipped[time_dim])
                    print(f"      Success for {nc_path.name}: {num_times} time steps")
                    for t in clipped[time_dim].values:
                        daily_slice = clipped.sel({time_dim: t})
                        daily_value = float(daily_slice.mean(dim=['latitude', 'longitude'], skipna=True).values)
                        if np.isnan(daily_value):
                            continue  # Skip days with no valid data (e.g., all NaN over geometry)

                        # Create record
                        record = pd.DataFrame({
                            "city": [city_name],
                            "shapefile": [os.path.basename(shp_path).replace(".shp", "")],
                            "variable": [var],
                            "date": [pd.to_datetime(t)],
                            "value": [daily_value]
                        })
                        city_records.append(record)
                        var_records += 1

                except Exception as e:
                    print(f"      Clip failed for {var} in {nc_path.name}: {e}")
                    print(f"      Details: Shapefile {bounds}, Data {ds_bounds}, Overlap {file_overlap}")
                    skipped_files += 1

                ds.close()

            print(f"    {var}: {var_records} records ({skipped_files} files skipped)")
            total_records += var_records

        print(f"  Total for {shp_file}: {total_records} records")

    # Save combined CSV for city (full year)
    if city_records:
        city_df = pd.concat(city_records, ignore_index=True)
        city_df = city_df.sort_values("date").reset_index(drop=True)
        output_path = os.path.join(output_folder, f"{city_name}_daily_valuesx.csv")
        city_df.to_csv(output_path, index=False)
        print(f"  Saved {len(city_df)} records to {output_path}")
        print(f"  Date range: {city_df['date'].min().date()} to {city_df['date'].max().date()}")
        print(f"  Variables: {city_df['variable'].unique()}")
    else:
        print(f"  No records for {city_name} (all clips failed—check debug above)")

print("\n=== Processing Complete! Check output CSVs in", output_folder, "===")