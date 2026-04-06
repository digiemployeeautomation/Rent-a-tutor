# Main Site — Audit Fixes

## Fix 1: WithdrawModal (CRITICAL)
File: app/dashboard/tutor/(shell)/page.js

Replace the entire `WithdrawModal` function with the one in
`app/dashboard/tutor/(shell)/WithdrawModal-fix.js`.

The old version called setDone(true) with no database write.
The new version inserts into `payout_requests` first.

## Fix 2: Tutor browse page — mobile filters
File: app/tutor/page.js

1. Add state near the top of FindTutorPage:
   const [filtersOpen, setFiltersOpen] = useState(false)

2. Replace the <aside> block with the one in
   app/tutor/tutor-page-mobile-filter-patch.jsx
