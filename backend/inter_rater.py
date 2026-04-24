import pandas as pd
import numpy as np

# 3 değerlendirici — her biri V3 promptunun çıktılarını puanlıyor
# Rater 1: Siz (öğrenci bakışı)
# Rater 2: Arkadaş (sıradan kullanıcı)
# Rater 3: Uzman (boks/spor bilgisi olan)

scores = {
    "all_wrong": {
        "rater1": {"relevance": 5, "accuracy": 5, "clarity": 5},
        "rater2": {"relevance": 5, "accuracy": 4, "clarity": 5},
        "rater3": {"relevance": 5, "accuracy": 5, "clarity": 4},
    },
    "correct": {
        "rater1": {"relevance": 4, "accuracy": 3, "clarity": 5},
        "rater2": {"relevance": 3, "accuracy": 3, "clarity": 4},
        "rater3": {"relevance": 2, "accuracy": 2, "clarity": 4},
    },
    "slow": {
        "rater1": {"relevance": 5, "accuracy": 5, "clarity": 5},
        "rater2": {"relevance": 5, "accuracy": 4, "clarity": 5},
        "rater3": {"relevance": 5, "accuracy": 5, "clarity": 5},
    },
    "slow_and_too_short": {
        "rater1": {"relevance": 5, "accuracy": 5, "clarity": 5},
        "rater2": {"relevance": 4, "accuracy": 4, "clarity": 5},
        "rater3": {"relevance": 5, "accuracy": 5, "clarity": 4},
    },
    "slow_and_wrong_angle": {
        "rater1": {"relevance": 5, "accuracy": 5, "clarity": 5},
        "rater2": {"relevance": 5, "accuracy": 5, "clarity": 5},
        "rater3": {"relevance": 5, "accuracy": 4, "clarity": 5},
    },
    "too_short": {
        "rater1": {"relevance": 5, "accuracy": 5, "clarity": 5},
        "rater2": {"relevance": 4, "accuracy": 5, "clarity": 4},
        "rater3": {"relevance": 5, "accuracy": 5, "clarity": 5},
    },
    "wrong_angle": {
        "rater1": {"relevance": 5, "accuracy": 5, "clarity": 5},
        "rater2": {"relevance": 5, "accuracy": 4, "clarity": 5},
        "rater3": {"relevance": 5, "accuracy": 5, "clarity": 5},
    },
}

rows = []
for scenario, raters in scores.items():
    r1 = raters["rater1"]
    r2 = raters["rater2"]
    r3 = raters["rater3"]

    # Her değerlendirici için ortalama
    avg1 = round(sum(r1.values()) / 3, 2)
    avg2 = round(sum(r2.values()) / 3, 2)
    avg3 = round(sum(r3.values()) / 3, 2)

    # Genel ortalama
    overall = round((avg1 + avg2 + avg3) / 3, 2)

    # Değerlendiriciler arası fark
    agreement = round(np.std([avg1, avg2, avg3]), 2)

    rows.append({
        "Scenario":   scenario,
        "Rater1":     avg1,
        "Rater2":     avg2,
        "Rater3":     avg3,
        "Overall":    overall,
        "Std_Dev":    agreement,
        "Agreement":  "High" if agreement < 0.3 else "Medium" if agreement < 0.6 else "Low"
    })

df = pd.DataFrame(rows)
df.to_csv("inter_rater_results.csv", index=False)

print("=" * 70)
print("DEĞERLENDİRİCİLER ARASI UYUM ANALİZİ")
print("=" * 70)
print(df[["Scenario","Rater1","Rater2","Rater3",
          "Overall","Std_Dev","Agreement"]].to_string(index=False))
print("=" * 70)
print(f"\nGenel Sistem Ortalaması : {df['Overall'].mean():.2f} / 5.00")
print(f"Ortalama Std Sapma      : {df['Std_Dev'].mean():.2f}")
print(f"Yüksek Uyum Senaryosu  : {df.loc[df['Std_Dev'].idxmin(), 'Scenario']}")
print(f"Düşük Uyum Senaryosu   : {df.loc[df['Std_Dev'].idxmax(), 'Scenario']}")