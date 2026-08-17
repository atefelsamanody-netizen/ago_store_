"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, User } from "firebase/auth";
import { db, auth } from "@/app/lib/firebase";

type Order = { id: string; total?: number; totalPrice?: number; productsTotal?: number; phone?: string; customerPhone?: string; status?: string; };
type Product = { id: string; price?: number; stock?: number; };

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function checkAdmin(currentUser: User) {
    const adminRef = doc(db, "admins", currentUser.uid);
    const adminSnapshot = await getDoc(adminRef);
    if (!adminSnapshot.exists()) { await signOut(auth); return false; }
    const adminData = adminSnapshot.data();
    if (String(adminData?.role || "").toLowerCase() !== "admin") { await signOut(auth); return false; }
    setIsAdmin(true); return true;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { setUser(null); setIsAdmin(false); setLoading(false); setAuthLoading(false); return; }
      setUser(currentUser);
      const allowed = await checkAdmin(currentUser);
      if (!allowed) setLoading(false);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { if (user && isAdmin) loadDashboard(); }, [user, isAdmin]);

  async function handleLogin() {
    setLoginError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await checkAdmin(credential.user);
      setPassword("");
    } catch { setLoginError("البريد او كلمة المرور غلط"); }
  }

  async function handleLogout() { await signOut(auth); setUser(null); setIsAdmin(false); }

  async function loadDashboard() {
    setLoading(true);
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    setOrders(ordersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    const productsSnapshot = await getDocs(collection(db, "products"));
    setProducts(productsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    setLoading(false);
  }
  
  if(authLoading) return <div>جاري التحقق...</div>
  if(!user || !isAdmin) return (
    <div dir="rtl">
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="الايميل"/>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة السر"/>
      <button onClick={handleLogin}>دخول</button>
      {loginError && <p>{loginError}</p>}
    </div>
  )
  if(loading) return <div>Loading...</div>
  
  return <div dir="rtl">
    <h1>Dashboard</h1>
    <p>Orders: {orders.length}</p>
    <p>Products: {products.length}</p>
    <button onClick={handleLogout}>خروج</button>
  </div>
}