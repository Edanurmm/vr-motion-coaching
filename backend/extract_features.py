import pandas as pd

df = pd.read_csv("../data/all_movements_data.csv")

def label_features(row):
    if row["movement"] == "punch":
        speed    = "good" if row["max_speed"] >= 3.0 else "low"
        angle    = "correct" if row["angle_deviation"] <= 15 else "incorrect"
        duration = "normal" if row["duration_ms"] >= 250 else "short"

    elif row["movement"] == "uppercut":
        speed    = "good" if row["max_speed"] >= 2.5 else "low"
        angle    = "correct" if 30 <= row["angle_deviation"] <= 70 else "incorrect"
        duration = "normal" if row["duration_ms"] >= 150 else "short"

    elif row["movement"] == "squat":
        speed    = "good" if row["max_speed"] >= 1.5 else "low"
        angle    = "correct" if 80 <= row["angle_deviation"] <= 100 else "incorrect"
        duration = "normal" if row["duration_ms"] >= 600 else "short"

    return pd.Series([speed, angle, duration])

df[["speed_label", "angle_label", "duration_label"]] = df.apply(label_features, axis=1)

df.to_csv("../data/all_movements_features.csv", index=False)

print("=" * 60)
print("ETİKETLEME TAMAMLANDI")
print("=" * 60)
print(f"Toplam satır: {len(df)}")
print("\nHareket bazlı etiket dağılımı:")
for movement in ["punch", "uppercut", "squat"]:
    sub = df[df["movement"] == movement]
    print(f"\n{movement.upper()}:")
    print(f"  Hız    → good: {(sub['speed_label']=='good').sum()}, low: {(sub['speed_label']=='low').sum()}")
    print(f"  Açı    → correct: {(sub['angle_label']=='correct').sum()}, incorrect: {(sub['angle_label']=='incorrect').sum()}")
    print