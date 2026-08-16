"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../lib/firebase";

/* =========================================================
   TYPES
========================================================= */

type OrderData = {
  orderId?: string;

  name?: string;
  phone?: string;

  governorate?: string;
  city?: string;
  address?: string;

  total?: number;
  productsTotal?: number;
  couponDiscount?: number;
  shipping?: number;
  finalTotal?: number;

  paymentType?: "full" | "deposit";

  paidAmount?: number;
  amountToPayNow?: number;

  deposit?: number;
  depositAmount?: number;

  remaining?: number;
  remainingProducts?: number;
  amountToCollect?: number;

  paymentStatus?: string;
  status?: string;

  payerAccount?: string;
  transferAmount?: number;

  paymentSubmittedAt?: any;
  updatedAt?: any;
};

/* =========================================================
   PAYMENT INFO
========================================================= */

const ETISALAT_CASH = "01155390834";

const INSTAPAY =
  "atef.elsamanody@instapay";

const ETISALAT_DIRECT_URL =
  "https://app.etisalat.eg/?appScreens=cash&appScreen=cash&extra=screenId:send_money;dial:01155390834";

const INSTAPAY_DIRECT_URL =
  "https://ipn.eg/C/Q/atef.elsamanody/instapay?ISIGN=23052601MEQCIBqQ8aV8lr1088h8x1Z25iEpTAt8F12FXf9shxHZ19JnAiBLI+U/tKJ5x6V9Hq0z5ms1hmnHrXccsZ6FxeFI+SKUjg==";

/* =========================================================
   PAYMENT PAGE CONTENT
========================================================= */

function PaymentPageContent() {
  const searchParams = useSearchParams();

  const orderId =
    searchParams.get("orderId") || "";

  const [order, setOrder] =
    useState<OrderData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [payerAccount, setPayerAccount] =
    useState("");

  const [transferAmount, setTransferAmount] =
    useState("");

  const [message, setMessage] =
    useState("");

  /* =========================================================
     LOAD ORDER
  ========================================================= */

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setMessage(
          "رقم الطلب غير موجود."
        );

        setLoading(false);
        return;
      }

      try {
        const orderRef = doc(
          db,
          "orders",
          orderId
        );

        const snapshot =
          await getDoc(orderRef);

        if (!snapshot.exists()) {
          setMessage(
            "لم يتم العثور على الطلب."
          );

          setLoading(false);
          return;
        }

        const data =
          snapshot.data() as OrderData;

        setOrder({
          ...data,
          orderId,
        });

        if (data.payerAccount) {
          setPayerAccount(
            data.payerAccount
          );
        }

        if (
          data.transferAmount !==
          undefined
        ) {
          setTransferAmount(
            String(
              data.transferAmount
            )
          );
        }
      } catch (error) {
        console.error(
          "LOAD ORDER ERROR:",
          error
        );

        setMessage(
          "حدث خطأ أثناء تحميل الطلب."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  /* =========================================================
     PAYMENT AMOUNT
  ========================================================= */

  const paymentAmount = Number(
    order?.paidAmount ??
      order?.amountToPayNow ??
      order?.depositAmount ??
      order?.deposit ??
      order?.total ??
      0
  );

  /* =========================================================
     COPY
  ========================================================= */

  async function copyText(
    value: string
  ) {
    try {
      await navigator.clipboard.writeText(
        value
      );

      setMessage(
        "تم نسخ البيانات بنجاح."
      );

      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch {
      setMessage(
        "اضغط مطولًا على البيانات لنسخها."
      );
    }
  }

  /* =========================================================
     REDIRECT TO TRACK PAGE
  ========================================================= */

  function goToTracking(
    currentOrder?: OrderData | null
  ) {
    const phone =
      currentOrder?.phone ||
      order?.phone ||
      "";

    const params =
      new URLSearchParams();

    if (phone) {
      params.set(
        "phone",
        phone
      );
    }

    if (orderId) {
      params.set(
        "orderId",
        orderId
      );
    }

    window.location.href =
      `/track?${params.toString()}`;
  }

  /* =========================================================
     SUBMIT PAYMENT
  ========================================================= */

  async function submitPayment() {
    if (submitting) return;

    setMessage("");

    if (!orderId) {
      setMessage(
        "رقم الطلب غير موجود."
      );

      return;
    }

    const cleanPayerAccount =
      payerAccount.trim();

    const numericTransferAmount =
      Number(
        transferAmount
      );

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!cleanPayerAccount) {
      setMessage(
        "اكتب رقم الهاتف أو الحساب الذي تم التحويل منه."
      );

      return;
    }

    if (
      numericTransferAmount <= 0 ||
      !Number.isFinite(
        numericTransferAmount
      )
    ) {
      setMessage(
        "اكتب مبلغ التحويل بشكل صحيح."
      );

      return;
    }

    if (
      numericTransferAmount !==
      Number(paymentAmount)
    ) {
      setMessage(
        `مبلغ التحويل يجب أن يكون ${Number(
          paymentAmount
        ).toLocaleString(
          "en-US"
        )} جنيه.`
      );

      return;
    }

    try {
      setSubmitting(true);

      setMessage(
        "جاري إرسال بيانات التحويل..."
      );

      /* =====================================================
         UPDATE FIRESTORE
      ===================================================== */

      const orderRef = doc(
        db,
        "orders",
        orderId
      );

      await updateDoc(
        orderRef,
        {
          payerAccount:
            cleanPayerAccount,

          transferAmount:
            numericTransferAmount,

          paymentStatus:
            "pending_review",

          status:
            "awaiting_payment_review",

          paymentSubmittedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      /* =====================================================
         LOCAL STATE
      ===================================================== */

      const updatedOrder: OrderData = {
        ...(order || {}),

        orderId,

        payerAccount:
          cleanPayerAccount,

        transferAmount:
          numericTransferAmount,

        paymentStatus:
          "pending_review",

        status:
          "awaiting_payment_review",
      };

      setOrder(
        updatedOrder
      );

      /* =====================================================
         SUCCESS
      ===================================================== */

      setMessage(
        "تم إرسال بيانات التحويل بنجاح ❤️"
      );

      /* =====================================================
         TRACKING
      ===================================================== */

      setTimeout(() => {
        goToTracking(
          updatedOrder
        );
      }, 1000);

    } catch (error: any) {
      console.error(
        "PAYMENT SUBMIT ERROR:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setMessage(
          "ليس لديك صلاحية إرسال بيانات التحويل."
        );
      } else {
        setMessage(
          "حدث خطأ أثناء إرسال بيانات التحويل. حاول مرة أخرى."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main
        className="payment-page"
        dir="rtl"
      >
        <div className="payment-loading">
          <div className="loader" />

          <p>
            جاري تحميل بيانات الطلب...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     ORDER ERROR
  ========================================================= */

  if (!order) {
    return (
      <main
        className="payment-page"
        dir="rtl"
      >
        <div className="error-card">
          <div className="error-icon">
            !
          </div>

          <h1>
            تعذر تحميل الطلب
          </h1>

          <p>
            {message ||
              "حدث خطأ غير متوقع."}
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAYMENT PAGE
  ========================================================= */

  return (
    <main
      className="payment-page"
      dir="rtl"
    >
      <section className="payment-container">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="payment-header">

          <div className="header-icon">
            $
          </div>

          <div>
            <span className="eyebrow">
              A.GO STORE
            </span>

            <h1>
              إتمام الدفع
            </h1>

            <p>
              حوّل المبلغ المطلوب ثم
              اكتب بيانات التحويل بالأسفل.
            </p>
          </div>

        </div>

        {/* =====================================================
            ORDER INFO
        ===================================================== */}

        <div className="order-info-card">

          <div className="order-info-top">

            <span>
              رقم الطلب
            </span>

            <strong dir="ltr">
              {orderId}
            </strong>

          </div>

          <div className="amount-section">

            <span>
              المبلغ المطلوب دفعه الآن
            </span>

            <strong>
              {paymentAmount.toLocaleString(
                "en-US"
              )}{" "}
              <small>
                جنيه
              </small>
            </strong>

          </div>

          {order.paymentType ===
            "deposit" && (
            <p className="deposit-note">
              هذا المبلغ يمثل العربون
              المطلوب لتأكيد الطلب.
            </p>
          )}

        </div>

        {/* =====================================================
            PAYMENT METHODS
        ===================================================== */}

        <div className="payment-methods">

          {/* ===================================================
              ETISALAT CASH
          =================================================== */}

          <div className="method-card">

            <div className="method-heading">

              <div className="method-logo">
                E
              </div>

              <div>
                <h3>
                  اتصالات كاش
                </h3>

                <p>
                  تحويل مباشر أو نسخ الرقم
                </p>
              </div>

            </div>

            <div className="copy-row">

              <div
                className="copy-value"
                dir="ltr"
              >
                {ETISALAT_CASH}
              </div>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    ETISALAT_CASH
                  )
                }
                className="copy-button"
              >
                نسخ
              </button>

            </div>

            <a
              href={
                ETISALAT_DIRECT_URL
              }
              className="direct-payment-button"
            >
              تحويل الآن
              <span>
                ↗️
              </span>
            </a>

          </div>

          {/* ===================================================
              INSTAPAY
          =================================================== */}

          <div className="method-card">

            <div className="method-heading">

              <div className="method-logo instapay">
                IP
              </div>

              <div>
                <h3>
                  InstaPay
                </h3>

                <p>
                  تحويل مباشر أو نسخ الحساب
                </p>
              </div>

            </div>

            <div className="copy-row">

              <div
                className="copy-value instapay-value"
                dir="ltr"
              >
                {INSTAPAY}
              </div>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    INSTAPAY
                  )
                }
                className="copy-button"
              >
                نسخ
              </button>

            </div>

            <a
              href={
                INSTAPAY_DIRECT_URL
              }
              className="direct-payment-button instapay-direct"
            >
              تحويل الآن
              <span>
                ↗️
              </span>
            </a>

          </div>

        </div>

        {/* =====================================================
            INSTRUCTIONS
        ===================================================== */}

        <div className="instructions-card">

          <div className="instruction-number">
            02
          </div>

          <div>

            <h3>
              بعد التحويل
            </h3>

            <p>
              اكتب رقم الهاتف أو الحساب
              الذي تم التحويل منه، ثم
              اكتب المبلغ الذي قمت بتحويله.
            </p>

          </div>

        </div>

        {/* =====================================================
            TRANSFER DATA
        ===================================================== */}

        <div className="section-title">

          <span>
            03
          </span>

          <h2>
            بيانات التحويل
          </h2>

        </div>

        <div className="transfer-form">

          {/* ===================================================
              PAYER ACCOUNT
          =================================================== */}

          <div className="form-group">

            <label htmlFor="payerAccount">
              رقم الهاتف أو الحساب الذي حوّلت منه
            </label>

            <input
              id="payerAccount"
              type="text"
              value={
                payerAccount
              }
              onChange={(e) =>
                setPayerAccount(
                  e.target.value
                )
              }
              placeholder="مثال: 010xxxxxxxx أو اسم الحساب"
              dir="ltr"
              disabled={
                submitting
              }
              autoComplete="off"
            />

          </div>

          {/* ===================================================
              TRANSFER AMOUNT
          =================================================== */}

          <div className="form-group">

            <label htmlFor="transferAmount">
              مبلغ التحويل
            </label>

            <div className="amount-input-wrapper">

              <input
                id="transferAmount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={
                  transferAmount
                }
                onChange={(e) =>
                  setTransferAmount(
                    e.target.value
                  )
                }
                placeholder="اكتب المبلغ"
                dir="ltr"
                disabled={
                  submitting
                }
              />

              <span>
                جنيه
              </span>

            </div>

            <small className="amount-hint">
              المطلوب تحويله الآن:{" "}
              <strong>
                {paymentAmount.toLocaleString(
                  "en-US"
                )}{" "}
                جنيه
              </strong>
            </small>

          </div>

        </div>

        {/* =====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={`message-box ${
              message.includes(
                "بنجاح"
              )
                ? "success-message"
                : ""
            }`}
          >
            {message}
          </div>
        )}

        {/* =====================================================
            CONFIRM
        ===================================================== */}

        <button
          type="button"
          className="confirm-payment-button"
          disabled={
            submitting ||
            !payerAccount.trim() ||
            !transferAmount
          }
          onClick={
            submitPayment
          }
        >
          {submitting
            ? "جاري إرسال بيانات التحويل..."
            : "تأكيد إرسال الدفع"}
        </button>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="secure-note">

          <span>
            🔒
          </span>

          <p>
            بعد إرسال البيانات سيتم
            مراجعة التحويل وتأكيد الطلب.
          </p>

        </div>

      </section>
    </main>
  );
}

/* =========================================================
   SUSPENSE FIX FOR NEXT.JS BUILD
========================================================= */

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main
          className="payment-page"
          dir="rtl"
        >
          <div className="payment-loading">
            <div className="loader" />

            <p>
              جاري تحميل بيانات الطلب...
            </p>
          </div>
        </main>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}