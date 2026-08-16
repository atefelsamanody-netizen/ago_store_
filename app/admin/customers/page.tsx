"use client";

import { useEffect, useMemo, useState } from "react";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

type Customer = {
  id: string;
  name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  lastStatus: string;
  lastOrderAt: number;
};

type Order = {
  id: string;

  name?: string;
  phone?: string;

  governorate?: string;
  city?: string;
  address?: string;

  total?: number;
  totalPrice?: number;
  productsTotal?: number;

  status?: string;
  createdAt?: any;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  // ==========================================
  // GET TIMESTAMP
  // ==========================================

  function getTimestamp(value: any): number {
    if (!value) return 0;

    // Firebase Timestamp
    if (typeof value?.toMillis === "function") {
      return value.toMillis();
    }

    // Date
    if (value instanceof Date) {
      return value.getTime();
    }

    // Number
    if (typeof value === "number") {
      return value;
    }

    // String date
    const parsed = new Date(value).getTime();

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  // ==========================================
  // LOAD CUSTOMERS
  // ==========================================

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const ordersRef = collection(db, "orders");

      let snapshot;

      try {
        const q = query(
          ordersRef,
          orderBy("createdAt", "desc")
        );

        snapshot = await getDocs(q);
      } catch {
        snapshot = await getDocs(ordersRef);
      }

      const orders: Order[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Order, "id">),
      }));

      // ==========================================
      // GROUP CUSTOMERS BY PHONE
      // ==========================================

      const customerMap = new Map<string, Customer>();

      orders.forEach((order) => {
        const phone = String(order.phone || "").trim();

        if (!phone) return;

        const name = String(order.name || "").trim();

        const governorate = String(
          order.governorate || ""
        ).trim();

        const city = String(
          order.city || ""
        ).trim();

        const address = String(
          order.address || ""
        ).trim();

        const orderTotal =
          Number(order.productsTotal) ||
          Number(order.totalPrice) ||
          Number(order.total) ||
          0;

        const orderTime = getTimestamp(
          order.createdAt
        );

        const existing = customerMap.get(phone);

        // ==========================================
        // EXISTING CUSTOMER
        // ==========================================

        if (existing) {
          existing.ordersCount += 1;

          existing.totalSpent += orderTotal;

          if (name) {
            existing.name = name;
          }

          if (governorate) {
            existing.governorate = governorate;
          }

          if (city) {
            existing.city = city;
          }

          if (address) {
            existing.address = address;
          }

          // أحدث طلب
          if (
            orderTime >=
            existing.lastOrderAt
          ) {
            existing.lastOrderAt =
              orderTime;

            existing.lastStatus =
              String(
                order.status || ""
              ).trim();
          }
        }

        // ==========================================
        // NEW CUSTOMER
        // ==========================================

        else {
          customerMap.set(phone, {
            id: phone,

            name:
              name || "عميل",

            phone,

            governorate,

            city,

            address,

            ordersCount: 1,

            totalSpent:
              orderTotal,

            lastStatus:
              String(
                order.status || ""
              ).trim(),

            lastOrderAt:
              orderTime,
          });
        }
      });

      // ==========================================
      // SORT CUSTOMERS
      // الأحدث أولًا
      // ==========================================

      const customersList =
        Array.from(
          customerMap.values()
        ).sort(
          (a, b) =>
            b.lastOrderAt -
            a.lastOrderAt
        );

      setCustomers(
        customersList
      );

    } catch (err) {
      console.error(
        "LOAD CUSTOMERS ERROR:",
        err
      );

      setCustomers([]);

      setError(
        "حدث خطأ أثناء تحميل العملاء."
      );

    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // MONEY
  // ==========================================

  function money(value: number) {
    return `${Number(
      value || 0
    ).toLocaleString("en-US")} EGP`;
  }

  // ==========================================
  // DATE
  // ==========================================

  function formatDate(
    timestamp: number
  ) {
    if (!timestamp) {
      return "-";
    }

    return new Date(
      timestamp
    ).toLocaleDateString(
      "ar-EG",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  // ==========================================
  // STATUS
  // ==========================================

  function getStatusLabel(
    status: string
  ) {
    const value =
      String(
        status || ""
      ).toLowerCase();

    if (
      value === "new" ||
      value === "pending"
    ) {
      return "طلب جديد";
    }

    if (
      value === "confirmed" ||
      value === "confirm"
    ) {
      return "تم تأكيد الطلب";
    }

    if (
      value === "preparing" ||
      value === "processing"
    ) {
      return "جاري تجهيز الطلب";
    }

    if (
      value === "shipped" ||
      value === "shipping"
    ) {
      return "تم شحن الطلب";
    }

    if (
      value === "delivered" ||
      value === "completed"
    ) {
      return "تم تسليم الطلب";
    }

    if (
      value === "cancelled" ||
      value === "canceled"
    ) {
      return "تم إلغاء الطلب";
    }

    return status || "غير محدد";
  }

  // ==========================================
  // FILTER
  // ==========================================

  const filteredCustomers =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return customers;
      }

      return customers.filter(
        (customer) =>
          customer.name
            .toLowerCase()
            .includes(value) ||
          customer.phone
            .toLowerCase()
            .includes(value) ||
          customer.governorate
            .toLowerCase()
            .includes(value) ||
          customer.city
            .toLowerCase()
            .includes(value)
      );
    }, [
      customers,
      search,
    ]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="admin-customers-page">
        <div className="customers-page-header">
          <div>
            <h1 className="admin-title">
              Customers
            </h1>

            <p className="customers-subtitle">
              جاري تحميل بيانات العملاء...
            </p>
          </div>
        </div>

        <div className="customers-loading">
          جاري تحميل العملاء...
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <main className="admin-customers-page">
        <div className="customers-page-header">
          <div>
            <h1 className="admin-title">
              Customers
            </h1>

            <p className="customers-subtitle">
              قاعدة بيانات العملاء
            </p>
          </div>

          <button
            type="button"
            className="refresh-customers-btn"
            onClick={loadCustomers}
          >
            ↻ تحديث
          </button>
        </div>

        <div className="customers-error">
          {error}
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="admin-customers-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="customers-page-header">

        <div>
          <h1 className="admin-title">
            Customers
          </h1>

          <p className="customers-count">
            {customers.length} عميل
          </p>

          <p className="customers-subtitle">
            كل عميل قام بعمل طلب يظهر هنا تلقائيًا
          </p>
        </div>

        <button
          type="button"
          className="refresh-customers-btn"
          onClick={loadCustomers}
        >
          ↻ تحديث
        </button>

      </div>

      {/* =====================================
          SEARCH
      ====================================== */}

      {customers.length > 0 && (
        <div className="customers-toolbar">

          <div className="customers-search">

            <span className="search-icon">
              🔎
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="ابحث بالاسم أو رقم الهاتف أو المدينة..."
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>
            )}

          </div>

          <div className="customers-result-count">
            {filteredCustomers.length} من{" "}
            {customers.length}
          </div>

        </div>
      )}

      {/* =====================================
          EMPTY
      ====================================== */}

      {customers.length === 0 ? (

        <div className="customers-empty">

          <div className="empty-icon">
            👤
          </div>

          <h2>
            لا يوجد عملاء حتى الآن
          </h2>

          <p>
            بمجرد وجود طلب يحتوي على رقم هاتف
            سيظهر العميل هنا تلقائيًا.
          </p>

        </div>

      ) : filteredCustomers.length === 0 ? (

        <div className="customers-empty">

          <div className="empty-icon">
            🔎
          </div>

          <h2>
            لا توجد نتائج
          </h2>

          <p>
            جرّب البحث باسم مختلف أو رقم هاتف آخر.
          </p>

          <button
            type="button"
            className="reset-search-btn"
            onClick={() =>
              setSearch("")
            }
          >
            مسح البحث
          </button>

        </div>

      ) : (

        /* =====================================
           TABLE
        ====================================== */

        <div className="customers-table-wrapper">

          <table className="customers-table">

            <thead>
              <tr>

                <th>
                  #
                </th>

                <th>
                  العميل
                </th>

                <th>
                  رقم الهاتف
                </th>

                <th>
                  المحافظة
                </th>

                <th>
                  المدينة
                </th>

                <th>
                  العنوان
                </th>

                <th>
                  الطلبات
                </th>

                <th>
                  إجمالي المنتجات
                </th>

                <th>
                  آخر طلب
                </th>

                <th>
                  الحالة
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredCustomers.map(
                (
                  customer,
                  index
                ) => (

                  <tr
                    key={
                      customer.id
                    }
                  >

                    {/* NUMBER */}

                    <td className="customer-number">
                      {index + 1}
                    </td>

                    {/* CUSTOMER */}

                    <td>

                      <div className="customer-name-cell">

                        <div className="customer-avatar">
                          {(
                            customer.name ||
                            "ع"
                          )
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {customer.name ||
                              "عميل"}
                          </strong>

                          <span>
                            عميل A.GO
                          </span>
                        </div>

                      </div>

                    </td>

                    {/* PHONE */}

                    <td>

                      <span className="customer-phone">
                        {customer.phone}
                      </span>

                    </td>

                    {/* GOVERNORATE */}

                    <td>
                      {customer.governorate ||
                        "-"}
                    </td>

                    {/* CITY */}

                    <td>
                      {customer.city ||
                        "-"}
                    </td>

                    {/* ADDRESS */}

                    <td>

                      <span className="customer-address">
                        {customer.address ||
                          "-"}
                      </span>

                    </td>

                    {/* ORDERS */}

                    <td>

                      <span className="orders-badge">
                        {customer.ordersCount}
                      </span>

                    </td>

                    {/* TOTAL */}

                    <td>

                      <strong className="customer-total">
                        {money(
                          customer.totalSpent
                        )}
                      </strong>

                    </td>

                    {/* LAST ORDER */}

                    <td>

                      <span className="customer-date">
                        {formatDate(
                          customer.lastOrderAt
                        )}
                      </span>

                    </td>

                    {/* STATUS */}

                    <td>

                      <span
                        className={`status-badge status-${String(
                          customer.lastStatus ||
                            ""
                        ).toLowerCase()}`}
                      >
                        {getStatusLabel(
                          customer.lastStatus
                        )}
                      </span>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </main>
  );
}