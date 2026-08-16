"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

type Product = {
  id?: string;
  slug?: string;
  name?: string;
  image?: string;
  color?: any;
  size?: string;
  qty?: number;
  price?: number;
  hiddenMessage?: string | null;
};

type Customer = {
  name?: string;
  phone?: string;
  governorate?: string;
  city?: string;
  address?: string;
};

type Order = {
  id: string;

  customer?: Customer;

  products?: Product[];

  // الأسعار
  total?: number;
  productsTotal?: number;
  couponDiscount?: number;
  couponCode?: string | null;

  shipping?: number;
  finalTotal?: number;

  // الدفع
  paymentType?: "full" | "deposit";
  paymentStatus?: string;

  paidAmount?: number;
  deposit?: number;
  depositAmount?: number;

  remaining?: number;
  remainingProducts?: number;
  amountToCollect?: number;

  // الحالة
  status?: string;

  createdAt?: any;
};

const STATUS_OPTIONS = [
  {
    value: "new",
    label: "طلب جديد",
    icon: "🆕",
  },
  {
    value: "confirmed",
    label: "تم تأكيد الطلب",
    icon: "✅",
  },
  {
    value: "preparing",
    label: "جاري تجهيز الطلب",
    icon: "📦",
  },
  {
    value: "shipped",
    label: "تم شحن الطلب",
    icon: "🚚",
  },
  {
    value: "delivered",
    label: "تم تسليم الطلب",
    icon: "🎉",
  },
  {
    value: "cancelled",
    label: "تم إلغاء الطلب",
    icon: "❌",
  },
];

function formatMoney(value: any) {
  return Number(value || 0).toLocaleString("en-US");
}

function getColorName(color: any) {
  if (!color) return "-";

  if (typeof color === "string") {
    return color;
  }

  return color.name || color.title || "-";
}

function getHiddenMessageName(message?: string | null) {
  if (!message) return "";

  return message.split("/").pop() || message;
}

/*
 * توحيد حالات الطلب
 *
 * Track و Dashboard يستخدموا نفس المعنى
 */
function normalizeStatus(status?: string) {
  switch (status) {
    case "processing":
      return "preparing";

    case "shipping":
      return "shipped";

    case "completed":
      return "delivered";

    default:
      return status || "confirmed";
  }
}

function getStatusLabel(status?: string) {
  const normalized = normalizeStatus(status);

  const found = STATUS_OPTIONS.find(
    (item) => item.value === normalized
  );

  return found || STATUS_OPTIONS[0];
}

function getOrderDate(createdAt: any) {
  try {
    if (!createdAt) return "";

    if (createdAt instanceof Timestamp) {
      return createdAt.toDate().toLocaleString("ar-EG");
    }

    if (createdAt?.toDate) {
      return createdAt.toDate().toLocaleString("ar-EG");
    }

    if (typeof createdAt === "string") {
      return new Date(createdAt).toLocaleString("ar-EG");
    }

    if (createdAt?.seconds) {
      return new Date(
        createdAt.seconds * 1000
      ).toLocaleString("ar-EG");
    }

    return "";
  } catch {
    return "";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [updatingOrder, setUpdatingOrder] =
    useState<string | null>(null);

  const [filter, setFilter] = useState<
    | "all"
    | "new"
    | "confirmed"
    | "preparing"
    | "shipped"
    | "delivered"
    | "cancelled"
  >("all");

  /*
   * ==========================
   * LOAD ORDERS
   * ==========================
   */

  useEffect(() => {
    const ordersRef = collection(db, "orders");

    const q = query(
      ordersRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Order[] = snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...(item.data() as Omit<Order, "id">),
          })
        );

        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "ORDERS LOAD ERROR:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * ==========================
   * FILTER
   * ==========================
   */

  const filteredOrders = useMemo(() => {
    if (filter === "all") {
      return orders;
    }

    return orders.filter(
      (order) =>
        normalizeStatus(order.status) === filter
    );
  }, [orders, filter]);

  /*
   * ==========================
   * CHANGE STATUS
   * ==========================
   */

  async function changeOrderStatus(
    orderId: string,
    status: string
  ) {
    try {
      setUpdatingOrder(orderId);

      await updateDoc(
        doc(db, "orders", orderId),
        {
          status,
          updatedAt: Timestamp.now(),
        }
      );
    } catch (error) {
      console.error(
        "STATUS UPDATE ERROR:",
        error
      );

      alert(
        "حدث خطأ أثناء تحديث حالة الطلب."
      );
    } finally {
      setUpdatingOrder(null);
    }
  }

  /*
   * ==========================
   * LOADING
   * ==========================
   */

  if (loading) {
    return (
      <>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            background: #f6f6f6;
            color: #111;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            font-size: 18px;
            direction: rtl;
          }
        `}</style>

        <main className="loading-page">
          جاري تحميل الطلبات...
        </main>
      </>
    );
  }

  /*
   * ==========================
   * PAGE
   * ==========================
   */

  return (
    <>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .orders-page {
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

        .orders-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ==========================
           HEADER
        ========================== */

        .page-header {
          background: #fff;
          border: 1px solid #e3e3e3;
          border-radius: 18px;
          padding: 25px;
          margin-bottom: 20px;
          box-shadow:
            0 4px 18px rgba(0, 0, 0, 0.05);
        }

        .page-header h1 {
          margin: 0 0 8px;
          font-size: 28px;
          font-weight: 800;
          color: #111;
        }

        .page-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 22px;
        }

        .filter-button {
          border: 1px solid #ddd;
          background: #fff;
          color: #222;
          border-radius: 10px;
          padding: 9px 15px;
          cursor: pointer;
          font-size: 13px;
          transition: 0.2s;
        }

        .filter-button:hover {
          border-color: #111;
        }

        .filter-button.active {
          background: #111;
          color: #fff;
          border-color: #111;
        }

        .empty {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 18px;
          padding: 50px 20px;
          text-align: center;
          color: #666;
        }

        /* ==========================
           ORDER CARD
        ========================== */

        .order-card {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 18px;
          margin-bottom: 22px;
          overflow: hidden;
          box-shadow:
            0 5px 20px rgba(0, 0, 0, 0.05);
        }

        .order-header {
          padding: 18px 22px;
          border-bottom: 1px solid #e5e5e5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
          background: #fafafa;
        }

        .order-number {
          font-size: 20px;
          font-weight: 800;
          color: #111;
        }

        .order-date {
          color: #777;
          font-size: 12px;
          margin-top: 4px;
        }

        .status-area {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-badge {
          border-radius: 9px;
          padding: 7px 11px;
          background: #111;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-select {
          border: 1px solid #ccc;
          border-radius: 9px;
          padding: 9px 12px;
          background: #fff;
          color: #111;
          font-size: 13px;
          cursor: pointer;
          min-width: 180px;
        }

        .status-select:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* ==========================
           CUSTOMER
        ========================== */

        .customer-section {
          padding: 22px;
          border-bottom: 1px solid #e5e5e5;
        }

        .section-title {
          font-size: 16px;
          font-weight: 800;
          margin: 0 0 15px;
          color: #111;
        }

        .customer-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 10px 25px;
        }

        .customer-row {
          font-size: 14px;
          color: #222;
          line-height: 1.7;
        }

        .customer-row strong {
          color: #111;
        }

        .address-row {
          grid-column: 1 / -1;
          padding-top: 5px;
        }

        /* ==========================
           PAYMENT
        ========================== */

        .payment-section {
          padding: 22px;
          border-bottom: 1px solid #e5e5e5;
        }

        .payment-type {
          display: inline-block;
          padding: 8px 12px;
          border-radius: 9px;
          background: #f0f0f0;
          color: #111;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 15px;
        }

        .money-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .money-box {
          border: 1px solid #e3e3e3;
          border-radius: 12px;
          padding: 13px;
          background: #fafafa;
        }

        .money-box span {
          display: block;
          color: #777;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .money-box strong {
          display: block;
          color: #111;
          font-size: 16px;
        }

        .money-box.paid {
          border-color: #b9dfc2;
          background: #f3fbf5;
        }

        .money-box.paid strong {
          color: #16813b;
        }

        .money-box.remaining {
          border-color: #f0c2c2;
          background: #fff6f6;
        }

        .money-box.remaining strong {
          color: #c52c2c;
        }

        /* ==========================
           COUPON
        ========================== */

        .coupon-box {
          margin-top: 15px;
          border: 1px solid #eadfca;
          background: #fffaf2;
          border-radius: 13px;
          padding: 14px 16px;
        }

        .coupon-title {
          font-size: 13px;
          color: #8b7355;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .coupon-code {
          font-size: 16px;
          color: #111;
          font-weight: 800;
        }

        .coupon-discount {
          margin-top: 5px;
          color: #c52c2c;
          font-size: 13px;
          font-weight: 700;
        }

        /* ==========================
           PRODUCTS
        ========================== */

        .products-section {
          padding: 22px;
          border-bottom: 1px solid #e5e5e5;
        }

        .products-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .product-item {
          display: flex;
          align-items: center;
          gap: 13px;
          border: 1px solid #e4e4e4;
          border-radius: 13px;
          padding: 10px;
          background: #fff;
        }

        .product-image {
          width: 65px;
          height: 65px;
          min-width: 65px;
          border-radius: 9px;
          object-fit: cover;
          background: #eee;
          border: 1px solid #ddd;
        }

        .product-info {
          flex: 1;
          min-width: 0;
        }

        .product-name {
          font-size: 14px;
          font-weight: 800;
          color: #111;
          margin-bottom: 5px;
        }

        .product-details {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 14px;
          font-size: 12px;
          color: #666;
        }

        .product-price {
          font-size: 14px;
          font-weight: 800;
          color: #111;
          white-space: nowrap;
        }

        /* ==========================
           TOTAL
        ========================== */

        .total-section {
          padding: 22px;
        }

        .total-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 7px 0;
          color: #333;
          font-size: 14px;
        }

        .total-line strong {
          color: #111;
        }

        .total-line.discount strong {
          color: #c52c2c;
        }

        .total-line.final {
          border-top: 1px solid #ddd;
          margin-top: 8px;
          padding-top: 15px;
          font-size: 17px;
          font-weight: 800;
        }

        .total-line.final strong {
          font-size: 20px;
        }

        .collection {
          margin-top: 12px;
          border-radius: 12px;
          padding: 13px 15px;
          background: #111;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .collection strong {
          font-size: 18px;
        }

        /* ==========================
           RESPONSIVE
        ========================== */

        @media (max-width: 800px) {
          .money-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .customer-grid {
            grid-template-columns: 1fr;
          }

          .address-row {
            grid-column: auto;
          }
        }

        @media (max-width: 600px) {
          .orders-page {
            padding: 18px 10px 50px;
          }

          .page-header {
            padding: 18px;
            border-radius: 14px;
          }

          .page-header h1 {
            font-size: 23px;
          }

          .order-header {
            padding: 15px;
          }

          .order-number {
            font-size: 18px;
          }

          .status-area {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .status-select {
            width: 100%;
          }

          .status-badge {
            text-align: center;
          }

          .customer-section,
          .payment-section,
          .products-section,
          .total-section {
            padding: 16px;
          }

          .money-grid {
            grid-template-columns: 1fr 1fr;
          }

          .product-image {
            width: 55px;
            height: 55px;
            min-width: 55px;
          }

          .product-price {
            font-size: 12px;
          }

          .collection {
            gap: 10px;
          }
        }
      `}</style>

      <main className="orders-page">
        <div className="orders-container">

          {/* =========================
              PAGE HEADER
          ========================= */}

          <section className="page-header">
            <h1>الطلبات</h1>

            <p>
              إدارة الطلبات وبيانات العملاء وحالة
              الطلب والدفع.
            </p>

            <div className="filters">

              <button
                className={`filter-button ${
                  filter === "all"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setFilter("all")
                }
              >
                كل الطلبات ({orders.length})
              </button>

              {STATUS_OPTIONS.map(
                (status) => {
                  const count =
                    orders.filter(
                      (order) =>
                        normalizeStatus(
                          order.status
                        ) === status.value
                    ).length;

                  return (
                    <button
                      key={status.value}
                      className={`filter-button ${
                        filter ===
                        status.value
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setFilter(
                          status.value as any
                        )
                      }
                    >
                      {status.icon}{" "}
                      {status.label}{" "}
                      ({count})
                    </button>
                  );
                }
              )}

            </div>
          </section>

          {/* =========================
              ORDERS
          ========================= */}

          {filteredOrders.length === 0 ? (
            <div className="empty">
              لا توجد طلبات هنا.
            </div>
          ) : (
            filteredOrders.map(
              (order, index) => {

                const products =
                  order.products || [];

                /*
                 * ==================================
                 * الحساب الصحيح للأسعار
                 * ==================================
                 *
                 * مثال:
                 *
                 * السعر الأصلي = 650
                 * الخصم = 100
                 * بعد الخصم = 550
                 * الشحن = 125
                 * النهائي = 675
                 */

                const storedProductsTotal =
                  Number(
                    order.productsTotal || 0
                  );

                const storedTotal =
                  Number(
                    order.total || 0
                  );

                const couponDiscount =
                  Number(
                    order.couponDiscount || 0
                  );

                /*
                 * إجمالي المنتجات الأصلي
                 */
                const calculatedProductsTotal =
                  products.reduce(
                    (sum, product) =>
                      sum +
                      Number(
                        product.price || 0
                      ) *
                        Number(
                          product.qty || 1
                        ),
                    0
                  );

                const originalProductsTotal =
                  storedProductsTotal ||
                  (
                    couponDiscount > 0 &&
                    storedTotal > 0
                      ? storedTotal +
                        couponDiscount
                      : calculatedProductsTotal
                  );

                /*
                 * إجمالي المنتجات بعد الخصم
                 */
                const discountedProductsTotal =
                  couponDiscount > 0
                    ? Math.max(
                        originalProductsTotal -
                          couponDiscount,
                        0
                      )
                    : storedTotal ||
                      originalProductsTotal;

                /*
                 * الشحن
                 */
                const shipping =
                  Number(
                    order.shipping || 0
                  );

                /*
                 * الإجمالي النهائي
                 */
                const finalTotal =
                  Number(
                    order.finalTotal ??
                      discountedProductsTotal +
                        shipping
                  );

                /*
                 * المبلغ المدفوع
                 */
                const paidAmount =
                  Number(
                    order.paidAmount ??
                      order.depositAmount ??
                      order.deposit ??
                      0
                  );

                /*
                 * المتبقي من المنتجات
                 */
                const remainingProducts =
                  Number(
                    order.remainingProducts ??
                      Math.max(
                        discountedProductsTotal -
                          paidAmount,
                        0
                      )
                  );

                /*
                 * المطلوب تحصيله عند الاستلام
                 */
                const amountToCollect =
                  Number(
                    order.amountToCollect ??
                      order.remaining ??
                      Math.max(
                        finalTotal -
                          paidAmount,
                        0
                      )
                  );

                /*
                 * الحالة الموحدة
                 */
                const actualStatus =
                  normalizeStatus(
                    order.status
                  );

                const status =
                  getStatusLabel(
                    actualStatus
                  );

                return (
                  <article
                    key={order.id}
                    className="order-card"
                  >

                    {/* =====================
                        ORDER HEADER
                    ===================== */}

                    <div className="order-header">

                      <div>
                        <div className="order-number">
                          طلب رقم{" "}
                          {orders.length -
                            index}
                        </div>

                        {getOrderDate(
                          order.createdAt
                        ) && (
                          <div className="order-date">
                            {getOrderDate(
                              order.createdAt
                            )}
                          </div>
                        )}
                      </div>

                      <div className="status-area">

                        <div className="status-badge">
                          {status.icon}{" "}
                          {status.label}
                        </div>

                        <select
                          className="status-select"
                          value={
                            actualStatus
                          }
                          disabled={
                            updatingOrder ===
                            order.id
                          }
                          onChange={(e) =>
                            changeOrderStatus(
                              order.id,
                              e.target.value
                            )
                          }
                        >
                          {STATUS_OPTIONS.map(
                            (item) => (
                              <option
                                key={
                                  item.value
                                }
                                value={
                                  item.value
                                }
                              >
                                {item.icon}{" "}
                                {item.label}
                              </option>
                            )
                          )}
                        </select>

                      </div>

                    </div>

                    {/* =====================
                        CUSTOMER
                    ===================== */}

                    <section className="customer-section">

                      <h2 className="section-title">
                        بيانات العميل
                      </h2>

                      <div className="customer-grid">

                        <div className="customer-row">
                          <strong>
                            الاسم:
                          </strong>{" "}
                          {order.customer
                            ?.name || "-"}
                        </div>

                        <div className="customer-row">
                          <strong>
                            الهاتف:
                          </strong>{" "}
                          {order.customer
                            ?.phone || "-"}
                        </div>

                        <div className="customer-row">
                          <strong>
                            المحافظة:
                          </strong>{" "}
                          {order.customer
                            ?.governorate ||
                            "-"}
                        </div>

                        <div className="customer-row">
                          <strong>
                            المدينة:
                          </strong>{" "}
                          {order.customer
                            ?.city || "-"}
                        </div>

                        <div className="customer-row address-row">
                          <strong>
                            العنوان:
                          </strong>{" "}
                          {order.customer
                            ?.address || "-"}
                        </div>

                      </div>

                    </section>

                    {/* =====================
                        PAYMENT
                    ===================== */}

                    <section className="payment-section">

                      <h2 className="section-title">
                        الدفع
                      </h2>

                      <div className="payment-type">
                        {order.paymentType ===
                          "deposit" ||
                        order.paymentStatus ===
                          "deposit"
                          ? "💰 دفع عربون 30%"
                          : "💳 دفع المبلغ بالكامل"}
                      </div>

                      <div className="money-grid">

                        <div className="money-box">
                          <span>
                            المنتجات قبل الخصم
                          </span>

                          <strong>
                            {formatMoney(
                              originalProductsTotal
                            )}{" "}
                            جنيه
                          </strong>
                        </div>

                        <div className="money-box">
                          <span>
                            المنتجات بعد الخصم
                          </span>

                          <strong>
                            {formatMoney(
                              discountedProductsTotal
                            )}{" "}
                            جنيه
                          </strong>
                        </div>

                        <div className="money-box paid">
                          <span>
                            تم دفعه
                          </span>

                          <strong>
                            {formatMoney(
                              paidAmount
                            )}{" "}
                            جنيه
                          </strong>
                        </div>

                        <div className="money-box remaining">
                          <span>
                            المتبقي
                          </span>

                          <strong>
                            {formatMoney(
                              remainingProducts
                            )}{" "}
                            جنيه
                          </strong>
                        </div>

                      </div>

                      {/* COUPON */}

                      {couponDiscount > 0 && (
                        <div className="coupon-box">

                          <div className="coupon-title">
                            🎟️ تم استخدام كود خصم
                          </div>

                          <div className="coupon-code">
                            الكود:{" "}
                            {order.couponCode ||
                              "خصم مطبق"}
                          </div>

                          <div className="coupon-discount">
                            🔻 قيمة الخصم:{" "}
                            {formatMoney(
                              couponDiscount
                            )}{" "}
                            جنيه
                          </div>

                        </div>
                      )}

                    </section>

                    {/* =====================
                        PRODUCTS
                    ===================== */}

                    <section className="products-section">

                      <h2 className="section-title">
                        المنتجات
                      </h2>

                      <div className="products-list">

                        {products.map(
                          (
                            product,
                            productIndex
                          ) => (
                            <div
                              key={`${product.id || product.slug || "product"}-${productIndex}`}
                              className="product-item"
                            >

                              <img
                                className="product-image"
                                src={
                                  product.image ||
                                  "/product-01.png"
                                }
                                alt={
                                  product.name ||
                                  "Product"
                                }
                              />

                              <div className="product-info">

                                <div className="product-name">
                                  {product.name ||
                                    "منتج"}
                                </div>

                                <div className="product-details">

                                  <span>
                                    المقاس:{" "}
                                    <strong>
                                      {product.size ||
                                        "-"}
                                    </strong>
                                  </span>

                                  <span>
                                    اللون:{" "}
                                    <strong>
                                      {getColorName(
                                        product.color
                                      )}
                                    </strong>
                                  </span>

                                  <span>
                                    الكمية:{" "}
                                    <strong>
                                      {product.qty ||
                                        1}
                                    </strong>
                                  </span>

                                </div>

                                {product.hiddenMessage && (
                                  <div
                                    className="product-details"
                                    style={{
                                      marginTop:
                                        "4px",
                                    }}
                                  >
                                    الرسالة:{" "}
                                    {getHiddenMessageName(
                                      product.hiddenMessage
                                    )}
                                  </div>
                                )}

                              </div>

                              <div className="product-price">
                                {formatMoney(
                                  Number(
                                    product.price ||
                                      0
                                  ) *
                                    Number(
                                      product.qty ||
                                        1
                                    )
                                )}{" "}
                                جنيه
                              </div>

                            </div>
                          )
                        )}

                      </div>

                    </section>

                    {/* =====================
                        TOTALS
                    ===================== */}

                    <section className="total-section">

                      <div className="total-line">
                        <span>
                          المنتجات قبل الخصم
                        </span>

                        <strong>
                          {formatMoney(
                            originalProductsTotal
                          )}{" "}
                          جنيه
                        </strong>
                      </div>

                      {couponDiscount > 0 && (
                        <div className="total-line discount">
                          <span>
                            🎟️ الخصم
                            {order.couponCode
                              ? ` (${order.couponCode})`
                              : ""}
                          </span>

                          <strong>
                            -{" "}
                            {formatMoney(
                              couponDiscount
                            )}{" "}
                            جنيه
                          </strong>
                        </div>
                      )}

                      <div className="total-line">
                        <span>
                          المنتجات بعد الخصم
                        </span>

                        <strong>
                          {formatMoney(
                            discountedProductsTotal
                          )}{" "}
                          جنيه
                        </strong>
                      </div>

                      <div className="total-line">
                        <span>
                          الشحن
                        </span>

                        <strong>
                          {formatMoney(
                            shipping
                          )}{" "}
                          جنيه
                        </strong>
                      </div>

                      <div className="total-line final">
                        <span>
                          الإجمالي النهائي
                        </span>

                        <strong>
                          {formatMoney(
                            finalTotal
                          )}{" "}
                          جنيه
                        </strong>
                      </div>

                      <div className="collection">
                        <span>
                          المطلوب تحصيله عند
                          الاستلام
                        </span>

                        <strong>
                          {formatMoney(
                            amountToCollect
                          )}{" "}
                          جنيه
                        </strong>
                      </div>

                    </section>

                  </article>
                );
              }
            )
          )}

        </div>
      </main>
    </>
  );
}