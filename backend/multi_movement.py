import pandas as pd
import numpy as np
from openai import OpenAI

import os
from dotenv import load_dotenv
load_dotenv()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

np.random.seed(42)

# 3 farklı hareket tipi için veri üret
def generate_movement(movement_type, scenario, n=5):
    data = []
    for _ in range(n):

        if movement_type == "punch":
            if scenario == "correct":
                speed=np.random.uniform(4.0,5.5); angle=np.random.uniform(0,10); duration=np.random.uniform(300,450); hit=True
            elif scenario == "slow":
                speed=np.random.uniform(1.0,2.5); angle=np.random.uniform(0,10); duration=np.random.uniform(300,450); hit=False
            elif scenario == "wrong_angle":
                speed=np.random.uniform(4.0,5.5); angle=np.random.uniform(25,45); duration=np.random.uniform(300,450); hit=False

        elif movement_type == "squat":
            if scenario == "correct":
                speed=np.random.uniform(2.0,3.0); angle=np.random.uniform(85,95); duration=np.random.uniform(800,1200); hit=True
            elif scenario == "slow":
                speed=np.random.uniform(0.5,1.0); angle=np.random.uniform(85,95); duration=np.random.uniform(800,1200); hit=False
            elif scenario == "wrong_angle":
                speed=np.random.uniform(2.0,3.0); angle=np.random.uniform(50,70); duration=np.random.uniform(800,1200); hit=False

        elif movement_type == "shoulder_rotation":
            if scenario == "correct":
                speed=np.random.uniform(3.0,4.0); angle=np.random.uniform(170,190); duration=np.random.uniform(500,700); hit=True
            elif scenario == "slow":
                speed=np.random.uniform(0.5,1.5); angle=np.random.uniform(170,190); duration=np.random.uniform(500,700); hit=False
            elif scenario == "wrong_angle":
                speed=np.random.uniform(3.0,4.0); angle=np.random.uniform(120,150); duration=np.random.uniform(500,700); hit=False

        data.append({
            "movement": movement_type,
            "scenario": scenario,
            "max_speed": round(speed, 2),
            "angle_deviation": round(angle, 2),
            "duration_ms": round(duration, 1),
            "hit_target": hit
        })
    return data

# Veri üret
all_data = []
for movement in ["punch", "squat", "shoulder_rotation"]:
    for scenario in ["correct", "slow", "wrong_angle"]:
        all_data.extend(generate_movement(movement, scenario))

df = pd.DataFrame(all_data)

# Etiketleme — her hareket için farklı eşikler
def label_features(row):
    if row["movement"] == "punch":
        speed_label    = "good" if row["max_speed"] >= 3.0 else "low"
        angle_label    = "correct" if row["angle_deviation"] <= 15 else "incorrect"
        duration_label = "normal" if row["duration_ms"] >= 250 else "short"
    elif row["movement"] == "squat":
        speed_label    = "good" if row["max_speed"] >= 1.5 else "low"
        angle_label    = "correct" if 80 <= row["angle_deviation"] <= 100 else "incorrect"
        duration_label = "normal" if row["duration_ms"] >= 600 else "short"
    elif row["movement"] == "shoulder_rotation":
        speed_label    = "good" if row["max_speed"] >= 2.0 else "low"
        angle_label    = "correct" if 160 <= row["angle_deviation"] <= 200 else "incorrect"
        duration_label = "normal" if row["duration_ms"] >= 400 else "short"
    return pd.Series([speed_label, angle_label, duration_label])

df[["speed_label","angle_label","duration_label"]] = df.apply(label_features, axis=1)

# LLM geri bildirim üret
def get_problems(row):
    problems = []
    if row["speed_label"] == "low":
        problems.append("speed is too low")
    if row["angle_label"] == "incorrect":
        problems.append("angle is incorrect")
    if row["duration_label"] == "short":
        problems.append("duration is too short")
    if not row["hit_target"]:
        problems.append("target was missed")
    return ", ".join(problems) if problems else "no errors detected"

movement_context = {
    "punch":             "boxing punch",
    "squat":             "squat exercise",
    "shoulder_rotation": "shoulder rotation exercise"
}

def get_feedback(row):
    context  = movement_context[row["movement"]]
    problems = get_problems(row)

    prompt = f"""You are an expert sports coach analyzing a {context} in VR.

Detected problems: {problems}
Speed: {row['speed_label']} | Angle: {row['angle_label']} | Duration: {row['duration_label']}

Respond in this exact format:
PROBLEM: [main issue in one sentence]
FIX: [specific action to fix it]
MOTIVATION: [one encouraging sentence]"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

print("ÇOKLU HAREKET TİPİ ANALİZİ")
print("=" * 70)

samples = df.groupby(["movement","scenario"]).first().reset_index()
results = []

for _, row in samples.iterrows():
    feedback = get_feedback(row)
    results.append({
        "movement": row["movement"],
        "scenario": row["scenario"],
        "speed":    row["speed_label"],
        "angle":    row["angle_label"],
        "duration": row["duration_label"],
        "hit":      row["hit_target"],
        "feedback": feedback
    })
    print(f"\nHAREKET: {row['movement'].upper()} | SENARYO: {row['scenario'].upper()}")
    print(f"Özellikler → Hız: {row['speed_label']} | Açı: {row['angle_label']} | Süre: {row['duration_label']}")
    print(f"LLM Geri Bildirimi:\n{feedback}")
    print("=" * 70)

results_df = pd.DataFrame(results)
results_df.to_csv("multi_movement_results.csv", index=False)
print("\nSonuçlar multi_movement_results.csv dosyasına kaydedildi!")