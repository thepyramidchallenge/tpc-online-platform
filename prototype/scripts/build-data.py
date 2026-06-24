#!/usr/bin/env python3
# Builds prototype/data.js (window.TPC_QUESTIONS + TPC_SETS) from the sheet CSVs,
# and copies the reference images into prototype/assets/.
import csv
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "sheets-template"
DST = ROOT / "prototype"
qs=[]
for r in csv.DictReader(open(SRC / "Questions__Questions.csv", encoding="utf-8")):
    qs.append({
        "id":r["questionId"],"domain":r["domain"],"topic":r["topic"],
        "level":r["level"],"type":r["type"],
        "payload":json.loads(r["payload"]),"answer":json.loads(r["correctAnswer"]),
        "explanation":r["explanation"],"difficulty":int(r["difficulty"]),"marks":int(r["marks"]),
    })
sets=[]
for r in csv.DictReader(open(SRC / "Questions__QuestionSets.csv", encoding="utf-8")):
    sets.append({"setId":r["setId"],"title":r["title"],"mode":r["mode"],
                 "questionIds":r["questionIds"].split(";"),
                 "timeLimitSec":int(r["timeLimitSec"]),"yearLevel":r["yearLevel"]})
with open(DST / "data.js", "w", encoding="utf-8") as f:
    f.write("window.TPC_QUESTIONS="+json.dumps(qs,ensure_ascii=False)+";\n")
    f.write("window.TPC_SETS="+json.dumps(sets,ensure_ascii=False)+";\n")
# copy images
for lvl in ("k2","k3"):
    out_dir = DST / "assets" / lvl
    out_dir.mkdir(parents=True, exist_ok=True)
    for src in (ROOT / "assets" / lvl).iterdir():
        if src.is_file():
            shutil.copy(src, out_dir / src.name)
print(f"data.js: {len(qs)} questions, {len(sets)} sets; images copied.")
