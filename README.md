# Together

An original, iPhone-first household expense app inspired by the supplied feature set, independently implemented. It supports two couples (four members), AUD expenses, shared and couple-private entries, equal/full allocation, compressed photo receipts, custom merchants/categories, dated sheets, pin/archive, settlement history, CSV export, and light/dark appearance.

## Status

Published at https://sagar-together.netlify.app with its Netlify Function and managed Netlify Database. All 18 automated tests pass. Live checks passed for household creation, joining, expense saving, cross-member reads, stale-revision rejection, private-record isolation, and invalid-key rejection. The database migration is applied. iPhone Safari layout, receipt picking, Home Screen launch, and file sharing still need device validation.

## Pearl UI redesign

Published at https://sagar-together.netlify.app. Production deployment: 6aa7e843490a2e6ed56f22c9.

The UI now uses a coordinated pearl-and-sage theme, including a redesigned Home spending summary, settlement shortcut, equal-sized couple cards and quick-add tiles, updated forms, sheet lists, and matching light/dark appearances. The floating navigation is one five-column glass capsule: Home, Sheets, Add, Settle, Settings. All buttons share their height, width, icon position and label baseline. Icons and Home Screen colours match the new theme. Financial data, shared storage, catalog management and privacy rules remain unchanged.

Chromium checks passed at 320, 375, 440 and 900 pixel widths: no horizontal overflow, equal navigation button dimensions and icon alignment, working navigation to all tabs, the add-expense form, onboarding and light/dark mode. Screenshots were visually reviewed and dark-mode contrast refined. Actual iPhone Safari verification remains outstanding.

## Sheets and choice lists update

Published to https://sagar-together.netlify.app. Deployment: 6aa79c73c2d4c6ac87354a77.

The main navigation is Home, Sheets, Settle, and Settings. Sheets opens a searchable list with totals, dates, and visible expense counts. Swipe right for edit/pin and left for archive/delete; the actions menu provides the same controls without a gesture. Sheet deletion requires every record to be eligible for deletion by the member and preserves settlement locks. Archive and reopen retain the original settlement requirements.

Merchant and category lists are available in Settings and within expense forms. Both support search, selection, add, rename, and removal. Defaults follow the supplied screenshots. Existing households receive defaults without a schema migration. Household choices are shared, counts reflect only the current member's visible expenses, and changing a choice does not rewrite historical expense labels. Expense drafts remain intact while browsing or editing choices.

Validated in Chromium at 320, 375, and 440 pixel phone widths: Sheets navigation, right-swipe controls, sheet creation/editing, merchant add/select/rename/remove, category selection, expense saving, draft retention, and absence of horizontal overflow. Safari device verification remains outstanding.

## iPhone layout update

Dialogs now explicitly fill the phone width, avoiding Safari’s default dialog maximum width. Form grid tracks and controls can shrink without horizontal overflow; date controls use a consistent height and left alignment. Very narrow phones stack paired fields. Dialog headings stay visible while scrolling, and onboarding headings receive initial focus without opening the keyboard.

## GitHub publishing

Source repository: https://github.com/sagaradhikari7777-byte/together.

Connect the existing Netlify project to this repository with production branch `main`, build command `npm run build`, and publish directory `dist`. Functions are configured in `netlify.toml`. Once the repository connection is enabled, pushes to `main` trigger production builds. Confirm the matching commit is published in Netlify before considering an update live. Keep credentials in Netlify, never in this repository.

## Deploy

The Netlify project is `sagar-together` (site ID `44e9826a-d6c3-4e89-949e-7cf869eb4527`). Build with `npm run build`. Deploy the complete project, including `netlify/functions` and the SQL migrations under `netlify/database/migrations`; uploading only `dist` omits the backend. The production site is public; preview deployments retain Netlify sign-in protection.

Netlify manages the production database connection. The `together_state` table stores household documents and short-lived rate-limit entries. Updates compare the entire expected document atomically in Postgres, preserving the API's conflict detection. Private access links and all visibility rules remain enforced on the server. Existing Upstash credentials are still supported as an optional alternative for previously configured installations.

For this deployment, the CLI uploaded the migration as a generated build artifact under `.netlify/internal/db/migrations`, and Netlify confirmed it was applied. Future schema changes should use new, sequential migrations. Do not edit already-applied migrations.

Open the live site, create your household, save your private access link, and share the separate invitation with your household members. On iPhone, open it in Safari and use Share → Add to Home Screen.

## Development

Use Node.js 22.12+ and install dependencies with `npm install`. Run `npm test` and `npm run build`. Use `netlify dev` for the Netlify backend and database environment. The original standalone development server uses the optional Redis backend. Sample mode remains temporary and does not save shared data.

## Access and privacy

- Four member slots, grouped as members 1–2 and 3–4. Display names are editable.
- Each member receives a random 256-bit private access key. Only its SHA-256 hash is stored with household data. The device remembers the key to stay signed in. Access links use a URL fragment that is removed from the address bar after opening.
- Private links act as sign-in credentials. Save yours securely. This version does not have email/password recovery or a member-key revocation interface. A lost key needs an owner-assisted database reset for that slot.
- The invitation allows its holder to claim an unclaimed member slot; it is not identity verification. Share only within the household. Replacing an invitation invalidates the old invitation, not already-issued member access.
- Server responses exclude the other couple’s private expenses and receipts. Private expenses must be paid by a member of the current couple. Only the author or payer can edit/delete an eligible expense.
- Couple-private entries are excluded from settlement. Shared entries allocate either 50/50 or 100% to one couple. For odd-cent equal splits, couple two receives the extra cent; every cent is accounted for.
- Recording settlement marks the selected sheet’s unsettled shared expenses as settled and locks them. It does not initiate a bank transfer. There is no settlement reversal interface.
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
- `scripts/`: dependency-free build and local development server.
- `netlify.toml` and `netlify/functions/household.mjs`: Netlify build configuration and native function adapter.
- `lib/netlify-storage.js`: managed Postgres storage adapter.
- `netlify/database/migrations/`: database schema migrations.
- `vercel.json`: optional original deployment settings.

No Grok source files, credentials, personal transaction data, or dependencies are copied into this app.
