# Supabase setup – step by step

Follow these steps so your admin "Save changes" syncs to all users.

---

## Step 1: Create the database table

1. In the **left sidebar** of your Supabase dashboard, click **"SQL Editor"**.
2. Click **"New query"** (or the + button).
3. Copy the entire SQL below and paste it into the editor:

```sql
create table if not exists public.site_config (
  id integer primary key default 1,
  config jsonb not null default '{}',
  updated_at timestamptz default now()
);

insert into public.site_config (id, config)
values (1, '{}')
on conflict (id) do nothing;

alter table public.site_config enable row level security;

create policy "Allow public read"
  on public.site_config for select
  using (true);

create policy "Allow public insert and update"
  on public.site_config for all
  using (true)
  with check (true);
```

4. Click **"Run"** (or press Ctrl+Enter).
5. You should see **"Success. No rows returned"** (that’s normal).

---

## Step 2: Get your Project URL and anon key

1. In the left sidebar, click **"Project Settings"** (gear icon at the bottom).
2. In the left menu under **"Configuration"**, click **"API"**.
3. On the API page you’ll see:
   - **Project URL** – e.g. `https://xxxxxxxxxxxxx.supabase.co`
   - **Project API keys** – find the key named **"anon" "public"**. Copy that key (long string).

Keep this tab open; you’ll need both values in the next step.

---

## Step 3: Add environment variables to your project

1. Open your project folder in your computer (the `capture-create-hub` folder).
2. In the **root** of the project (same level as `package.json`), create a new file named **`.env`** (with the dot at the start).
3. Paste this into `.env` and replace the placeholders with your real values from Step 2:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

Example (with fake values):

```
VITE_SUPABASE_URL=https://abcdefghijklmn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...
```

4. Save the file.

---

## Step 4: Restart the app

1. If the dev server is running, stop it (Ctrl+C in the terminal).
2. Start it again:

```bash
npm run dev
```

If you only build for production:

```bash
npm run build
```

---

## Step 5: Test that it works

1. Open your site and go to **/admin**.
2. Log in with **brijeshparjapat52@gmail.com**.
3. Change something small (e.g. form title or a label).
4. Click **"Save changes"** in the top-right.
5. You should see a toast: **"Saved! Changes will appear for all users."**
6. Open the site in a **new browser** (or incognito) and reload – you should see the same updated content.

If the toast says **"Saved locally..."** instead, the app is not reading your `.env`. Check that:
- The file is named exactly `.env` (with a dot) and is in the project root.
- Variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- You restarted the dev server after creating/editing `.env`.

---

## Optional: Check the table in Supabase

1. In Supabase, go to **Table Editor** in the left sidebar.
2. Open the **site_config** table.
3. You should see one row with `id = 1` and a `config` column. After you save from admin, that `config` will contain your full site configuration (hero, categories, form, etc.).
