"use client";

import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

type Settings = {
  // =========================
  // STORE
  // =========================

  storeName: string;
  tagline: string;
  currency: string;

  // =========================
  // PAYMENTS
  // =========================

  shippingCost: number;
  depositPercent: number;
  hiddenMessagePrice: number;

  // =========================
  // CONTACT
  // =========================

  whatsapp: string;
  instagram: string;
  tiktok: string;

  // =========================
  // STORE STATUS
  // =========================

  storeActive: boolean;
  maintenanceMode: boolean;

  // =========================
  // FEATURES
  // =========================

  couponsEnabled: boolean;
  hiddenMessagesEnabled: boolean;
  featuredProductsEnabled: boolean;
  cartEnabled: boolean;
  checkoutEnabled: boolean;

  // =========================
  // APPEARANCE
  // =========================

  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;

  logoUrl: string;
  faviconUrl: string;

  // =========================
  // HOMEPAGE
  // =========================

  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;

  // =========================
  // SITE TEXT
  // =========================

  announcementText: string;
  footerText: string;

  // =========================
  // PRODUCT
  // =========================

  showProductColors: boolean;
  showProductSizes: boolean;
  showProductStock: boolean;

  // =========================
  // SHIPPING
  // =========================

  shippingEnabled: boolean;

  // =========================
  // ORDER
  // =========================

  minimumOrderAmount: number;
};

const defaultSettings: Settings = {
  // STORE
  storeName: "A.GO",
  tagline: "Always Go Original",
  currency: "EGP",

  // PAYMENTS
  shippingCost: 125,
  depositPercent: 30,
  hiddenMessagePrice: 50,

  // CONTACT
  whatsapp: "",
  instagram: "",
  tiktok: "",

  // STATUS
  storeActive: true,
  maintenanceMode: false,

  // FEATURES
  couponsEnabled: true,
  hiddenMessagesEnabled: true,
  featuredProductsEnabled: true,
  cartEnabled: true,
  checkoutEnabled: true,

  // APPEARANCE
  primaryColor: "#d4af37",
  secondaryColor: "#111111",
  backgroundColor: "#ffffff",
  textColor: "#111111",

  logoUrl: "",
  faviconUrl: "",

  // HOMEPAGE
  heroTitle: "Always Go Original",
  heroSubtitle: "Original pieces. Original style.",
  heroButtonText: "Shop Now",
  heroButtonLink: "/products",

  // TEXT
  announcementText: "",
  footerText: "A.GO — Always Go Original",

  // PRODUCT
  showProductColors: true,
  showProductSizes: true,
  showProductStock: true,

  // SHIPPING
  shippingEnabled: true,

  // ORDER
  minimumOrderAmount: 0,
};

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<Settings>(defaultSettings);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // =========================
  // LOAD
  // =========================

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      const settingsRef = doc(
        db,
        "settings",
        "store"
      );

      const snapshot =
        await getDoc(settingsRef);

      if (snapshot.exists()) {
        setSettings({
          ...defaultSettings,
          ...(snapshot.data() as Partial<Settings>),
        });
      }
    } catch (error) {
      console.error(
        "LOAD SETTINGS ERROR:",
        error
      );

      setMessage(
        "حدث خطأ أثناء تحميل الإعدادات."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // UPDATE
  // =========================

  function updateSetting<
    K extends keyof Settings
  >(
    key: K,
    value: Settings[K]
  ) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    setMessage("");
  }

  // =========================
  // SAVE
  // =========================

  async function saveSettings() {
    try {
      setSaving(true);
      setMessage("");

      const settingsRef = doc(
        db,
        "settings",
        "store"
      );

      await setDoc(
        settingsRef,
        settings,
        {
          merge: true,
        }
      );

      setMessage(
        "✓ تم حفظ جميع الإعدادات بنجاح"
      );
    } catch (error) {
      console.error(
        "SAVE SETTINGS ERROR:",
        error
      );

      setMessage(
        "حدث خطأ أثناء حفظ الإعدادات."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="admin-settings-page">
        <div className="settings-loading">
          <h1>Settings</h1>
          <p>
            جاري تحميل إعدادات المتجر...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <main className="admin-settings-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="settings-header">

        <div>
          <span className="settings-eyebrow">
            A.GO CONTROL CENTER
          </span>

          <h1 className="admin-title">
            Settings
          </h1>

          <p>
            مركز التحكم الرئيسي في المتجر
          </p>
        </div>

        <button
          type="button"
          className="settings-save-btn"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving
            ? "جاري الحفظ..."
            : "حفظ جميع التغييرات"}
        </button>

      </header>

      {/* =========================
          MESSAGE
      ========================= */}

      {message && (
        <div
          className={`settings-message ${
            message.startsWith("✓")
              ? "success"
              : "error"
          }`}
        >
          {message}
        </div>
      )}

      {/* =========================
          STORE
      ========================= */}

      <section className="settings-section">

        <div className="settings-section-title">
          <div>
            <span>01</span>
            <h2>بيانات المتجر</h2>
          </div>

          <p>
            البيانات الأساسية التي تظهر للعملاء
          </p>
        </div>

        <div className="settings-grid">

          <label className="settings-field">
            <span>اسم المتجر</span>

            <input
              value={settings.storeName}
              onChange={(e) =>
                updateSetting(
                  "storeName",
                  e.target.value
                )
              }
            />
          </label>

          <label className="settings-field">
            <span>الشعار</span>

            <input
              value={settings.tagline}
              onChange={(e) =>
                updateSetting(
                  "tagline",
                  e.target.value
                )
              }
            />
          </label>

          <label className="settings-field">
            <span>العملة</span>

            <input
              value={settings.currency}
              onChange={(e) =>
                updateSetting(
                  "currency",
                  e.target.value
                )
              }
            />
          </label>

        </div>

      </section>

      {/* =========================
          PAYMENTS
      ========================= */}

      <section className="settings-section">

        <div className="settings-section-title">
          <div>
            <span>02</span>
            <h2>الدفع والأسعار</h2>
          </div>

          <p>
            التحكم في الحسابات التي يعتمد عليها الدفع
          </p>
        </div>

        <div className="settings-grid">

          <label className="settings-field">
            <span>مصاريف الشحن</span>

            <input
              type="number"
              min="0"
              value={settings.shippingCost}
              onChange={(e) =>
                updateSetting(
                  "shippingCost",
                  Number(e.target.value)
                )
              }
            />

            <small>EGP</small>
          </label>

          <label className="settings-field">
            <span>نسبة العربون</span>

            <input
              type="number"
              min="0"
              max="100"
              value={settings.depositPercent}
              onChange={(e) =>
                updateSetting(
                  "depositPercent",
                  Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        e.target.value
                      )
                    )
                  )
                )
              }
            />

            <small>%</small>
          </label>

          <label className="settings-field">
            <span>
              سعر الرسالة المخفية
            </span>

            <input
              type="number"
              min="0"
              value={
                settings.hiddenMessagePrice
              }
              onChange={(e) =>
                updateSetting(
                  "hiddenMessagePrice",
                  Number(e.target.value)
                )
              }
            />

            <small>EGP</small>
          </label>

          <label className="settings-field">
            <span>
              الحد الأدنى للطلب
            </span>

            <input
              type="number"
              min="0"
              value={
                settings.minimumOrderAmount
              }
              onChange={(e) =>
                updateSetting(
                  "minimumOrderAmount",
                  Number(e.target.value)
                )
              }
            />

            <small>EGP — 0 = بدون حد</small>
          </label>

        </div>

      </section>

      {/* =========================
          CONTACT
      ========================= */}

      <section className="settings-section">

        <div className="settings-section-title">
          <div>
            <span>03</span>
            <h2>التواصل والسوشيال</h2>
          </div>

          <p>
            الروابط وأرقام التواصل الخاصة بالمتجر
          </p>
        </div>

        <div className="settings-grid">

          <label className="settings-field">
            <span>WhatsApp</span>

            <input
              placeholder="201xxxxxxxxx"
              value={settings.whatsapp}
              onChange={(e) =>
                updateSetting(
                  "whatsapp",
                  e.target.value
                )
              }
            />
          </label>

          <label className="settings-field">
            <span>Instagram</span>

            <input
              placeholder="https://instagram.com/..."
              value={settings.instagram}
              onChange={(e) =>
                updateSetting(
                  "instagram",
                  e.target.value
                )
              }
            />
          </label>

          <label className="settings-field">
            <span>TikTok</span>

            <input
              placeholder="https://tiktok.com/@..."
              value={settings.tiktok}
              onChange={(e) =>
                updateSetting(
                  "tiktok",
                  e.target.value
                )
              }
            />
          </label>

        </div>

      </section>

      {/* =========================
          APPEARANCE
      ========================= */}

      <section className="settings-section">

        <div className="settings-section-title">
          <div>
            <span>04</span>
            <h2>مظهر الموقع</h2>
          </div>

          <p>
            التحكم في الألوان والخلفية والهوية البصرية
          </p>
        </div>

        <div className="settings-grid">

          <label className="settings-field">
            <span>Primary Color</span>

            <div className="color-input-row">
              <input
                type="color"
                value={
                  settings.primaryColor
                }
                onChange={(e) =>
                  updateSetting(
                    "primaryColor",
                    e.target.value
                  )
                }
              />

              <input
                value={
                  settings.primaryColor
                }
                onChange={(e) =>
                  updateSetting(
                    "primaryColor",
                    e.target.value
                  )
                }
              />
            </div>
          </label>

          <label className="settings-field">
            <span>Secondary Color</span>

            <div className="color-input-row">
              <input
                type="color"
                value={
                  settings.secondaryColor
                }
                onChange={(e) =>
                  updateSetting(
                    "secondaryColor",
                    e.target.value
                  )
                }
              />

              <input
                value={
                  settings.secondaryColor
                }
                onChange={(e) =>
                  updateSetting(
                    "secondaryColor",
                    e.target.value
                  )
                }
              />
            </div>
          </label>

          <label className="settings-field">
            <span>Background</span>

            <div className="color-input-row">
              <input
                type="color"
                value={
                  settings.backgroundColor
                }
                onChange={(e) =>
                  updateSetting(
                    "backgroundColor",
                    e.target.value
                  )
                }
              />

              <input
                value={
                  settings.backgroundColor
                }
                onChange={(e) =>
                  updateSetting(
                    "backgroundColor",
                    e.target.value
                  )
                }
              />
            </div>
          </label>

          <label className="settings-field">
            <span>Text Color</span>

            <div className="color-input-row">
              <input
                type="color"
                value={
                  settings.textColor
                }
                onChange={(e) =>
                  updateSetting(
                    "textColor",
                    e.target.value
                  )
                }
              />

              <input
                value={
                  settings.textColor
                }
                onChange={(e) =>
                  updateSetting(
                    "textColor",
                    e.target.value
                  )
                }
              />
            </div>
          </label>

          <label className="settings-field">
            <span>Logo URL</span>

            <input
              placeholder="https://..."
              value={settings.logoUrl}
              onChange={(e) =>
                updateSetting(
                  "logoUrl",
                  e.target.value
                )
              }
            />
          </label>

          <label className="settings-field">
            <span>Favicon URL</span>

            <input
              placeholder="https://..."
              value={settings.faviconUrl}
              onChange={(e) =>
                updateSetting(
                  "faviconUrl",
                  e.target.value
                )
              }
            />
          </label>

        </div>

      </section>

      {/* =========================
          HOMEPAGE
      ========================= */}

      <section className="settings-section">

        <div className="settings-section-title">
          <div>
            <span>05</span>
            <h2>الصفحة الرئيسية</h2>
          </div>

          <p>
            النصوص الأساسية للواجهة الرئيسية
          </p>
        </div>

        <div className="settings-grid">

          <label className="settings-field">
            <span>العنوان الرئيسي</span>

            <input
              value={settings.heroTitle}
              onChange={(e) =>
                updateSetting(
                  "heroTitle",
                  e.target.value
                )
              }
            />
          </label>

          <label className="settings-field">
            <span>الوصف</span>

            <input
              value={settings.heroSubtitle}
              onChange={(e) =>
                updateSetting(
                  "heroSubtitle",
                  e.target.value
                )
              }
            />
          </label>

          <label className="settings-field">
            <span>نص زر الشراء</span>

            <input
              value={
                settings.heroButtonText
              }
              onChange={(e) =>
                updateSetting(
                  "heroButtonText",
                  e.target.value
                )
              }
            />
          </label>

          <label className="settings-field">
            <span>رابط زر الشراء</span>

            <input
              value={
                settings.heroButtonLink
              }
              onChange={(e) =>
                updateSetting(
                  "heroButtonLink",
                  e.target.value
                )
              }
            />
          </label>

        </div>

      </section>

      {/* =========================
          ANNOUNCEMENT
      ========================= */}

      <section className="settings-section">

        <div className="settings-section-title">
          <div>
            <span>06</span>
            <h2>رسائل الموقع</h2>
          </div>

          <p>
            الرسائل التي تظهر للعملاء
          </p>
        </div>

        <div className="settings-grid">

          <label className="settings-field full">
            <span>
              Announcement
            </span>

            <input
              placeholder="مثال: شحن مجاني لفترة محدودة"
              value={
                settings.announcementText
              }
              onChange={(e) =>
                updateSetting(
                  "announcementText",
                  e.target.value
                )
              }
            />
          </label>

          <label className="settings-field full">
            <span>
              Footer Text
            </span>

            <input
              value={settings.footerText}
              onChange={(e) =>
                updateSetting(
                  "footerText",
                  e.target.value
                )
              }
            />
          </label>

        </div>

      </section>

      {/* =========================
          FEATURES
      ========================= */}

      <section className="settings-section">

        <div className="settings-section-title">
          <div>
            <span>07</span>
            <h2>خصائص الموقع</h2>
          </div>

          <p>
            تشغيل وإيقاف خصائص المتجر بدون تعديل الكود
          </p>
        </div>

        <div className="settings-switch-grid">

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={
                settings.couponsEnabled
              }
              onChange={(e) =>
                updateSetting(
                  "couponsEnabled",
                  e.target.checked
                )
              }
            />

            <span>
              الكوبونات
            </span>
          </label>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={
                settings.hiddenMessagesEnabled
              }
              onChange={(e) =>
                updateSetting(
                  "hiddenMessagesEnabled",
                  e.target.checked
                )
              }
            />

            <span>
              الرسائل المخفية
            </span>
          </label>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={
                settings.featuredProductsEnabled
              }
              onChange={(e) =>
                updateSetting(
                  "featuredProductsEnabled",
                  e.target.checked
                )
              }
            />

            <span>
              Featured Products
            </span>
          </label>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={
                settings.cartEnabled
              }
              onChange={(e) =>
                updateSetting(
                  "cartEnabled",
                  e.target.checked
                )
              }
            />

            <span>
              سلة المشتريات
            </span>
          </label>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={
                settings.checkoutEnabled
              }
              onChange={(e) =>
                updateSetting(
                  "checkoutEnabled",
                  e.target.checked
                )
              }
            />

            <span>
              صفحة الدفع
            </span>
          </label>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={
                settings.shippingEnabled
              }
              onChange={(e) =>
                updateSetting(
                  "shippingEnabled",
                  e.target.checked
                )
              }
            />

            <span>
              الشحن
            </span>
          </label>

        </div>

      </section>

      {/* =========================
          PRODUCT DISPLAY
      ========================= */}

      <section className="settings-section">

        <div className="settings-section-title">
          <div>
            <span>08</span>
            <h2>عرض المنتجات</h2>
          </div>

          <p>
            التحكم في المعلومات التي تظهر للعميل
          </p>
        </div>

        <div className="settings-switch-grid">

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={
                settings.showProductColors
              }
              onChange={(e) =>
                updateSetting(
                  "showProductColors",
                  e.target.checked
                )
              }
            />

            <span>
              إظهار الألوان
            </span>
          </label>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={
                settings.showProductSizes
              }
              onChange={(e) =>
                updateSetting(
                  "showProductSizes",
                  e.target.checked
                )
              }
            />

            <span>
              إظهار المقاسات
            </span>
          </label>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={
                settings.showProductStock
              }
              onChange={(e) =>
                updateSetting(
                  "showProductStock",
                  e.target.checked
                )
              }
            />

            <span>
              إظهار المخزون
            </span>
          </label>

        </div>

      </section>

      {/* =========================
          STORE STATUS
      ========================= */}

      <section className="settings-section danger-section">

        <div className="settings-section-title">
          <div>
            <span>09</span>
            <h2>حالة المتجر</h2>
          </div>

          <p>
            التحكم في إتاحة المتجر للعملاء
          </p>
        </div>

        <div className="settings-switch-grid">

          <label className="settings-switch big">
            <input
              type="checkbox"
              checked={
                settings.storeActive
              }
              onChange={(e) =>
                updateSetting(
                  "storeActive",
                  e.target.checked
                )
              }
            />

            <span>
              المتجر يعمل
            </span>
          </label>

          <label className="settings-switch big">
            <input
              type="checkbox"
              checked={
                settings.maintenanceMode
              }
              onChange={(e) =>
                updateSetting(
                  "maintenanceMode",
                  e.target.checked
                )
              }
            />

            <span>
              وضع الصيانة
            </span>
          </label>

        </div>

        <div className="settings-warning">
          <strong>
            تنبيه
          </strong>

          <p>
            عند تفعيل وضع الصيانة سنربطه لاحقًا
            بحيث يظهر للعميل أن المتجر متوقف مؤقتًا،
            بينما تظل لوحة الأدمن تعمل.
          </p>
        </div>

      </section>

      {/* =========================
          SAVE
      ========================= */}

      <div className="settings-bottom">

        <button
          type="button"
          className="settings-save-btn"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving
            ? "جاري الحفظ..."
            : "حفظ جميع الإعدادات"}
        </button>

      </div>

    </main>
  );
}