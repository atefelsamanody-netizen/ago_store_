import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

export type StoreSettings = {
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
  minimumOrderAmount: number;

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
  shippingEnabled: boolean;

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
  // PRODUCT DISPLAY
  // =========================

  showProductColors: boolean;
  showProductSizes: boolean;
  showProductStock: boolean;
};

// =====================================================
// DEFAULT SETTINGS
// =====================================================

export const defaultStoreSettings: StoreSettings = {
  // STORE
  storeName: "A.GO",
  tagline: "Always Go Original",
  currency: "EGP",

  // PAYMENTS
  shippingCost: 125,
  depositPercent: 30,
  hiddenMessagePrice: 50,
  minimumOrderAmount: 0,

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
  shippingEnabled: true,

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

  // SITE TEXT
  announcementText: "",
  footerText: "A.GO — Always Go Original",

  // PRODUCT DISPLAY
  showProductColors: true,
  showProductSizes: true,
  showProductStock: true,
};

// =====================================================
// GET STORE SETTINGS
// =====================================================

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const settingsRef = doc(
      db,
      "settings",
      "store"
    );

    const snapshot =
      await getDoc(settingsRef);

    if (!snapshot.exists()) {
      return defaultStoreSettings;
    }

    return {
      ...defaultStoreSettings,
      ...(snapshot.data() as Partial<StoreSettings>),
    };
  } catch (error) {
    console.error(
      "GET STORE SETTINGS ERROR:",
      error
    );

    return defaultStoreSettings;
  }
}