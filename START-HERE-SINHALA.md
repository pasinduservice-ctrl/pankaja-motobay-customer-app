# මුලින්ම කියවන්න — Pankaja Motobay Customer App

1. මේ ZIP එක Extract කරන්න.
2. Extract කළ `Pankaja-Motobay-Customer-App` folder එක VS Code එකෙන් Open Folder කරන්න.
3. `.env.example` file එක copy කරලා ඒ copy එක `.env` ලෙස rename කරන්න.
4. `.env` ඇතුළේ `EXPO_PUBLIC_SUPABASE_URL` සහ `EXPO_PUBLIC_SUPABASE_ANON_KEY` අලුත් Supabase project එකේ values වලින් පුරවන්න. සැබෑ `service_role` key එක දාන්න එපා.
5. VS Code Terminal එකේ මේ commands දෙන්න:
   `npm install`
   ඉන්පසු `npx expo start`
6. Database එක සූදානම් කිරීමට `supabase/schema.sql` file එක අලුත් Supabase project එකේ SQL Editor එකෙන් run කරන්න.
7. Admin panel එක සඳහා වෙනම Admin ZIP එකේ README බලන්න.

වැදගත්: මේ files starter version එකක්. මෙහි `.env` file එකක් ඇතුළත් කර නැහැ; ඔබේ project values ඔබම එකතු කළ යුතුයි. Run කරලා සැබෑ Supabase project එකට connect කරලා පරීක්ෂා කිරීම අත්‍යවශ්‍යයි.
