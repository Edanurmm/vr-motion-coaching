import pandas as pd
from openai import OpenAI

import os
from dotenv import load_dotenv
load_dotenv()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY")) 

df = pd.read_csv("../data/all_movements_features.csv")

MOVEMENT_CONTEXT_EN = {
    "punch":    "boxing jab/cross punch",
    "uppercut": "boxing uppercut punch",
    "squat":    "squat exercise"
}

MOVEMENT_CONTEXT_TR = {
    "punch":    "boks yumruğu (jab/cross)",
    "uppercut": "boks uppercutu",
    "squat":    "squat egzersizi"
}

def get_problems_en(row):
    problems = []
    if row["speed_label"] == "low":        problems.append("speed is too low")
    if row["angle_label"] == "incorrect":  problems.append("angle is incorrect")
    if row["duration_label"] == "short":   problems.append("duration is too short")
    if not row["hit_target"]:              problems.append("target was missed")
    return ", ".join(problems) if problems else "no errors detected"

def get_problems_tr(row):
    problems = []
    if row["speed_label"] == "low":        problems.append("hız çok düşük")
    if row["angle_label"] == "incorrect":  problems.append("açı yanlış")
    if row["duration_label"] == "short":   problems.append("hareket süresi çok kısa")
    if not row["hit_target"]:              problems.append("hedef ıskalandı")
    return ", ".join(problems) if problems else "hata tespit edilmedi"

def prompt_en(row):
    context  = MOVEMENT_CONTEXT_EN[row["movement"]]
    problems = get_problems_en(row)
    return f"""You are an expert {context} coach. Analyze this VR movement and give feedback.
Problems detected: {problems}
Speed: {row['speed_label']} | Angle: {row['angle_label']} | Duration: {row['duration_label']}

Respond in this exact format:
PROBLEM: [main issue in one sentence]
FIX: [specific action to fix it]
MOTIVATION: [one encouraging sentence]"""

def prompt_tr(row):
    context  = MOVEMENT_CONTEXT_TR[row["movement"]]
    problems = get_problems_tr(row)
    return f"""Sen bir uzman {context} antrenörüsün. VR ortamındaki hareketi analiz et.
Tespit edilen sorunlar: {problems}
Hız: {row['speed_label']} | Açı: {row['angle_label']} | Süre: {row['duration_label']}

Tam olarak şu formatta yanıt ver:
SORUN: [ana sorunu tek cümlede belirt]
DÜZELTME: [sorunu düzeltmek için somut öneri]
MOTİVASYON: [cesaretlendirici bir cümle]"""

def get_llm(prompt):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

samples = df.groupby(["movement", "scenario"]).first().reset_index()

print("TÜRKÇE vs İNGİLİZCE — 3 HAREKET × 7 SENARYO")
print("=" * 70)

results = []
for _, row in samples.iterrows():
    print(f"\n{row['movement'].upper()} | {row['scenario'].upper()}")

    en_out = get_llm(prompt_en(row))
    tr_out = get_llm(prompt_tr(row))

    results.append({
        "movement": row["movement"],
        "scenario": row["scenario"],
        "speed":    row["speed_label"],
        "angle":    row["angle_label"],
        "duration": row["duration_label"],
        "hit":      row["hit_target"],
        "output_en": en_out,
        "output_tr": tr_out,
    })

    print(f"EN: {en_out[:80]}...")
    print(f"TR: {tr_out[:80]}...")
    print("-" * 70)

results_df = pd.DataFrame(results)
results_df.to_csv("../data/language_comparison_all.csv", index=False)
print("\nSonuçlar kaydedildi: data/language_comparison_all.csv")