# Pankaja Motobay Customer App

Starter Expo app for Android with customer sign-up/sign-in, published vehicle-care tips, appointment requests, booking history, WhatsApp and call links.

## Before running
1. Install Node.js LTS on your computer.
2. Open this folder in VS Code.
3. Copy `.env.example` to a new file named `.env`.
4. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from your NEW Supabase project.
5. Replace WhatsApp and phone placeholders with the business contact numbers.
6. In Terminal, run:
   ```bash
   npm install
   npx expo start
   ```

Do not put a Supabase `service_role` / secret key in this app. Never upload `.env` to GitHub.
For the database tables and security policies, use the `schema.sql` from the Admin Panel ZIP's `supabase` folder, or the separate SQL file provided with the project.

## Notes
This is a starter project and must be tested against your Supabase project before public release. Android package/build setup and real contact details still need confirming.
