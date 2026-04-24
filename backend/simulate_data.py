import pandas as pd
import numpy as np

np.random.seed(42)

def generate_movement(movement_type, scenario, n=15):
    data = []
    for _ in range(n):

        if movement_type == "punch":
            if scenario == "correct":
                speed    = np.random.uniform(4.0, 5.5)
                angle    = np.random.uniform(0, 10)
                duration = np.random.uniform(300, 450)
                hit      = True
            elif scenario == "slow":
                speed    = np.random.uniform(1.0, 2.5)
                angle    = np.random.uniform(0, 10)
                duration = np.random.uniform(300, 450)
                hit      = False
            elif scenario == "wrong_angle":
                speed    = np.random.uniform(4.0, 5.5)
                angle    = np.random.uniform(25, 45)
                duration = np.random.uniform(300, 450)
                hit      = False
            elif scenario == "too_short":
                speed    = np.random.uniform(4.0, 5.5)
                angle    = np.random.uniform(0, 10)
                duration = np.random.uniform(100, 200)
                hit      = False
            elif scenario == "slow_and_wrong_angle":
                speed    = np.random.uniform(1.0, 2.5)
                angle    = np.random.uniform(25, 45)
                duration = np.random.uniform(300, 450)
                hit      = False
            elif scenario == "slow_and_too_short":
                speed    = np.random.uniform(1.0, 2.5)
                angle    = np.random.uniform(0, 10)
                duration = np.random.uniform(100, 200)
                hit      = False
            elif scenario == "all_wrong":
                speed    = np.random.uniform(1.0, 2.5)
                angle    = np.random.uniform(25, 45)
                duration = np.random.uniform(100, 200)
                hit      = False

        elif movement_type == "uppercut":
            if scenario == "correct":
                speed    = np.random.uniform(3.0, 4.5)
                angle    = np.random.uniform(35, 65)
                duration = np.random.uniform(180, 320)
                hit      = True
            elif scenario == "slow":
                speed    = np.random.uniform(0.5, 1.8)
                angle    = np.random.uniform(35, 65)
                duration = np.random.uniform(180, 320)
                hit      = False
            elif scenario == "wrong_angle":
                speed    = np.random.uniform(3.0, 4.5)
                angle    = np.random.uniform(80, 105)
                duration = np.random.uniform(180, 320)
                hit      = False
            elif scenario == "too_short":
                speed    = np.random.uniform(3.0, 4.5)
                angle    = np.random.uniform(35, 65)
                duration = np.random.uniform(50, 120)
                hit      = False
            elif scenario == "slow_and_wrong_angle":
                speed    = np.random.uniform(0.5, 1.8)
                angle    = np.random.uniform(80, 105)
                duration = np.random.uniform(180, 320)
                hit      = False
            elif scenario == "slow_and_too_short":
                speed    = np.random.uniform(0.5, 1.8)
                angle    = np.random.uniform(35, 65)
                duration = np.random.uniform(50, 120)
                hit      = False
            elif scenario == "all_wrong":
                speed    = np.random.uniform(0.5, 1.8)
                angle    = np.random.uniform(80, 105)
                duration = np.random.uniform(50, 120)
                hit      = False

        elif movement_type == "squat":
            if scenario == "correct":
                speed    = np.random.uniform(2.0, 3.0)
                angle    = np.random.uniform(82, 98)
                duration = np.random.uniform(800, 1200)
                hit      = True
            elif scenario == "slow":
                speed    = np.random.uniform(0.5, 1.2)
                angle    = np.random.uniform(82, 98)
                duration = np.random.uniform(800, 1200)
                hit      = False
            elif scenario == "wrong_angle":
                speed    = np.random.uniform(2.0, 3.0)
                angle    = np.random.uniform(50, 72)
                duration = np.random.uniform(800, 1200)
                hit      = False
            elif scenario == "too_short":
                speed    = np.random.uniform(2.0, 3.0)
                angle    = np.random.uniform(82, 98)
                duration = np.random.uniform(300, 500)
                hit      = False
            elif scenario == "slow_and_wrong_angle":
                speed    = np.random.uniform(0.5, 1.2)
                angle    = np.random.uniform(50, 72)
                duration = np.random.uniform(800, 1200)
                hit      = False
            elif scenario == "slow_and_too_short":
                speed    = np.random.uniform(0.5, 1.2)
                angle    = np.random.uniform(82, 98)
                duration = np.random.uniform(300, 500)
                hit      = False
            elif scenario == "all_wrong":
                speed    = np.random.uniform(0.5, 1.2)
                angle    = np.random.uniform(50, 72)
                duration = np.random.uniform(300, 500)
                hit      = False

        data.append({
            "movement":        movement_type,
            "scenario":        scenario,
            "max_speed":       round(speed, 2),
            "angle_deviation": round(angle, 2),
            "duration_ms":     round(duration, 1),
            "hit_target":      hit
        })
    return data

# Tüm hareketler ve senaryolar
MOVEMENTS = ["punch", "uppercut", "squat"]
SCENARIOS = [
    "correct",
    "slow",
    "wrong_angle",
    "too_short",
    "slow_and_wrong_angle",
    "slow_and_too_short",
    "all_wrong"
]

all_data = []
for movement in MOVEMENTS:
    for scenario in SCENARIOS:
        all_data.extend(generate_movement(movement, scenario))

df = pd.DataFrame(all_data)
df.to_csv("../data/all_movements_data.csv", index=False)

print("=" * 60)
print("VERİ ÜRETİMİ TAMAMLANDI")
print("=" * 60)
print(f"Toplam satır: {len(df)}")
print(f"Hareket sayısı: {df['movement'].nunique()}")
print(f"Senaryo sayısı: {df['scenario'].nunique()}")
print("\nHareket × Senaryo dağılımı:")
print(df.groupby(["movement", "scenario"])["scenario"].count().to_string())
print("=" * 60)
print("\nDosya kaydedildi: data/all_movements_data.csv")