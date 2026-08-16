"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";

import { db, auth } from "@/app/lib/firebase";

/* =========================================================
   TYPES
========================================================= */

type Order = {
  id: string;

  total?: number;
  totalPrice?: number;
  productsTotal?: number;

  paidAmount?: number;
  deposit?: number;
  depositAmount?: number;

  shipping?: number;
  shippingCost?: number;

  phone?: string;
  customerPhone?: string;

  status?: string;

  createdAt?: any;
};

type Product = {
  id: string;
  price?: number;
  stock?: number;
};

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const [user, setUser] =
    useState<User | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [adminChecking, setAdminChecking] =
    useState(false);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loginError, setLoginError] =
    useState("");

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =========================================================
     CHECK ADMIN
  ========================================================= */

  async function checkAdmin(
    currentUser: User
  ) {
    try {
      setAdminChecking(true);

      /*
        كل Admin له document داخل:

        admins/{UID}

        مثال:

        admins
          └── USER_UID
                role: "admin"
                active: true
      */

      const adminRef = doc(
        db,
        "admins",
        currentUser.uid
      );

      const adminSnapshot =
        await getDoc(adminRef);

      if (!adminSnapshot.exists()) {
        await signOut(auth);

        setUser(null);
        setIsAdmin(false);

        setLoginError(
          "هذا الحساب ليس لديه صلاحية الأدمن."
        );

        return false;
      }

      const adminData =
        adminSnapshot.data();

      const role =
        String(
          adminData?.role || ""
        ).toLowerCase();

      const active =
        adminData?.active !== false;

      if (
        role !== "admin" ||
        !active
      ) {
        await signOut(auth);

        setUser(null);
        setIsAdmin(false);

        setLoginError(
          "ليس لديك صلاحية الدخول إلى لوحة الأدمن."
        );

        return false;
      }

      setIsAdmin(true);

      return true;

    } catch (error) {
      console.error(
        "ADMIN CHECK ERROR:",
        error
      );

      await signOut(auth);

      setUser(null);
      setIsAdmin(false);

      setLoginError(
        "حدث خطأ أثناء التحقق من صلاحيات الأدمن."
      );

      return false;

    } finally {
      setAdminChecking(false);
    }
  }

  /* =========================================================
     AUTH STATE
  ========================================================= */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          setAuthLoading(true);

          if (!currentUser) {
            setUser(null);
            setIsAdmin(false);
            setLoading(false);
            setAuthLoading(false);
            return;
          }

          setUser(currentUser);

          const allowed =
            await checkAdmin(
              currentUser
            );

          if (!allowed) {
            setLoading(false);
          }

          setAuthLoading(false);
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {
    if (
      user &&
      isAdmin
    ) {
      loadDashboard();
    }
  }, [user, isAdmin]);

  /* =========================================================
     LOGIN
  ========================================================= */

  async function handleLogin() {
    setLoginError("");

    if (!email.trim()) {
      setLoginError(
        "اكتب البريد الإلكتروني."
      );
      return;
    }

    if (!password) {
      setLoginError(
        "اكتب كلمة المرور."
      );
      return;
    }

    try {
      setLoginLoading(true);

      const credential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      /*
        لا نعتمد على الإيميل وحده.

        بعد تسجيل الدخول:
        يتم فحص admins/{uid}

        وده أهم جزء في الحماية.
      */

      const allowed =
        await checkAdmin(
          credential.user
        );

      if (!allowed) {
        return;
      }

      setPassword("");

    } catch (error: any) {
      console.error(
        "ADMIN LOGIN ERROR:",
        error
      );

      setLoginError(
        "البريد الإلكتروني أو كلمة المرور غير صحيحة."
      );

    } finally {
      setLoginLoading(false);
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  async function handleLogout() {
    try {
      await signOut(auth);

      setUser(null);
      setIsAdmin(false);

      setOrders([]);
      setProducts([]);

    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );
    }
  }

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  async function loadDashboard() {
    try {
      setLoading(true);

      /* =====================================================
         ORDERS
      ===================================================== */

      const ordersSnapshot =
        await getDocs(
          collection(db, "orders")
        );

      const loadedOrders: Order[] =
        ordersSnapshot.docs.map(
          (orderDoc) => ({
            id: orderDoc.id,

            ...(orderDoc.data() as Omit<
              Order,
              "id"
            >),
          })
        );

      /* =====================================================
         PRODUCTS
      ===================================================== */

      const productsSnapshot =
        await getDocs(
          collection(db, "products")
        );

      const loadedProducts: Product[] =
        productsSnapshot.docs.map(
          (productDoc) => ({
            id: productDoc.id,

            ...(productDoc.data() as Omit<
              Product,
              "id"
            >),
          })
        );

      setOrders(
        loadedOrders
      );

      setProducts(
        loadedProducts
      );

      console.log(
        "📦 Orders:",
        loadedOrders
      );

      console.log(
        "🛍 Products:",
        loadedProducts
      );

    } catch (error) {
      console.error(
        "❌ DASHBOARD ERROR:",
        error
      );

    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     AUTH LOADING
  ========================================================= */

  if (
    authLoading ||
    adminChecking
  ) {
    return (
      <>
        <main
          className="admin-auth-loading"
          dir="rtl"
        >
          <div>

            <div className="admin-loading-logo">
              A.GO
            </div>

            <p>
              جاري التحقق...
            </p>

          </div>
        </main>

        <style jsx>{`

          .admin-auth-loading {
            min-height: 100vh;
            width: 100%;

            display: flex;
            align-items: center;
            justify-content: center;

            background: #f7f7f7;

            color: #111;

            text-align: center;
          }

          .admin-loading-logo {
            font-size: 38px;
            font-weight: 900;
            letter-spacing: 2px;
          }

          .admin-auth-loading p {
            color: #777;
            margin-top: 10px;
            font-size: 14px;
          }

        `}</style>
      </>
    );
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  if (
    !user ||
    !isAdmin
  ) {
    return (
      <>
        <main
          className="admin-login-page"
          dir="rtl"
        >

          <div className="admin-login-box">

            <div className="admin-login-logo">
              A.GO
            </div>

            <h1>
              صفحة الأدمن
            </h1>

            <p>
              تسجيل الدخول إلى لوحة التحكم
            </p>

            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              autoComplete="username"
              onChange={(e) => {
                setEmail(
                  e.target.value
                );

                setLoginError("");
              }}
            />

            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(
                  e.target.value
                );

                setLoginError("");
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  handleLogin();
                }
              }}
            />

            {loginError && (
              <div className="admin-login-error">
                {loginError}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading
                ? "جاري تسجيل الدخول..."
                : "دخول"}
            </button>

          </div>

        </main>

        <style jsx>{`

          .admin-login-page {
            min-height: 100vh;
            width: 100%;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 20px;

            box-sizing: border-box;

            background: #f7f7f7;
          }

          .admin-login-box {
            width: 100%;
            max-width: 420px;

            background: #fff;

            border: 1px solid #e8e8e8;

            border-radius: 24px;

            padding: 35px 28px;

            box-sizing: border-box;

            text-align: center;

            box-shadow:
              0 15px 45px
              rgba(0, 0, 0, 0.08);
          }

          .admin-login-logo {
            font-size: 38px;
            font-weight: 900;

            letter-spacing: 2px;

            color: #111;

            margin-bottom: 25px;
          }

          .admin-login-box h1 {
            margin: 0;

            color: #111;

            font-size: 27px;

            font-weight: 800;
          }

          .admin-login-box p {
            margin: 10px 0 25px;

            color: #777;

            font-size: 14px;
          }

          .admin-login-box input {
            width: 100%;

            height: 52px;

            border:
              1px solid #ddd;

            border-radius: 13px;

            padding:
              0 16px;

            box-sizing:
              border-box;

            font-size: 16px;

            outline: none;

            color: #111;

            background: #fff;

            margin-bottom: 12px;
          }

          .admin-login-box input:focus {
            border-color: #111;
          }

          .admin-login-box button {
            width: 100%;

            height: 52px;

            margin-top: 5px;

            border: none;

            border-radius: 13px;

            background: #111;

            color: #fff;

            font-size: 16px;

            font-weight: 800;

            cursor: pointer;

            transition:
              0.2s ease;
          }

          .admin-login-box button:hover {
            opacity: 0.9;
          }

          .admin-login-box button:disabled {
            opacity: 0.6;

            cursor: not-allowed;
          }

          .admin-login-error {
            margin:
              5px 0 12px;

            color: #c00000;

            font-size: 14px;

            font-weight: 700;

            line-height: 1.5;
          }

          @media (max-width: 600px) {

            .admin-login-page {
              padding: 16px;
            }

            .admin-login-box {
              padding:
                30px 20px;

              border-radius: 20px;
            }

            .admin-login-logo {
              font-size: 34px;
            }

            .admin-login-box h1 {
              font-size: 24px;
            }

          }

        `}</style>
      </>
    );
  }

  /* =========================================================
     DASHBOARD LOADING
  ========================================================= */

  if (loading) {
    return (
      <>
        <div
          className="dashboard-loading"
          dir="rtl"
        >

          <h1 className="admin-title">
            Dashboard
          </h1>

          <p>
            Loading dashboard...
          </p>

        </div>

        <style jsx>{`

          .dashboard-loading {
            width: 100%;
            padding: 20px;
            color: #111;
          }

          @media (max-width: 600px) {

            .dashboard-loading {
              padding: 15px;
            }

            .dashboard-loading h1 {
              font-size: 28px !important;
            }

            .dashboard-loading p {
              font-size: 14px;
            }

          }

        `}</style>
      </>
    );
  }

  /* =========================================================
     CUSTOMERS
  ========================================================= */

  const customers =
    new Set(
      orders
        .map(
          (order) =>
            order.phone ||
            order.customerPhone ||
            ""
        )
        .filter(Boolean)
    );

  /* =========================================================
     SALES
  ========================================================= */

  const sales =
    orders.reduce(
      (total, order) => {

        const productsTotal =
          Number(
            order.productsTotal
          ) ||
          Number(
            order.totalPrice
          ) ||
          Number(
            order.total
          ) ||
          0;

        return (
          total +
          productsTotal
        );
      },
      0
    );

  /* =========================================================
     ACTIVE ORDERS
  ========================================================= */

  const activeOrders =
    orders.filter(
      (order) =>
        order.status !==
        "cancelled"
    );

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <>
      <div
        className="admin-dashboard"
        dir="rtl"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-dashboard-header">

          <div className="dashboard-heading">

            <h1 className="admin-title">
              Dashboard
            </h1>

            <p>
              A.GO Store Overview
            </p>

          </div>

          <div className="dashboard-actions">

            <button
              type="button"
              onClick={
                loadDashboard
              }
              className="admin-refresh-btn"
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="admin-logout-btn"
            >
              تسجيل الخروج
            </button>

          </div>

        </div>

        {/* =================================================
            DASHBOARD CARDS
        ================================================= */}

        <div className="dashboard-cards">

          {/* ORDERS */}

          <div className="dashboard-card">

            <h2>
              {activeOrders.length}
            </h2>

            <p>
              Orders
            </p>

          </div>

          {/* PRODUCTS */}

          <div className="dashboard-card">

            <h2>
              {products.length}
            </h2>

            <p>
              Products
            </p>

          </div>

          {/* CUSTOMERS */}

          <div className="dashboard-card">

            <h2>
              {customers.size}
            </h2>

            <p>
              Customers
            </p>

          </div>

          {/* SALES */}

          <div className="dashboard-card sales-card">

            <h2>
              {sales.toLocaleString(
                "en-US"
              )}{" "}
              EGP
            </h2>

            <p>
              Sales
            </p>

          </div>

        </div>

      </div>

      {/* =================================================
          CSS
      ================================================= */}

      <style jsx>{`

        .admin-dashboard {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .admin-dashboard-header {
          width: 100%;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 20px;

          margin-bottom: 30px;
        }

        .dashboard-heading {
          min-width: 0;
        }

        .dashboard-heading p {
          margin: 8px 0 0;
          color: #777;
        }

        .dashboard-actions {
          display: flex;

          align-items: center;

          gap: 10px;

          flex-shrink: 0;
        }

        .admin-refresh-btn {
          border: none;

          background: #111;

          color: #fff;

          padding:
            12px 22px;

          border-radius: 12px;

          font-size: 15px;

          font-weight: 700;

          cursor: pointer;

          transition:
            0.25s ease;

          white-space:
            nowrap;
        }

        .admin-refresh-btn:hover {
          transform:
            translateY(-2px);

          opacity: 0.9;
        }

        .admin-logout-btn {
          border:
            1px solid #ddd;

          background: #fff;

          color: #111;

          padding:
            12px 18px;

          border-radius: 12px;

          font-size: 14px;

          font-weight: 700;

          cursor: pointer;

          white-space:
            nowrap;

          transition:
            0.25s ease;
        }

        .admin-logout-btn:hover {
          background: #111;

          color: #fff;

          border-color: #111;
        }

        .dashboard-cards {
          width: 100%;

          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );

          gap: 20px;
        }

        .dashboard-card {
          min-width: 0;

          width: 100%;

          box-sizing:
            border-box;

          background: #fff;

          border:
            1px solid #e8e8e8;

          border-radius: 20px;

          padding:
            28px 22px;

          box-shadow:
            0 8px 25px
            rgba(
              0,
              0,
              0,
              0.05
            );

          overflow: hidden;
        }

        .dashboard-card h2 {
          margin: 0;

          color: #111;

          font-size:
            clamp(
              28px,
              3vw,
              42px
            );

          font-weight: 800;

          line-height: 1.1;

          overflow-wrap:
            anywhere;

          word-break:
            break-word;
        }

        .dashboard-card p {
          margin:
            12px 0 0;

          color: #777;

          font-size: 15px;

          font-weight: 600;
        }

        .sales-card h2 {
          font-size:
            clamp(
              24px,
              2.5vw,
              38px
            );
        }

        /* =================================================
           TABLET
        ================================================= */

        @media (max-width: 900px) {

          .dashboard-cards {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 600px) {

          .admin-dashboard {
            padding: 0;
          }

          .admin-dashboard-header {
            flex-direction:
              column;

            align-items:
              stretch;

            gap: 16px;

            margin-bottom:
              22px;
          }

          .dashboard-heading {
            width: 100%;
          }

          .dashboard-heading
            :global(.admin-title) {

            font-size:
              30px !important;

            line-height:
              1.1;
          }

          .dashboard-heading p {
            font-size: 14px;

            margin-top: 7px;
          }

          .dashboard-actions {
            width: 100%;

            display: grid;

            grid-template-columns:
              1fr 1fr;

            gap: 10px;
          }

          .admin-refresh-btn,
          .admin-logout-btn {

            width: 100%;

            min-height: 48px;

            padding:
              13px 10px;

            font-size: 14px;

            border-radius: 13px;
          }

          .dashboard-cards {

            width: 100%;

            grid-template-columns:
              1fr;

            gap: 14px;
          }

          .dashboard-card {

            width: 100%;

            min-height:
              125px;

            padding:
              22px 20px;

            border-radius:
              17px;
          }

          .dashboard-card h2 {
            font-size:
              34px;
          }

          .dashboard-card p {

            margin-top:
              9px;

            font-size:
              14px;
          }

          .sales-card h2 {
            font-size:
              30px;
          }

        }

        /* =================================================
           VERY SMALL PHONES
        ================================================= */

        @media (max-width: 380px) {

          .dashboard-card {
            padding:
              20px 16px;
          }

          .dashboard-card h2 {
            font-size:
              30px;
          }

          .sales-card h2 {
            font-size:
              26px;
          }

          .dashboard-heading
            :global(.admin-title) {

            font-size:
              27px !important;
          }

        }

      `}</style>
    </>
  );
}