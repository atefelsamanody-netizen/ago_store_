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
   MONEY
========================================================= */

/*
  كل المبالغ الخاصة بالدفع يتم تقريبها لأقرب 5 جنيه.
  158.7  -> 160
  157.2  -> 155
  162.8  -> 165
*/

function roundToFive(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.round(value / 5) * 5;
}

function formatMoney(value: number) {
  return `${roundToFive(value).toLocaleString("en-US")} جنيه`;
}

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

  /*
    القيمة التي يتم الاعتماد عليها في الحسابات المالية
    يتم تقريبها لأقرب 5 جنيه.
  */
  const paymentBaseTotal =
    roundToFive(productsTotal);

  /* =========================================================
     DISCOUNT
  ========================================================= */

  const safeCouponDiscount = Math.min(
    Math.max(
      roundToFive(couponDiscount),
      0
    ),
    paymentBaseTotal
  );

  const discountedProductsTotal =
    roundToFive(
      Math.max(
        paymentBaseTotal -
          safeCouponDiscount,
        0
      )
    );

  /* =========================================================
     SHIPPING
  ========================================================= */

  const shipping = roundToFive(
    getShippingCost(
      customer.governorate,
      customer.city
    )
  );

  const locationSelected = Boolean(
    customer.governorate &&
      customer.city
  );

  /* =========================================================
     PAYMENT
  ========================================================= */

  const deposit = roundToFive(
    discountedProductsTotal * 0.3
  );

  const remainingProducts =
    roundToFive(
      Math.max(
        discountedProductsTotal -
          deposit,
        0
      )
    );

  const finalTotal =
    roundToFive(
      discountedProductsTotal +
        shipping
    );

  const amountToPayNow =
    paymentType === "deposit"
      ? deposit
      : discountedProductsTotal;

  const amountToCollect =
    paymentType === "deposit"
      ? roundToFive(
          remainingProducts +
            shipping
        )
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
          (paymentBaseTotal * value) /
          100;
      } else {
        discount = value;
      }

      discount = Math.min(
        Math.max(
          roundToFive(discount),
          0
        ),
        paymentBaseTotal
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
        `تم تطبيق الخصم: ${formatMoney(
          discount
        )}`
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
        safeCouponDiscount;

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
                roundToFive(
                  (paymentBaseTotal *
                    value) /
                    100
                ),
                0
              ),
              paymentBaseTotal
            );
        } else {
          finalCouponDiscount =
            Math.min(
              Math.max(
                roundToFive(value),
                0
              ),
              paymentBaseTotal
            );
        }
      } else {
        finalCouponDiscount = 0;
      }

      /* =====================================================
         FINAL TOTALS
      ===================================================== */

      const finalPaymentBaseTotal =
        roundToFive(
          productsTotal
        );

      const finalDiscountedProductsTotal =
        roundToFive(
          Math.max(
            finalPaymentBaseTotal -
              finalCouponDiscount,
            0
          )
        );

      const finalDeposit =
        roundToFive(
          finalDiscountedProductsTotal *
            0.3
        );

      const finalRemainingProducts =
        roundToFive(
          Math.max(
            finalDiscountedProductsTotal -
              finalDeposit,
            0
          )
        );

      const finalTotalWithShipping =
        roundToFive(
          finalDiscountedProductsTotal +
            shipping
        );

      const finalAmountToPayNow =
        paymentType === "deposit"
          ? finalDeposit
          : finalDiscountedProductsTotal;

      const finalAmountToCollect =
        paymentType === "deposit"
          ? roundToFive(
              finalRemainingProducts +
                shipping
            )
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

          address:
            customer.address,

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

          /*
            السعر الأصلي للمنتجات
          */
          productsTotal,

          /*
            الإجمالي المستخدم في الدفع
          */
          total:
            finalDiscountedProductsTotal,

          couponCode:
            cleanCoupon
              ? cleanCoupon
              : null,

          couponDiscount:
            finalCouponDiscount,

          shipping,

          finalTotal:
            finalTotalWithShipping,

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

          status:
            "new",
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
      dir="rtl"
    >
      <h1 className="checkout-title">
        إتمام الطلب
      </h1>

      <div className="checkout-grid">

        {/* =====================================================
            CUSTOMER INFO
        ===================================================== */}

        <div className="customer-info">

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

          {/* =================================================
              GOVERNORATE + CITY
          ================================================= */}

          <div className="location-row">

            <select
              value={
                customer.governorate
              }
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
              ).map(
                (governorate) => (
                  <option
                    key={
                      governorate
                    }
                    value={
                      governorate
                    }
                  >
                    {GOVERNORATE_LABELS[
                      governorate
                    ] ||
                      governorate}
                  </option>
                )
              )}
            </select>

            <select
              value={
                customer.city
              }
              disabled={
                !customer.governorate
              }
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

              {availableCities.map(
                (city) => (
                  <option
                    key={city}
                    value={city}
                  >
                    {city}
                  </option>
                )
              )}
            </select>

          </div>

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

        {/* =====================================================
            ORDER SUMMARY
        ===================================================== */}

        <div className="order-summary">

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

          {/* =================================================
              COUPON INSIDE ORDER SUMMARY
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

                  setCouponApplied(
                    false
                  );

                  setCouponDiscount(
                    0
                  );

                  setCouponMessage(
                    ""
                  );
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

          <hr />

          {/* =================================================
              TOTALS
          ================================================= */}

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

          {safeCouponDiscount > 0 && (
            <div className="checkout-total-row discount-row">
              <span>
                الخصم
              </span>

              <strong>
                - {formatMoney(
                  safeCouponDiscount
                )}
              </strong>
            </div>
          )}

          <div className="checkout-total-row">
            <span>
              بعد الخصم
            </span>

            <strong>
              {formatMoney(
                discountedProductsTotal
              )}
            </strong>
          </div>

          {locationSelected && (
            <div className="checkout-total-row shipping-total-row">
              <span>
                الشحن
              </span>

              <strong>
                {formatMoney(
                  shipping
                )}
              </strong>
            </div>
          )}

          <div className="checkout-total-row final-total">
            <span>
              الإجمالي النهائي
              {locationSelected && (
                <small>
                  شامل الشحن
                </small>
              )}
            </span>

            <strong>
              {locationSelected
                ? formatMoney(
                    finalTotal
                  )
                : formatMoney(
                    discountedProductsTotal
                  )}
            </strong>
          </div>

        </div>

        {/* =====================================================
            PAYMENT
        ===================================================== */}

        <div className="payment-box">

          <h2>
            طريقة الدفع
          </h2>

          {/* FULL PAYMENT */}

          <label
            className={`payment-option ${
              paymentType === "full"
                ? "active"
                : ""
            }`}
          >

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

            <div className="payment-option-content">

              <strong>
                💳 الدفع بالكامل
              </strong>

              <p>
                الآن:{" "}
                {formatMoney(
                  discountedProductsTotal
                )}
              </p>

              <p>
                عند الاستلام:{" "}
                {locationSelected
                  ? formatMoney(
                      shipping
                    ) + " شحن"
                  : "يتم حساب الشحن"}
              </p>

            </div>

          </label>

          {/* DEPOSIT */}

          <label
            className={`payment-option ${
              paymentType === "deposit"
                ? "active"
                : ""
            }`}
          >

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

            <div className="payment-option-content">

              <strong>
                💰 دفع عربون 30%
              </strong>

              <p>
                الآن:{" "}
                {formatMoney(
                  deposit
                )}
              </p>

              <p>
                عند الاستلام:{" "}
                {locationSelected
                  ? formatMoney(
                      amountToCollect
                    )
                  : "يتم حساب المبلغ"}
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
                {formatMoney(
                  amountToPayNow
                )}
              </strong>
            </div>

            <div>
              <span>
                باقي المنتجات
              </span>

              <strong>
                {formatMoney(
                  paymentType ===
                    "deposit"
                    ? remainingProducts
                    : 0
                )}
              </strong>
            </div>

            <div>
              <span>
                الشحن
              </span>

              <strong>
                {locationSelected
                  ? formatMoney(
                      shipping
                    )
                  : "—"}
              </strong>
            </div>

            <div className="collection-row">
              <span>
                التحصيل عند الاستلام
              </span>

              <strong>
                {locationSelected
                  ? formatMoney(
                      amountToCollect
                    )
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
    </main>
  );
}