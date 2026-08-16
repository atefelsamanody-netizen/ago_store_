"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

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

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD DASHBOARD
  // =========================

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      // =========================
      // ORDERS
      // =========================

      const ordersSnapshot = await getDocs(
        collection(db, "orders")
      );

      const loadedOrders: Order[] =
        ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Order, "id">),
        }));

      // =========================
      // PRODUCTS
      // =========================

      const productsSnapshot = await getDocs(
        collection(db, "products")
      );

      const loadedProducts: Product[] =
        productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Product, "id">),
        }));

      setOrders(loadedOrders);
      setProducts(loadedProducts);

      console.log("📦 Orders:", loadedOrders);
      console.log("🛍 Products:", loadedProducts);
    } catch (error) {
      console.error("❌ DASHBOARD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // CUSTOMERS
  // =========================

  const customers = new Set(
    orders
      .map(
        (order) =>
          order.phone ||
          order.customerPhone ||
          ""
      )
      .filter(Boolean)
  );

  // =========================
  // SALES
  // =========================

  const sales = orders.reduce(
    (total, order) => {
      const productsTotal =
        Number(order.productsTotal) ||
        Number(order.totalPrice) ||
        Number(order.total) ||
        0;

      return total + productsTotal;
    },
    0
  );

  // =========================
  // CURRENT ORDERS
  // =========================

  const activeOrders = orders.filter(
    (order) => order.status !== "cancelled"
  );

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <>
        <div className="dashboard-loading">
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

  // =========================
  // DASHBOARD
  // =========================

  return (
    <>
      <div className="admin-dashboard">

        {/* =========================
            HEADER
        ========================= */}

        <div className="admin-dashboard-header">

          <div className="dashboard-heading">

            <h1 className="admin-title">
              Dashboard
            </h1>

            <p>
              A.GO Store Overview
            </p>

          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="admin-refresh-btn"
          >
            ↻ Refresh
          </button>

        </div>

        {/* =========================
            DASHBOARD CARDS
        ========================= */}

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
              {sales.toLocaleString("en-US")} EGP
            </h2>

            <p>
              Sales
            </p>

          </div>

        </div>

      </div>

      {/* =========================
          MOBILE RESPONSIVE
      ========================= */}

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
          justify-content: space-between;
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

        .admin-refresh-btn {
          flex-shrink: 0;
          border: none;
          background: #111;
          color: #fff;
          padding: 12px 22px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.25s ease;
          white-space: nowrap;
        }

        .admin-refresh-btn:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }

        .dashboard-cards {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .dashboard-card {
          min-width: 0;
          width: 100%;
          box-sizing: border-box;

          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 20px;

          padding: 28px 22px;

          box-shadow:
            0 8px 25px rgba(0, 0, 0, 0.05);

          overflow: hidden;
        }

        .dashboard-card h2 {
          margin: 0;

          color: #111;

          font-size: clamp(28px, 3vw, 42px);

          font-weight: 800;

          line-height: 1.1;

          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .dashboard-card p {
          margin: 12px 0 0;

          color: #777;

          font-size: 15px;

          font-weight: 600;
        }

        .sales-card h2 {
          font-size: clamp(24px, 2.5vw, 38px);
        }

        /* =========================
           TABLET
        ========================= */

        @media (max-width: 900px) {

          .dashboard-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 600px) {

          .admin-dashboard {
            padding: 0;
          }

          .admin-dashboard-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            margin-bottom: 22px;
          }

          .dashboard-heading {
            width: 100%;
          }

          .dashboard-heading :global(.admin-title) {
            font-size: 30px !important;
            line-height: 1.1;
          }

          .dashboard-heading p {
            font-size: 14px;
            margin-top: 7px;
          }

          .admin-refresh-btn {
            width: 100%;
            min-height: 48px;
            padding: 13px 18px;
            font-size: 15px;
            border-radius: 13px;
          }

          .dashboard-cards {
            width: 100%;
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .dashboard-card {
            width: 100%;
            min-height: 125px;
            padding: 22px 20px;
            border-radius: 17px;
          }

          .dashboard-card h2 {
            font-size: 34px;
          }

          .dashboard-card p {
            margin-top: 9px;
            font-size: 14px;
          }

          .sales-card h2 {
            font-size: 30px;
          }

        }

        /* =========================
           VERY SMALL PHONES
        ========================= */

        @media (max-width: 380px) {

          .dashboard-card {
            padding: 20px 16px;
          }

          .dashboard-card h2 {
            font-size: 30px;
          }

          .sales-card h2 {
            font-size: 26px;
          }

          .dashboard-heading :global(.admin-title) {
            font-size: 27px !important;
          }

        }

      `}</style>
    </>
  );
}