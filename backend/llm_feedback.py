import pandas as pd
from openai import OpenAI

import os
from dotenv import load_dotenv
load_dotenv()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

df = pd.read_csv("punch_features.csv")

samples = df.groupby("scenario").first().reset_index()

def get_feedback(row):
    prompt = f"""You are an expert boxing coach analyzing a punch movement in VR.

Movement data:
- Speed: {row['speed_label']}
- Angle: {row['angle_label']}
- Duration: {row['duration_label']}
- Hit target: {row['hit_target']}

Give specific, actionable coaching feedback in 2-3 sentences.
Be encouraging but precise. Focus on what needs improvement."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

print("LLM Geri Bildirimleri Üretiliyor...\n")
print("=" * 60)

results = []
for _, row in samples.iterrows():
    feedback = get_feedback(row)
    results.append({
        "scenario": row["scenario"],
        "speed": row["speed_label"],
        "angle": row["angle_label"],
        "duration": row["duration_label"],
        "hit": row["hit_target"],
        "feedback": feedback
    })
    print(f"SENARYO: {row['scenario'].upper()}")
    print(f"Özellikler → Hız: {row['speed_label']} | Açı: {row['angle_label']} | Süre: {row['duration_label']}")
    print(f"LLM Geri Bildirimi:\n{feedback}")
    print("=" * 60)

results_df = pd.DataFrame(results)
results_df.to_csv("feedback_results.csv", index=False)
print("\nSonuçlar feedback_results.csv dosyasına kaydedildi!")




