import zipfile
import os
import glob
import shutil
from pathlib import Path
import re  # For parsing zip names

input_folder = r"D:\Downloads\Programming\Python\NASA Space Apps\heat_risk_dataextraction\era5-land-nc"
output_folder = r"D:\Downloads\Programming\Python\NASA Space Apps\heat_risk_dataextraction\era5-land-unzipped"

# Optional: Clear output folder to start fresh (uncomment if needed)
# shutil.rmtree(output_folder, ignore_errors=True)
os.makedirs(output_folder, exist_ok=True)

# Find all "fake" .nc zips
zip_paths = sorted(glob.glob(os.path.join(input_folder, "era5_land_2024_*.nc")))  # Sort for consistent order
print(f"Found {len(zip_paths)} zip files in {input_folder}")

extracted_count = 0
total_extracted_files = 0

for zip_path in zip_paths:
    zip_name = os.path.basename(zip_path)
    print(f"\nProcessing {zip_name}...")
    
    # Parse year and month from zip name (e.g., "era5_land_2024_01.nc" -> year=2024, month=01)
    match = re.search(r'era5_land_(\d{4})_(\d{2})\.nc', zip_name)
    if not match:
        print(f"  Warning: Could not parse year/month from {zip_name}. Skipping.")
        continue
    year, month = match.groups()
    print(f"  Parsed: year={year}, month={month}")
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            contents = zip_ref.namelist()
            print(f"  Contents: {contents}")
            
            # Extract and rename each .nc file
            for file_in_zip in contents:
                if not file_in_zip.endswith('.nc'):
                    continue  # Skip non-.nc files
                
                # Original name inside zip (e.g., "2m_temperature_0_daily-mean.nc")
                original_name = os.path.basename(file_in_zip)
                
                # New unique name (e.g., "2m_temperature_2024_01_daily-mean.nc")
                # Replace "_0_" with "_{year}_{month}_"
                new_name = original_name.replace("_0_daily-mean.nc", f"_{year}_{month}_daily-mean.nc")
                new_path = os.path.join(output_folder, new_name)
                
                # Extract to a temp location, then rename and move
                temp_path = zip_ref.extract(file_in_zip, output_folder)
                if os.path.exists(temp_path):
                    shutil.move(temp_path, new_path)
                    print(f"  Extracted and renamed: {original_name} -> {new_name}")
                    total_extracted_files += 1
            
            extracted_count += 1
            print(f"  Successfully processed {zip_name} (extracted/renamed {len([c for c in contents if c.endswith('.nc')])} files)")
            
    except zipfile.BadZipFile:
        print(f"  Error: {zip_name} is not a valid zip. Skipping.")
    except Exception as e:
        print(f"  Error processing {zip_name}: {e}. Skipping.")

# Summary and verification
print(f"\nUnzipping complete!")
print(f"Processed {extracted_count} zips, extracted/renamed {total_extracted_files} files.")
print(f"\nExtracted .nc files in {output_folder} (should be 24 total):")
extracted_ncs = sorted(Path(output_folder).glob("*_daily-mean.nc"))
if extracted_ncs:
    for nc_file in extracted_ncs:
        print(f"  - {nc_file.name}")
    print(f"Total: {len(extracted_ncs)} .nc files")
    
    # Group by variable for quick check
    temp_files = [f for f in extracted_ncs if "temperature" in f.name]
    dewpoint_files = [f for f in extracted_ncs if "dewpoint" in f.name]
    print(f"  - Temperature files (t2m): {len(temp_files)}")
    print(f"  - Dewpoint files (d2m): {len(dewpoint_files)}")
else:
    print("  No .nc files found! Check errors above.")