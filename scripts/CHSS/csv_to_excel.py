import pandas as pd
import os
from pathlib import Path

# Folder with your CSV files (one per city)
input_folder = r"D:\Downloads\Programming\Python\NASA Space Apps\heat_risk_dataextraction\city_daily_csv"

# Ensure the folder exists
if not os.path.exists(input_folder):
    print(f"Error: Folder '{input_folder}' does not exist. Check the path.")
    exit(1)

print(f"Scanning for CSV files in: {input_folder}")
csv_files = list(Path(input_folder).glob("*.csv"))
print(f"Found {len(csv_files)} CSV files to convert.\n")

if len(csv_files) == 0:
    print("No CSV files found. Exiting.")
    exit(1)

# Loop through each CSV and convert to XLSX
for csv_file in csv_files:

    print(f"Processing {csv_file.name}...")
    try:
        # Read the CSV
        df = pd.read_csv(csv_file)
        
        # Create output path: same name but .xlsx extension, in same folder
        output_path = csv_file.with_suffix('.xlsx')  # e.g., Berlin_daily_values.csv -> Berlin_daily_values.xlsx
        
        # Save as Excel (overwrites if exists)
        df.to_excel(output_path, index=False, engine='openpyxl')
        
        print(f"  Converted {len(df)} rows to {output_path.name}")
        print(f"  Columns: {list(df.columns)}")
        print(f"  Date range (if applicable): {df['date'].min() if 'date' in df.columns else 'N/A'} to {df['date'].max() if 'date' in df.columns else 'N/A'}\n")
        
    except Exception as e:
        print(f"  Error converting {csv_file.name}: {e}")
        print("  Skipping this file.\n")

print("Conversion complete! Check the input folder for .xlsx files.")
