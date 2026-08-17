"use client";

import { useEffect, useMemo, useState } from "react";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

type CouponUser = {
  phone: string;
  name?: string;
  usedCount?: number;
  lastUsedAt?: any;
};

type Coupon = {
  id: string;

  code?: string;

  discountType?: "percentage" | "fixed";

  discountValue?: number;

  usageLimit?: number;

  usedCount?: number;

  active?: boolean;

  createdAt?: any;

  usedBy?: CouponUser[];
};

export default function CouponsPage() {
  const [coupons, setCoupons] =
    useState<Coupon[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [code, setCode] =
    useState("");

  const [discountType, setDiscountType] =
    useState<"percentage" | "fixed">(
      "percentage"
    );

  const [discountValue, setDiscountValue] =
    useState("");

  const [usageLimit, setUsageLimit] =
    useState("");

  const [expandedCoupon, setExpandedCoupon] =
    useState<string | null>(null);

  // ==========================================
  // LOAD COUPONS
  // ==========================================

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      setLoading(true);

      const snapshot = await getDocs(
        collection(db, "coupons")
      );

      const loadedCoupons: Coupon[] =
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Coupon, "id">),
        }));

      setCoupons(loadedCoupons);
    } catch (error) {
      console.error(
        "LOAD COUPONS ERROR:",
        error
      );

      alert(
        "حصل خطأ أثناء تحميل أكواد الخصم ❌"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // CREATE COUPON
  // ==========================================

  async function createCoupon() {
    const cleanCode =
      code.trim().toUpperCase();

    const value =
      Number(discountValue);

    const limit =
      usageLimit.trim() === ""
        ? 0
        : Number(usageLimit);

    if (!cleanCode) {
      alert("اكتب كود الخصم");
      return;
    }

    if (!value || value <= 0) {
      alert("اكتب قيمة الخصم");
      return;
    }

    if (
      discountType === "percentage" &&
      value > 100
    ) {
      alert(
        "نسبة الخصم لا يمكن أن تتعدى 100%"
      );
      return;
    }

    if (limit < 0) {
      alert(
        "حد الاستخدام غير صحيح"
      );
      return;
    }

    const exists =
      coupons.some(
        (coupon) =>
          coupon.code?.toUpperCase() ===
          cleanCode
      );

    if (exists) {
      alert(
        "الكود ده موجود بالفعل"
      );
      return;
    }

    try {
      setSaving(true);

      await addDoc(
        collection(db, "coupons"),
        {
          code: cleanCode,

          discountType,

          discountValue: value,

          // 0 = غير محدود
          usageLimit: limit,

          usedCount: 0,

          active: true,

          // المستخدمين الذين استخدموا الكوبون
          usedBy: [],

          createdAt:
            serverTimestamp(),
        }
      );

      setCode("");

      setDiscountValue("");

      setUsageLimit("");

      await loadCoupons();

      alert(
        "تم إنشاء الكوبون بنجاح ✅"
      );
    } catch (error) {
      console.error(
        "CREATE COUPON ERROR:",
        error
      );

      alert(
        "حصل خطأ أثناء إنشاء الكوبون ❌"
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // TOGGLE COUPON
  // ==========================================

  async function toggleCoupon(
    coupon: Coupon
  ) {
    try {
      const newActive =
        !coupon.active;

      await updateDoc(
        doc(
          db,
          "coupons",
          coupon.id
        ),
        {
          active: newActive,
        }
      );

      setCoupons((previous) =>
        previous.map((item) =>
          item.id === coupon.id
            ? {
                ...item,
                active: newActive,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "TOGGLE COUPON ERROR:",
        error
      );

      alert(
        "حصل خطأ أثناء تعديل الكوبون ❌"
      );
    }
  }

  // ==========================================
  // DELETE COUPON
  // ==========================================

  async function deleteCoupon(
    coupon: Coupon
  ) {
    const confirmed =
      window.confirm(
        `هل تريد حذف الكوبون ${coupon.code}?`
      );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(
          db,
          "coupons",
          coupon.id
        )
      );

      setCoupons((previous) =>
        previous.filter(
          (item) =>
            item.id !== coupon.id
        )
      );

      if (
        expandedCoupon ===
        coupon.id
      ) {
        setExpandedCoupon(null);
      }
    } catch (error) {
      console.error(
        "DELETE COUPON ERROR:",
        error
      );

      alert(
        "حصل خطأ أثناء حذف الكوبون ❌"
      );
    }
  }

  // ==========================================
  // FORMAT MONEY
  // ==========================================

  function money(
    value: number
  ) {
    return `${Number(
      value || 0
    ).toLocaleString(
      "en-US"
    )} EGP`;
  }

  // ==========================================
  // FORMAT DATE
  // ==========================================

  function formatDate(
    timestamp: any
  ) {
    if (!timestamp) {
      return "غير متوفر";
    }

    try {
      const date =
        timestamp?.toDate
          ? timestamp.toDate()
          : new Date(timestamp);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "غير متوفر";
      }

      return date.toLocaleString(
        "ar-EG",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "غير متوفر";
    }
  }

  // ==========================================
  // STATUS
  // ==========================================

  function getCouponStatus(
    coupon: Coupon
  ) {
    const used =
      Number(
        coupon.usedCount || 0
      );

    const limit =
      Number(
        coupon.usageLimit || 0
      );

    if (
      limit > 0 &&
      used >= limit
    ) {
      return {
        label:
          "انتهت الاستخدامات",
        className:
          "coupon-status-ended",
      };
    }

    if (
      coupon.active === true
    ) {
      return {
        label: "فعال",
        className:
          "coupon-status-active",
      };
    }

    return {
      label: "متوقف",
      className:
        "coupon-status-disabled",
    };
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  const statistics =
    useMemo(() => {
      const total =
        coupons.length;

      const active =
        coupons.filter(
          (coupon) =>
            coupon.active ===
            true
        ).length;

      const totalUses =
        coupons.reduce(
          (sum, coupon) =>
            sum +
            Number(
              coupon.usedCount ||
                0
            ),
          0
        );

      const unlimited =
        coupons.filter(
          (coupon) =>
            Number(
              coupon.usageLimit ||
                0
            ) === 0
        ).length;

      return {
        total,
        active,
        totalUses,
        unlimited,
      };
    }, [coupons]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
   return (
  <main className="admin-coupons-page" dir="rtl">
        <div className="coupons-loading">

          <div className="loading-spinner" />

          <h2>
            جاري تحميل أكواد الخصم
          </h2>

          <p>
            برجاء الانتظار...
          </p>

        </div>

      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

 return (
  <main className="admin-coupons-page" dir="rtl">
      {/* ======================================
          HEADER
      ======================================= */}

      <header className="coupons-header">

        <div>
          <div className="coupons-title-row">

            <span className="coupons-title-mark">
              A.GO
            </span>

            <h1>
              Coupons
            </h1>

          </div>

          <p>
            إدارة أكواد الخصم والاستخدامات والعملاء
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={loadCoupons}
        >
          ↻ تحديث
        </button>

      </header>

      {/* ======================================
          STATISTICS
      ======================================= */}

      <section className="coupon-overview">

        <div className="overview-box">

          <span>
            إجمالي الكوبونات
          </span>

          <strong>
            {statistics.total}
          </strong>

        </div>

        <div className="overview-box">

          <span>
            الكوبونات الفعالة
          </span>

          <strong>
            {statistics.active}
          </strong>

        </div>

        <div className="overview-box">

          <span>
            إجمالي الاستخدامات
          </span>

          <strong>
            {statistics.totalUses}
          </strong>

        </div>

        <div className="overview-box">

          <span>
            استخدام غير محدود
          </span>

          <strong>
            {statistics.unlimited}
          </strong>

        </div>

      </section>

      {/* ======================================
          CREATE
      ======================================= */}

      <section className="coupon-create-card">

        <div className="section-heading">

          <div>
            <span>
              NEW COUPON
            </span>

            <h2>
              إنشاء كود خصم
            </h2>

            <p>
              أنشئ كوبون جديد وحدد قيمة الخصم وحد الاستخدام.
            </p>
          </div>

        </div>

        <div className="coupon-form">

          {/* CODE */}

          <div className="coupon-field">

            <label>
              كود الخصم
            </label>

            <input
              type="text"
              placeholder="مثال: AGO10"
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value.toUpperCase()
                )
              }
            />

          </div>

          {/* TYPE */}

          <div className="coupon-field">

            <label>
              نوع الخصم
            </label>

            <select
              value={discountType}
              onChange={(e) =>
                setDiscountType(
                  e.target.value as
                    | "percentage"
                    | "fixed"
                )
              }
            >

              <option value="percentage">
                نسبة مئوية %
              </option>

              <option value="fixed">
                مبلغ ثابت EGP
              </option>

            </select>

          </div>

          {/* VALUE */}

          <div className="coupon-field">

            <label>
              قيمة الخصم
            </label>

            <input
              type="number"
              min="1"
              placeholder={
                discountType ===
                "percentage"
                  ? "مثال: 10"
                  : "مثال: 100"
              }
              value={discountValue}
              onChange={(e) =>
                setDiscountValue(
                  e.target.value
                )
              }
            />

          </div>

          {/* LIMIT */}

          <div className="coupon-field">

            <label>
              حد الاستخدام
            </label>

            <input
              type="number"
              min="0"
              placeholder="0 = غير محدود"
              value={usageLimit}
              onChange={(e) =>
                setUsageLimit(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        <div className="coupon-create-footer">

          <span>
            {usageLimit === ""
              ? "الاستخدام غير محدود"
              : Number(usageLimit) === 0
              ? "الاستخدام غير محدود"
              : `مسموح بـ ${usageLimit} استخدام`}
          </span>

          <button
            type="button"
            className="create-coupon-btn"
            onClick={createCoupon}
            disabled={saving}
          >
            {saving
              ? "جاري الإنشاء..."
              : "+ إنشاء الكوبون"}
          </button>

        </div>

      </section>

      {/* ======================================
          COUPONS LIST
      ======================================= */}

      <section className="coupons-section">

        <div className="coupons-section-header">

          <div>
            <span>
              COUPONS
            </span>

            <h2>
              أكواد الخصم
            </h2>
          </div>

          <div className="coupon-count-badge">
            {coupons.length}
          </div>

        </div>

        {coupons.length === 0 ? (

          <div className="coupons-empty">

            <div className="empty-icon">
              %
            </div>

            <h3>
              لا توجد أكواد خصم
            </h3>

            <p>
              أنشئ أول كوبون من القسم الموجود بالأعلى.
            </p>

          </div>

        ) : (

          <div className="coupons-list">

            {coupons.map(
              (coupon) => {

                const value =
                  Number(
                    coupon.discountValue ||
                      0
                  );

                const used =
                  Number(
                    coupon.usedCount ||
                      0
                  );

                const limit =
                  Number(
                    coupon.usageLimit ||
                      0
                  );

                const remaining =
                  limit > 0
                    ? Math.max(
                        limit - used,
                        0
                      )
                    : null;

                const status =
                  getCouponStatus(
                    coupon
                  );

                const users =
                  Array.isArray(
                    coupon.usedBy
                  )
                    ? coupon.usedBy
                    : [];

                const expanded =
                  expandedCoupon ===
                  coupon.id;

                const usagePercentage =
                  limit > 0
                    ? Math.min(
                        (used /
                          limit) *
                          100,
                        100
                      )
                    : 0;

                return (

                  <article
                    key={coupon.id}
                    className="coupon-card"
                  >

                    {/* =========================
                        TOP
                    ========================== */}

                    <div className="coupon-card-top">

                      <div className="coupon-code-box">

                        <span>
                          COUPON CODE
                        </span>

                        <strong>
                          {coupon.code ||
                            "NO CODE"}
                        </strong>

                      </div>

                      <div
                        className={`coupon-status ${status.className}`}
                      >
                        {status.label}
                      </div>

                    </div>

                    {/* =========================
                        MAIN INFO
                    ========================== */}

                    <div className="coupon-main-info">

                      <div className="coupon-info-item">

                        <span>
                          الخصم
                        </span>

                        <strong className="discount-value">

                          {coupon.discountType ===
                          "fixed"
                            ? money(value)
                            : `${value}%`}

                        </strong>

                      </div>

                      <div className="coupon-info-item">

                        <span>
                          تم الاستخدام
                        </span>

                        <strong>
                          {used}
                        </strong>

                      </div>

                      <div className="coupon-info-item">

                        <span>
                          الحد الأقصى
                        </span>

                        <strong>
                          {limit > 0
                            ? limit
                            : "∞"}
                        </strong>

                      </div>

                      <div className="coupon-info-item">

                        <span>
                          المتبقي
                        </span>

                        <strong>
                          {remaining !==
                          null
                            ? remaining
                            : "∞"}
                        </strong>

                      </div>

                    </div>

                    {/* =========================
                        PROGRESS
                    ========================== */}

                    <div className="coupon-progress-section">

                      <div className="coupon-progress-top">

                        <span>
                          نسبة الاستخدام
                        </span>

                        <strong>
                          {limit > 0
                            ? `${Math.round(
                                usagePercentage
                              )}%`
                            : "غير محدود"}
                        </strong>

                      </div>

                      {limit > 0 && (

                        <div className="coupon-progress">

                          <div
                            className="coupon-progress-fill"
                            style={{
                              width: `${usagePercentage}%`,
                            }}
                          />

                        </div>

                      )}

                    </div>

                    {/* =========================
                        META
                    ========================== */}

                    <div className="coupon-meta">

                      <div>

                        <span>
                          تاريخ الإنشاء
                        </span>

                        <strong>
                          {formatDate(
                            coupon.createdAt
                          )}
                        </strong>

                      </div>

                      <div>

                        <span>
                          عدد العملاء
                        </span>

                        <strong>
                          {users.length}
                        </strong>

                      </div>

                    </div>

                    {/* =========================
                        USERS
                    ========================== */}

                    <div className="coupon-users-section">

                      <button
                        type="button"
                        className="coupon-users-toggle"
                        onClick={() =>
                          setExpandedCoupon(
                            expanded
                              ? null
                              : coupon.id
                          )
                        }
                      >

                        <span>
                          👥 العملاء الذين استخدموا الكوبون
                        </span>

                        <span>
                          {users.length}

                          <b>
                            {expanded
                              ? "⌃"
                              : "⌄"}
                          </b>
                        </span>

                      </button>

                      {expanded && (

                        <div className="coupon-users-list">

                          {users.length ===
                          0 ? (

                            <div className="no-coupon-users">

                              <span>
                                لا يوجد أي استخدام للكوبون حتى الآن.
                              </span>

                            </div>

                          ) : (

                            users.map(
                              (
                                user,
                                index
                              ) => (

                                <div
                                  key={`${user.phone}-${index}`}
                                  className="coupon-user-row"
                                >

                                  <div className="coupon-user-avatar">

                                    {(
                                      user.name ||
                                      "ع"
                                    )
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}

                                  </div>

                                  <div className="coupon-user-info">

                                    <strong>
                                      {user.name ||
                                        "عميل"}
                                    </strong>

                                    <span>
                                      📞{" "}
                                      {user.phone ||
                                        "-"}
                                    </span>

                                  </div>

                                  <div className="coupon-user-usage">

                                    <strong>
                                      {Number(
                                        user.usedCount ||
                                          1
                                      )}
                                    </strong>

                                    <span>
                                      مرات
                                    </span>

                                  </div>

                                  <div className="coupon-user-date">

                                    <span>
                                      آخر استخدام
                                    </span>

                                    <strong>
                                      {formatDate(
                                        user.lastUsedAt
                                      )}
                                    </strong>

                                  </div>

                                </div>

                              )
                            )

                          )}

                        </div>

                      )}

                    </div>

                    {/* =========================
                        ACTIONS
                    ========================== */}

                    <div className="coupon-actions">

                      <button
                        type="button"
                        className="coupon-toggle-btn"
                        onClick={() =>
                          toggleCoupon(
                            coupon
                          )
                        }
                      >
                        {coupon.active
                          ? "إيقاف الكوبون"
                          : "تفعيل الكوبون"}
                      </button>

                      <button
                        type="button"
                        className="delete-coupon-btn"
                        onClick={() =>
                          deleteCoupon(
                            coupon
                          )
                        }
                      >
                        حذف الكوبون
                      </button>

                    </div>

                  </article>

                );
              }
            )}

          </div>

        )}

      </section>

    </main>
  );
}