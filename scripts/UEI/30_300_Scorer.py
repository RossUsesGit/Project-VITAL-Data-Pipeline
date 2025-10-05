import numpy as np
import pandas as pds
import rasterio
from scipy.ndimage import distance_transform_edt

with rasterio.open(r"Path\city_clipped.tif") as src:
    pixel_data = src.read(1)

'''
                                30% Cover Score
'''
unique, counts = np.unique(pixel_data, return_counts=True) #Count the number of pixels under each unique LCZ class

# Create a table
table = pds.DataFrame({"Class": unique, "Pixel Count": counts})
print(table["Class"]) #Display Available LCZ Classes in the country
print(table["Pixel Count"]) #Display number of pixel counts for each class

Total_Area_Range = [num for num in range(1, 16) if num in table['Class']] #Check and include LCZs relevant to the city data
Total_Areas = int(table.loc[Total_Area_Range, 'Pixel Count'].sum()) #Sum the number of pixels with LCZ data in the city to get total area of available data

low_envInteg = [num for num in [1, 2, 3, 7, 8, 10, 14, 15, 16] if num in table['Class']] #Check and include low pervious green cover LCZs that are relevant to the city
low_envInteg_total = int(table.loc[low_envInteg, 'Pixel Count'].sum()) #Sum the number of LCZs in the city that has low pervious green cover
high_envInteg = [num for num in [4, 5, 6, 9, 11, 12, 13] if num in table['Class']] #Check and include high pervious green cover LCZs that are relevant to the city
high_envInteg_total = int(table.loc[high_envInteg, 'Pixel Count'].sum()) #Sum the number of LCZs in the city that has high pervious green cover
high_envInteg_relFreq = round(((high_envInteg_total / Total_Areas)*100), 2) #Get relative freq of high environment integration LCZs to total number of pixel data
cover30_score = round(((high_envInteg_relFreq / 30) * 100), 2) #Translate to a 100 scoring system

if cover30_score > 100: cover30_score = 100

'''
                                Natural Cover within 300m Score
'''

compact_minNatCov = [num for num in [1, 2, 3, 7, 8] if num in table['Class']]
compact_minNatCov_total = int(table.loc[compact_minNatCov, 'Pixel Count'].sum())

mask_compact = np.isin(pixel_data, compact_minNatCov)   # all compact/dense LCZs
mask_natural = np.isin(pixel_data, high_envInteg)       # all LCZs with natural covers

# Distance to nearest natural cover (in pixels)
dist_to_natural = distance_transform_edt(~mask_natural) #mask all natural covers as false to calculate distance of true values (compact LCZs) to them.

# Pick compact pixels within 3 pixels (~300 m as res = 100 m)
nearby_compact = mask_compact & (dist_to_natural <= 3)

areas_nearby_300m = np.sum(nearby_compact) #Get the sum of all compact LCZs that evaluated true for 300m accessibility

areas_nearby_300m_relFreq = round((areas_nearby_300m / compact_minNatCov_total) * 100, 2)

uei_score = round(((cover30_score + areas_nearby_300m_relFreq) / 2), 2)

#Prepare UEI data for display in the 
city_uei_data = {
    'Country': input('Enter Country Name: '),
    'City': input('Enter City Name: '),
    'Areas With 30% Cover' : high_envInteg_total,
    'Areas With 30% Cover Relative Frequency': high_envInteg_relFreq,
    '30% Ideal Cover Score': cover30_score,
    'Areas within 300m NatCov': areas_nearby_300m,
    'Areas within 300m NatCov Relative Frequency': areas_nearby_300m_relFreq,
    'Total Compact Areas': compact_minNatCov_total,
    'Total Areas': Total_Areas,
    'UEI Score': uei_score
}

print(city_uei_data) #Preview Scores and Data

'''
                                                                Save to CSV
'''

# Convert the row to a DataFrame
uei_df = pds.DataFrame([city_uei_data])

# Append to CSV without overwriting
uei_df.to_csv("cities_uei_data3.csv", mode='a', header=False, index=False) #Set header to false if csv file to write to already exists
