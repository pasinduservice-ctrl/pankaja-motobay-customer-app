# Pankaja Motobay Admin Panel

Responsive web admin panel for managing appointment requests and vehicle care tips.

## Local setup
1. Install Node.js LTS.
2. Copy `.env.example` to `.env`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the same NEW Supabase project used by the customer app.
4. Open a terminal in this folder and run:
   ```bash
   npm install
   npm run dev
   ```
5. Open the local URL shown by Vite.

## Database and admin
1. In a NEW Supabase project, open SQL Editor and run `supabase/schema.sql`.
2. Create an admin user in Supabase Dashboard > Authentication > Users.
3. Copy that user's UUID, then run in SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where id = 'PASTE-ADMIN-USER-UUID-HERE';
   ```
4. Sign in to the panel with that admin user's email and password.

## Deploy to Netlify
- Create a separate private GitHub repository for this admin panel and upload these files (do not upload `.env`).
- In Netlify, import that repository.
- Build command: `npm run build`
- Publish directory: `dist`
- Set environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify site environment variables, then redeploy.

## Security
Never use a Supabase service-role/secret key in this browser app. Do not upload `.env`. The public/anon key is intended for client apps; database security relies on RLS policies. This is a starter implementation and needs testing before production use.
