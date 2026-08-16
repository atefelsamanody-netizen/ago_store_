"use client";

import { useState } from "react";
import Image from "next/image";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

/* =========================================================
   TYPES
========================================================= */

type Product = {
  image: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  hiddenMessage?: string;

  color?: {
    name: string;
  };
};

type Customer = {
  name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
};

type Order = {
  id: string;

  customer: Customer;

  products: Product[];

  status: string;

  paymentType: string;

  total: number;

  productsTotal?: number;

  couponDiscount?: number;

  couponCode?: string | null;

  shipping: number;

  finalTotal?: number;

  paidAmount?: number;

  deposit?: number;

  depositAmount?: number;

  remaining?: number;

  remainingProducts?: number;

  amountToCollect?: number;
};

/* =========================================================
   PAGE
========================================================= */

export default function TrackPage() {
  const [phone, setPhone] = useState("");

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(false);

  /* =========================================================
     SEARCH
  ========================================================= */

  async function searchOrder() {
    if (!phone.trim()) {
      alert(
        "من فضلك أدخل رقم الهاتف"
      );

      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, "orders"),
        where(
          "customer.phone",
          "==",
          phone.trim()
        )
      );

      const snapshot =
        await getDocs(q);

      const data =
        snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<
              Order,
              "id"
            >),
          })
        );

      setOrders(data);
    } catch (error) {
      console.error(error);

      alert(
        "حدث خطأ أثناء البحث"
      );
    }

    setLoading(false);
  }

  /* =========================================================
     STATUS NORMALIZATION
  ========================================================= */

  function normalizeStatus(
    status?: string
  ) {
    switch (status) {
      case "processing":
        return "preparing";

      case "shipped":
        return "shipping";

      case "delivered":
        return "completed";

      case "completed":
        return "completed";

      default:
        return status || "new";
    }
  }

  /* =========================================================
     STATUS TEXT
  ========================================================= */

  function getStatusText(
    status?: string
  ) {
    const normalized =
      normalizeStatus(status);

    switch (normalized) {
      case "new":
        return "طلب جديد";

      case "confirmed":
        return "تم التأكيد";

      case "preparing":
        return "جاري التجهيز";

      case "shipping":
        return "تم الشحن";

      case "completed":
        return "تم التسليم";

      case "cancelled":
        return "تم الإلغاء";

      default:
        return status || "طلب جديد";
    }
  }

  /* =========================================================
     ORDER STEPS
  ========================================================= */

  const orderSteps = [
    {
      key: "new",
      text: "🆕 تم استلام الطلب",
    },
    {
      key: "confirmed",
      text: "✅ تم تأكيد الطلب",
    },
    {
      key: "preparing",
      text: "📦 جاري تجهيز الطلب",
    },
    {
      key: "shipping",
      text: "🚚 تم شحن الطلب",
    },
    {
      key: "completed",
      text: "🎉 تم تسليم الطلب",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 950,
          margin: "auto",
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 25,
          padding: 35,
          boxShadow:
            "0 15px 40px rgba(0,0,0,.07)",
        }}
      >

        {/* =================================================
            LOGO
        ================================================= */}

        <div
          style={{
            textAlign: "center",
            marginBottom: 25,
          }}
        >
          <h1
            style={{
              fontSize: "90px",
              fontWeight: 800,
              letterSpacing: "10px",
              color: "#000",
              margin: 0,
              lineHeight: 1,
              fontFamily:
                "Arial, Helvetica, sans-serif",
            }}
          >
            AGO
          </h1>

          <p
            style={{
              marginTop: "10px",
              fontSize: "14px",
              letterSpacing: "8px",
              color: "#555",
              fontWeight: 600,
              textTransform:
                "uppercase",
            }}
          >
            ◆ ALWAYS GO ORIGINAL ◆
          </p>

          <h1
            style={{
              color: "#000",
              fontSize: 38,
              marginTop: 20,
              fontWeight: 800,
            }}
          >
            Track Your Order
          </h1>

          <p
            style={{
              color: "#8b7355",
              fontSize: 18,
              fontWeight: 600,
              marginTop: 10,
            }}
          >
            مكانك فى أى وقت ❤️
          </p>
        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div
          style={{
            display: "flex",
            gap: 15,
            marginBottom: 35,
          }}
        >
          <input
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            placeholder="اكتب رقم الهاتف"
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 14,
              border:
                "1px solid #ddd",
              fontSize: 16,
              color: "#000",
              outline: "none",
            }}
          />

          <button
            onClick={searchOrder}
            disabled={loading}
            style={{
              background: "#8b7355",
              color: "#fff",
              border: "none",
              padding: "0 35px",
              borderRadius: 14,
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontWeight: 700,
              opacity: loading
                ? 0.7
                : 1,
            }}
          >
            {loading
              ? "جارى البحث..."
              : "بحث"}
          </button>
        </div>

        {/* =================================================
            NO ORDERS
        ================================================= */}

        {orders.length === 0 &&
        !loading ? (
          <div
            style={{
              textAlign: "center",
              color: "#777",
              padding: "35px 0",
              fontSize: 16,
            }}
          >
            أدخل رقم الهاتف لمعرفة حالة طلبك.
          </div>
        ) : (
          orders.map((order) => {

            /* =================================================
               PRODUCTS TOTAL
            ================================================= */

            const productsTotal =
              Number(
                order.productsTotal ??
                  order.total ??
                  (
                    order.products || []
                  ).reduce(
                    (
                      sum,
                      product
                    ) =>
                      sum +
                      Number(
                        product.price ||
                          0
                      ) *
                        Number(
                          product.qty ||
                            1
                        ),
                    0
                  )
              );

            /* =================================================
               COUPON
            ================================================= */

            const couponDiscount =
              Number(
                order.couponDiscount ||
                  0
              );

            const discountedProductsTotal =
              Math.max(
                productsTotal -
                  couponDiscount,
                0
              );

            /* =================================================
               SHIPPING
            ================================================= */

            const shipping =
              Number(
                order.shipping || 0
              );

            /* =================================================
               FINAL TOTAL
            ================================================= */

            const finalTotal =
              Number(
                order.finalTotal ??
                  discountedProductsTotal +
                    shipping
              );

            /* =================================================
               PAYMENT
            ================================================= */

            const isDeposit =
              order.paymentType ===
              "deposit";

            const paidAmount =
              Number(
                order.paidAmount ??
                  order.depositAmount ??
                  order.deposit ??
                  (isDeposit
                    ? Math.round(
                        discountedProductsTotal *
                          0.3
                      )
                    : discountedProductsTotal)
              );

            /*
             * باقي المنتجات فقط
             */
            const remainingProducts =
              Number(
                order.remainingProducts ??
                  order.remaining ??
                  (isDeposit
                    ? Math.max(
                        discountedProductsTotal -
                          paidAmount,
                        0
                      )
                    : 0)
              );

            /*
             * المبلغ المطلوب عند الاستلام
             */
            const amountToCollect =
              Number(
                order.amountToCollect ??
                  (isDeposit
                    ? remainingProducts +
                      shipping
                    : shipping)
              );

            /* =================================================
               STATUS
            ================================================= */

            const currentStatus =
              normalizeStatus(
                order.status
              );

            const currentIndex =
              orderSteps.findIndex(
                (step) =>
                  step.key ===
                  currentStatus
              );

            return (
              <div
                key={order.id}
                style={{
                  marginBottom: 30,
                  border:
                    "1px solid #ececec",
                  borderRadius: 22,
                  padding: 25,
                  background: "#fff",
                  boxShadow:
                    "0 8px 25px rgba(0,0,0,.05)",
                }}
              >

                {/* =================================================
                    CUSTOMER
                ================================================= */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 20,
                  }}
                >

                  <div>

                    <h2
                      style={{
                        margin: 0,
                        color: "#000",
                        fontSize: 24,
                      }}
                    >
                      {
                        order.customer
                          .name
                      }
                    </h2>

                    <p
                      style={{
                        color: "#000",
                        marginTop: 12,
                      }}
                    >
                      📞{" "}
                      {
                        order.customer
                          .phone
                      }
                    </p>

                    <p
                      style={{
                        color: "#000",
                      }}
                    >
                      📍{" "}
                      {
                        order.customer
                          .governorate
                      }{" "}
                      -{" "}
                      {
                        order.customer
                          .city
                      }
                    </p>

                    <p
                      style={{
                        color: "#000",
                      }}
                    >
                      🏠{" "}
                      {
                        order.customer
                          .address
                      }
                    </p>

                    <p
                      style={{
                        color: "#000",
                      }}
                    >
                      💳{" "}
                      {isDeposit
                        ? "دفع عربون"
                        : "دفع كامل"}
                    </p>

                  </div>

                  <div
                    style={{
                      background:
                        "#8b7355",
                      color: "#fff",
                      padding:
                        "10px 22px",
                      borderRadius: 30,
                      fontWeight:
                        "bold",
                    }}
                  >
                    {getStatusText(
                      order.status
                    )}
                  </div>

                </div>

                {/* =================================================
                    PRICE
                ================================================= */}

                <div
                  style={{
                    marginTop: 25,
                    padding: 18,
                    border:
                      "1px solid #eee",
                    borderRadius: 16,
                    background: "#fafafa",
                  }}
                >

                  <p
                    style={{
                      color: "#000",
                      margin:
                        "0 0 10px",
                      fontWeight: 600,
                    }}
                  >
                    💰 السعر قبل الخصم:{" "}
                    <b>
                      {productsTotal.toLocaleString(
                        "en-US"
                      )}{" "}
                      جنيه
                    </b>
                  </p>

                  {order.couponCode &&
                    couponDiscount > 0 && (
                      <>
                        <p
                          style={{
                            color:
                              "#8b7355",
                            margin:
                              "0 0 8px",
                            fontWeight:
                              "bold",
                          }}
                        >
                          🎟️ كود الخصم:{" "}
                          <span
                            style={{
                              direction:
                                "ltr",
                              display:
                                "inline-block",
                            }}
                          >
                            {
                              order.couponCode
                            }
                          </span>
                        </p>

                        <p
                          style={{
                            color:
                              "#dc2626",
                            margin:
                              "0 0 10px",
                            fontWeight:
                              "bold",
                          }}
                        >
                          🔻 قيمة الخصم:{" "}
                          {couponDiscount.toLocaleString(
                            "en-US"
                          )}{" "}
                          جنيه
                        </p>
                      </>
                    )}

                  <p
                    style={{
                      color:
                        "#16a34a",
                      margin:
                        "0 0 10px",
                      fontWeight:
                        "bold",
                      fontSize: 18,
                    }}
                  >
                    ✅ السعر بعد الخصم:{" "}
                    {discountedProductsTotal.toLocaleString(
                      "en-US"
                    )}{" "}
                    جنيه
                  </p>

                  <p
                    style={{
                      color: "#000",
                      margin:
                        "0 0 10px",
                    }}
                  >
                    🚚 الشحن:{" "}
                    {shipping.toLocaleString(
                      "en-US"
                    )}{" "}
                    جنيه
                  </p>

                  <p
                    style={{
                      color: "#000",
                      margin: 0,
                      fontWeight:
                        "bold",
                      fontSize: 19,
                    }}
                  >
                    💰 الإجمالي النهائي:{" "}
                    {finalTotal.toLocaleString(
                      "en-US"
                    )}{" "}
                    جنيه
                  </p>

                </div>

                {/* =================================================
                    PAYMENT
                ================================================= */}

                <div
                  style={{
                    marginTop: 15,
                    padding: 16,
                    borderRadius: 15,
                    background:
                      "#fafafa",
                    border:
                      "1px solid #eee",
                  }}
                >

                  <p
                    style={{
                      color:
                        "#16a34a",
                      fontWeight:
                        "bold",
                      margin:
                        "0 0 8px",
                    }}
                  >
                    ✅ المدفوع الآن:{" "}
                    {paidAmount.toLocaleString(
                      "en-US"
                    )}{" "}
                    جنيه
                  </p>

                  {isDeposit ? (
                    <>
                      <p
                        style={{
                          color:
                            "#dc2626",
                          fontWeight:
                            "bold",
                          margin:
                            "0 0 8px",
                        }}
                      >
                        💵 المتبقي من قيمة
                        المنتجات:{" "}
                        {remainingProducts.toLocaleString(
                          "en-US"
                        )}{" "}
                        جنيه
                      </p>

                      <p
                        style={{
                          color:
                            "#000",
                          fontWeight:
                            "bold",
                          margin:
                            "0 0 8px",
                        }}
                      >
                        🚚 الشحن:{" "}
                        {shipping.toLocaleString(
                          "en-US"
                        )}{" "}
                        جنيه
                      </p>

                      <p
                        style={{
                          color:
                            "#000",
                          fontWeight:
                            "bold",
                          margin: 0,
                          fontSize: 17,
                        }}
                      >
                        💰 المطلوب عند
                        الاستلام:{" "}
                        {amountToCollect.toLocaleString(
                          "en-US"
                        )}{" "}
                        جنيه
                      </p>
                    </>
                  ) : (
                    <>
                      <p
                        style={{
                          color:
                            "#000",
                          fontWeight:
                            "bold",
                          margin:
                            "0 0 8px",
                        }}
                      >
                        ✅ قيمة المنتجات مدفوعة بالكامل
                      </p>

                      <p
                        style={{
                          color:
                            "#000",
                          fontWeight:
                            "bold",
                          margin: 0,
                        }}
                      >
                        🚚 المطلوب عند الاستلام للشحن فقط:{" "}
                        {amountToCollect.toLocaleString(
                          "en-US"
                        )}{" "}
                        جنيه
                      </p>
                    </>
                  )}

                </div>

                {/* =================================================
                    TRACKING
                ================================================= */}

                <h3
                  style={{
                    color: "#000",
                    marginTop: 30,
                    marginBottom: 20,
                    fontSize: 22,
                    fontWeight:
                      "bold",
                  }}
                >
                  📦 متابعة الطلب
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: 18,
                    marginBottom: 35,
                  }}
                >

                  {orderSteps.map(
                    (
                      step,
                      stepIndex
                    ) => {

                      const done =
                        currentIndex !==
                          -1 &&
                        stepIndex <=
                          currentIndex;

                      return (
                        <div
                          key={
                            step.key
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 10,
                            padding:
                              "8px 10px",
                            borderRadius:
                              16,
                            background:
                              done
                                ? "#ecfdf5"
                                : "#f7f7f7",
                            border: `1px solid ${
                              done
                                ? "#22c55e"
                                : "#ddd"
                            }`,
                          }}
                        >

                          <div
                            style={{
                              width: 30,
                              height: 30,
                              minWidth: 30,
                              borderRadius:
                                "50%",
                              backgroundColor:
                                done
                                  ? "#22c55e"
                                  : "#e5e7eb",
                              border:
                                done
                                  ? "2px solid #22c55e"
                                  : "2px solid #d1d5db",
                              color:
                                done
                                  ? "#fff"
                                  : "transparent",
                              display:
                                "flex",
                              justifyContent:
                                "center",
                              alignItems:
                                "center",
                              fontSize: 16,
                              fontWeight:
                                700,
                            }}
                          >
                            {done
                              ? "✓"
                              : ""}
                          </div>

                          <span
                            style={{
                              fontSize: 15,
                              fontWeight:
                                700,
                              color:
                                done
                                  ? "#15803d"
                                  : "#555",
                            }}
                          >
                            {
                              step.text
                            }
                          </span>

                        </div>
                      );
                    }
                  )}

                </div>

                {/* =================================================
                    PRODUCTS
                ================================================= */}

                <h3
                  style={{
                    color: "#000",
                    marginBottom: 20,
                  }}
                >
                  المنتجات
                </h3>

                {(order.products ??
                  []).map(
                  (
                    product,
                    index
                  ) => (
                    <div
                      key={index}
                      style={{
                        display:
                          "flex",
                        gap: 20,
                        alignItems:
                          "center",
                        padding: 18,
                        border:
                          "1px solid #ececec",
                        borderRadius:
                          18,
                        background:
                          "#fff",
                        marginBottom:
                          18,
                        boxShadow:
                          "0 4px 12px rgba(0,0,0,.05)",
                      }}
                    >

                      <Image
                        src={
                          product.image
                        }
                        alt={
                          product.name
                        }
                        width={110}
                        height={110}
                        style={{
                          borderRadius:
                            14,
                          objectFit:
                            "cover",
                        }}
                      />

                      <div
                        style={{
                          flex: 1,
                        }}
                      >

                        <h4
                          style={{
                            margin: 0,
                            color:
                              "#000",
                            fontSize:
                              20,
                          }}
                        >
                          {
                            product.name
                          }
                        </h4>

                        <p
                          style={{
                            color:
                              "#000",
                            marginTop:
                              10,
                          }}
                        >
                          📏 المقاس:{" "}
                          <b>
                            {
                              product.size
                            }
                          </b>
                        </p>

                        <p
                          style={{
                            color:
                              "#000",
                          }}
                        >
                          🎨 اللون:{" "}
                          <b>
                            {
                              product
                                .color
                                ?.name
                            }
                          </b>
                        </p>

                        <p
                          style={{
                            color:
                              "#000",
                          }}
                        >
                          📦 الكمية:{" "}
                          <b>
                            {
                              product.qty
                            }
                          </b>
                        </p>

                        <p
                          style={{
                            color:
                              "#000",
                          }}
                        >
                          💰 السعر:{" "}
                          <b>
                            {Number(
                              product.price ||
                                0
                            ).toLocaleString(
                              "en-US"
                            )}{" "}
                            جنيه
                          </b>
                        </p>

                        {product.hiddenMessage && (
                          <div
                            style={{
                              marginTop:
                                12,
                              background:
                                "#fafafa",
                              border:
                                "1px solid #e5e5e5",
                              padding:
                                12,
                              borderRadius:
                                12,
                              color:
                                "#000",
                            }}
                          >
                            💌{" "}
                            {product.hiddenMessage
                              .split("/")
                              .pop()}
                          </div>
                        )}

                      </div>

                    </div>
                  )
                )}

                {/* =================================================
                    ANOTHER ORDER
                ================================================= */}

                <button
                  onClick={() => {
                    setPhone("");
                    setOrders([]);
                  }}
                  style={{
                    width: "100%",
                    marginTop: 20,
                    padding: "16px",
                    background:
                      "#8b7355",
                    color: "#fff",
                    border: "none",
                    borderRadius: 14,
                    fontSize: 17,
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer",
                  }}
                >
                  مراجعة طلب آخر
                </button>

              </div>
            );
          })
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          style={{
            marginTop: 45,
            paddingTop: 30,
            borderTop:
              "1px solid #eee",
            textAlign: "center",
          }}
        >

          <h2
            style={{
              color: "#000",
              marginBottom: 12,
            }}
          >
            ❤️ شكراً لاختيارك AGO
          </h2>

          <p
            style={{
              color: "#8b7355",
              fontWeight:
                "bold",
              fontSize: 18,
            }}
          >
            مكانك فى أى وقت ❤️
          </p>

          <a
            href="https://wa.me/201155390834"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:
                "inline-block",
              marginTop: 22,
              background:
                "#25D366",
              color: "#fff",
              textDecoration:
                "none",
              padding:
                "15px 28px",
              borderRadius: 14,
              fontWeight:
                "bold",
            }}
          >
            تواصل عبر واتساب
            01155390834
          </a>

        </div>

      </div>
    </main>
  );
}