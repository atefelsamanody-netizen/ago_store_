"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../lib/firebase";

type Product = {
  name?: string;
  price?: number;
  qty?: number;
};

type Order = {
  id: string;

  products?: Product[];

  total?: number;
  productsTotal?: number;

  couponDiscount?: number;
  couponCode?: string | null;

  shipping?: number;
  finalTotal?: number;

  paidAmount?: number;
  deposit?: number;
  depositAmount?: number;

  remaining?: number;
  amountToCollect?: number;

  paymentType?: "full" | "deposit" | string;
  paymentStatus?: string;

  status?: string;

  customer?: {
    name?: string;
    phone?: string;
  };

  createdAt?: any;
};

function money(value: number) {
  return Number(value || 0).toLocaleString("en-US");
}

function getOrderProductsTotal(order: Order) {
  if (
    typeof order.productsTotal === "number" &&
    order.productsTotal > 0
  ) {
    return order.productsTotal;
  }

  if (
    typeof order.total === "number" &&
    order.total > 0
  ) {
    return order.total;
  }

  return (order.products || []).reduce(
    (sum, product) =>
      sum +
      Number(product.price || 0) *
        Number(product.qty || 1),
    0
  );
}

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
| المبيعات الحقيقية = الإجمالي بعد الخصم + الشحن
|
| مثال:
| المنتج = 650
| الخصم = 100
| الشحن = 0
| المبيعات = 550
|
| وليس 650.
|--------------------------------------------------------------------------
*/

function getFinalOrderTotal(order: Order) {
  const productsTotal =
    getOrderProductsTotal(order);

  const discount = Number(
    order.couponDiscount || 0
  );

  const shipping = Number(
    order.shipping || 0
  );

  /*
   * لو checkout حفظ finalTotal
   * نستخدمه لأنه الرقم النهائي الفعلي.
   */
  if (
    typeof order.finalTotal === "number"
  ) {
    return Math.max(
      order.finalTotal,
      0
    );
  }

  /*
   * لو مفيش finalTotal:
   *
   * المنتجات - الخصم + الشحن
   */
  return Math.max(
    productsTotal -
      discount +
      shipping,
    0
  );
}

function getPaidAmount(order: Order) {
  if (
    typeof order.paidAmount === "number"
  ) {
    return order.paidAmount;
  }

  if (
    typeof order.depositAmount === "number"
  ) {
    return order.depositAmount;
  }

  if (
    typeof order.deposit === "number"
  ) {
    return order.deposit;
  }

  /*
   * لو الدفع كامل
   * نعتبر المبلغ النهائي مدفوع.
   */
  if (
    order.paymentType === "full"
  ) {
    return getFinalOrderTotal(order);
  }

  return 0;
}

function isCancelled(order: Order) {
  return (
    order.status === "cancelled"
  );
}

function getOrderDate(createdAt: any) {
  try {
    if (!createdAt) return null;

    if (createdAt?.toDate) {
      return createdAt.toDate();
    }

    if (createdAt?.seconds) {
      return new Date(
        createdAt.seconds * 1000
      );
    }

    if (createdAt instanceof Date) {
      return createdAt;
    }

    return new Date(createdAt);
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const ordersRef = collection(
      db,
      "orders"
    );

    const q = query(
      ordersRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Order[] =
          snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<
              Order,
              "id"
            >),
          }));

        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "DASHBOARD ORDERS ERROR:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | إحصائيات الطلبات
  |--------------------------------------------------------------------------
  */

  const validOrders =
    orders.filter(
      (order) => !isCancelled(order)
    );

  const totalOrders =
    orders.length;

  const activeOrders =
    orders.filter(
      (order) =>
        order.status !== "delivered" &&
        order.status !== "completed" &&
        order.status !== "cancelled"
    ).length;

  const deliveredOrders =
    orders.filter(
      (order) =>
        order.status === "delivered" ||
        order.status === "completed"
    ).length;

  const cancelledOrders =
    orders.filter(
      (order) =>
        order.status === "cancelled"
    ).length;

  /*
  |--------------------------------------------------------------------------
  | SALES
  |--------------------------------------------------------------------------
  |
  | هنا بنحسب الرقم بعد الخصم.
  |
  | 650 - 100 = 550
  |--------------------------------------------------------------------------
  */

  const totalSales =
    validOrders.reduce(
      (sum, order) =>
        sum +
        getFinalOrderTotal(order),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | PAID
  |--------------------------------------------------------------------------
  */

  const totalPaid =
    validOrders.reduce(
      (sum, order) =>
        sum +
        getPaidAmount(order),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | REMAINING
  |--------------------------------------------------------------------------
  */

  const totalRemaining =
    validOrders.reduce(
      (sum, order) => {
        const finalTotal =
          getFinalOrderTotal(order);

        const paid =
          getPaidAmount(order);

        return (
          sum +
          Math.max(
            finalTotal - paid,
            0
          )
        );
      },
      0
    );

  /*
  |--------------------------------------------------------------------------
  | DISCOUNTS
  |--------------------------------------------------------------------------
  */

  const totalDiscount =
    validOrders.reduce(
      (sum, order) =>
        sum +
        Number(
          order.couponDiscount || 0
        ),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | SHIPPING
  |--------------------------------------------------------------------------
  */

  const totalShipping =
    validOrders.reduce(
      (sum, order) =>
        sum +
        Number(order.shipping || 0),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | PRODUCTS SOLD
  |--------------------------------------------------------------------------
  */

  const productsSold =
    validOrders.reduce(
      (sum, order) =>
        sum +
        (order.products || []).reduce(
          (productSum, product) =>
            productSum +
            Number(
              product.qty || 1
            ),
          0
        ),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | AVERAGE ORDER
  |--------------------------------------------------------------------------
  */

  const averageOrder =
    validOrders.length > 0
      ? totalSales /
        validOrders.length
      : 0;

  /*
  |--------------------------------------------------------------------------
  | آخر الطلبات
  |--------------------------------------------------------------------------
  */

  const recentOrders =
    orders.slice(0, 6);

  if (loading) {
    return (
      <main className="loading-page">
        <div>
          <div className="loader" />
          <p>
            جاري تحميل بيانات المتجر...
          </p>
        </div>

        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            direction: rtl;
            font-family:
              Arial,
              Tahoma,
              sans-serif;
            color: #111;
          }

          .loader {
            width: 42px;
            height: 42px;
            border: 4px solid #ddd;
            border-top-color: #111;
            border-radius: 50%;
            animation: spin 0.8s linear
              infinite;
            margin: 0 auto 15px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          p {
            color: #666;
            font-size: 15px;
          }
        `}</style>
      </main>
    );
  }

  return (
    <>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .dashboard {
          min-height: 100vh;
          background: #f5f5f5;
          color: #111;
          padding: 35px 20px 70px;
          direction: rtl;
          font-family:
            Arial,
            Tahoma,
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        /*
        ==========================
        HEADER
        ==========================
        */

        .header {
          background: #fff;
          border: 1px solid #e3e3e3;
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 22px;
          box-shadow:
            0 5px 20px
              rgba(0, 0, 0, 0.04);
        }

        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 900;
        }

        .header p {
          margin: 8px 0 0;
          color: #777;
          font-size: 14px;
        }

        /*
        ==========================
        STAT CARDS
        ==========================
        */

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 22px;
        }

        .stat {
          background: #fff;
          border: 1px solid #e2e2e2;
          border-radius: 18px;
          padding: 22px;
          min-height: 130px;
          box-shadow:
            0 5px 18px
              rgba(0, 0, 0, 0.04);
        }

        .stat-label {
          color: #777;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .stat-value {
          color: #111;
          font-size: 28px;
          font-weight: 900;
        }

        .stat-sub {
          margin-top: 8px;
          color: #999;
          font-size: 12px;
        }

        .sales {
          background: #111;
          color: #fff;
          border-color: #111;
        }

        .sales .stat-label,
        .sales .stat-sub,
        .sales .stat-value {
          color: #fff;
        }

        .paid {
          background: #f3fbf5;
          border-color: #b8dfc2;
        }

        .paid .stat-value {
          color: #16813b;
        }

        .remaining {
          background: #fff7f7;
          border-color: #efc4c4;
        }

        .remaining .stat-value {
          color: #c52c2c;
        }

        /*
        ==========================
        TWO COLUMNS
        ==========================
        */

        .grid {
          display: grid;
          grid-template-columns:
            1.3fr 0.7fr;
          gap: 22px;
          margin-bottom: 22px;
        }

        .panel {
          background: #fff;
          border: 1px solid #e2e2e2;
          border-radius: 20px;
          padding: 24px;
          box-shadow:
            0 5px 18px
              rgba(0, 0, 0, 0.04);
        }

        .panel-title {
          margin: 0 0 20px;
          font-size: 19px;
          font-weight: 900;
        }

        /*
        ==========================
        QUICK STATS
        ==========================
        */

        .quick-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .quick {
          border: 1px solid #e5e5e5;
          border-radius: 14px;
          padding: 15px;
          background: #fafafa;
        }

        .quick span {
          display: block;
          color: #777;
          font-size: 12px;
          margin-bottom: 7px;
        }

        .quick strong {
          font-size: 19px;
        }

        /*
        ==========================
        RECENT ORDERS
        ==========================
        */

        .orders {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .order {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 14px;
          border: 1px solid #e5e5e5;
          border-radius: 13px;
          background: #fff;
        }

        .order-info {
          min-width: 0;
        }

        .order-name {
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .order-phone {
          color: #777;
          font-size: 12px;
        }

        .order-money {
          font-size: 14px;
          font-weight: 900;
          white-space: nowrap;
        }

        .status {
          margin-top: 6px;
          display: inline-block;
          font-size: 11px;
          color: #fff;
          background: #111;
          border-radius: 8px;
          padding: 5px 8px;
        }

        /*
        ==========================
        STATUS COLORS
        ==========================
        */

        .status.new {
          background: #2563eb;
        }

        .status.confirmed {
          background: #16a34a;
        }

        .status.preparing {
          background: #ca8a04;
        }

        .status.shipping {
          background: #7c3aed;
        }

        .status.shipped {
          background: #7c3aed;
        }

        .status.delivered,
        .status.completed {
          background: #059669;
        }

        .status.cancelled {
          background: #dc2626;
        }

        /*
        ==========================
        EMPTY
        ==========================
        */

        .empty {
          padding: 30px;
          text-align: center;
          color: #777;
          border: 1px dashed #ddd;
          border-radius: 14px;
        }

        /*
        ==========================
        FOOTER NOTE
        ==========================
        */

        .note {
          background: #fff;
          border: 1px solid #e3e3e3;
          border-radius: 18px;
          padding: 20px;
          color: #666;
          font-size: 13px;
          line-height: 1.8;
        }

        .note strong {
          color: #111;
        }

        /*
        ==========================
        MOBILE
        ==========================
        */

        @media (max-width: 900px) {
          .stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .dashboard {
            padding: 18px 10px 50px;
          }

          .header {
            padding: 20px;
            border-radius: 16px;
          }

          .header h1 {
            font-size: 25px;
          }

          .stats {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .stat {
            padding: 16px;
            min-height: 110px;
          }

          .stat-value {
            font-size: 21px;
          }

          .panel {
            padding: 17px;
            border-radius: 16px;
          }

          .quick-grid {
            grid-template-columns: 1fr 1fr;
          }

          .order {
            align-items: flex-start;
          }

          .order-money {
            font-size: 12px;
          }
        }
      `}</style>

      <main className="dashboard">
        <div className="container">

          {/* HEADER */}

          <section className="header">
            <h1>Dashboard</h1>

            <p>
              A.GO Store Overview
              <br />
              إدارة ومتابعة مبيعات وطلبات
              المتجر.
            </p>
          </section>

          {/* MAIN STATS */}

          <section className="stats">

            <div className="stat">
              <div className="stat-label">
                الطلبات
              </div>

              <div className="stat-value">
                {totalOrders}
              </div>

              <div className="stat-sub">
                إجمالي الطلبات
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">
                المنتجات المباعة
              </div>

              <div className="stat-value">
                {productsSold}
              </div>

              <div className="stat-sub">
                إجمالي القطع
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">
                العملاء
              </div>

              <div className="stat-value">
                {
                  new Set(
                    validOrders.map(
                      (order) =>
                        order.customer
                          ?.phone
                    ).filter(Boolean)
                  ).size
                }
              </div>

              <div className="stat-sub">
                عملاء لديهم طلبات
              </div>
            </div>

            <div className="stat sales">
              <div className="stat-label">
                Sales
              </div>

              <div className="stat-value">
                {money(totalSales)}
                {" "}EGP
              </div>

              <div className="stat-sub">
                بعد الخصومات
              </div>
            </div>

          </section>

          {/* PAYMENT STATS */}

          <section className="stats">

            <div className="stat paid">
              <div className="stat-label">
                المبلغ المدفوع
              </div>

              <div className="stat-value">
                {money(totalPaid)}
                {" "}EGP
              </div>

              <div className="stat-sub">
                المدفوع فعليًا
              </div>
            </div>

            <div className="stat remaining">
              <div className="stat-label">
                المتبقي
              </div>

              <div className="stat-value">
                {money(totalRemaining)}
                {" "}EGP
              </div>

              <div className="stat-sub">
                مبالغ لم يتم تحصيلها
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">
                الخصومات
              </div>

              <div className="stat-value">
                {money(totalDiscount)}
                {" "}EGP
              </div>

              <div className="stat-sub">
                إجمالي قيمة الكوبونات
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">
                متوسط الطلب
              </div>

              <div className="stat-value">
                {money(averageOrder)}
                {" "}EGP
              </div>

              <div className="stat-sub">
                متوسط قيمة الطلب
              </div>
            </div>

          </section>

          {/* PANELS */}

          <section className="grid">

            {/* RECENT ORDERS */}

            <div className="panel">

              <h2 className="panel-title">
                آخر الطلبات
              </h2>

              {recentOrders.length === 0 ? (
                <div className="empty">
                  لا توجد طلبات حتى الآن.
                </div>
              ) : (
                <div className="orders">

                  {recentOrders.map(
                    (order) => {

                      const finalTotal =
                        getFinalOrderTotal(
                          order
                        );

                      let statusClass =
                        order.status ||
                        "confirmed";

                      let statusText =
                        "تم التأكيد";

                      switch (
                        order.status
                      ) {
                        case "new":
                          statusText =
                            "طلب جديد";
                          break;

                        case "confirmed":
                          statusText =
                            "تم التأكيد";
                          break;

                        case "preparing":
                        case "processing":
                          statusText =
                            "جاري التجهيز";
                          statusClass =
                            "preparing";
                          break;

                        case "shipping":
                        case "shipped":
                          statusText =
                            "تم الشحن";
                          statusClass =
                            "shipping";
                          break;

                        case "delivered":
                        case "completed":
                          statusText =
                            "تم التسليم";
                          statusClass =
                            "delivered";
                          break;

                        case "cancelled":
                          statusText =
                            "تم الإلغاء";
                          break;

                        default:
                          statusText =
                            "تم التأكيد";
                      }

                      return (
                        <div
                          key={order.id}
                          className="order"
                        >

                          <div className="order-info">

                            <div className="order-name">
                              {
                                order
                                  .customer
                                  ?.name ||
                                "عميل"
                              }
                            </div>

                            <div className="order-phone">
                              {
                                order
                                  .customer
                                  ?.phone ||
                                "-"
                              }
                            </div>

                            <span
                              className={`status ${statusClass}`}
                            >
                              {statusText}
                            </span>

                          </div>

                          <div className="order-money">
                            {money(
                              finalTotal
                            )}{" "}
                            جنيه
                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

            {/* QUICK STATS */}

            <div className="panel">

              <h2 className="panel-title">
                ملخص سريع
              </h2>

              <div className="quick-grid">

                <div className="quick">
                  <span>
                    الطلبات الحالية
                  </span>

                  <strong>
                    {activeOrders}
                  </strong>
                </div>

                <div className="quick">
                  <span>
                    تم التسليم
                  </span>

                  <strong>
                    {deliveredOrders}
                  </strong>
                </div>

                <div className="quick">
                  <span>
                    الطلبات الملغاة
                  </span>

                  <strong>
                    {cancelledOrders}
                  </strong>
                </div>

                <div className="quick">
                  <span>
                    الشحن
                  </span>

                  <strong>
                    {money(
                      totalShipping
                    )}{" "}
                    EGP
                  </strong>
                </div>

              </div>

            </div>

          </section>

          {/* IMPORTANT NOTE */}

          <section className="note">

            <strong>
              ملاحظة الحساب:
            </strong>

            {" "}
            الـ Sales في الـ Dashboard
            بيتحسب من السعر النهائي للطلب
            بعد تطبيق الخصم.

            <br />

            مثال:
            <strong>
              {" "}
              650 جنيه
            </strong>
            {" "}
            سعر المنتج -
            <strong>
              {" "}
              100 جنيه
            </strong>
            {" "}
            خصم =
            <strong>
              {" "}
              550 جنيه
            </strong>

            <br />

            وبالتالي العميل اللي اشترى
            منتج بـ650 واستخدم كود خصم
            يخليه يدفع 550، الـ Dashboard
            هتسجل المبيعات الصحيحة
            <strong>
              {" "}
              550 جنيه
            </strong>
            وليس 650.

          </section>

        </div>
      </main>
    </>
  );
}