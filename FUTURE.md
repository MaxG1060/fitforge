# FitForge — Future Backlog

Everything here was deliberately cut from V1 to ship faster.
Items are roughly ordered by value. Revisit after V1 is live.

## Integrations
- [ ] Garmin Connect API — auto-import workouts and HRV
- [ ] Whoop API — recovery scores, strain, sleep stages
- [ ] Apple Health — steps, heart rate, sleep, HRV, RHR, weight, workouts
  - No public Web API; data lives in HealthKit on the iPhone
  - **Recommended approach**: iOS Shortcut + webhook
    - User builds a daily-automation Shortcut that pulls HealthKit metrics and POSTs to `/api/apple-health/webhook`
    - Backend: `health_metrics` table, per-user auth token, settings page with copy-pasteable Shortcut instructions
    - Free, no native app, ~10 min one-time setup on the phone
  - Alternative: "Health Auto Export" iOS app (~$5) with built-in REST/webhook export — easier setup, paid dependency
  - Out of scope: native iOS app with HealthKit (needs Apple Developer account $99/yr + Swift)
- [ ] Renpho API — auto-sync body metrics (no public API yet, monitor for release)
- [ ] Google Fit — Android fallback

## Social Layer
- [ ] Friend connections — add friends by username/email
- [ ] Shared leaderboard — weekly training volume, streak, weight lifted
- [ ] Challenges — "most km cycled this month" between friends
- [ ] Activity feed — see friends' workouts
- [ ] Push notifications for challenges

## Mobile
- [ ] React Native / Expo native app (iOS + Android)
- [ ] App Store / Google Play listing
- [ ] Native Health kit integration

## Analytics
- [ ] Body composition trend charts (weight, body fat %, muscle mass over time)
- [ ] Training load heatmap (volume by week)
- [ ] Recovery vs. performance correlation
- [ ] Personal records tracking
- [ ] Export data to CSV

## Training Plans
- [ ] Multi-week structured programs (e.g. 8-week cycling base)
- [ ] Auto-adjust plan based on Whoop recovery score
- [ ] Exercise library with technique notes
- [ ] Rest day vs. active recovery recommendations

## Nutrition
- [ ] Barcode scanner for logging individual meals
- [ ] Calorie tracking against training load
- [ ] Grocery list generator from meal plan
- [ ] Restaurant / takeaway substitution suggestions

## Infrastructure
- [ ] Offline mode (PWA with service worker caching)
- [ ] Data export / account deletion (GDPR)
- [ ] Team/coach accounts
