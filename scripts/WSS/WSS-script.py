import pandas as pd

# Data for cities
data = {
    "City": ["Athens", "Berlin", "Cairo", "Delhi", "Istanbul", "Lagos", "Manila", "New York", "Paris", "São Paulo"],
    "Country": ["Greece", "Germany", "Egypt", "India", "Türkiye", "Nigeria", "Philippines", "U.S.", "France", "Brazil"],
    "Population": [3153386, 3769495, 20600000, 30291000, 15701602, 15600000, 1902590, 8467513, 2166423, 12325232],
    "W": [100, 100, 75, 40, 99, 29, 48, 97, 100, 86],
    "S": [100, 100, 88, 82, 79, 28, 63, 99, 99, 79],
    "T": [85, 95, 50, 60, 63, 8, 68, 90, 91, 52]
}

df = pd.DataFrame(data)

# Compute W&S Index
df["W&S_Score"] = (0.40 * df["W"]) + (0.35 * df["S"]) + (0.25 * df["T"])
df["W&S_Score"] = df["W&S_Score"].round(2)

# Define new category thresholds
def categorize(score):
    if score <= 25:
        return "At-Risk"
    elif score <= 50:
        return "Poor"
    elif score <= 75:
        return "Moderate"
    elif score < 100:
        return "Good"
    else:
        return "Excellent"

df["Category"] = df["W&S_Score"].apply(categorize)

# Display final table
print(df.to_string(index=False))
