"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";

import { createOrder } from "../lib/orders";
import { db } from "../lib/firebase";

/* =========================================================
   TYPES
========================================================= */

type CartItem = {
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
  name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
};

type CouponData = {
  id: string;
  code?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  usageLimit?: number;
  usedCount?: number;
  active?: boolean;
};

/* =========================================================
   EGYPT GOVERNORATES
========================================================= */

const EGYPT_GOVERNORATES: Record<string, string[]> = {
  القاهرة: [
    "مدينة نصر",
    "مصر الجديدة",
    "المعادي",
    "حلوان",
    "التجمع الأول",
    "التجمع الخامس",
    "الشروق",
    "بدر",
    "15 مايو",
    "المرج",
    "عين شمس",
    "المطرية",
    "شبرا",
    "روض الفرج",
    "الزمالك",
    "وسط البلد",
  ],

  الجيزة: [
    "الجيزة",
    "6 أكتوبر",
    "الشيخ زايد",
    "حدائق أكتوبر",
    "العمرانية",
    "الهرم",
    "فيصل",
    "الدقي",
    "العجوزة",
    "إمبابة",
    "الوراق",
    "البدرشين",
    "العياط",
    "الصف",
    "أوسيم",
    "كرداسة",
  ],

  القليوبية: [
    "بنها",
    "شبرا الخيمة",
    "القناطر الخيرية",
    "الخانكة",
    "العبور",
    "قليوب",
    "طوخ",
    "كفر شكر",
    "شبين القناطر",
  ],

  الإسكندرية: [
    "الإسكندرية",
    "برج العرب",
    "برج العرب الجديدة",
    "العامرية",
    "العجمي",
    "سيدي بشر",
    "سموحة",
    "محرم بك",
    "المنتزه",
    "ميامي",
  ],

  الدقهلية: [
    "المنصورة",
    "طلخا",
    "ميت غمر",
    "دكرنس",
    "السنبلاوين",
    "أجا",
    "منية النصر",
    "بلقاس",
    "شربين",
    "المطرية",
    "الجمالية",
    "نبروه",
  ],

  الشرقية: [
    "الزقازيق",
    "العاشر من رمضان",
    "بلبيس",
    "منيا القمح",
    "فاقوس",
    "أبو كبير",
    "كفر صقر",
    "ههيا",
    "ديرب نجم",
    "الحسينية",
    "أولاد صقر",
  ],

  الغربية: [
    "طنطا",
    "المحلة الكبرى",
    "كفر الزيات",
    "زفتى",
    "السنطة",
    "سمنود",
    "قطور",
    "بسيون",
  ],

  المنوفية: [
    "شبين الكوم",
    "منوف",
    "السادات",
    "أشمون",
    "الباجور",
    "قويسنا",
    "بركة السبع",
    "تلا",
    "الشهداء",
  ],

  البحيرة: [
    "دمنهور",
    "كفر الدوار",
    "رشيد",
    "إدكو",
    "أبو حمص",
    "أبو المطامير",
    "الدلنجات",
    "حوش عيسى",
    "المحمودية",
    "إيتاي البارود",
    "شبراخيت",
    "وادي النطرون",
    "بدر",
  ],

  كفر_الشيخ: [
    "كفر الشيخ",
    "دسوق",
    "فوه",
    "مطوبس",
    "بلطيم",
    "الحامول",
    "بيلا",
    "سيدي سالم",
    "قلين",
    "الرياض",
    "برج البرلس",
  ],

  دمياط: [
    "دمياط",
    "دمياط الجديدة",
    "رأس البر",
    "فارسكور",
    "كفر سعد",
    "الزرقا",
    "كفر البطيخ",
    "السرو",
  ],

  بورسعيد: [
    "بورسعيد",
    "بورفؤاد",
  ],

  الإسماعيلية: [
    "الإسماعيلية",
    "فايد",
    "القنطرة شرق",
    "القنطرة غرب",
    "التل الكبير",
    "أبو صوير",
    "القصاصين الجديدة",
  ],

  السويس: [
    "السويس",
    "العين السخنة",
    "عتاقة",
    "الجناين",
    "فيصل",
    "الأربعين",
  ],

  الفيوم: [
    "الفيوم",
    "الفيوم الجديدة",
    "سنورس",
    "إطسا",
    "طامية",
    "أبشواي",
    "يوسف الصديق",
  ],

  بني_سويف: [
    "بني سويف",
    "بني سويف الجديدة",
    "الواسطى",
    "ناصر",
    "إهناسيا",
    "ببا",
    "الفشن",
    "سمسطا",
  ],

  المنيا: [
    "المنيا",
    "المنيا الجديدة",
    "ملوي",
    "مغاغة",
    "بني مزار",
    "سمالوط",
    "أبو قرقاص",
    "دير مواس",
    "مطاي",
    "العدوة",
  ],

  أسيوط: [
    "أسيوط",
    "أسيوط الجديدة",
    "ديروط",
    "منفلوط",
    "القوصية",
    "أبنوب",
    "أبو تيج",
    "الغنايم",
    "ساحل سليم",
    "البداري",
    "صدفا",
  ],

  سوهاج: [
    "سوهاج",
    "سوهاج الجديدة",
    "أخميم",
    "جرجا",
    "طهطا",
    "البلينا",
    "المراغة",
    "المنشأة",
    "جهينة",
    "دار السلام",
    "ساقلتة",
  ],

  قنا: [
    "قنا",
    "قنا الجديدة",
    "نجع حمادي",
    "دشنا",
    "قفط",
    "قوص",
    "نقادة",
    "أبو تشت",
    "فرشوط",
    "الوقف",
  ],

  الأقصر: [
    "الأقصر",
    "الأقصر الجديدة",
    "إسنا",
    "أرمنت",
    "الطود",
    "القرنة",
    "البياضية",
  ],

  أسوان: [
    "أسوان",
    "أسوان الجديدة",
    "إدفو",
    "كوم أمبو",
    "دراو",
    "نصر النوبة",
    "أبو سمبل",
  ],

  البحر_الأحمر: [
    "الغردقة",
    "رأس غارب",
    "سفاجا",
    "القصير",
    "مرسى علم",
    "الشلاتين",
    "حلايب",
  ],

  الوادي_الجديد: [
    "الخارجة",
    "الداخلة",
    "الفرافرة",
    "باريس",
    "بلاط",
  ],

  مطروح: [
    "مرسى مطروح",
    "الحمام",
    "العلمين",
    "الضبعة",
    "سيدي براني",
    "السلوم",
    "سيوة",
    "النجيلة",
  ],

  جنوب_سيناء: [
    "شرم الشيخ",
    "دهب",
    "نويبع",
    "طابا",
    "سانت كاترين",
    "رأس سدر",
    "أبو رديس",
    "أبو زنيمة",
  ],
};

const GOVERNORATE_LABELS: Record<string, string> = {
  كفر_الشيخ: "كفر الشيخ",
  بني_سويف: "بني سويف",
  البحر_الأحمر: "البحر الأحمر",
  الوادي_الجديد: "الوادي الجديد",
  جنوب_سيناء: "جنوب سيناء",
};

/* =========================================================
   SHIPPING
========================================================= */

function getShippingCost(
  governorate: string,
  city: string
) {
  if (!governorate || !city) {
    return 0;
  }

  if (governorate === "الدقهلية") {
    return city === "المنصورة" ? 105 : 125;
  }

  if (
    governorate === "القاهرة" ||
    governorate === "الجيزة" ||
    governorate === "الإسكندرية" ||
    governorate === "البحيرة" ||
    governorate === "الشرقية" ||
    governorate === "الغربية" ||
    governorate === "كفر_الشيخ" ||
    governorate === "المنوفية" ||
    governorate === "دمياط" ||
    governorate === "القليوبية"
  ) {
    return 125;
  }

  if (governorate === "بورسعيد") {
    return 135;
  }

  if (governorate === "الإسماعيلية") {
    return 125;
  }

  if (governorate === "السويس") {
    return city === "العين السخنة" ? 190 : 135;
  }

  if (
    governorate === "الفيوم" ||
    governorate === "بني_سويف" ||
    governorate === "المنيا" ||
    governorate === "أسيوط" ||
    governorate === "سوهاج"
  ) {
    return 145;
  }

  if (governorate === "قنا") {
    return 165;
  }

  if (governorate === "الأقصر") {
    return 195;
  }

  if (governorate === "أسوان") {
    return 215;
  }

  if (governorate === "الوادي_الجديد") {
    return 270;
  }

  if (governorate === "البحر_الأحمر") {
    return 220;
  }

  if (governorate === "جنوب_سيناء") {
    return city === "دهب" || city === "نويبع"
      ? 270
      : 210;
  }

  if (governorate === "مطروح") {
    return 200;
  }

  return 0;
}

/* =========================================================
   CHECKOUT
========================================================= */

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const [paymentType, setPaymentType] =
    useState<"full" | "deposit">("full");

  const [customer, setCustomer] =
    useState<Customer>({
      name: "",
      phone: "",
      governorate: "",
      city: "",
      address: "",
    });

  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     LOAD CART
  ========================================================= */

  useEffect(() => {
    try {
      const items = JSON.parse(
        localStorage.getItem("cart") || "[]"
      );

      setCart(
        Array.isArray(items) ? items : []
      );
    } catch {
      setCart([]);
    }
  }, []);

  /* =========================================================
     PRODUCTS TOTAL
  ========================================================= */

  const productsTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.qty || 1),
      0
    );
  }, [cart]);

  /* =========================================================
     DISCOUNT
  ========================================================= */

  const discountedProductsTotal = Math.max(
    productsTotal - couponDiscount,
    0
  );

  /* =========================================================
     SHIPPING
  ========================================================= */

  const shipping = getShippingCost(
    customer.governorate,
    customer.city
  );

  const locationSelected = Boolean(
    customer.governorate &&
      customer.city
  );

  /* =========================================================
     PAYMENT
========================================================= */

  const deposit = Math.round(
    discountedProductsTotal * 0.3
  );

  const remainingProducts = Math.max(
    discountedProductsTotal - deposit,
    0
  );

  const finalTotal =
    discountedProductsTotal + shipping;

  /*
   * الدفع بالكامل:
   * يدفع قيمة المنتجات الآن
   * والشحن عند الاستلام.
   *
   * العربون:
   * يدفع 30% الآن
   * والباقي + الشحن عند الاستلام.
   */

  const amountToPayNow =
    paymentType === "deposit"
      ? deposit
      : discountedProductsTotal;

  const amountToCollect =
    paymentType === "deposit"
      ? remainingProducts + shipping
      : shipping;

  /* =========================================================
     CITIES
  ========================================================= */

  const availableCities =
    customer.governorate
      ? EGYPT_GOVERNORATES[
          customer.governorate
        ] || []
      : [];

  /* =========================================================
     CUSTOMER
  ========================================================= */

  function updateCustomer(
    field: keyof Customer,
    value: string
  ) {
    setCustomer((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "governorate"
        ? { city: "" }
        : {}),
    }));
  }

  /* =========================================================
     COLOR
  ========================================================= */

  function getColorName(color: any) {
    if (!color) return "-";

    if (typeof color === "string") {
      return color;
    }

    return (
      color.name ||
      color.label ||
      "-"
    );
  }

  /* =========================================================
     HIDDEN MESSAGE
  ========================================================= */

  function getHiddenMessageName(
    message?: string | null
  ) {
    if (!message) return "";

    return (
      message.split("/").pop() ||
      message
    );
  }

  /* =========================================================
     SIZE
  ========================================================= */

  function getSizeName(
    size?: string | null
  ) {
    if (!size) return "-";

    const cleanSize =
      String(size)
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();

    if (
      cleanSize === "XXL" ||
      cleanSize === "2-X-L" ||
      cleanSize === "2XL"
    ) {
      return "2XL";
    }

    if (
      cleanSize === "X-L" ||
      cleanSize === "XL"
    ) {
      return "XL";
    }

    if (cleanSize === "L") return "L";
    if (cleanSize === "M") return "M";

    return cleanSize;
  }

  /* =========================================================
     APPLY COUPON
  ========================================================= */

  async function applyCoupon() {
    const cleanCode =
      coupon.trim().toUpperCase();

    setCouponApplied(false);

    if (!cleanCode) {
      setCouponDiscount(0);
      setCouponMessage(
        "اكتب كود الخصم أولاً."
      );
      return;
    }

    if (productsTotal <= 0) {
      setCouponDiscount(0);
      setCouponMessage(
        "السلة فارغة."
      );
      return;
    }

    try {
      const q = query(
        collection(db, "coupons"),
        where("code", "==", cleanCode)
      );

      const snapshot =
        await getDocs(q);

      if (snapshot.empty) {
        setCouponDiscount(0);
        setCouponMessage(
          "كود الخصم غير صحيح."
        );
        return;
      }

      const couponDoc =
        snapshot.docs[0];

      const couponData =
        couponDoc.data() as Omit<
          CouponData,
          "id"
        >;

      if (
        couponData.active === false
      ) {
        setCouponDiscount(0);
        setCouponMessage(
          "كود الخصم غير مفعل."
        );
        return;
      }

      const usageLimit =
        Number(
          couponData.usageLimit || 0
        );

      const usedCount =
        Number(
          couponData.usedCount || 0
        );

      if (
        usageLimit > 0 &&
        usedCount >= usageLimit
      ) {
        setCouponDiscount(0);
        setCouponMessage(
          "كود الخصم انتهت استخداماته."
        );
        return;
      }

      const value =
        Number(
          couponData.discountValue || 0
        );

      if (value <= 0) {
        setCouponDiscount(0);
        setCouponMessage(
          "كود الخصم لا يحتوي على قيمة خصم صحيحة."
        );
        return;
      }

      let discount = 0;

      if (
        couponData.discountType ===
        "percentage"
      ) {
        discount =
          (productsTotal * value) / 100;
      } else {
        discount = value;
      }

      discount = Math.min(
        Math.max(discount, 0),
        productsTotal
      );

      if (discount <= 0) {
        setCouponDiscount(0);
        setCouponMessage(
          "كود الخصم لا يحتوي على خصم."
        );
        return;
      }

      setCouponDiscount(discount);
      setCouponApplied(true);

      setCouponMessage(
        `تم تطبيق الخصم: ${discount.toLocaleString(
          "en-US"
        )} جنيه`
      );
    } catch (error) {
      console.error(
        "COUPON ERROR:",
        error
      );

      setCouponDiscount(0);
      setCouponApplied(false);

      setCouponMessage(
        "حدث خطأ أثناء التحقق من الكود."
      );
    }
  }

  /* =========================================================
     CONFIRM ORDER
  ========================================================= */

  async function confirmOrder() {
    if (
      !customer.name.trim() ||
      !customer.phone.trim() ||
      !customer.governorate ||
      !customer.city ||
      !customer.address.trim()
    ) {
      alert(
        "من فضلك أكمل جميع بيانات العميل."
      );
      return;
    }

    if (!locationSelected) {
      alert(
        "اختر المحافظة والمدينة."
      );
      return;
    }

    if (cart.length === 0) {
      alert("السلة فارغة.");
      return;
    }

    try {
      setLoading(true);

      /* =====================================================
         RECHECK COUPON
      ===================================================== */

      let finalCouponDiscount =
        couponDiscount;

      const cleanCoupon =
        coupon.trim().toUpperCase();

      if (cleanCoupon) {
        const q = query(
          collection(db, "coupons"),
          where("code", "==", cleanCoupon)
        );

        const snapshot =
          await getDocs(q);

        if (snapshot.empty) {
          throw new Error(
            "كود الخصم غير موجود."
          );
        }

        const couponDoc =
          snapshot.docs[0];

        const couponData =
          couponDoc.data() as Omit<
            CouponData,
            "id"
          >;

        if (
          couponData.active === false
        ) {
          throw new Error(
            "كود الخصم غير مفعل."
          );
        }

        const usageLimit =
          Number(
            couponData.usageLimit || 0
          );

        const usedCount =
          Number(
            couponData.usedCount || 0
          );

        if (
          usageLimit > 0 &&
          usedCount >= usageLimit
        ) {
          throw new Error(
            "كود الخصم انتهت استخداماته."
          );
        }

        const value =
          Number(
            couponData.discountValue || 0
          );

        if (
          couponData.discountType ===
          "percentage"
        ) {
          finalCouponDiscount =
            Math.min(
              Math.max(
                (productsTotal * value) /
                  100,
                0
              ),
              productsTotal
            );
        } else {
          finalCouponDiscount =
            Math.min(
              Math.max(value, 0),
              productsTotal
            );
        }
      } else {
        finalCouponDiscount = 0;
      }

      /* =====================================================
         FINAL TOTALS
      ===================================================== */

      const finalDiscountedProductsTotal =
        Math.max(
          productsTotal -
            finalCouponDiscount,
          0
        );

      const finalDeposit =
        Math.round(
          finalDiscountedProductsTotal *
            0.3
        );

      const finalRemainingProducts =
        Math.max(
          finalDiscountedProductsTotal -
            finalDeposit,
          0
        );

      const finalTotalWithShipping =
        finalDiscountedProductsTotal +
        shipping;

      const finalAmountToPayNow =
        paymentType === "deposit"
          ? finalDeposit
          : finalDiscountedProductsTotal;

      const finalAmountToCollect =
        paymentType === "deposit"
          ? finalRemainingProducts +
            shipping
          : shipping;

      /* =====================================================
         CREATE ORDER
      ===================================================== */

      const orderId =
        await createOrder({
          customer,

          name: customer.name,
          phone: customer.phone,
          governorate:
            customer.governorate,
          city: customer.city,
          address: customer.address,

          products: cart.map(
            (item) => ({
              ...item,

              price:
                Number(
                  item.price || 0
                ),

              qty:
                Number(
                  item.qty || 1
                ),

              size:
                getSizeName(
                  item.size
                ),
            })
          ),

          /* =========================
             MONEY
          ========================= */

          total:
            finalDiscountedProductsTotal,

          productsTotal,

          couponCode:
            cleanCoupon
              ? cleanCoupon
              : null,

          couponDiscount:
            finalCouponDiscount,

          shipping,

          finalTotal:
            finalTotalWithShipping,

          /* =========================
             PAYMENT
          ========================= */

          paymentType,

          paidAmount:
            finalAmountToPayNow,

          deposit:
            paymentType === "deposit"
              ? finalDeposit
              : finalDiscountedProductsTotal,

          depositAmount:
            paymentType === "deposit"
              ? finalDeposit
              : finalDiscountedProductsTotal,

          remainingProducts:
            paymentType === "deposit"
              ? finalRemainingProducts
              : 0,

          /*
           * remaining = باقي المنتجات
           * وليس باقي المنتجات + الشحن.
           */

          remaining:
            paymentType === "deposit"
              ? finalRemainingProducts
              : 0,

          amountToCollect:
            finalAmountToCollect,

          paymentStatus:
            "pending",

          paymentMethod:
            null,

          /* =========================
             ORDER STATUS
          ========================= */

          status: "new",
        });

      /* =====================================================
         COUPON USED COUNT
      ===================================================== */

      if (cleanCoupon) {
        try {
          const q = query(
            collection(db, "coupons"),
            where(
              "code",
              "==",
              cleanCoupon
            )
          );

          const snapshot =
            await getDocs(q);

          if (!snapshot.empty) {
            const couponDoc =
              snapshot.docs[0];

            await runTransaction(
              db,
              async (transaction) => {
                const freshCoupon =
                  await transaction.get(
                    couponDoc.ref
                  );

                if (
                  !freshCoupon.exists()
                ) {
                  return;
                }

                const data =
                  freshCoupon.data();

                const currentUsed =
                  Number(
                    data.usedCount || 0
                  );

                const limit =
                  Number(
                    data.usageLimit || 0
                  );

                if (
                  limit > 0 &&
                  currentUsed >= limit
                ) {
                  return;
                }

                transaction.update(
                  doc(
                    db,
                    "coupons",
                    couponDoc.id
                  ),
                  {
                    usedCount:
                      currentUsed + 1,
                  }
                );
              }
            );
          }
        } catch (
          couponUpdateError
        ) {
          console.error(
            "COUPON COUNT UPDATE ERROR:",
            couponUpdateError
          );
        }
      }

      /* =====================================================
         CLEAR CART
      ===================================================== */

      localStorage.removeItem(
        "cart"
      );

      window.dispatchEvent(
        new Event("storage")
      );

      /* =====================================================
         GO TO PAYMENT
      ===================================================== */

      if (!orderId) {
        throw new Error(
          "تم إنشاء الطلب ولكن لم يتم الحصول على رقم الطلب."
        );
      }

      window.location.href =
        `/payment?orderId=${encodeURIComponent(
          orderId
        )}`;
    } catch (error: any) {
      console.error(
        "CREATE ORDER ERROR:",
        error
      );

      alert(
        error?.message ||
          "حدث خطأ أثناء تسجيل الطلب."
      );

      setLoading(false);
    }
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main
      className="checkout-page"
      style={{
        color: "#000",
      }}
      dir="rtl"
    >
      <h1
        className="checkout-title"
        style={{
          color: "#000",
        }}
      >
        إتمام الطلب
      </h1>

      <div className="checkout-grid">

        <div
          className="customer-info"
          style={{
            color: "#000",
          }}
        >
          <h2>
            بيانات العميل
          </h2>

          <input
            placeholder="الاسم بالكامل"
            value={customer.name}
            onChange={(e) =>
              updateCustomer(
                "name",
                e.target.value
              )
            }
          />

          <input
            placeholder="رقم الهاتف"
            value={customer.phone}
            onChange={(e) =>
              updateCustomer(
                "phone",
                e.target.value
              )
            }
          />

         

          <textarea
            rows={4}
            placeholder="العنوان بالتفصيل"
            value={
              customer.address
            }
            onChange={(e) =>
              updateCustomer(
                "address",
                e.target.value
              )
            }
          />
        </div>

        <div
          className="order-summary"
          style={{
            color: "#000",
          }}
        >
          <h2>
            ملخص الطلب
          </h2>

          {cart.map(
            (
              item,
              index
            ) => (
              <div
                key={`${item.id || item.slug || "item"}-${index}`}
                className="summary-item"
              >
                <Image
                  src={
                    item.image ||
                    "/product-01.png"
                  }
                  alt={
                    item.name ||
                    "Product"
                  }
                  width={70}
                  height={70}
                />

                <div className="summary-info">

                  <h4>
                    {item.name ||
                      "Product"}
                  </h4>

                  <p>
                    اللون :{" "}
                    <strong>
                      {getColorName(
                        item.color
                      )}
                    </strong>
                  </p>

                  <div className="summary-meta">

                    <p className="summary-size">
                      <span>
                        المقاس:
                      </span>

                      <strong
                        dir="ltr"
                        className="size-value"
                      >
                        {getSizeName(
                          item.size
                        )}
                      </strong>
                    </p>

                    <p className="summary-quantity">
                      <span>
                        الكمية:
                      </span>

                      <strong>
                        {Number(
                          item.qty ||
                            1
                        )}
                      </strong>
                    </p>

                  </div>

                  {item.hiddenMessage && (
                    <p>
                      الرسالة :{" "}
                      {getHiddenMessageName(
                        item.hiddenMessage
                      )}
                    </p>
                  )}

                </div>

                <div className="summary-price">
                  {Number(
                    item.price || 0
                  ).toLocaleString(
                    "en-US"
                  )}{" "}
                  جنيه
                </div>

              </div>
            )
          )}

          <hr />

          <div className="checkout-total-row">
            <span>
              إجمالي المنتجات
            </span>

            <strong>
              {productsTotal.toLocaleString(
                "en-US"
              )}{" "}
              جنيه
            </strong>
          </div>

          {couponDiscount > 0 && (
            <div className="checkout-total-row">
              <span>
                الخصم
              </span>

              <strong>
                -{" "}
                {couponDiscount.toLocaleString(
                  "en-US"
                )}{" "}
                جنيه
              </strong>
            </div>
          )}

          <div className="checkout-total-row">
            <span>
              بعد الخصم
            </span>

            <strong>
              {discountedProductsTotal.toLocaleString(
                "en-US"
              )}{" "}
              جنيه
            </strong>
          </div>

          <div className="checkout-shipping-summary">

  <div className="shipping-title">
    الشحن
  </div>

  <div className="shipping-selects">

    <select
      value={customer.governorate}
      onChange={(e) =>
        updateCustomer(
          "governorate",
          e.target.value
        )
      }
    >
      <option value="">
        اختر المحافظة
      </option>

      {Object.keys(
        EGYPT_GOVERNORATES
      ).map((governorate) => (
        <option
          key={governorate}
          value={governorate}
        >
          {GOVERNORATE_LABELS[
            governorate
          ] || governorate}
        </option>
      ))}
    </select>

    <select
      value={customer.city}
      disabled={!customer.governorate}
      onChange={(e) =>
        updateCustomer(
          "city",
          e.target.value
        )
      }
    >
      <option value="">
        {customer.governorate
          ? "اختر المدينة"
          : "اختر المحافظة أولاً"}
      </option>

      {availableCities.map((city) => (
        <option
          key={city}
          value={city}
        >
          {city}
        </option>
      ))}
    </select>

  </div>

  <div className="shipping-price">
    {locationSelected
      ? `${shipping.toLocaleString(
          "en-US"
        )} جنيه`
      : "اختر المحافظة والمدينة"}
  </div>

</div>

          <div className="checkout-total-row final-total">
            <span>
              الإجمالي النهائي
            </span>

            <strong>
              {locationSelected
                ? `${finalTotal.toLocaleString(
                    "en-US"
                  )} جنيه`
                : `${discountedProductsTotal.toLocaleString(
                    "en-US"
                  )} جنيه`}
            </strong>
          </div>

          {/* =================================================
              COUPON
          ================================================= */}

          <div className="coupon-box">

            <h3>
              كود الخصم
            </h3>

            <div className="coupon-input-row">

              <input
                placeholder="اكتب كود الخصم"
                value={coupon}
                onChange={(e) => {
                  setCoupon(
                    e.target.value.toUpperCase()
                  );

                  setCouponApplied(false);
                  setCouponDiscount(0);
                  setCouponMessage("");
                }}
              />

              <button
                type="button"
                onClick={
                  applyCoupon
                }
              >
                تطبيق
              </button>

            </div>

            {couponMessage && (
              <p
                className={
                  couponApplied
                    ? "coupon-success-message"
                    : "coupon-error-message"
                }
              >
                {couponMessage}
              </p>
            )}

          </div>

          {/* =================================================
              PAYMENT
          ================================================= */}

          <div className="payment-box">

            <h2>
              طريقة الدفع
            </h2>

            <label className="payment-option">

              <input
                type="radio"
                name="payment"
                checked={
                  paymentType ===
                  "full"
                }
                onChange={() =>
                  setPaymentType(
                    "full"
                  )
                }
              />

              <div>

                <strong>
                  💳 الدفع بالكامل
                </strong>

                <p>
                  ستدفع الآن :{" "}
                  {discountedProductsTotal.toLocaleString(
                    "en-US"
                  )}{" "}
                  جنيه
                </p>

                <p>
                  عند الاستلام :{" "}
                  {locationSelected
                    ? `${shipping.toLocaleString(
                        "en-US"
                      )} جنيه للشحن`
                    : "يتم حساب الشحن بعد اختيار المحافظة والمدينة"}
                </p>

              </div>

            </label>

            <label className="payment-option">

              <input
                type="radio"
                name="payment"
                checked={
                  paymentType ===
                  "deposit"
                }
                onChange={() =>
                  setPaymentType(
                    "deposit"
                  )
                }
              />

              <div>

                <strong>
                  💰 دفع عربون 30%
                </strong>

                <p>
                  ستدفع الآن :{" "}
                  {deposit.toLocaleString(
                    "en-US"
                  )}{" "}
                  جنيه
                </p>

                <p>
                  عند الاستلام :{" "}
                  {locationSelected
                    ? `${amountToCollect.toLocaleString(
                        "en-US"
                      )} جنيه`
                    : "يتم حساب المبلغ بعد اختيار المحافظة والمدينة"}
                </p>

              </div>

            </label>

            {/* =================================================
                PAYMENT SUMMARY
            ================================================= */}

            <div className="checkout-payment-summary">

              <div>
                <span>
                  المدفوع الآن
                </span>

                <strong>
                  {amountToPayNow.toLocaleString(
                    "en-US"
                  )}{" "}
                  جنيه
                </strong>
              </div>

              <div>
                <span>
                  باقي المنتجات
                </span>

                <strong>
                  {(
                    paymentType ===
                    "deposit"
                      ? remainingProducts
                      : 0
                  ).toLocaleString(
                    "en-US"
                  )}{" "}
                  جنيه
                </strong>
              </div>

              <div>
                <span>
                  الشحن
                </span>

                <strong>
                  {locationSelected
                    ? `${shipping.toLocaleString(
                        "en-US"
                      )} جنيه`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>
                  التحصيل عند الاستلام
                </span>

                <strong>
                  {locationSelected
                    ? `${amountToCollect.toLocaleString(
                        "en-US"
                      )} جنيه`
                    : "—"}
                </strong>
              </div>

            </div>

            <button
              type="button"
              className="confirm-order"
              disabled={
                loading ||
                !locationSelected
              }
              onClick={
                confirmOrder
              }
            >
              {loading
                ? "جاري إنشاء الطلب..."
                : !locationSelected
                ? "اختر المحافظة والمدينة"
                : "الانتقال إلى الدفع"}
            </button>

          </div>

        </div>
      </div>
    </main>
  );
}