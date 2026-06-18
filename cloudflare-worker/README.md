# Hacky Sack Preorder Counter — Cloudflare Worker

Live, shared, auto-decrementing counter for the Sun Punks preorder page. Runs on
Cloudflare's free tier (100k requests/day, no card required).

## What it does

- Stores `{ left8, left32 }` in Cloudflare Workers KV (Cloudflare's free
  key-value store).
- The preorder section fetches the live counts on page load.
- When someone submits a preorder, the section POSTs to this worker before
  submitting to Shopify, which decrements the count atomically.
- If the count for the chosen style is exhausted, the worker returns 409
  and the storefront refuses the submit and shows a sold-out message for
  that style.
- The other style stays sellable independently (8-panel and 32-panel
  caps are tracked separately).

## Deploy steps (one-time, ~10 minutes)

1. Sign up at <https://dash.cloudflare.com/sign-up> (free, email + password).
2. Once logged in, in the left sidebar click **Workers & Pages**.
3. Click **Create application** → **Create Worker**.
4. Name it whatever (e.g. `hackysack-counter`). Click **Deploy**.
5. After deploy, click **Edit code**.
6. Delete the placeholder code on the left. Paste the contents of `worker.js`
   from this folder. Click **Save and deploy**.
7. Now wire up the KV storage:
   - Go back to the worker's dashboard (top of left panel → click worker name).
   - Click **Settings** tab → **Variables and Secrets** → scroll to **KV
     namespace bindings** → click **Add binding**.
   - **Variable name:** `HACKYSACK_KV` (must match exactly).
   - **KV namespace:** click **Create a namespace**, name it
     `hackysack-state`, click **Add**.
   - Save the binding.
8. *(Optional)* To enable the `/reset` endpoint for resetting counts later:
   - Same Settings page → **Variables and Secrets** → **Add variable**.
   - Name: `RESET_SECRET`. Value: any long random string you keep private.
   - Save.
9. At the top of the worker dashboard, copy the worker URL (looks like
   `https://hackysack-counter.YOUR-ACCOUNT.workers.dev`).
10. Paste that URL into the Shopify theme editor: **Customize theme → open
    the preorder page → Preorder — Hacky Sack section → Counter API URL**.
    Save.

That's it. The page is now live-counter-backed.

## Operations

- **Check current counts:**
  Open the worker URL in a browser. You'll see `{"left8":45,"left32":45,...}`.

- **Reset counts** (e.g. starting a second drop):
  ```bash
  curl -X POST https://hackysack-counter.YOUR-ACCOUNT.workers.dev/reset \
       -H "Authorization: Bearer YOUR_RESET_SECRET"
  ```

- **Manually adjust counts** (e.g. cancel a preorder, refund a duplicate):
  Cloudflare dashboard → Workers & Pages → KV → `hackysack-state` namespace
  → click the `counts` key → edit the JSON → save.

## Changing the caps

The caps `MAX_8` and `MAX_32` are constants at the top of `worker.js`.
To change them, edit and redeploy. If you raise the cap, existing counts
stay (so increasing to 60 with `left8=10` means 25 more sold + 50 to go).

## Failure mode

If Cloudflare is unreachable, the storefront falls back to the theme-editor
"Spots taken so far" numbers and accepts preorders without decrementing the
worker. The merchant should still receive the `formsubmit.co` email
notifications in either case. Worth re-syncing counts via the KV dashboard
after any extended outage.
