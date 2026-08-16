"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

import {
  getStoreSettings,
  type StoreSettings,
  defaultStoreSettings,
} from "@/app/lib/storesettings";

type Color =
  | string
  | {
      name?: string;
      code?: string;
      images?: string[];
    };

type Product = {
  id: string;
  name?: string;
  slug?: string;
  price?: number;
  oldPrice?: number;
  stock?: number;
  images?: string[];
  sizes?: string[];
  colors?: Color[];
};

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [settings, setSettings] =
    useState<StoreSettings>(
      defaultStoreSettings
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

    const [cartCount, setCartCount] = useState(0);

useEffect(() => {

  function updateCartCount() {

    try {

      const cart = JSON.parse(

        localStorage.getItem("cart") || "[]"

      );

      const count = cart.reduce(

        (total: number, item: any) =>

          total + Number(item.qty || 1),

        0

      );

      setCartCount(count);

    } catch {

      setCartCount(0);

    }

  }

  updateCartCount();

  window.addEventListener("storage", updateCartCount);

  window.addEventListener("cartUpdated", updateCartCount);

  return () => {

    window.removeEventListener("storage", updateCartCount);

    window.removeEventListener("cartUpdated", updateCartCount);

  };

}, []);
  /* =========================================================
     IMAGE VALIDATION
     ========================================================= */

  function isValidImageUrl(
    value: unknown
  ): value is string {
    if (typeof value !== "string") {
      return false;
    }

    const url = value.trim();

    if (!url) {
      return false;
    }

    return (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/")
    );
  }

  function cleanImages(
    value: unknown
  ): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is string =>
        isValidImageUrl(item)
    );
  }

  /* =========================================================
     LOAD PAGE
     ========================================================= */

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      const storeSettings =
        await getStoreSettings();

      setSettings(storeSettings);

      const productsRef =
        collection(db, "products");

      let snapshot;

      try {
        const q = query(
          productsRef,
          orderBy("createdAt", "desc")
        );

        snapshot =
          await getDocs(q);
      } catch {
        snapshot =
          await getDocs(
            productsRef
          );
      }

      const loadedProducts: Product[] =
        snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<
              Product,
              "id"
            >),
          })
        );

      setProducts(
        loadedProducts
      );
    } catch (err) {
      console.error(
        "LOAD PRODUCTS PAGE ERROR:",
        err
      );

      setProducts([]);

      setError(
        "Could not load the store."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     HEADER
     AGO LEFT
     TRACK CENTER
     CART RIGHT
     ========================================================= */

  function ProductsNavigation() {
    return (
      <header className="ago-page-nav products-page-nav">

        <Link
          href="/"
          className="ago-nav-logo"
          aria-label="AGO Home"
        >
          <span className="ago-nav-a">
            A
          </span>

          <span className="ago-nav-go">
            GO
          </span>
        </Link>

        <Link
          href="/track"
          className="products-nav-track"
          aria-label="Track Order"
        >
          <span className="nav-track-icon">
            ◷
          </span>

          <span>
            Track Order
          </span>
        </Link>

        <Link
  href="/cart"
  className="ago-nav-cart"
  aria-label="Shopping Cart"
>
  <span className="nav-cart-icon">
    🛒
  </span>

  <span>
    Cart
  </span>

  {cartCount > 0 && (
    <span className="cart-count-badge">
      {cartCount}
    </span>
  )}
</Link>

      </header>
    );
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <main className="products-page">

        <ProductsNavigation />

        <div className="products-loading">
          <h2>
            Loading...
          </h2>
        </div>

      </main>
    );
  }

  /* =========================================================
     STORE DISABLED
     ========================================================= */

  if (
    !settings.storeActive ||
    settings.maintenanceMode
  ) {
    return (
      <main className="products-page store-disabled">

        <ProductsNavigation />

        <div className="store-disabled-box">

          <div className="ago-wordmark ago-wordmark-large">
            <span className="ago-a">
              A
            </span>

            <span className="ago-go">
              GO
            </span>
          </div>

          <h1>
            {settings.storeName}
          </h1>

          <p>
            المتجر متوقف مؤقتًا
          </p>

          <span>
            نرجعلك قريبًا ❤️
          </span>

        </div>

      </main>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (error) {
    return (
      <main className="products-page">

        <ProductsNavigation />

        <div className="products-error">

          <h2>
            Something went wrong
          </h2>

          <p>
            {error}
          </p>

        </div>

      </main>
    );
  }

  /* =========================================================
     EMPTY STORE
     ========================================================= */

  if (products.length === 0) {
    return (
      <main className="products-page">

        <ProductsNavigation />

        <div className="products-empty">

          <h2>
            No Products Yet
          </h2>

          <p>
            Add your first product
            from the Admin page.
          </p>

        </div>

      </main>
    );
  }

  /* =========================================================
     MAIN PAGE
     ========================================================= */

  return (
    <main className="products-page">

      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <ProductsNavigation />

      {/* =====================================================
          HERO BANNER
          ===================================================== */}

      <section className="products-banner">

        <div className="banner-image-wrapper">

          <img
            src="/ago-banner.png"
            alt="AGO Collection"
            className="banner-image"
          />

        </div>

        <div className="banner-button-wrapper">

          <button
            type="button"
            className="shop-collection-button"
            onClick={() => {
              document
                .getElementById(
                  "products"
                )
                ?.scrollIntoView({
                  behavior:
                    "smooth",
                });
            }}
          >
            SHOP COLLECTION
          </button>

        </div>

      </section>

      {/* =====================================================
          COLLECTION TITLE
          ===================================================== */}

      <section className="products-title">

        <div className="ago-wordmark ago-title-wordmark">

          <span className="ago-a">
            A
          </span>

          <span className="ago-go">
            GO
          </span>

        </div>

        <p>
          Always Go Original
        </p>

        <span className="title-line" />

      </section>

      {/* =====================================================
          ANNOUNCEMENT
          ===================================================== */}

      {settings.announcementText && (
        <div className="store-announcement">
          {
            settings.announcementText
          }
        </div>
      )}

      {/* =====================================================
          PRODUCTS
          ===================================================== */}

      <section
        id="products"
        className="products-grid"
      >

        {products.map(
          (product) => {

            const images =
              cleanImages(
                product.images
              );

            const firstImage =
              images.length > 0
                ? images[0]
                : "/products/product_11.png";

            const price =
              Number(
                product.price || 0
              );

            const oldPrice =
              Number(
                product.oldPrice ||
                  0
              );

            const stock =
              Number(
                product.stock || 0
              );

            return (
              <Link
                key={product.id}
                href={`/products/${
                  product.slug ||
                  product.id
                }`}
                className="product-card"
              >

                {/* IMAGE */}

                <div className="product-card-image">

                  {isValidImageUrl(
                    firstImage
                  ) ? (
                    <img
                      src={firstImage}
                      alt={
                        product.name ||
                        "AGO Product"
                      }
                      className="product-image"
                    />
                  ) : (
                    <img
                      src="/products/product_11.png"
                      alt="AGO Product"
                      className="product-image"
                    />
                  )}

                </div>

                {/* INFO */}

                <div className="product-card-info">

                  <h2>
                    {product.name ||
                      "Product"}
                  </h2>

                  {/* PRICE */}

                  <div className="product-card-price">

                    <span className="new-price">
                      {price}{" "}
                      {
                        settings.currency
                      }
                    </span>

                    {oldPrice >
                      0 && (
                      <span className="old-price">
                        {
                          oldPrice
                        }{" "}
                        {
                          settings.currency
                        }
                      </span>
                    )}

                  </div>

                  {/* COLORS */}

                  {settings.showProductColors &&
                    Array.isArray(
                      product.colors
                    ) &&
                    product.colors
                      .length >
                      0 && (

                      <div className="product-colors">

                        {product.colors.map(
                          (
                            color,
                            index
                          ) => {

                            const code =
                              typeof color ===
                              "string"
                                ? color
                                : color?.code ||
                                  "#000000";

                            const name =
                              typeof color ===
                              "string"
                                ? color
                                : color?.name ||
                                  `Color ${
                                    index +
                                    1
                                  }`;

                            return (
                              <span
                                key={`${name}-${index}`}
                                className="product-color"
                                title={
                                  name
                                }
                               style={{
  "--swatch-color": code,
} as React.CSSProperties}
                              />
                            );
                          }
                        )}

                      </div>
                    )}

                  {/* SIZES */}

                  {settings.showProductSizes &&
                    Array.isArray(
                      product.sizes
                    ) &&
                    product.sizes
                      .length >
                      0 && (

                      <div className="product-sizes">

                        {product.sizes.map(
                          (
                            size
                          ) => (
                            <span
                              key={
                                size
                              }
                              className="product-size"
                            >
                              {
                                size
                              }
                            </span>
                          )
                        )}

                      </div>
                    )}

                  {/* STOCK */}

                  {settings.showProductStock && (

                    <div className="product-stock">

                      {stock > 0 ? (
                        <span>
                          * IN STOCK
                        </span>
                      ) : (
                        <span>
                          * OUT OF STOCK
                        </span>
                      )}

                    </div>

                  )}

                </div>

              </Link>
            );
          }
        )}

      </section>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="products-footer">

        <div className="footer-brand">

          <div className="ago-wordmark ago-footer-wordmark">

            <span className="ago-a">
              A
            </span>

            <span className="ago-go">
              GO
            </span>

          </div>

          <p className="footer-tagline">
            Always Go Original
          </p>

          <span className="footer-line" />

        </div>

        <div className="footer-social">

          <a
            href="https://www.facebook.com/share/1BdKGsi6Fa/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="social-icon">
              f
            </span>

            <span>
              Facebook
            </span>
          </a>

          <a
            href="https://www.instagram.com/ago_clothing_brand?igsh=MXFyN2Q1bHdpcHF0&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="social-icon">
              ◎
            </span>

            <span>
              Instagram
            </span>
          </a>

          <a
            href="https://www.tiktok.com/@ago_clothing_brand?_r=1&_t=ZS-98tV7VAJ1Ay"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="social-icon">
              ♪
            </span>

            <span>
              TikTok
            </span>
          </a>

          <a
            href="https://wa.me/201155390834"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className=  "social-icon◔">
            
            </span>

            <span>
              WhatsApp
            </span>
          </a>

        </div>

        <div className="footer-qr">

          <p>
            Scan To Vist AGO
          </p>

          <img
            src="/qr-code.png"
            alt="AGO QR Code"
            className="qr-image"
          />

        </div>

        <div className="footer-copy">

          ©️{" "}
          {new Date().getFullYear()}{" "}

          <span className="footer-copy-ago">
            AGO
          </span>

        </div>

      </footer>

    </main>
  );
}