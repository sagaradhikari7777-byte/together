# Together

An original, iPhone-first household expense app inspired by the supplied feature set, independently implemented. It supports two couples (four members), AUD expenses, shared and couple-private entries, equal/full allocation, compressed photo receipts, custom merchants/categories, dated sheets, pin/archive, settlement history, CSV export, and light/dark appearance.

## Status

Published at https://sagar-together.vercel.app on Vercel, with its serverless API and Upstash Redis (Vercel KV) storage. All automated tests pass, and Vercel runs them before every build. iPhone Safari layout, receipt picking, Home Screen launch, and file sharing still need device validation.

## Pearl UI redesign

The UI now uses a coordinated pearl-and-sage theme, including a redesigned Home spending summary, settlement shortcut, equal-sized couple cards and quick-add tiles, updated forms, sheet lists, and matching light/dark appearances. The floating navigation is one five-column glass capsule: Home, Sheets, Add, Settle, Settings. All buttons share their height, width, icon position and label baseline. Icons and Home Screen colours match the new theme. Financial data, shared storage, catalog management and privacy rules remain unchanged.

Chromium checks passed at 320, 375, 440 and 900 pixel widths: no horizontal overflow, equal navigation button dimensions and icon alignment, working navigation to all tabs, the add-expense form, onboarding and light/dark mode. Screenshots were visually reviewed and dark-mode contrast refined. Actual iPhone Safari verification remains outstanding.

## Sheets and choice lists update

The main navigation is Home, Sheets, Settle, and Settings. Sheets opens a searchable list with totals, dates, and visible expense counts. Swipe right for edit/pin and left for archive/delete; the actions menu provides the same controls without a gesture. Sheet deletion requires every record to be eligible for deletion by the member and preserves settlement locks. Archive and reopen retain the original settlement requirements.

Merchant and category lists are available in Settings and within expense forms. Both support search, selection, add, rename, and removal. Defaults follow the supplied screenshots. Existing households receive defaults without a schema migration. Household choices are shared, counts reflect only the current member's visible expenses, and changing a choice does not rewrite historical expense labels. Expense drafts remain intact while browsing or editing choices.

Validated in Chromium at 320, 375, and 440 pixel phone widths: Sheets navigation, right-swipe controls, sheet creation/editing, merchant add/select/rename/remove, category selection, expense saving, draft retention, and absence of horizontal overflow. Safari device verification remains outstanding.

## iPhone layout update

Dialogs now explicitly fill the phone width, avoiding Safari’s default dialog maximum width. Form grid tracks and controls can shrink without horizontal overflow; date controls use a consistent height and left alignment. Very narrow phones stack paired fields. Dialog headings stay visible while scrolling, and onboarding headings receive initial focus without opening the keyboard.

## Recurring expenses and settlement undo

Settings → Recurring expenses holds regular bills such as rent, power and internet. Each one is added to every new sheet, dated on the sheet's start day; the new-sheet form has a checkbox to skip them. "Add missing to …" adds any that are not yet on the current sheet. Added expenses are ordinary expenses that can be edited or deleted. Recurring entries follow the same privacy and author/payer rules as expenses.

Settlement history has an Undo button. Undoing a settlement removes the record and unlocks its expenses so they count toward the balance again. Settlements on archived sheets can be undone after reopening the sheet.

## GitHub publishing

Source repository: https://github.com/sagaradhikari7777-byte/together.

The Vercel project `sagar-together` deploys from this repository. Pushes to `main` trigger production builds; other branches receive preview deployments. Confirm the matching commit is published in Vercel before considering an update live. Keep credentials in Vercel, never in this repository.

## Deploy

`vercel.json` sets the build command to `npm test && npm run build` (a failing test stops the deployment) and the output directory to `dist`. `api/household.js` is deployed automatically as a Vercel Function at `/api/household`.

Connect an Upstash Redis database to the project (Vercel Marketplace → Upstash, or Storage). The function reads `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without them the app reports that shared storage is not connected. Each household is one versioned JSON document; updates use an atomic compare-and-set script, preserving the API's conflict detection. Private access links and all visibility rules remain enforced on the server.

To check a deployment end to end, run `node scripts/check-live.mjs <site URL>`. It creates a temporary household; set the KV variables locally to have it deleted afterwards.

Open the live site, create your household, save your private access link, and share the separate invitation with your household members. On iPhone, open it in Safari and use Share → Add to Home Screen.

## Development

Use Node.js 22. There are no runtime dependencies. Run `npm test` and `npm run build`. `npm run dev` starts a local server at http://localhost:3000 using the Redis credentials in `.env` (see `.env.example`). Sample mode remains temporary and does not save shared data.

## Access and privacy

- Four member slots, grouped as members 1–2 and 3–4. Display names are editable.
- Each member receives a random 256-bit private access key. Only its SHA-256 hash is stored with household data. The device remembers the key to stay signed in. Access links use a URL fragment that is removed from the address bar after opening.
- Private links act as sign-in credentials. Save yours securely. This version does not have email/password recovery or a member-key revocation interface. A lost key needs an owner-assisted database reset for that slot.
- The invitation allows its holder to claim an unclaimed member slot; it is not identity verification. Share only within the household. Replacing an invitation invalidates the old invitation, not already-issued member access.
- Server responses exclude the other couple’s private expenses and receipts. Private expenses must be paid by a member of the current couple. Only the author or payer can edit/delete an eligible expense.
- Couple-private entries are excluded from settlement. Shared entries allocate either 50/50 or 100% to one couple. For odd-cent equal splits, couple two receives the extra cent; every cent is accounted for.
- Recording settlement marks the selected sheet’s unsettled shared expenses as settled and locks them. It does not initiate a bank transfer. A settlement recorded by mistake can be undone from the settlement history.
- Writes use an atomic compare-and-set operation to prevent silent overwrites. When another member saves first, the app refreshes and asks the current member to review and save again.
- The app refreshes visible household data every 30 seconds and when returning to the foreground. An open form is protected from background replacement. It requires connectivity and does not promise offline or iOS background sync.
- CSV export contains only the current member’s visible records and excludes receipt images. Formula-leading text is escaped.

## Capacity and receipts

This initial small-household implementation keeps one versioned JSON document per household. Uploaded receipt images are resized and compressed before storage (under 400 KB encoded per receipt). A household document is capped at approximately 3.5 MB and writes stop with an explicit message when full. Archiving does not free storage. For long-term receipt-heavy use, move receipts to object storage and expenses to separate records before this limit is reached. CSV is a record export, not a full restore backup. Configure provider backups for durable recovery.

## Files

- `public/`: independent interface, styles, icons, manifest.
- `lib/model.js`: validation, member visibility, splits, sheets, settlement rules.
- `api/household.js`: authenticated Vercel endpoint, rate limit and atomic persistence.
- `tests/household.test.mjs`: financial, privacy, access, concurrency-revision and API checks using a deterministic fake Redis service.
- `scripts/`: dependency-free build, local development server and live deployment check.
- `vercel.json`: Vercel build settings and security headers.

No Grok source files, credentials, personal transaction data, or dependencies are copied into this app.
