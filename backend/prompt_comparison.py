import pandas as pd
from openai import OpenAI

import os
from dotenv import load_dotenv
load_dotenv()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

df = pd.read_csv("../data/all_movements_features.csv")

MOVEMENT_CONTEXT = {
    "punch":    "boxing jab/cross punch",
    "uppercut": "boxing uppercut punch",
    "squat":    "squat exercise"
}

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

def prompt_v1(row):
    context = MOVEMENT_CONTEXT[row["movement"]]
    return f"""You are a {context} coach.
Movement: Speed={row['speed_label']}, Angle={row['angle_label']}, Duration={row['duration_label']}, Hit={row['hit_target']}
Give 2-3 sentences of coaching feedback."""

def prompt_v2(row):
    context  = MOVEMENT_CONTEXT[row["movement"]]
    problems = get_problems(row)
    return f"""You are an expert {context} coach analyzing a VR movement.
Detected problems: {problems}
Movement data: Speed={row['speed_label']}, Angle={row['angle_label']}, Duration={row['duration_label']}

Focus ONLY on the detected problems above.
Give specific, actionable feedback in 2-3 sentences."""

def prompt_v3(row):
    context  = MOVEMENT_CONTEXT[row["movement"]]
    problems = get_problems(row)
    return f"""You are an expert {context} coach. Analyze this VR movement and give feedback.
Problems detected: {problems}
Speed: {row['speed_label']} | Angle: {row['angle_label']} | Duration: {row['duration_label']} | Hit: {row['hit_target']}

Respond in this exact format:
PROBLEM: [main issue in one sentence]
FIX: [specific action to fix it]
MOTIVATION: [one encouraging sentence]"""

def get_llm(prompt):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

# Her hareketten her senaryodan 1 örnek al
samples = df.groupby(["movement", "scenario"]).first().reset_index()

print("PROMPT KARŞILAŞTIRMASI — 3 HAREKET × 7 SENARYO")
print("=" * 70)

results = []
for _, row in samples.iterrows():
    print(f"\n{row['movement'].upper()} | {row['scenario'].upper()}")

    p1 = get_llm(prompt_v1(row))
    p2 = get_llm(prompt_v2(row))
    p3 = get_llm(prompt_v3(row))

    results.append({
        "movement": row["movement"],
        "scenario": row["scenario"],
        "speed":    row["speed_label"],
        "angle":    row["angle_label"],
        "duration": row["duration_label"],
        "hit":      row["hit_target"],
        "prompt_v1": p1,
        "prompt_v2": p2,
        "prompt_v3": p3,
    })

    print(f"V1: {p1[:80]}...")
    print(f"V2: {p2[:80]}...")
    print(f"V3: {p3[:80]}...")
    print("-" * 70)

results_df = pd.DataFrame(results)
results_df.to_csv("../data/prompt_comparison_all.csv", index=False)
print("\nSonuçlar kaydedildi: data/prompt_comparison_all.csv")