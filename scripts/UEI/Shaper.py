import geopandas as gpd
'''
ACKNOWLEDGEMENT OF AI USE: AI Generated the code for extraction using geopandas. For some cities, that are not readily available in country shapefiles of GADM, the AI provided
assistance to finding districts under it and fusing them into one shapefile. However, the team also verified manually if the cities are accurate by checking their categories in
the array manuall (see line 62 for reference). This ensures that the correct city is extracted, which then underwent manual verification through visual comparison of actual maps 
of target cities against the extracted shape by the code. 
'''

'''
City Shapefile extractor sample, in the context of Greece
'''

# Load the shapefile
shapefile = gpd.read_file(r"Path\gadm41_GRC_3.shp")
print(shapefile.columns)

# Filter all districts within Cairo Governorate
athens = shapefile[shapefile["NAME_3"] == "Athens"] # Replace "NAME_NUM" with the 
'''
   If GADM country shapefile does not provide the exact shape for a particular city, use the code below for extracting shape of district
   and combining into one city shapefile 
'''
# cairo_city_districts = [
#     "'Abdin",
#     "Al-Azbakiyah",
#     "Al-Gamaliyah",
#     "Qasr an-Nil",
#     "Bab ash-Sha'riyah",
#     "Az-Zahir",
#     "Al-Muski",
#     "Ancient Cairo",
#     "Al-Khalifa",
#     "As-Sayidah Zaynab",
#     "Ad-Darb al-Ahmar",
#     "Al-Waili",
#     "Az-Zaytun",
#     "Hada'iq al-Qubbah",
#     "Shubra",
#     "Rud al-Faraj",
#     "Ash-Sharabiyah",
#     "Al-Matariyah",
#     "Al-Marj",
#     "'Ain Schams",
#     "Al-Ma'adi",
#     "Al-Basatin",
#     "Nasr City 1",
#     "Nasr City 2",
#     "Heliopolis",
#     "An-Nuzhah",
#     "Zawiyya Al-Hamra",
#     "Bulaq",
#     "Zamalik"
# ]

# cairo_city = cairo_governorate[cairo_governorate['NAME_2'].isin(cairo_city_districts)] # Use this code to select districts under a state or governorate

# Merge (dissolve) into one geometry
# cairo_city_dissolved = cairo_city.dissolve(by="NAME_2")  #Use for merging counties/districts into cities

#--------------------------------------------------------------------------------------------

# Show the list of cities under the same name and their type (municipality, state, province, etc.)
print(athens[['NAME_3', 'TYPE_3']]) 

# print('\n', new_york_cnty)

# # Save as a new shapefile
athens.to_file("athens.shp")
