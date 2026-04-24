import pandas as pd

df = pd.read_csv("feedback_results.csv")

evaluations = {
    "correct":              {"relevance": 5, "accuracy": 5, "clarity": 5},
    "slow":                 {"relevance": 4, "accuracy": 3, "clarity": 5},
    "too_short":            {"relevance": 4, "accuracy": 2, "clarity": 4}, # rele-4 geri bildirim alakalı ama yanlış soruna odaklandı, accu-2 asıl sorun süre kısalığıydı llm açı dedi yanlış teşhis, clarty 4 -anlaşılır ama yanlış bilgi verdi 
    "wrong_angle":          {"relevance": 5, "accuracy": 5, "clarity": 5},
    "slow_and_wrong_angle": {"relevance": 5, "accuracy": 5, "clarity": 5},
    "slow_and_too_short":   {"relevance": 5, "accuracy": 4, "clarity": 5},
    "all_wrong":            {"relevance": 5, "accuracy": 5, "clarity": 5},
}

rows = []
for _, row in df.iterrows():
    s = row["scenario"]
    ev = evaluations[s]
    avg = round((ev["relevance"] + ev["accuracy"] + ev["clarity"]) / 3, 2)
    rows.append({
        "Scenario":  s,
        "Speed":     row["speed"],
        "Angle":     row["angle"],
        "Duration":  row["duration"],
        "Relevance": ev["relevance"],
        "Accuracy":  ev["accuracy"],
        "Clarity":   ev["clarity"],
        "Average":   avg,
        "Feedback":  row["feedback"]
    })

result_df = pd.DataFrame(rows)
result_df.to_csv("evaluation_table.csv", index=False)

print("=" * 60)
print("DEĞERLENDİRME SONUÇLARI")
print("=" * 60)
print(result_df[["Scenario","Relevance","Accuracy",
                 "Clarity","Average"]].to_string(index=False))
print("=" * 60)
print(f"\nGenel Ortalama: {result_df['Average'].mean():.2f} / 5.00")
print(f"En düşük puan: {result_df['Average'].min():.2f} ({result_df.loc[result_df['Average'].idxmin(), 'Scenario']})")
print(f"En yüksek puan: {result_df['Average'].max():.2f} ({result_df.loc[result_df['Average'].idxmax(), 'Scenario']})")