#!/usr/bin/env bash
# Speed test: single verify + batch upload/stream
# Usage:  ./speed-test.sh [image_path] [image2_path ...]
# Default: uses first two images found in test-images/

set -euo pipefail

HOST="${SERVER_HOST:-http://localhost:3001}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── pick images ───────────────────────────────────────────────────────────────
if [[ $# -ge 1 ]]; then
  IMAGES=("$@")
else
  mapfile -t IMAGES < <(find "$SCRIPT_DIR/test-images" -maxdepth 1 \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" \) | sort | head -3)
fi

if [[ ${#IMAGES[@]} -eq 0 ]]; then
  echo "No images found. Pass image paths as arguments or add images to test-images/"
  exit 1
fi

SINGLE_IMAGE="${IMAGES[0]}"

# ── shared application data ───────────────────────────────────────────────────
APP_JSON='{
  "brandName": "Test Brand",
  "classType": "American Lager",
  "beverageType": "beer",
  "alcoholContent": "5.0% alc/vol",
  "netContents": "355 mL",
  "producerName": "Test Brewing Co.",
  "producerAddress": "123 Main St, Denver, CO 80203"
}'

# ── helpers ───────────────────────────────────────────────────────────────────
hr() { printf '\n%s\n' "────────────────────────────────────────────"; }
ts() { python3 -c "import time; print(int(time.time()*1000))"; }  # ms, works on all platforms

# ── 1. SINGLE VERIFY ─────────────────────────────────────────────────────────
hr
echo "SINGLE VERIFY"
echo "  image : $(basename "$SINGLE_IMAGE")"
echo "  size  : $(du -h "$SINGLE_IMAGE" | cut -f1)"
echo "  url   : $HOST/api/verify"

T_START=$(ts)

HTTP_CODE=$(curl -s -o /tmp/ttb_single_response.json \
  --write-out "%{http_code}" \
  --connect-timeout 5 \
  --max-time 30 \
  -X POST "$HOST/api/verify" \
  -F "image=@$SINGLE_IMAGE" \
  -F "application=$APP_JSON")

T_SINGLE=$(( $(ts) - T_START ))

echo "  status: $HTTP_CODE"
echo "  time  : ${T_SINGLE}ms"

if [[ "$HTTP_CODE" == "200" ]]; then
  PROCESSING_MS=$(python3 -c "import json,sys; d=json.load(open('/tmp/ttb_single_response.json')); print(d.get('processingTimeMs','n/a'))" 2>/dev/null || echo "n/a")
  OVERALL=$(python3 -c "import json; d=json.load(open('/tmp/ttb_single_response.json')); print(d.get('overallStatus','?'))" 2>/dev/null || echo "?")
  FIELD_COUNT=$(python3 -c "import json; d=json.load(open('/tmp/ttb_single_response.json')); print(len(d.get('fields',[])))" 2>/dev/null || echo "?")
  echo "  result: $OVERALL  ($FIELD_COUNT fields, Claude reported ${PROCESSING_MS}ms)"
else
  echo "  error : $(cat /tmp/ttb_single_response.json)"
fi

# ── 2. STREAMING VERIFY (SSE) ────────────────────────────────────────────────
hr
echo "STREAMING VERIFY (SSE)"
echo "  image : $(basename "$SINGLE_IMAGE")"
echo "  size  : $(du -h "$SINGLE_IMAGE" | cut -f1)"
echo "  url   : $HOST/api/verify/stream"

T_STREAM_START=$(ts)
T_FIRST_FIELD=""
STREAM_FIELDS=0
STREAM_STATUS=""
STREAM_ERROR=""

while IFS= read -r line; do
  if [[ "$line" == data:* ]]; then
    PAYLOAD="${line#data: }"
    if [[ "$PAYLOAD" == "[DONE]" ]]; then
      break
    fi
    TYPE=$(echo "$PAYLOAD" | python3 -c "import json,sys; print(json.load(sys.stdin).get('type',''))" 2>/dev/null || echo "")
    if [[ "$TYPE" == "field" ]]; then
      if [[ -z "$T_FIRST_FIELD" ]]; then
        T_FIRST_FIELD=$(( $(ts) - T_STREAM_START ))
      fi
      STREAM_FIELDS=$(( STREAM_FIELDS + 1 ))
    elif [[ "$TYPE" == "done" ]]; then
      STREAM_STATUS=$(echo "$PAYLOAD" | python3 -c "import json,sys; print(json.load(sys.stdin).get('overallStatus','?'))" 2>/dev/null || echo "?")
    elif [[ "$TYPE" == "error" ]]; then
      STREAM_ERROR=$(echo "$PAYLOAD" | python3 -c "import json,sys; print(json.load(sys.stdin).get('error','unknown error'))" 2>/dev/null || echo "unknown error")
    fi
  fi
done < <(curl -sN \
  --connect-timeout 5 \
  --max-time 60 \
  -X POST "$HOST/api/verify/stream" \
  -F "image=@$SINGLE_IMAGE" \
  -F "application=$APP_JSON")

T_STREAM_TOTAL=$(( $(ts) - T_STREAM_START ))

echo "  total time  : ${T_STREAM_TOTAL}ms"
echo "  fields      : $STREAM_FIELDS"
if [[ -n "$STREAM_ERROR" ]]; then
  echo "  error       : $STREAM_ERROR"
else
  echo "  result      : $STREAM_STATUS"
fi
if [[ -n "$T_FIRST_FIELD" ]]; then
  echo "  first field : ${T_FIRST_FIELD}ms"
  if (( T_FIRST_FIELD < 2000 )); then
    echo "  first field : PASS (<2000ms target)"
  else
    echo "  first field : SLOW (${T_FIRST_FIELD}ms > 2000ms target)"
  fi
fi

# ── 4. BATCH UPLOAD + SSE STREAM ─────────────────────────────────────────────
hr
echo "BATCH PROCESSING"
echo "  images: ${#IMAGES[@]}"
for img in "${IMAGES[@]}"; do
  echo "    $(basename "$img")  ($(du -h "$img" | cut -f1))"
done
echo "  url   : $HOST/api/batch/upload"

# Build -F args for each image
FORM_ARGS=()
for img in "${IMAGES[@]}"; do
  FORM_ARGS+=(-F "images=@$img")
done

T_BATCH_START=$(ts)

UPLOAD_RESP=$(curl -s \
  --connect-timeout 5 \
  --max-time 15 \
  -X POST "$HOST/api/batch/upload" \
  "${FORM_ARGS[@]}" \
  -F "application=$APP_JSON")

T_UPLOAD=$(( $(ts) - T_BATCH_START ))

JOB_ID=$(echo "$UPLOAD_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['jobId'])" 2>/dev/null || echo "")

if [[ -z "$JOB_ID" ]]; then
  echo "  error : upload failed — $UPLOAD_RESP"
  exit 1
fi

echo "  upload: ${T_UPLOAD}ms → jobId $JOB_ID"
echo "  stream: $HOST/api/batch/$JOB_ID/stream"
echo "  waiting for completion..."

COMPLETED=0
TOTAL=${#IMAGES[@]}
LAST_EVENT=""

while IFS= read -r line; do
  if [[ "$line" == event:* ]]; then
    LAST_EVENT="${line#event: }"
    LAST_EVENT="${LAST_EVENT#event:}"
    LAST_EVENT="${LAST_EVENT// /}"
  fi
  if [[ "$line" == data:* && "$LAST_EVENT" == "label" ]]; then
    DATA="${line#data: }"
    STATUS=$(echo "$DATA" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "?")
    FNAME=$(echo "$DATA" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('filename','?'))" 2>/dev/null || echo "?")
    if [[ "$STATUS" == "complete" || "$STATUS" == "failed" ]]; then
      ELAPSED=$(( $(ts) - T_BATCH_START ))
      OVERALL=$(echo "$DATA" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('result',{}).get('overallStatus','n/a'))" 2>/dev/null || echo "n/a")
      COMPLETED=$(( COMPLETED + 1 ))
      echo "  [${ELAPSED}ms] $FNAME → $STATUS ($OVERALL)"
    fi
  fi
  if [[ "$LAST_EVENT" == "done" ]]; then
    break
  fi
done < <(curl -sN --max-time 120 "$HOST/api/batch/$JOB_ID/stream")

T_BATCH_TOTAL=$(( $(ts) - T_BATCH_START ))

hr
echo "SUMMARY"
echo "  single verify (blocking) : ${T_SINGLE}ms"
if [[ -n "$T_FIRST_FIELD" ]]; then
  echo "  stream first field       : ${T_FIRST_FIELD}ms  (target <2000ms)"
fi
echo "  stream total             : ${T_STREAM_TOTAL}ms"
echo "  batch total              : ${T_BATCH_TOTAL}ms  (${#IMAGES[@]} labels, avg $(( T_BATCH_TOTAL / ${#IMAGES[@]} ))ms/label)"
echo "  target                   : <5000ms single/stream,  <$(( 5000 * ${#IMAGES[@]} / 3 ))ms batch"
if (( T_SINGLE < 5000 )); then
  echo "  single                   : PASS"
else
  echo "  single                   : SLOW (${T_SINGLE}ms > 5000ms)"
fi
if (( T_STREAM_TOTAL < 5000 )); then
  echo "  stream                   : PASS"
else
  echo "  stream                   : SLOW (${T_STREAM_TOTAL}ms > 5000ms)"
fi
hr