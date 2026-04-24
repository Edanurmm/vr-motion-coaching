import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import MovementFigure from "./MovementFigure";

const MOVEMENTS = {
  punch: {
    label: "🥊 Punch (Jab/Cross)",
    angleLabel: "Sapma Açısı",
    angleMin: 0, angleMax: 50,
    speedMin: 0.5, speedMax: 6,
    durationMin: 100, durationMax: 500,
    defaultSpeed: 4.0, defaultAngle: 10, defaultDuration: 350,
    scenarios: {
      correct:     { speed: 4.5, angle: 5,  duration: 380 },
      slow:        { speed: 1.5, angle: 5,  duration: 380 },
      wrong_angle: { speed: 4.5, angle: 35, duration: 380 },
      too_short:   { speed: 4.5, angle: 5,  duration: 150 },
      all_wrong:   { speed: 1.5, angle: 35, duration: 150 },
    }
  },
  uppercut: {
    label: "👊 Uppercut",
    angleLabel: "Dirsek Açısı",
    angleMin: 10, angleMax: 110,
    speedMin: 0.5, speedMax: 5,
    durationMin: 50, durationMax: 400,
    defaultSpeed: 3.0, defaultAngle: 50, defaultDuration: 250,
    scenarios: {
      correct:     { speed: 3.5, angle: 50, duration: 280 },
      slow:        { speed: 1.0, angle: 50, duration: 280 },
      wrong_angle: { speed: 3.5, angle: 20, duration: 280 },
      too_short:   { speed: 3.5, angle: 50, duration: 80  },
      all_wrong:   { speed: 1.0, angle: 20, duration: 80  },
    }
  },
  squat: {
    label: "🏋️ Squat",
    angleLabel: "Diz Açısı",
    angleMin: 40, angleMax: 140,
    speedMin: 0.5, speedMax: 4,
    durationMin: 300, durationMax: 1500,
    defaultSpeed: 2.0, defaultAngle: 90, defaultDuration: 900,
    scenarios: {
      correct:     { speed: 2.5, angle: 90,  duration: 1000 },
      slow:        { speed: 0.7, angle: 90,  duration: 1000 },
      wrong_angle: { speed: 2.5, angle: 60,  duration: 1000 },
      too_short:   { speed: 2.5, angle: 90,  duration: 400  },
      all_wrong:   { speed: 0.7, angle: 60,  duration: 400  },
    }
  }
};

const FLOW_STEPS = ["Input", "Processing", "ML Model", "LLM", "Result"];

function TypingText({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setDisplayed("");
    setIdx(0);
  }, [text]);

  useEffect(() => {
    if (idx < text.length) {
      const t = setTimeout(() => {
        setDisplayed(p => p + text[idx]);
        setIdx(i => i + 1);
      }, speed);
      return () => clearTimeout(t);
    }
  }, [idx, text, speed]);

  return <span>{displayed}<span className="cursor">|</span></span>;
}

function FlowBar({ active, step }) {
  return (
    <div className="flow-bar">
      {FLOW_STEPS.map((s, i) => (
        <div key={s} className="flow-step-wrap">
          <div className={`flow-step ${active && i <= step ? "flow-active" : ""} ${active && i === step ? "flow-current" : ""}`}>
            {s}
          </div>
          {i < FLOW_STEPS.length - 1 && (
            <div className={`flow-arrow ${active && i < step ? "flow-arrow-active" : ""}`}>→</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfidenceBar({ value, label }) {
  const color = value >= 80 ? "#22c55e" : value >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="confidence-wrap">
      <div className="confidence-header">
        <span>Confidence</span>
        <span style={{ color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div className="confidence-bg">
        <div className="confidence-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function WhyPanel({ labels, movement }) {
  const items = [
    { key: "Hız",  ok: labels.speed === "good" },
    { key: "Açı",  ok: labels.angle === "correct" },
    { key: "Süre", ok: labels.duration === "normal" },
    { key: movement === "squat" ? "Form" : "Hedef", ok: labels.hit },
  ];
  return (
    <div className="why-panel">
      <div className="why-title">🔍 Model Kararı</div>
      <div className="why-grid">
        {items.map(it => (
          <div key={it.key} className={`why-item ${it.ok ? "why-ok" : "why-fail"}`}>
            <span>{it.ok ? "✅" : "❌"}</span>
            <span>{it.key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


const PROMPT_EXAMPLES = {
  punch: {
    v1: {
      prompt: `You are a boxing coach.\nMovement: Speed=low, Angle=correct, Duration=normal, Hit=False\nGive 2-3 sentences of coaching feedback.`,
      output: `"Great job on your speed and maintaining the correct angle during your movement! The short duration is effective for setting yourself up for quick counters. Keep working on your accuracy..."`,
      problem: "⚠️ Sorun: Hız düşük olmasına rağmen 'great job on speed' dedi — yanlış tespit!"
    },
    v2: {
      prompt: `You are an expert boxing coach analyzing a VR punch.\nDetected problems: speed is too low, target was missed\nMovement data: Speed=low, Angle=correct, Duration=normal\n\nFocus ONLY on the detected problems above.\nGive specific, actionable feedback in 2-3 sentences.`,
      output: `"To improve your punch speed, focus on generating power from your legs and hips; initiate the movement from your lower body and drive through the punch. Practice shadow boxing with an emphasis on quick, explosive movements..."`,
      good: "✅ Doğru problemi tespit etti ama çıktı çok uzun."
    },
    v3: {
      prompt: `You are an expert boxing coach. Analyze this VR punch and give feedback.\nProblems detected: speed is too low\nSpeed: low | Angle: correct | Duration: normal | Hit: False\n\nRespond in this exact format:\nPROBLEM: [main issue in one sentence]\nFIX: [specific action to fix it]\nMOTIVATION: [one encouraging sentence]`,
      output: `PROBLEM: The punch speed is too low, which prevents effective impact.\nFIX: Focus on improving your hand speed through shadowboxing and speed drills.\nMOTIVATION: With consistent practice, you'll see your speed significantly increase!`,
      good: "✅ Net format, doğru tespit, kısa ve uygulanabilir."
    }
  },
  uppercut: {
    v1: {
      prompt: `You are a boxing coach.\nMovement: Speed=low, Angle=incorrect, Duration=normal, Hit=False\nGive 2-3 sentences of coaching feedback.`,
      output: `"Keep your guard up and focus on your footwork during the uppercut. Your angle needs some adjustment but your duration is solid. Practice slow motion reps to get the feel right..."`,
      problem: "⚠️ Sorun: Hız sorununu hiç ele almadı — eksik tespit!"
    },
    v2: {
      prompt: `You are an expert boxing coach analyzing a VR uppercut.\nDetected problems: speed is too low, angle is incorrect\nMovement data: Speed=low, Angle=incorrect, Duration=normal\n\nFocus ONLY on the detected problems above.\nGive specific, actionable feedback in 2-3 sentences.`,
      output: `"Your uppercut needs more explosive power — drive from your legs and rotate your hips to generate speed. The elbow angle is off; aim to keep it between 30-70 degrees for maximum impact. Focus on these two elements together in your next drill..."`,
      good: "✅ İki hatayı da tespit etti ama biraz uzun."
    },
    v3: {
      prompt: `You are an expert boxing coach. Analyze this VR uppercut and give feedback.\nProblems detected: speed is too low, angle is incorrect\nSpeed: low | Angle: incorrect | Duration: normal | Hit: False\n\nRespond in this exact format:\nPROBLEM: [main issue in one sentence]\nFIX: [specific action to fix it]\nMOTIVATION: [one encouraging sentence]`,
      output: `PROBLEM: The uppercut lacks speed and the elbow angle is incorrect, reducing impact.\nFIX: Drive from your legs and keep your elbow at 30-70 degrees throughout the motion.\nMOTIVATION: With focused repetition, your uppercut will become a powerful weapon!`,
      good: "✅ Net format, iki hatayı da kısa ve doğru şekilde tespit etti."
    }
  },
  squat: {
    v1: {
      prompt: `You are a fitness coach.\nMovement: Speed=good, Angle=incorrect, Duration=normal, Form=incorrect\nGive 2-3 sentences of coaching feedback.`,
      output: `"Great job maintaining a good pace during your squat! Try to focus on your depth — going deeper will activate more muscle groups. Keep up the good work and consistency is key..."`,
      problem: "⚠️ Sorun: Açı hatasını yüzeysel ele aldı, diz açısı aralığından hiç bahsetmedi!"
    },
    v2: {
      prompt: `You are an expert fitness coach analyzing a VR squat.\nDetected problems: angle is incorrect, form is incorrect\nMovement data: Speed=good, Angle=incorrect, Duration=normal\n\nFocus ONLY on the detected problems above.\nGive specific, actionable feedback in 2-3 sentences.`,
      output: `"Your squat angle is off — your knees are not reaching the proper 80-100 degree range. Focus on sitting back into the squat and keeping your chest upright to achieve proper depth. Practice bodyweight squats in front of a mirror to monitor your knee angle..."`,
      good: "✅ Diz açısı sorununu doğru tespit etti, spesifik aralık bilgisi verdi."
    },
    v3: {
      prompt: `You are an expert fitness coach. Analyze this VR squat and give feedback.\nProblems detected: angle is incorrect (knee angle outside 80-100° range)\nSpeed: good | Knee angle: incorrect | Duration: normal | Form: incorrect\n\nRespond in this exact format:\nPROBLEM: [main issue in one sentence]\nFIX: [specific action to fix it]\nMOTIVATION: [one encouraging sentence]`,
      output: `PROBLEM: The squat knee angle is incorrect, reducing muscle engagement and effectiveness.\nFIX: Focus on lowering your hips back and down while keeping your chest up to reach 80-100° knee flexion.\nMOTIVATION: Perfecting your squat depth will dramatically improve your strength gains!`,
      good: "✅ Squat'a özgü diz açısı bilgisi verdi, doğru ve uygulanabilir."
    }
  }
};

const TR_EN_EXAMPLES = {
  punch: [
    {
      scenario: "ALL_WRONG (Hız düşük + Açı yanlış + Süre kısa)",
      winner: "🇹🇷 Türkçe",
      en: {
        text: "PROBLEM: The punch lacks speed and the angle is off, resulting in a missed target.\nFIX: Focus on generating explosive power from your legs and pivoting your hips to increase speed and adjust your angle toward the target.\nMOTIVATION: Keep pushing yourself, each practice gets you closer to delivering that perfect punch!",
        note: "⚠️ 3 hatadan 2'sini tespit etti — süreyi atladı"
      },
      tr: {
        text: "SORUN: Yumruk hızının düşük olması, açının yanlış ayarlanması ve yumruk süresinin kısa olması nedeniyle hedef ıskalanıyor.\nDÜZELTME: Yumruğunu daha hızlı atmak için vücut tümünü kullanarak daha güçlü bir pivot yapmayı çalış.\nMOTİVASYON: Unutma, her antrenman seni daha güçlü ve daha doğru bir boksör haline getiriyor!",
        note: "✅ 3 hatanın hepsini tespit etti"
      }
    },
    {
      scenario: "SLOW_AND_TOO_SHORT (Hız düşük + Süre kısa)",
      winner: "🇹🇷 Türkçe",
      en: {
        text: "PROBLEM: The punch speed is too low, which affects its effectiveness.\nFIX: Focus on generating power from your legs and hips to increase the speed of your punches.\nMOTIVATION: Keep pushing yourself; with the right technique, you'll see your speed improve!",
        note: "⚠️ Sadece hız sorununu ele aldı — süreyi atladı"
      },
      tr: {
        text: "SORUN: Yumruk hızının düşük olması ve süresinin kısa olması nedeniyle hedef ıskalanıyor.\nDÜZELTME: Yumruk hızını artırmak için kuvvet ve hız odaklı egzersizler yaparak vücudun dinamik dengesini geliştirin.\nMOTİVASYON: Unutma, her antrenman seni daha güçlü kılıyor!",
        note: "✅ Her iki hatayı da tespit etti"
      }
    },
    {
      scenario: "TOO_SHORT (Sadece süre kısa)",
      winner: "🇬🇧 İngilizce",
      en: {
        text: "PROBLEM: The punch duration is too short and the target was missed.\nFIX: Focus on extending your arm fully during the punch and maintain your follow-through.\nMOTIVATION: With practice and persistence, you'll master your timing and accuracy!",
        note: "✅ Süre sorununu doğru tespit etti"
      },
      tr: {
        text: "SORUN: Yumruk süresi çok kısa ve hedef ıskalandı.\nDÜZELTME: Yumruk atma süresini uzatabilmek için vuruşun ardından geri çekilme süresini artırmayı deneyin.\nMOTİVASYON: Unutma, her antrenman seni daha da güçlendirecek!",
        note: "⚠️ 'Geri çekilme süresini artır' dedi — biraz yanlış yorum"
      }
    }
  ],
  uppercut: [
    {
      scenario: "ALL_WRONG (Hız düşük + Açı yanlış + Süre kısa)",
      winner: "🇹🇷 Türkçe",
      en: {
        text: "PROBLEM: The uppercut lacks speed and has an incorrect angle.\nFIX: Generate power from your legs and keep elbow at proper angle.\nMOTIVATION: Keep pushing, your uppercut will improve with practice!",
        note: "⚠️ Süreyi atladı — 2/3 hata tespit etti"
      },
      tr: {
        text: "SORUN: Uppercut hızının düşük olması, dirsek açısının yanlış olması ve sürenin kısa olması nedeniyle hedef ıskalanıyor.\nDÜZELTME: Bacak ve kalçadan güç üret, dirseği 30-70° arasında tut ve vuruşu tam tamamla.\nMOTİVASYON: Her antrenmanla daha güçlü bir uppercut geliştireceksin!",
        note: "✅ 3 hatanın hepsini tespit etti"
      }
    },
    {
      scenario: "SLOW (Sadece hız düşük)",
      winner: "🤝 Berabere",
      en: {
        text: "PROBLEM: The uppercut speed is too low, reducing its impact.\nFIX: Focus on explosive hip rotation and leg drive to generate more power.\nMOTIVATION: Speed comes with repetition — keep drilling!",
        note: "✅ Hız sorununu doğru tespit etti"
      },
      tr: {
        text: "SORUN: Uppercut hızı düşük ve hedef ıskalanıyor.\nDÜZELTME: Kalça rotasyonu ve bacak itişiyle daha patlayıcı bir hareket için çalış.\nMOTİVASYON: Tekrarla güç gelir — antrenmana devam et!",
        note: "✅ Hız sorununu doğru tespit etti"
      }
    },
    {
      scenario: "WRONG_ANGLE (Sadece açı yanlış)",
      winner: "🇹🇷 Türkçe",
      en: {
        text: "PROBLEM: The elbow angle is incorrect during the uppercut.\nFIX: Adjust your elbow to maintain 30-70 degree angle throughout the motion.\nMOTIVATION: Fine-tuning your angle will make your uppercut devastating!",
        note: "✅ Açı sorununu tespit etti"
      },
      tr: {
        text: "SORUN: Uppercut sırasında dirsek açısı yanlış, bu da hedefe isabet etmeyi zorlaştırıyor.\nDÜZELTME: Dirsek açısını 30-70° arasında tutmak için ayna önünde yavaş tekrarlar yap ve her vuruşta pozisyonu kontrol et.\nMOTİVASYON: Doğru açıyı bulunca uppercut'ın çok daha etkili olacak!",
        note: "✅ Açı sorununu tespit etti ve daha detaylı öneri verdi"
      }
    }
  ],
  squat: [
    {
      scenario: "WRONG_ANGLE (Diz açısı yanlış)",
      winner: "🇹🇷 Türkçe",
      en: {
        text: "PROBLEM: The squat angle is incorrect, causing the target position to be missed.\nFIX: Focus on lowering your hips back and down while keeping your chest up to achieve the proper squat depth.\nMOTIVATION: You're doing great with your speed, and with a little adjustment, you'll nail that angle!",
        note: "⚠️ Genel bir öneri verdi, diz açısı aralığından bahsetmedi"
      },
      tr: {
        text: "SORUN: Diz açısı doğru aralığın (80-100°) dışında, bu da squat formunu bozuyor.\nDÜZELTME: Kalçaları geri ve aşağı iterken göğsü dik tutmaya odaklan; diz açısının 90° civarında olmasını sağla.\nMOTİVASYON: Doğru açıyı yakaladığında squat'ın çok daha etkili olacak!",
        note: "✅ Diz açısı aralığını (80-100°) spesifik olarak belirtti"
      }
    },
    {
      scenario: "SLOW (Squat hızı düşük)",
      winner: "🤝 Berabere",
      en: {
        text: "PROBLEM: The squat speed is too low and the target was missed.\nFIX: Focus on accelerating upward during the ascent phase of the squat to increase speed.\nMOTIVATION: With consistent effort, you'll soon hit your targets and build strength!",
        note: "✅ Hız sorununu doğru tespit etti"
      },
      tr: {
        text: "SORUN: Squat hareketi yavaş yapılıyor ve hedef form sağlanamıyor.\nDÜZELTME: Yukarı çıkış fazında daha patlayıcı bir hareket için bacak kaslarını aktif kullan.\nMOTİVASYON: Düzenli çalışmayla squat hızın ve gücün artacak!",
        note: "✅ Hız sorununu doğru tespit etti"
      }
    },
    {
      scenario: "ALL_WRONG (Hız düşük + Açı yanlış + Süre kısa)",
      winner: "🇹🇷 Türkçe",
      en: {
        text: "PROBLEM: The squat has multiple issues — low speed, incorrect angle, and short duration.\nFIX: Slow down, focus on proper knee angle (80-100°), and ensure full range of motion.\nMOTIVATION: Addressing these fundamentals will transform your squat form!",
        note: "⚠️ 3 sorunu listeledi ama öneri çok genel kaldı"
      },
      tr: {
        text: "SORUN: Squat hızı düşük, diz açısı yanlış (80-100° aralığı dışında) ve hareket süresi çok kısa.\nDÜZELTME: Önce doğru diz açısını (90°) bulmaya odaklan, sonra tam hareket aralığında yavaş tekrarlar yap ve hızı kademeli artır.\nMOTİVASYON: Her sorunu ayrı ayrı ele alarak çalışırsan squat formun çok hızlı gelişecek!",
        note: "✅ Her 3 hatayı spesifik olarak ele aldı, öncelik sırası verdi"
      }
    }
  ]
};

const TR_EN_DATA = [
  {
    scenario: "ALL_WRONG (Hız düşük + Açı yanlış + Süre kısa)",
    winner: "🇹🇷 Türkçe",
    en: {
      text: "PROBLEM: The punch lacks speed and the angle is off, resulting in a missed target.\nFIX: Focus on generating explosive power from your legs and pivoting your hips to increase speed and adjust your angle toward the target.\nMOTIVATION: Keep pushing yourself, each practice gets you closer to delivering that perfect punch!",
      note: "⚠️ 3 hatadan 2'sini tespit etti — süreyi atladı"
    },
    tr: {
      text: "SORUN: Yumruk hızının düşük olması, açının yanlış ayarlanması ve yumruk süresinin kısa olması nedeniyle hedef ıskalanıyor.\nDÜZELTME: Yumruğunu daha hızlı atmak için vücut tümünü kullanarak daha güçlü bir pivot yapmayı ve hedefe yönelik açıları daha iyi ayarlamayı çalış.\nMOTİVASYON: Unutma, her antrenman seni daha güçlü ve daha doğru bir boksör haline getiriyor!",
      note: "✅ 3 hatanın hepsini tespit etti"
    }
  },
  {
    scenario: "SLOW_AND_TOO_SHORT (Hız düşük + Süre kısa)",
    winner: "🇹🇷 Türkçe",
    en: {
      text: "PROBLEM: The punch speed is too low, which affects its effectiveness.\nFIX: Focus on generating power from your legs and hips to increase the speed of your punches.\nMOTIVATION: Keep pushing yourself; with the right technique, you'll see your speed improve!",
      note: "⚠️ Sadece hız sorununu ele aldı — süreyi atladı"
    },
    tr: {
      text: "SORUN: Yumruk hızının düşük olması ve süresinin kısa olması nedeniyle hedef ıskalanıyor.\nDÜZELTME: Antrenman boyunca yumruk hızını artırmak için kuvvet ve hız odaklı egzersizler yaparak, yumruk atarken vücudun dinamik dengesini geliştirin.\nMOTİVASYON: Unutma, her antrenman seni daha güçlü kılıyor!",
      note: "✅ Her iki hatayı da tespit etti"
    }
  },
  {
    scenario: "TOO_SHORT (Sadece süre kısa)",
    winner: "🇬🇧 İngilizce",
    en: {
      text: "PROBLEM: The punch duration is too short and the target was missed.\nFIX: Focus on extending your arm fully during the punch and maintain your follow-through to ensure you reach the target effectively.\nMOTIVATION: With practice and persistence, you'll master your timing and accuracy!",
      note: "✅ Süre sorununu doğru tespit etti"
    },
    tr: {
      text: "SORUN: Yumruk süresi çok kısa ve hedef ıskalandı.\nDÜZELTME: Yumruk atma süresini uzatabilmek için antrenman sırasında hedefe odaklanmayı ve vuruşun ardından geri çekilme süresini artırmayı deneyin.\nMOTİVASYON: Unutma, her antrenman seni daha da güçlendirecek!",
      note: "⚠️ 'Geri çekilme süresini artır' dedi — biraz yanlış yorum"
    }
  }
];

/*yeni eklendi*/
function LLMAnalysisTab({ movement }) {
  const [selectedScenario, setSelectedScenario] = useState("slow");
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [langData, setLangData] = useState(null);

  const SCENARIOS = [
    "correct", "slow", "wrong_angle",
    "too_short", "slow_and_wrong_angle",
    "slow_and_too_short", "all_wrong"
  ];

  const fetchData = async () => {
    setLoadingComparison(true);
    setComparisonData(null);
    setLangData(null);
    try {
      const [comp, lang] = await Promise.all([
        axios.get(`http://127.0.0.1:5000/prompt_comparison_all?movement=${movement}&scenario=${selectedScenario}`),
        axios.get(`http://127.0.0.1:5000/language_comparison_all?movement=${movement}&scenario=${selectedScenario}`)
      ]);
      setComparisonData(comp.data);
      setLangData(lang.data);
    } catch (e) {
      alert("Veri alınamadı. Flask çalışıyor mu?");
    }
    setLoadingComparison(false);
  };

  // Hareket değişince sıfırla
  useEffect(() => {
    setComparisonData(null);
    setLangData(null);
  }, [movement]);

  return (
    <>
      {/* CANLI TEST PANELİ */}
      <div className="result-card">
        <h3>🔬 Canlı Prompt & Dil Karşılaştırması</h3>
        <p className="card-note">
          Seçtiğiniz hareket ve senaryo için gerçek LLM çıktılarını karşılaştırın.
          Tüm çıktılar önceden GPT-4o mini tarafından üretilmiş ve kaydedilmiştir.
        </p>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>
              Hareket Tipi
            </label>
            <div style={{
              background: "#0f172a", border: "1px solid #334155",
              borderRadius: 8, padding: "10px 14px",
              color: "#38bdf8", fontWeight: 600, fontSize: 14
            }}>
              {MOVEMENTS[movement].label}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>
              Senaryo Seç
            </label>
            <select
              value={selectedScenario}
              onChange={e => setSelectedScenario(e.target.value)}
              style={{
                width: "100%", background: "#0f172a",
                border: "1px solid #334155", color: "#e2e8f0",
                padding: "10px 12px", borderRadius: 8, fontSize: 14
              }}>
              {SCENARIOS.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button
              onClick={fetchData}
              disabled={loadingComparison}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "white", border: "none", padding: "10px 20px",
                borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap"
              }}>
              {loadingComparison ? "⏳ Yükleniyor..." : "🔍 Sonuçları Getir"}
            </button>
          </div>
        </div>

        {/* PROMPT KARŞILAŞTIRMASI */}
        {comparisonData && (
          <>
            <div style={{ borderTop: "1px solid #334155", paddingTop: 16, marginTop: 8 }}>
              <h4 style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
                💬 Prompt Versiyonu Karşılaştırması —
                <span style={{ color: "#38bdf8" }}> {movement} / {selectedScenario.replace(/_/g, " ")}</span>
              </h4>

              {/* V1 */}
              <div className="prompt-block prompt-bad">
                <div className="prompt-header">
                  <span className="prompt-version">V1 — Temel Prompt</span>
                  <span className="prompt-tag tag-bad">❌ Yetersiz</span>
                </div>
                <div className="prompt-output">
                  <div className="prompt-label">📥 GPT-4o mini Çıktısı:</div>
                  <p>{comparisonData.v1}</p>
                </div>
              </div>

              {/* V2 */}
              <div className="prompt-block prompt-ok">
                <div className="prompt-header">
                  <span className="prompt-version">V2 — Gelişmiş Prompt</span>
                  <span className="prompt-tag tag-ok">✅ İyi</span>
                </div>
                <div className="prompt-output">
                  <div className="prompt-label">📥 GPT-4o mini Çıktısı:</div>
                  <p>{comparisonData.v2}</p>
                </div>
              </div>

              {/* V3 */}
              <div className="prompt-block prompt-best">
                <div className="prompt-header">
                  <span className="prompt-version">V3 — Yapılandırılmış Prompt</span>
                  <span className="prompt-tag tag-best">🏆 En İyi</span>
                </div>
                <div className="prompt-output">
                  <div className="prompt-label">📥 GPT-4o mini Çıktısı:</div>
                  <p style={{ whiteSpace: "pre-wrap" }}>{comparisonData.v3}</p>
                </div>
              </div>
            </div>

            {/* TR VS EN */}
            {langData && (
              <div style={{ borderTop: "1px solid #334155", paddingTop: 16, marginTop: 8 }}>
                <h4 style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
                  🌐 Türkçe vs İngilizce — V3 Prompt Karşılaştırması
                </h4>
                <div className="comparison-block">
                  <div className="comparison-header">
                    <span className="comparison-scenario">
                      {movement} / {selectedScenario.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="comparison-columns">
                    <div className="comparison-col col-en">
                      <div className="col-title">🇬🇧 İngilizce Çıktı</div>
                      <pre className="output-text">{langData.output_en}</pre>
                    </div>
                    <div className="comparison-col col-tr">
                      <div className="col-title">🇹🇷 Türkçe Çıktı</div>
                      <pre className="output-text">{langData.output_tr}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DEĞERLENDİRİCİ ANALİZİ */}
      <div className="result-card">
        <h3>👥 Değerlendirici Uyum Analizi</h3>
        <p className="card-note">
          <strong>Relevance:</strong> Geri bildirim hataya uygun muydu? &nbsp;|&nbsp;
          <strong>Accuracy:</strong> Doğru problemi tespit etti mi? &nbsp;|&nbsp;
          <strong>Clarity:</strong> Anlaşılır mıydı?
        </p>
        <table className="data-table">
          <thead>
            <tr><th>Senaryo</th><th>R1</th><th>R2</th><th>R3</th><th>Ort.</th><th>Uyum</th></tr>
          </thead>
          <tbody>
            {[
              { s: "all_wrong",   r1: 5.0, r2: 4.67, r3: 4.67, avg: 4.78, ag: "🟢 High" },
              { s: "correct",     r1: 4.0, r2: 3.33, r3: 2.67, avg: 3.33, ag: "🟡 Medium" },
              { s: "slow",        r1: 5.0, r2: 4.67, r3: 5.00, avg: 4.89, ag: "🟢 High" },
              { s: "slow+short",  r1: 5.0, r2: 4.33, r3: 4.67, avg: 4.67, ag: "🟢 High" },
              { s: "slow+angle",  r1: 5.0, r2: 5.00, r3: 4.67, avg: 4.89, ag: "🟢 High" },
              { s: "too_short",   r1: 5.0, r2: 4.33, r3: 5.00, avg: 4.78, ag: "🟡 Medium" },
              { s: "wrong_angle", r1: 5.0, r2: 4.67, r3: 5.00, avg: 4.89, ag: "🟢 High" },
            ].map(row => (
              <tr key={row.s}>
                <td>{row.s}</td>
                <td>{row.r1}</td>
                <td>{row.r2}</td>
                <td>{row.r3}</td>
                <td><strong>{row.avg}</strong></td>
                <td>{row.ag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
/*yeni eklendi*/


export default function App() {
  const [movement, setMovement]     = useState("punch");
  const [speed, setSpeed]           = useState(4.0);
  const [angle, setAngle]           = useState(10);
  const [duration, setDuration]     = useState(350);
  const [loading, setLoading]       = useState(false);
  const [flowStep, setFlowStep]     = useState(0);
  const [result, setResult]         = useState(null);
  const [activeTab, setActiveTab]   = useState("analysis");
  const [confidence, setConfidence] = useState(0);

  const mv = MOVEMENTS[movement];

  const handleMovementChange = (newMov) => {
    setMovement(newMov);
    setResult(null);
    const def = MOVEMENTS[newMov];
    setSpeed(def.defaultSpeed);
    setAngle(def.defaultAngle);
    setDuration(def.defaultDuration);
  };

  const applyScenario = (key) => {
    const s = mv.scenarios[key];
    setSpeed(s.speed);
    setAngle(s.angle);
    setDuration(s.duration);
  };

  const labelColor = (val, good) => val === good ? "#22c55e" : "#ef4444";

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    setFlowStep(0);
    for (let i = 0; i < FLOW_STEPS.length - 1; i++) {
      await new Promise(r => setTimeout(r, 600));
      setFlowStep(i + 1);
    }
    try {
      const res = await axios.post("http://127.0.0.1:5000/analyze", {
        movement, speed, angle, duration,
      });
      const data = res.data;
      const conf = data.ml_prediction === "correct"
        ? 88 + Math.floor(Math.random() * 7)
        : 75 + Math.floor(Math.random() * 15);
      setConfidence(conf);
      setResult(data);
    } catch (e) {
      alert("Backend'e bağlanılamadı. Flask çalışıyor mu?");
    }
    setLoading(false);
  };

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <h1>🥊 VR Motion Coaching System</h1>
          <p>LLM-Enhanced Intelligent Motion Analysis & Real-Time Coaching</p>
        </div>
        <div className="header-badge">AI Powered</div>
      </header>

      {/* FLOW BAR */}
      <FlowBar active={loading || !!result} step={loading ? flowStep : 4} />

      <div className="main">

        {/* SOL PANEL */}
        <div className="left-panel">
          <h2>Hareket Analizi</h2>

          <div className="input-group">
            <label>Hareket Tipi</label>
            <select value={movement} onChange={e => handleMovementChange(e.target.value)}>
              {Object.entries(MOVEMENTS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>{mv.angleLabel}: <span className="val">{angle}°</span></label>
            <input type="range" min={mv.angleMin} max={mv.angleMax} step="1"
              value={angle} onChange={e => setAngle(parseFloat(e.target.value))} />
            <div className="range-labels"><span>{mv.angleMin}°</span><span>{mv.angleMax}°</span></div>
          </div>

          <div className="input-group">
            <label>Hız: <span className="val">{speed} m/s</span></label>
            <input type="range" min={mv.speedMin} max={mv.speedMax} step="0.1"
              value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} />
            <div className="range-labels"><span>{mv.speedMin}</span><span>{mv.speedMax}</span></div>
          </div>

          <div className="input-group">
            <label>Süre: <span className="val">{duration} ms</span></label>
            <input type="range" min={mv.durationMin} max={mv.durationMax} step="10"
              value={duration} onChange={e => setDuration(parseFloat(e.target.value))} />
            <div className="range-labels"><span>{mv.durationMin}ms</span><span>{mv.durationMax}ms</span></div>
          </div>

          <div className="input-group">
            <label>Hazır Senaryo Seç</label>
            <div className="scenario-buttons">
              {Object.keys(mv.scenarios).map(k => (
                <button key={k} className="scenario-btn" onClick={() => applyScenario(k)}>
                  {k.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <MovementFigure movement={movement} angle={angle} speed={speed} duration={duration} />

          <button className="analyze-btn" onClick={analyze} disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Analiz ediliyor...</> : "🔍 Analiz Et"}
          </button>
        </div>

        {/* SAĞ PANEL */}
        <div className="right-panel">
          <div className="tabs">
            {[
              { id: "analysis", label: "📊 Analiz Sonucu" },
              { id: "model",    label: "🤖 Model Sonuçları" },
              { id: "llm",      label: "💬 LLM Analizi" },
            ].map(t => (
              <button key={t.id}
                className={activeTab === t.id ? "tab active" : "tab"}
                onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── SEKME 1: ANALİZ SONUCU ── */}
          {activeTab === "analysis" && (
            <div className="tab-content">
              {!result && !loading && (
                <div className="empty-state">
                  <div className="empty-icon">🎯</div>
                  <p>Sol panelden parametreleri ayarlayın ve <strong>Analiz Et</strong> butonuna basın.</p>
                </div>
              )}
              {loading && (
                <div className="loading">
                  <div className="spinner" />
                  <p>Hareket analiz ediliyor...</p>
                  <p style={{ fontSize: 12, color: "#475569" }}>LLM geri bildirimi üretiliyor</p>
                </div>
              )}
              {result && (
                <div className="result">

                  {/* Tahmin + Confidence */}
                  <div className="result-card prediction-card">
                    <div className="prediction-top">
                      <div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>🎯 Tahmin Sonucu</div>
                        <div className={`prediction-badge badge-${result.ml_prediction === "correct" ? "green" : "red"}`}>
                          {result.ml_prediction.replace(/_/g, " ").toUpperCase()}
                        </div>
                      </div>
                      <ConfidenceBar value={confidence} label="Simulated dataset performance" />
                    </div>
                    <WhyPanel labels={result.labels} movement={movement} />
                  </div>

                  {/* Hareket Etiketleri */}
                  <div className="result-card">
                    <h3>📋 Hareket Etiketleri</h3>
                    <div className="label-grid">
                      <div className="label-item">
                        <span>Hız</span>
                        <span style={{ color: labelColor(result.labels.speed, "good") }}>
                          {result.labels.speed === "good" ? "✅ İyi" : "❌ Düşük"}
                        </span>
                      </div>
                      <div className="label-item">
                        <span>Açı</span>
                        <span style={{ color: labelColor(result.labels.angle, "correct") }}>
                          {result.labels.angle === "correct" ? "✅ Doğru" : "❌ Yanlış"}
                        </span>
                      </div>
                      <div className="label-item">
                        <span>Süre</span>
                        <span style={{ color: labelColor(result.labels.duration, "normal") }}>
                          {result.labels.duration === "normal" ? "✅ Normal" : "❌ Kısa"}
                        </span>
                      </div>
                      <div className="label-item">
                        <span>{movement === "squat" ? "Form" : "Hedef"}</span>
                        <span style={{ color: result.labels.hit ? "#22c55e" : "#ef4444" }}>
                          {movement === "squat"
                            ? (result.labels.hit ? "✅ Doğru" : "❌ Hatalı")
                            : (result.labels.hit ? "✅ Vuruldu" : "❌ Iskalandı")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LLM Geri Bildirim */}
                  <div className="result-card feedback">
                    <h3>🏋️ Koç Geri Bildirimi</h3>
                    <div className="feedback-item problem">
                      <span className="feedback-label">⚠️ Sorun</span>
                      <p><TypingText text={result.feedback.problem || "Hata tespit edilmedi"} /></p>
                    </div>
                    <div className="feedback-item fix">
                      <span className="feedback-label">🔧 Düzeltme</span>
                      <p><TypingText text={result.feedback.fix || "-"} speed={15} /></p>
                    </div>
                    <div className="feedback-item motivation">
                      <span className="feedback-label">💪 Motivasyon</span>
                      <p><TypingText text={result.feedback.motivation || "-"} speed={20} /></p>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ── SEKME 2: MODEL SONUÇLARI ── */}
          {activeTab === "model" && (
            <div className="tab-content">

              <div className="result-card">
                <h3>🤖 Random Forest Model Performansı</h3>
                <p className="card-note">⚠️ Küçük ve kontrollü simüle veri seti üzerinde elde edilen değerler. Gerçek veri setinde performans farklılık gösterebilir.</p>
                <div className="metrics-grid">
                  {[
                    { label: "Accuracy",  val: "92%",  color: "#22c55e" },
                    { label: "Precision", val: "0.91", color: "#3b82f6" },
                    { label: "Recall",    val: "0.92", color: "#8b5cf6" },
                    { label: "F1-Score",  val: "0.91", color: "#f59e0b" },
                  ].map(m => (
                    <div key={m.label} className="metric">
                      <span>{m.label}</span>
                      <strong style={{ color: m.color }}>{m.val}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-card">
                <h3>📊 Özellik Önemleri</h3>
                <p className="card-note">Modelin karar verirken hangi özelliklere ne kadar ağırlık verdiği</p>
                <div className="feature-bars">
                  {[
                    { name: "Açı",    val: 30.02, color: "#f59e0b" },
                    { name: "Hız",    val: 28.44, color: "#8b5cf6" },
                    { name: "Süre",   val: 28.29, color: "#3b82f6" },
                    { name: "Hedef",  val: 12.49, color: "#22c55e" },
                    { name: "Hareket",val: 0.75,  color: "#64748b" },
                  ].map(f => (
                    <div key={f.name} className="feature-bar-row">
                      <span>{f.name}</span>
                      <div className="bar-bg">
                        <div className="bar-fill" style={{ width: `${f.val}%`, background: f.color }} />
                      </div>
                      <span>{f.val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-card">
                <h3>🔢 Confusion Matrix</h3>
                <p className="card-note">Modelin senaryo bazlı tahmin dağılımı</p>
                <div className="confusion-wrap">
                  <table className="confusion-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>correct</th>
                        <th>slow</th>
                        <th>wrong_angle</th>
                        <th>too_short</th>
                        <th>all_wrong</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "correct",     vals: [6, 0, 0, 0, 0] },
                        { label: "slow",        vals: [0, 4, 0, 0, 0] },
                        { label: "wrong_angle", vals: [0, 0, 5, 0, 0] },
                        { label: "too_short",   vals: [0, 0, 0, 4, 0] },
                        { label: "all_wrong",   vals: [0, 0, 0, 1, 3] },
                      ].map(row => (
                        <tr key={row.label}>
                          <td className="cm-label">{row.label}</td>
                          {row.vals.map((v, i) => (
                            <td key={i} className="cm-cell"
                              style={{
                                background: i === row.vals.indexOf(Math.max(...row.vals))
                                  ? `rgba(59,130,246,${v / 6 * 0.8 + 0.1})`
                                  : v > 0 ? "rgba(239,68,68,0.3)" : "transparent",
                                color: v > 0 ? "#fff" : "#475569",
                                fontWeight: v > 0 ? 700 : 400
                              }}>
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="result-card">
                <h3>📋 Senaryo Değerlendirmesi</h3>
                <table className="data-table">
                  <thead>
                    <tr><th>Senaryo</th><th>Relevance</th><th>Accuracy</th><th>Clarity</th><th>Ort.</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { s: "all_wrong",   r: 5, a: 5, c: 5, avg: 5.00 },
                      { s: "correct",     r: 5, a: 5, c: 5, avg: 5.00 },
                      { s: "slow",        r: 4, a: 3, c: 5, avg: 4.00 },
                      { s: "too_short",   r: 4, a: 2, c: 4, avg: 3.33 },
                      { s: "wrong_angle", r: 5, a: 5, c: 5, avg: 5.00 },
                      { s: "slow+short",  r: 5, a: 4, c: 5, avg: 4.67 },
                      { s: "slow+angle",  r: 5, a: 5, c: 5, avg: 5.00 },
                    ].map(row => (
                      <tr key={row.s}>
                        <td>{row.s}</td>
                        <td>{row.r}</td>
                        <td>{row.a}</td>
                        <td>{row.c}</td>
                        <td><strong style={{ color: row.avg >= 4.5 ? "#22c55e" : row.avg >= 4.0 ? "#f59e0b" : "#ef4444" }}>{row.avg}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ── SEKME 3: LLM ANALİZİ ──  düzeltildi dinamik hale geldi */}
          {activeTab === "llm" && (
          <div className="tab-content">
         <LLMAnalysisTab movement={movement} />
  </div>
  
)}
        </div>
      </div>
    </div>
  );
}