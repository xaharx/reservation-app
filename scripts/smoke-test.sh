#!/usr/bin/env bash
# Pre-release smoke test — run this against your local server before sharing
# a build with a customer:
#   bash scripts/smoke-test.sh
#
# Exercises the full reservation and order round trips (create -> lookup ->
# cancel) plus the read-only CMS/menu endpoints. Requires the server running
# locally on port 3000 and `jq` installed (`brew install jq`).
set -uo pipefail

BASE="http://localhost:3000/api/v1"
PASS=0
FAIL=0

check() {
  local label="$1"
  local expected_status="$2"
  local actual_status="$3"
  if [ "$actual_status" == "$expected_status" ]; then
    echo "  OK   $label ($actual_status)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL $label (expected $expected_status, got $actual_status)"
    FAIL=$((FAIL + 1))
  fi
}

echo "== Health =="
STATUS=$(curl -s -o /tmp/smoke_health.json -w "%{http_code}" "$BASE/health")
check "GET /health" 200 "$STATUS"

echo
echo "== CMS content (read-only) =="
for path in about gallery contact menu social-media settings home; do
  STATUS=$(curl -s -o /tmp/smoke_cms.json -w "%{http_code}" "$BASE/$path")
  check "GET /$path" 200 "$STATUS"
done

echo
echo "== Reservation round trip =="
EMAIL="smoketest+$(date +%s)@example.com"
CREATE_BODY=$(cat <<JSON
{"firstName":"Smoke","lastName":"Test","email":"$EMAIL","phone":"+923001234567","reservationDate":"2026-12-31","reservationTime":"20:00","guestCount":2,"deviceId":"smoke-test","os":"android"}
JSON
)
STATUS=$(curl -s -o /tmp/smoke_reservation.json -w "%{http_code}" -X POST "$BASE/reservations" -H "Content-Type: application/json" -d "$CREATE_BODY")
check "POST /reservations" 201 "$STATUS"
CODE=$(jq -r '.data.confirmationCode // empty' /tmp/smoke_reservation.json)

if [ -n "$CODE" ]; then
  LOOKUP_BODY=$(cat <<JSON
{"confirmationCode":"$CODE","guestEmail":"$EMAIL"}
JSON
)
  STATUS=$(curl -s -o /tmp/smoke_lookup.json -w "%{http_code}" -X POST "$BASE/reservations/lookup" -H "Content-Type: application/json" -d "$LOOKUP_BODY")
  check "POST /reservations/lookup" 200 "$STATUS"

  CANCEL_BODY=$(cat <<JSON
{"guestEmail":"$EMAIL","reason":"Smoke test cleanup"}
JSON
)
  STATUS=$(curl -s -o /tmp/smoke_cancel.json -w "%{http_code}" -X POST "$BASE/reservations/$CODE/cancellation" -H "Content-Type: application/json" -d "$CANCEL_BODY")
  check "POST /reservations/{code}/cancellation" 200 "$STATUS"
else
  echo "  SKIP lookup/cancel (no confirmation code returned)"
fi

echo
echo "== Order round trip (needs a real Stripe test key) =="
MENU_ITEM_ID=$(curl -s "$BASE/menu" | jq -r '.data[0].items[0].id // empty')
if [ -z "$MENU_ITEM_ID" ]; then
  echo "  SKIP (no menu items — run 'npm run seed:menu' first)"
else
  ORDER_BODY=$(cat <<JSON
{"firstName":"Smoke","lastName":"Test","email":"$EMAIL","phone":"+923001234567","items":[{"menuItemId":"$MENU_ITEM_ID","quantity":1}]}
JSON
)
  STATUS=$(curl -s -o /tmp/smoke_order.json -w "%{http_code}" -X POST "$BASE/orders" -H "Content-Type: application/json" -d "$ORDER_BODY")
  check "POST /orders" 201 "$STATUS"
  if [ "$STATUS" != "201" ]; then
    echo "  -> $(jq -r '.message // .' /tmp/smoke_order.json 2>/dev/null)"
    echo "  -> If this says payment processing is unavailable, your STRIPE_SECRET_KEY in .env is still the placeholder."
  fi
fi

echo
echo "== Result: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]
