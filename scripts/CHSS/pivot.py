import pandas as pd
import os
from pathlib import Path

# Folder with your CSV files (one per city) - will overwrite originals here
input_folder = r"D:\Downloads\Programming\Python\NASA Space Apps\heat_risk_dataextraction\city_daily_csv"

# WARNING: This script will OVERWRITE the original CSVs in the input folder!
# It fixes headers or pivots as needed. Back up your files first!
print("WARNING: Original CSVs will be overwritten (headers fixed or pivoted).")
print("Proceed? (Ctrl+C to cancel)\n")
input("Press Enter to continue...")  # Optional pause for confirmation

# Process each city CSV (overwriting in place)
for csv_file in Path(input_folder).glob("*.csv"):
    print(f"Processing {csv_file.name}...")
    try:
        df = pd.read_csv(csv_file)
        
        # Check if already in wide format (no 'variable' column)
        if 'variable' not in df.columns or 'value' not in df.columns:
            print(f"  Detected wide format. Fixing headers and sorting...")
            
            # Rename bad columns (based on your sample: '2' -> 'd2m', '2.1' -> 't2m')
            column_mapping = {'2': 'd2m', '2.1': 't2m'}  # Adjust if your bad names differ
            df = df.rename(columns=column_mapping)
            
            # Ensure we have t2m and d2m (or warn if missing)
            if 'd2m' not in df.columns or 't2m' not in df.columns:
                # Fallback: Assume last two columns are d2m (lower values) and t2m (higher)
                num_cols = len(df.columns)
                if num_cols >= 5:  # city, shapefile, date + 2 values
                    df = df.rename(columns={df.columns[3]: 'd2m', df.columns[4]: 't2m'})
                    print(f"  Renamed columns {df.columns[3]} -> 'd2m' and {df.columns[4]} -> 't2m'")
                else:
                    raise ValueError(f"Unexpected columns: {df.columns.tolist()}. Expected 5+ columns.")
            
            # Sort by date (no pivoting needed)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values(['city', 'shapefile', 'date']).reset_index(drop=True)
            
            # Final columns order: city, shapefile, date, d2m, t2m (alphabetical for consistency)
            col_order = ['city', 'shapefile', 'date', 'd2m', 't2m']
            available_cols = [col for col in col_order if col in df.columns]
            df = df[available_cols]
            
            print(f"  Fixed columns: {list(df.columns)}")
            
        else:
            # Long format detected: Proceed with pivoting
            print(f"  Detected long format. Pivoting to wide...")
            
            # Force variable order (alphabetical: d2m before t2m)
            df['variable'] = pd.Categorical(df['variable'], categories=['d2m', 't2m'], ordered=True)
            
            # Pivot
            pivoted = df.pivot_table(
                index=['city', 'shapefile', 'date'],
                columns='variable',
                values='value',
                aggfunc='first'
            ).reset_index()
            
            # Flatten MultiIndex
            if isinstance(pivoted.columns, pd.MultiIndex):
                pivoted.columns = pivoted.columns.droplevel(0)
            
            # Ensure order: d2m then t2m
            col_order = ['city', 'shapefile', 'date', 'd2m', 't2m']
            available_cols = [col for col in col_order if col in pivoted.columns]
            pivoted = pivoted[available_cols]
            
            # Sort by date
            pivoted['date'] = pd.to_datetime(pivoted['date'])
            pivoted = pivoted.sort_values(['city', 'shapefile', 'date']).reset_index(drop=True)
            
            df = pivoted  # Use pivoted for saving
            print(f"  Pivoted columns: {list(df.columns)}")
        
        # Save (overwrite with fixed/pivoted data)
        output_path = str(csv_file)
        df.to_csv(output_path, index=False, encoding='utf-8')
        print(f"Overwritten {len(df)} rows to {output_path}")
        print(f"  Final columns: {list(df.columns)}")
        print(f"  Date range: {df['date'].min().date()} to {df['date'].max().date()}\n")
        
    except Exception as e:
        print(f"Error processing {csv_file.name}: {e}")
        print("Skipping this file.\n")

print("Processing complete! Check the input folder for fixed CSVs.")
