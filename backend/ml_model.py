import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import pickle

df = pd.read_csv("../data/all_movements_features.csv")

# Sayısallaştır
df["speed_num"]    = df["speed_label"].map({"low": 0, "good": 1})
df["angle_num"]    = df["angle_label"].map({"incorrect": 0, "correct": 1})
df["duration_num"] = df["duration_label"].map({"short": 0, "normal": 1})
df["hit_num"]      = df["hit_target"].map({False: 0, True: 1})
df["movement_num"] = df["movement"].map({"punch": 0, "uppercut": 1, "squat": 2})

X = df[["movement_num", "speed_num", "angle_num", "duration_num", "hit_num"]]
y = df["scenario"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("=" * 60)
print("RANDOM FOREST — 3 HAREKET TİPİ")
print("=" * 60)
print(f"\nEğitim seti: {len(X_train)} örnek")
print(f"Test seti  : {len(X_test)} örnek")
print(f"\nDoğruluk (Accuracy): {accuracy_score(y_test, y_pred):.2%}\n")
print("Detaylı Rapor:")
print(classification_report(y_test, y_pred))

print("=" * 60)
print("ÖZELLİK ÖNEMLERİ:")
features = ["movement", "speed", "angle", "duration", "hit"]
for feat, imp in zip(features, model.feature_importances_):
    bar = "█" * int(imp * 50)
    print(f"  {feat:10} → {imp:.2%}  {bar}")

# Hareket bazlı doğruluk
print("\n" + "=" * 60)
print("HAREKET BAZLI DOĞRULUK:")
for movement in ["punch", "uppercut", "squat"]:
    mov_num = {"punch": 0, "uppercut": 1, "squat": 2}[movement]
    mask    = X_test["movement_num"] == mov_num
    if mask.sum() > 0:
        acc = accuracy_score(y_test[mask], y_pred[mask])
        print(f"  {movement:10} → {acc:.2%} ({mask.sum()} test örneği)")

print("=" * 60)

#kaydet
with open("../models/rf_model.pkl", "wb") as f:
    pickle.dump(model, f)
print("\nModel kaydedildi: models/rf_model.pkl")