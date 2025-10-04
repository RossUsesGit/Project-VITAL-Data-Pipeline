# Population Density Score (PDS) computation
# -------------------------------------------
# DATA SOURCES:
# - Population: WorldPop 2023 (https://www.worldpop.org/)
# - Urban Area: Copernicus GHSL built-up (https://human-settlement.emergency.copernicus.eu/)
# - Urban Boundaries: CIESIN / SEDAC GUPPD (https://search.earthdata.nasa.gov/search?q=CIESIN%20ESDIS)
#
# FORMULA SOURCE:
# - Urban Density = Population ÷ Area (UN-Habitat SDG 11.3.1)
#   https://unstats.un.org/sdgs/metadata/files/Metadata-11-03-01.pdf
# - PDS = log-scaled density score, capped at 100,000 people/km²
#   Inspired by UN-Habitat CPI & OECD (log normalization to avoid extreme 0 values)
#   https://cpi.unhabitat.org/
#   https://www.oecd-ilibrary.org/urban-rural-and-regional-development/cities-in-the-world_d0efcbda-en
#
# CATEGORY DEFINITION:
# - Perfect: 100 → Optimal livability and compactness.
# - Healthy: 76–99 → Balanced density, supports accessibility and efficiency.
# - Moderate: 51–75 → Mixed conditions, manageable with some strain.
# - Poor: 26–50 → Problematic density, overcrowding or sprawl.
# - Unhealthy: 1–25 → Critical density extremes, low livability.

import math

cities = [
    {"city": "Manila", "population": 1902590, "urban_area_km2": 43.7},
    {"city": "São Paulo", "population": 12325232, "urban_area_km2": 1521},
    {"city": "New York", "population": 8467513, "urban_area_km2": 789},
    {"city": "Lagos", "population": 15600000, "urban_area_km2": 1171},
    {"city": "Delhi", "population": 30291000, "urban_area_km2": 1484},
    {"city": "Berlin", "population": 3769495, "urban_area_km2": 891},
    {"city": "Paris", "population": 2165423, "urban_area_km2": 1054},
    {"city": "Athens", "population": 3153386, "urban_area_km2": 717},  
    {"city": "Cairo", "population": 20600000, "urban_area_km2": 606},
    {"city": "Istanbul", "population": 15701602, "urban_area_km2": 5343}
]

def compute_density(population, area_km2):
    """Compute urban population density (people per km²)."""
    return population / area_km2

def log_density_score(density, min_d, cap_d=100000):
    """Compute log-scaled Population Density Score (PDS)."""
    density = min(density, cap_d)
    return 100 * (math.log(cap_d + 1) - math.log(density + 1)) / (math.log(cap_d + 1) - math.log(min_d + 1))

def categorize(score):
    """Classify city based on PDS score."""
    if score == 100:
        return "Perfect", "Optimal livability and compactness"
    elif score >= 76:
        return "Healthy", "Balanced density; supports livability and efficiency"
    elif score >= 51:
        return "Moderate", "Mixed conditions; manageable but with some strain"
    elif score >= 26:
        return "Poor", "Problematic density; overcrowding or sprawl risks"
    else:
        return "Unhealthy", "Critical density extremes; low livability"

# Compute densities
densities = [compute_density(c["population"], c["urban_area_km2"]) for c in cities]
min_density = min(densities)

# Print header
print(f"{'City':<15} {'Pop (2023)':<12} {'Area km²':<10} {'Density':<15} {'PDS Score':<12} {'Category':<12} {'Description'}")
print("-" * 120)

# Calculate and print results
for c in cities:
    city = c["city"]
    pop = c["population"]
    area = c["urban_area_km2"]
    dens = compute_density(pop, area)
    pds = log_density_score(dens, min_density)
    category, description = categorize(round(pds))

    print(f"{city:<15} {pop:<12,} {area:<10.1f} {dens:<15.1f} {pds:<12.1f} {category:<12} {description}")
