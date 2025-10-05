import geopandas as gpd
import rasterio
from rasterio.mask import mask

# Load the shapefile
shapefile = gpd.read_file(r"Path\city.shp")

# Open raster
with rasterio.open(r"Path\lcz_filter_v3.tif") as src:
    # Convert the shapefile to the coordinate system used by rasterio for safety
    shapefile = shapefile.to_crs(src.crs)

    # Clip raster to city boundary
    out_image, out_transform = mask(src, shapefile.geometry, crop=True)
    out_meta = src.meta.copy()

# Update pixel data using the transformed image and numpy arr
out_meta.update({
    "driver": "GTiff",
    "height": out_image.shape[1],
    "width": out_image.shape[2],
    "transform": out_transform
})

# Write the city bounded data and image to a new file
with rasterio.open(r"Path\city_clipped.tif", "w", **out_meta) as dest:
    dest.write(out_image)
