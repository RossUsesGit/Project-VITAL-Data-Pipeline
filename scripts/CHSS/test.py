import xarray as xr

nc_file = r"D:\Downloads\Programming\Python\NASA Space Apps\heat_risk_dataextraction\era5-land-unzipped/2m_temperature_0_daily-mean.nc"
nc_file2 = r"D:\Downloads\Programming\Python\NASA Space Apps\heat_risk_dataextraction\era5-land-unzipped\2m_dewpoint_temperature_0_daily-mean.nc"
try:
    ds = xr.open_dataset(nc_file, engine='h5netcdf')  # or engine='netcdf4'
    ds2 = xr.open_dataset(nc_file2,engine='h5netcdf')
    print("Variables in NC file:", list(ds.data_vars))
    print("Coordinates:", list(ds.coords))
    print("Dimensions:", ds.dims)

    print("Variables in NC file 2:", list(ds2.data_vars))
    print("Coordinates:", list(ds2.coords))
    print("Dimensions:", ds2.dims)


except Exception as e:
    print("Failed to open NC file:", e)