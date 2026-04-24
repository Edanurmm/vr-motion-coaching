from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import pandas as pd
import pickle
import numpy as np
import os

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Yolları ayarla
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR   = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ML modelini yükle
with open(os.path.join(MODELS_DIR, "rf_model.pkl"), "rb") as f:
    model = pickle.load(f)

# Veri setini yükle
DATA_PATH = os.path.join(DATA_DIR, "all_movements_features.csv")

def get_problems(speed, angle, duration, hit):
    problems = []
    if speed == "low":
        problems.append("speed is too low")
    if angle == "incorrect":
        problems.append("angle is incorrect")
    if duration == "short":
        problems.append("duration is too short")
    if not hit:
        problems.append("target was missed")
    return ", ".join(problems) if problems else "no errors detected"

def get_llm_feedback(movement, speed, angle, duration, hit):
    problems = get_problems(speed, angle, duration, hit)
    movement_context = {
    "punch":    "boxing jab/cross punch",
    "uppercut": "boxing uppercut punch",
    "squat":    "squat exercise",
}
    context = movement_context.get(movement, "movement")

    prompt = f"""You are an expert sports coach analyzing a {context} in VR.

Detected problems: {problems}
Speed: {speed} | Angle: {angle} | Duration: {duration}

Respond in this exact format:
PROBLEM: [main issue in one sentence]
FIX: [specific action to fix it]
MOTIVATION: [one encouraging sentence]"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

def label_features(movement, speed_val, angle_val, duration_val):
    if movement == "punch":
        speed    = "good" if speed_val >= 3.0 else "low"
        angle    = "correct" if angle_val <= 15 else "incorrect"
        duration = "normal" if duration_val >= 250 else "short"
    elif movement == "uppercut":
        speed    = "good" if speed_val >= 2.5 else "low"
        angle    = "correct" if 30 <= angle_val <= 70 else "incorrect"
        duration = "normal" if duration_val >= 150 else "short"
    elif movement == "squat":
        speed    = "good" if speed_val >= 1.5 else "low"
        angle    = "correct" if 80 <= angle_val <= 100 else "incorrect"
        duration = "normal" if duration_val >= 600 else "short"
    else:
        speed = angle = duration = "unknown"
    return speed, angle, duration

@app.route("/analyze", methods=["POST"])
def analyze():
    data         = request.json
    movement     = data.get("movement", "punch")
    speed_val    = float(data.get("speed", 3.0))
    angle_val    = float(data.get("angle", 10.0))
    duration_val = float(data.get("duration", 300.0))

    speed, angle, duration = label_features(
        movement, speed_val, angle_val, duration_val
    )

    speed_num    = 1 if speed == "good" else 0
    angle_num    = 1 if angle == "correct" else 0
    duration_num = 1 if duration == "normal" else 0
    hit_num      = 1 if (speed_num and angle_num and duration_num) else 0

    #değişiklik yaptım modele 5. bir özellik eklendi
    movement_num = {"punch": 0, "uppercut": 1, "squat": 2}.get(movement, 0)
    X = np.array([[movement_num, speed_num, angle_num, duration_num, hit_num]])
    prediction = model.predict(X)[0]
    hit        = bool(hit_num)

    feedback = get_llm_feedback(movement, speed, angle, duration, hit)

    lines      = feedback.strip().split("\n")
    problem    = next((l.replace("PROBLEM:","").strip() for l in lines if l.startswith("PROBLEM:")), "")
    fix        = next((l.replace("FIX:","").strip() for l in lines if l.startswith("FIX:")), "")
    motivation = next((l.replace("MOTIVATION:","").strip() for l in lines if l.startswith("MOTIVATION:")), "")

    return jsonify({
        "movement": movement,
        "labels": {
            "speed":    speed,
            "angle":    angle,
            "duration": duration,
            "hit":      hit
        },
        "ml_prediction": prediction,
        "feedback": {
            "problem":    problem,
            "fix":        fix,
            "motivation": motivation,
            "raw":        feedback
        }
    })

@app.route("/results", methods=["GET"])
def results():
    try:
        df = pd.read_csv(os.path.join(DATA_DIR, "evaluation_table.csv"))
        return jsonify(df.to_dict(orient="records"))
    except:
        return jsonify([])

@app.route("/prompt_comparison", methods=["GET"])
def prompt_comparison():
    try:
        df = pd.read_csv(os.path.join(DATA_DIR, "prompt_comparison.csv"))
        return jsonify(df.to_dict(orient="records"))
    except:
        return jsonify([])

@app.route("/inter_rater", methods=["GET"])
def inter_rater():
    try:
        df = pd.read_csv(os.path.join(DATA_DIR, "inter_rater_results.csv"))
        return jsonify(df.to_dict(orient="records"))
    except:
        return jsonify([])
    
@app.route("/prompt_comparison_all", methods=["GET"])
def prompt_comparison_all():
    try:
        movement = request.args.get("movement", "punch")
        scenario = request.args.get("scenario", "slow")
        df = pd.read_csv(os.path.join(DATA_DIR, "prompt_comparison_all.csv"))
        filtered = df[(df["movement"] == movement) & (df["scenario"] == scenario)]
        if filtered.empty:
            return jsonify({"error": "Not found"}), 404
        row = filtered.iloc[0]
        return jsonify({
            "movement": row["movement"],
            "scenario": row["scenario"],
            "speed":    row["speed"],
            "angle":    row["angle"],
            "duration": row["duration"],
            "v1": row["prompt_v1"],
            "v2": row["prompt_v2"],
            "v3": row["prompt_v3"],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
#değişiklik llm çıktılarını backende ekledik 
@app.route("/language_comparison_all", methods=["GET"])
def language_comparison_all():
    try:
        movement = request.args.get("movement", "punch")
        scenario = request.args.get("scenario", "slow")
        df = pd.read_csv(os.path.join(DATA_DIR, "language_comparison_all.csv"))
        filtered = df[(df["movement"] == movement) & (df["scenario"] == scenario)]
        if filtered.empty:
            return jsonify({"error": "Not found"}), 404
        row = filtered.iloc[0]
        return jsonify({
            "movement":  row["movement"],
            "scenario":  row["scenario"],
            "output_en": row["output_en"],
            "output_tr": row["output_tr"],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500    

if __name__ == "__main__":
    app.run(debug=True, port=5000)