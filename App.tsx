import React, { useEffect, useState } from "react";
import { Alert, Image, Linking, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { supabase } from "./src/supabase";

const gold = "#D6AD45";
const dark = "#101010";
const panel = "#1C1C1C";

type Tip = { id: string; title: string; body: string; language: string };
type Booking = { id: string; service_type: string; vehicle_type: string; preferred_date: string; note: string | null; status: string };

export default function App() {
  const [screen, setScreen] = useState<"home"|"tips"|"login"|"booking"|"history">("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [service, setService] = useState("General service");
  const [vehicle, setVehicle] = useState("Motorcycle");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadTips(); }, []);

  async function loadTips() {
    if (!supabase) return;
    const { data, error } = await supabase.from("tips").select("id,title,body,language").eq("is_published", true).order("created_at", { ascending: false });
    if (!error && data) setTips(data as Tip[]);
  }
  async function auth(mode: "sign-in"|"sign-up") {
    if (!supabase) return Alert.alert("Setup needed", "Please configure the Supabase URL and public key in the .env file.");
    if (!email.trim() || !password) return Alert.alert("Required", "Enter email and password.");
    setLoading(true);
    const result = mode === "sign-up"
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (result.error) return Alert.alert("Authentication", result.error.message);
    if (mode === "sign-up" && !result.data.session) {
      Alert.alert("Check your email", "Account created. Confirm your email if email confirmation is enabled, then sign in.");
    } else {
      setUserEmail(result.data.user?.email ?? email.trim());
      setScreen("home");
    }
  }
  async function logout() {
    await supabase?.auth.signOut();
    setUserEmail(null); setBookings([]); setScreen("home");
  }
  async function loadBookings() {
    if (!supabase) return;
    const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (error) return Alert.alert("Bookings", error.message);
    setBookings((data ?? []) as Booking[]);
  }
  async function createBooking() {
    if (!supabase) return Alert.alert("Setup needed", "Configure Supabase first.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setScreen("login"); return Alert.alert("Login required", "Sign in before requesting an appointment."); }
    if (!date.trim()) return Alert.alert("Date required", "Enter a preferred date, e.g. 2026-10-20.");
    setLoading(true);
    const { error } = await supabase.from("bookings").insert({
      customer_id: user.id, service_type: service, vehicle_type: vehicle,
      preferred_date: date.trim(), note: note.trim() || null
    });
    setLoading(false);
    if (error) return Alert.alert("Booking failed", error.message);
    Alert.alert("Request sent", "Your appointment request was sent. The garage will confirm it.");
    setNote(""); setScreen("history"); loadBookings();
  }
  function openWhatsApp() {
    const number = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER || "94770000000";
    Linking.openURL(`https://wa.me/${number}?text=${encodeURIComponent("Hello Pankaja Motobay, I need vehicle service information.")}`).catch(() => Alert.alert("WhatsApp", "Could not open WhatsApp."));
  }
  function openCall() {
    const phone = process.env.EXPO_PUBLIC_PHONE_NUMBER || "+94770000000";
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert("Call", "Could not open phone app."));
  }
  const btn = (label: string, action: () => void, outline = false) => (
    <TouchableOpacity onPress={action} style={{ padding: 14, borderRadius: 10, borderWidth: outline ? 1 : 0, borderColor: gold, backgroundColor: outline ? "transparent" : gold, marginVertical: 5 }}>
      <Text style={{ color: outline ? gold : dark, fontWeight: "800", textAlign: "center" }}>{label}</Text>
    </TouchableOpacity>
  );
  const field = (label: string, value: string, set: (v: string) => void, secure = false) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: "#DDD", marginBottom: 5 }}>{label}</Text>
      <TextInput value={value} onChangeText={set} secureTextEntry={secure} placeholderTextColor="#777" style={{ color: "white", borderColor: "#444", borderWidth: 1, borderRadius: 8, padding: 12 }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Image source={require("./assets/logo.jpg")} style={{ width: 190, height: 150, resizeMode: "contain", alignSelf: "center", marginBottom: 8 }} accessibilityLabel="Pankaja Motobay logo" />
        <Text style={{ color: gold, fontSize: 27, fontWeight: "900", marginBottom: 4, textAlign: "center" }}>PANKAJA MOTOBAY</Text>
        <Text style={{ color: "#CCC", marginBottom: 18 }}>Vehicle Care • Service • Repairs</Text>
        {!supabase && <Text style={{ color: "#FFB4A8", marginBottom: 12 }}>Setup required: copy .env.example to .env and add your Supabase public configuration.</Text>}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 15 }}>
          {(["home","tips","booking","history"] as const).map(s => <TouchableOpacity key={s} onPress={() => { setScreen(s); if (s === "history") loadBookings(); }} style={{ padding: 9, borderRadius: 8, backgroundColor: screen === s ? gold : panel }}><Text style={{ color: screen === s ? dark : "white", fontWeight: "700" }}>{({home:"Home",tips:"Care Tips",booking:"Book Service",history:"My Bookings"} as any)[s]}</Text></TouchableOpacity>)}
        </View>
        {screen === "home" && <View style={{ backgroundColor: panel, padding: 16, borderRadius: 14 }}>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "800", marginBottom: 8 }}>Your vehicle, our care.</Text>
          <Text style={{ color: "#CCC", lineHeight: 23 }}>Motorcycle, three-wheeler and car service enquiries. Request an appointment and the garage will contact you to confirm.</Text>
          {btn(userEmail ? `Signed in: ${userEmail}` : "Customer Login / Sign Up", () => setScreen("login"), true)}
          {btn("Request an Appointment", () => setScreen(userEmail ? "booking" : "login"))}
          {btn("WhatsApp Pankaja Motobay", openWhatsApp)}
          {btn("Call the Garage", openCall, true)}
          {userEmail && btn("Sign Out", logout, true)}
        </View>}
        {screen === "tips" && <View>
          <Text style={{ color: gold, fontSize: 20, fontWeight: "800", marginBottom: 10 }}>Vehicle Care Tips / වාහන නඩත්තු උපදෙස්</Text>
          {tips.length === 0 && <Text style={{ color: "#CCC" }}>No published tips yet. Please check again later.</Text>}
          {tips.map(t => <View key={t.id} style={{ backgroundColor: panel, padding: 14, borderRadius: 10, marginBottom: 10 }}><Text style={{ color: gold, fontSize: 17, fontWeight: "800" }}>{t.title}</Text><Text style={{ color: "#EEE", marginTop: 7, lineHeight: 22 }}>{t.body}</Text><Text style={{ color: "#888", marginTop: 5 }}>{t.language}</Text></View>)}
          {btn("Refresh Tips", loadTips, true)}
        </View>}
        {screen === "login" && <View style={{ backgroundColor: panel, padding: 16, borderRadius: 12 }}>
          <Text style={{ color: gold, fontSize: 21, fontWeight: "800", marginBottom: 12 }}>Customer Account</Text>
          {field("Email", email, setEmail)}
          {field("Password", password, setPassword, true)}
          {loading ? <ActivityIndicator color={gold} /> : <>
            {btn("Sign In", () => auth("sign-in"))}
            {btn("Create Account", () => auth("sign-up"), true)}
          </>}
          <Text style={{ color: "#999", fontSize: 12 }}>Use your own customer email and password. Admin accounts are managed separately.</Text>
        </View>}
        {screen === "booking" && <View style={{ backgroundColor: panel, padding: 16, borderRadius: 12 }}>
          <Text style={{ color: gold, fontSize: 21, fontWeight: "800", marginBottom: 12 }}>Appointment Request</Text>
          <Text style={{ color: "#DDD", marginBottom: 5 }}>Vehicle type</Text>
          <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>{["Motorcycle","Three-wheeler","Car","Other"].map(v => <TouchableOpacity key={v} onPress={() => setVehicle(v)} style={{ padding: 9, borderRadius: 8, backgroundColor: vehicle === v ? gold : "#333" }}><Text style={{ color: vehicle === v ? dark : "white" }}>{v}</Text></TouchableOpacity>)}</View>
          <Text style={{ color: "#DDD", marginBottom: 5 }}>Service type</Text>
          <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>{["General service","Engine repair","Electrical","Brake system","Other"].map(v => <TouchableOpacity key={v} onPress={() => setService(v)} style={{ padding: 9, borderRadius: 8, backgroundColor: service === v ? gold : "#333" }}><Text style={{ color: vehicle === v ? dark : "white" }}>{v}</Text></TouchableOpacity>)}</View>
          {field("Preferred date (YYYY-MM-DD)", date, setDate)}
          {field("Extra details (optional)", note, setNote)}
          {loading ? <ActivityIndicator color={gold} /> : btn("Send Appointment Request", createBooking)}
        </View>}
        {screen === "history" && <View>
          <Text style={{ color: gold, fontSize: 21, fontWeight: "800", marginBottom: 10 }}>My Bookings</Text>
          {!userEmail && <Text style={{ color: "#CCC" }}>Sign in to view your appointment requests.</Text>}
          {userEmail && bookings.map(b => <View key={b.id} style={{ backgroundColor: panel, padding: 13, borderRadius: 10, marginBottom: 9 }}><Text style={{ color: "white", fontWeight: "800" }}>{b.vehicle_type} — {b.service_type}</Text><Text style={{ color: "#CCC", marginTop: 5 }}>Date: {b.preferred_date}</Text><Text style={{ color: gold, marginTop: 5 }}>Status: {b.status}</Text>{b.note ? <Text style={{ color: "#CCC" }}>{b.note}</Text> : null}</View>)}
          {userEmail && btn("Refresh Bookings", loadBookings, true)}
        </View>}
        <Text style={{ color: "#666", fontSize: 11, textAlign: "center", marginTop: 25 }}>Appointment requests are not confirmed until the garage responds.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
