"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

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
  hiddenMessages?: string[];
  hiddenMessagePrice?: number;
};

export default function ProductPage() {
  const params = useParams();

  const slug =
    typeof params?.slug === "string"
      ? params.slug
      : Array.isArray(params?.slug)
      ? params.slug[0]
      : "";

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState("");

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  const [selectedColorImages, setSelectedColorImages] =
    useState<string[]>([]);

  const [selectedColor, setSelectedColor] =
    useState<Color | null>(null);

  const [selectedSize, setSelectedSize] =
    useState("");

  const [selectedMessage, setSelectedMessage] =
    useState(0);

  const [includeHiddenMessage, setIncludeHiddenMessage] =
    useState(false);

  const [touchStartX, setTouchStartX] =
    useState<number | null>(null);

    const [cartCount, setCartCount] = useState(0);

useEffect(() => {
  function updateCartCount() {
    try {
      const cart = JSON.parse(
        localStorage.getItem("cart") || "[]"
      );

      const count = cart.reduce(
        (total: number, item: any) =>
          total + (item.qty || 1),
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
    window.removeEventListener(
      "storage",
      updateCartCount
    );

    window.removeEventListener(
      "cartUpdated",
      updateCartCount
    );
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
     LOAD PRODUCT
     ========================================================= */

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Product slug is missing.");
      return;
    }

    loadProduct();
  }, [slug]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError("");
      setProduct(null);

      const productsRef =
        collection(db, "products");

      const q = query(
        productsRef,
        where("slug", "==", slug)
      );

      const snapshot =
        await getDocs(q);

      if (snapshot.empty) {
        setError(
          `Product "${slug}" was not found.`
        );

        return;
      }

      const productDoc =
        snapshot.docs[0];

      const data: Product = {
        id: productDoc.id,
        ...(productDoc.data() as Omit<
          Product,
          "id"
        >),
      };

      setProduct(data);

      const generalImages =
        cleanImages(data.images);

      const colors =
        Array.isArray(data.colors)
          ? data.colors
          : [];

      /* FIRST COLOR */

      if (colors.length > 0) {
        const firstColor =
          colors[0];

        setSelectedColor(firstColor);

        let colorImages: string[] = [];

        if (
          typeof firstColor === "object" &&
          firstColor !== null
        ) {
          colorImages =
            cleanImages(
              firstColor.images
            );
        }

        if (colorImages.length > 0) {
          setSelectedColorImages(
            colorImages
          );

          setSelectedImageIndex(0);

          setSelectedImage(
            colorImages[0]
          );
        } else if (
          generalImages.length > 0
        ) {
          setSelectedColorImages(
            generalImages
          );

          setSelectedImageIndex(0);

          setSelectedImage(
            generalImages[0]
          );
        } else {
          setSelectedColorImages([]);
          setSelectedImage("");
        }
      }

      /* NO COLORS */

      else if (
        generalImages.length > 0
      ) {
        setSelectedColorImages(
          generalImages
        );

        setSelectedImageIndex(0);

        setSelectedImage(
          generalImages[0]
        );
      } else {
        setSelectedColorImages([]);
        setSelectedImage("");
      }

      /* FIRST SIZE */

      const sizes =
        Array.isArray(data.sizes)
          ? data.sizes
          : [];

      setSelectedSize(
        sizes.length > 0
          ? sizes[0]
          : ""
      );

      setSelectedMessage(0);

      setIncludeHiddenMessage(false);
    } catch (err) {
      console.error(
        "LOAD PRODUCT ERROR:",
        err
      );

      setProduct(null);

      setError(
        "Could not load this product."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     CHANGE COLOR
     ========================================================= */

  function handleColorChange(
    color: Color
  ) {
    setSelectedColor(color);

    const generalImages =
      cleanImages(
        product?.images
      );

    let colorImages: string[] = [];

    if (
      typeof color === "object" &&
      color !== null
    ) {
      colorImages =
        cleanImages(
          color.images
        );
    }

    if (colorImages.length > 0) {
      setSelectedColorImages(
        colorImages
      );

      setSelectedImageIndex(0);

      setSelectedImage(
        colorImages[0]
      );

      return;
    }

    if (generalImages.length > 0) {
      setSelectedColorImages(
        generalImages
      );

      setSelectedImageIndex(0);

      setSelectedImage(
        generalImages[0]
      );
    } else {
      setSelectedColorImages([]);
      setSelectedImage("");
    }
  }

  /* =========================================================
     IMAGE NAVIGATION
     ========================================================= */

  function showNextImage() {
    if (
      selectedColorImages.length <= 1
    ) {
      return;
    }

    const nextIndex =
      (selectedImageIndex + 1) %
      selectedColorImages.length;

    setSelectedImageIndex(
      nextIndex
    );

    setSelectedImage(
      selectedColorImages[nextIndex]
    );
  }

  function showPreviousImage() {
    if (
      selectedColorImages.length <= 1
    ) {
      return;
    }

    const previousIndex =
      selectedImageIndex === 0
        ? selectedColorImages.length - 1
        : selectedImageIndex - 1;

    setSelectedImageIndex(
      previousIndex
    );

    setSelectedImage(
      selectedColorImages[
        previousIndex
      ]
    );
  }

  /* =========================================================
     SWIPE
     ========================================================= */

  function handleTouchStart(
    e: React.TouchEvent<HTMLDivElement>
  ) {
    setTouchStartX(
      e.touches[0].clientX
    );
  }

  function handleTouchEnd(
    e: React.TouchEvent<HTMLDivElement>
  ) {
    if (
      touchStartX === null
    ) {
      return;
    }

    const endX =
      e.changedTouches[0].clientX;

    const difference =
      touchStartX - endX;

    if (
      Math.abs(difference) > 50
    ) {
      if (difference > 0) {
        showNextImage();
      } else {
        showPreviousImage();
      }
    }

    setTouchStartX(null);
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <main className="product-page-shell">

        <header className="ago-page-nav product-page-nav">

          <a
            href="/track"
            className="ago-nav-track"
          >
            <span className="nav-track-icon">
              ◷
            </span>

            <span>
              Track Order
            </span>
          </a>

          <a
            href="/"
            className="ago-nav-logo"
          >
            <span className="ago-nav-a">
              A
            </span>

            <span className="ago-nav-go">
              GO
            </span>
          </a>

        <a
  href="/cart"
  className="ago-nav-cart"
  aria-label="Shopping Cart"
>
  <span style={{ position: "relative" }}>
    <span className="nav-cart-icon">
      🛒
    </span>

    {cartCount > 0 && (
      <span
        style={{
          position: "absolute",
          top: "-7px",
          right: "-9px",
          background: "#111",
          color: "#fff",
          borderRadius: "50%",
          minWidth: "16px",
          height: "16px",
          padding: "0 3px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "9px",
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {cartCount}
      </span>
    )}
  </span>

  <span>
    Cart
  </span>
</a>

        </header>

        <div className="product-loading">
          <h2>
            Loading...
          </h2>
        </div>

      </main>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (!product) {
    return (
      <main className="product-page-shell">

        <header className="ago-page-nav product-page-nav">

          <a
            href="/track"
            className="ago-nav-track"
          >
            <span className="nav-track-icon">
              ◷
            </span>

            <span>
              Track Order
            </span>
          </a>

          <a
            href="/"
            className="ago-nav-logo"
          >
            <span className="ago-nav-a">
              A
            </span>

            <span className="ago-nav-go">
              GO
            </span>
          </a>

          <a
            href="/cart"
            className="ago-nav-cart"
          >
            <span className="nav-cart-icon">
              🛒
            </span>

            <span>
              Cart
            </span>
          </a>

        </header>

        <div className="product-error">
          <h2>
            Product Not Found
          </h2>

          <p>
            {error ||
              `Slug: ${slug}`}
          </p>
        </div>

      </main>
    );
  }

  const currentProduct =
    product;

  const images =
    cleanImages(
      currentProduct.images
    );

  const colors =
    Array.isArray(
      currentProduct.colors
    )
      ? currentProduct.colors
      : [];

  const sizes =
    Array.isArray(
      currentProduct.sizes
    )
      ? currentProduct.sizes
      : [];

  const hiddenMessages =
    cleanImages(
      currentProduct.hiddenMessages
    );

  const currentHiddenMessage =
    hiddenMessages.length > 0
      ? hiddenMessages[
          selectedMessage
        ]
      : null;

  const basePrice =
    Number(
      currentProduct.price || 0
    );

  const hiddenMessagePrice =
    Number(
      currentProduct.hiddenMessagePrice ||
        50
    );

  const finalPrice =
    basePrice +
    (includeHiddenMessage
      ? hiddenMessagePrice
      : 0);

  function getColorName(
    color: Color,
    index: number
  ) {
    if (
      typeof color === "string"
    ) {
      return color;
    }

    return (
      color?.name ||
      `Color ${index + 1}`
    );
  }

  function getColorCode(
    color: Color
  ) {
    if (
      typeof color === "string"
    ) {
      return color;
    }

    return (
      color?.code ||
      "#000000"
    );
  }

  function isColorActive(
    color: Color
  ) {
    if (
      typeof color === "string"
    ) {
      return (
        selectedColor === color
      );
    }

    if (
      typeof selectedColor !==
        "object" ||
      selectedColor === null
    ) {
      return false;
    }

    return (
      selectedColor.name ===
      color.name
    );
  }

  /* =========================================================
     ADD TO CART
     ========================================================= */

  function addToCart() {
    try {
      const cart = JSON.parse(
        localStorage.getItem(
          "cart"
        ) || "[]"
      );

      const hiddenMessage =
        includeHiddenMessage
          ? currentHiddenMessage
          : null;

      const colorKey =
        typeof selectedColor ===
        "string"
          ? selectedColor
          : selectedColor?.name ||
            "";

      const existingIndex =
        cart.findIndex(
          (item: any) =>
            item.slug === slug &&
            item.size ===
              selectedSize &&
            (
              typeof item.color ===
              "string"
                ? item.color
                : item.color?.name
            ) === colorKey &&
            item.hiddenMessage ===
              hiddenMessage
        );

      if (
        existingIndex !== -1
      ) {
        cart[
          existingIndex
        ].qty =
          (cart[
            existingIndex
          ].qty || 1) + 1;
      } else {
        cart.push({
          id:
            currentProduct.id,

          slug,

          name:
            currentProduct.name ||
            "Product",

          image:
            selectedImage ||
            images[0] ||
            "/product-01.png",

          color:
            selectedColor,

          size:
            selectedSize,

          qty: 1,

          hiddenMessage,

          price:
            finalPrice,
        });
      }

      localStorage.setItem(
        "cart",
        JSON.stringify(cart)
      );

      window.dispatchEvent(
  new Event("storage")
);
window.dispatchEvent(
  new Event("cartUpdated")
);
window.dispatchEvent(
  new Event("cartUpdated")
);
      alert(
        "✅ Product Added To Cart"
      );
    } catch (err) {
      console.error(
        "ADD TO CART ERROR:",
        err
      );

      alert(
        "Could not add product to cart."
      );
    }
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <main className="product-page-shell">

      {/* =====================================================
          TOP NAVIGATION
          TRACK LEFT / AGO CENTER / CART RIGHT
          ===================================================== */}

      <header className="ago-page-nav product-page-nav">

        <a
          href="/track"
          className="ago-nav-track"
          aria-label="Track Order"
        >
          <span className="nav-track-icon">
            ◷
          </span>

          <span>
            Track Order
          </span>
        </a>

        <a
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
        </a>

        <a
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
        </a>

      </header>

      {/* =====================================================
          PRODUCT CONTENT
          ===================================================== */}

      <section className="product-content">

        {/* ===================================================
            GALLERY
            IMPORTANT:
            استخدام img عادي بدل next/image
            =================================================== */}

        <div
          className="product-gallery"
          onTouchStart={
            handleTouchStart
          }
          onTouchEnd={
            handleTouchEnd
          }
        >

          {isValidImageUrl(
            selectedImage
          ) ? (
            <img
              src={selectedImage}
              alt={
                currentProduct.name ||
                "Product"
              }
              className="main-product-image"
              draggable={false}
            />
          ) : images.length > 0 ? (
            <img
              src={images[0]}
              alt={
                currentProduct.name ||
                "Product"
              }
              className="main-product-image"
              draggable={false}
            />
          ) : (
            <div className="product-image-fallback">
              <span>
                AGO
              </span>
            </div>
          )}

          {selectedColorImages.length >
            1 && (
            <>
              <button
                type="button"
                className="gallery-arrow gallery-arrow-left"
                onClick={(e) => {
                  e.stopPropagation();
                  showPreviousImage();
                }}
                aria-label="Previous image"
              >
                ←
              </button>

              <button
                type="button"
                className="gallery-arrow gallery-arrow-right"
                onClick={(e) => {
                  e.stopPropagation();
                  showNextImage();
                }}
                aria-label="Next image"
              >
                →
              </button>

              <div className="image-counter">
                {selectedImageIndex +
                  1}{" "}
                /{" "}
                {
                  selectedColorImages.length
                }
              </div>
            </>
          )}

        </div>

        {/* ===================================================
            PRODUCT INFO
            =================================================== */}

        <div className="product-info">

          <h1>
            {currentProduct.name ||
              "Product"}
          </h1>

          <div className="price">

            <span className="new-price">
              {finalPrice} EGP
            </span>

            {Number(
              currentProduct.oldPrice || 0
            ) > 0 && (
              <span className="old-price">
                {
                  currentProduct.oldPrice
                }{" "}
                EGP
              </span>
            )}

          </div>

          {/* SIZE */}

          {sizes.length > 0 && (
            <>
              <h3>
                Size
              </h3>

              <div className="sizes">

                {sizes.map(
                  (size) => (
                    <button
                      key={size}
                      type="button"
                      className={`size-btn ${
                        selectedSize ===
                        size
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedSize(
                          size
                        )
                      }
                    >
                      {size}
                    </button>
                  )
                )}

              </div>
            </>
          )}

          {/* COLORS */}

          {colors.length > 0 && (
            <>
              <h3>
                Color
              </h3>

              <div className="colors">

                {colors.map(
                  (
                    color,
                    index
                  ) => {

                    const name =
                      getColorName(
                        color,
                        index
                      );

                    const code =
                      getColorCode(
                        color
                      );

                    return (
                      <button
                        key={`${name}-${index}`}
                        type="button"
                        aria-label={
                          name
                        }
                        title={
                          name
                        }
                        className={`color ${
                          isColorActive(
                            color
                          )
                            ? "active"
                            : ""
                        }`}
                       style={{
  "--swatch-color": code,
} as React.CSSProperties}
                        onClick={() =>
                          handleColorChange(
                            color
                          )
                        }
                      />
                    );
                  }
                )}

              </div>
            </>
          )}

          {/* HIDDEN MESSAGES */}

          {hiddenMessages.length >
            0 && (
            <>
              <h3>
                Hidden Messages
              </h3>

              <button
                type="button"
                className={`select-message-btn ${
                  includeHiddenMessage
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setIncludeHiddenMessage(
                    (prev) =>
                      !prev
                  )
                }
              >
                {includeHiddenMessage
                  ? "✔ Hidden Message Selected"
                  : `Add Hidden Message (+${hiddenMessagePrice} EGP)`}
              </button>

              {includeHiddenMessage && (
                <>
                  <div className="hidden-message-box">

                    <button
                      type="button"
                      className="arrow-btn"
                      onClick={() =>
                        setSelectedMessage(
                          (prev) =>
                            prev === 0
                              ? hiddenMessages.length -
                                1
                              : prev - 1
                        )
                      }
                    >
                      ←
                    </button>

                    {isValidImageUrl(
                      currentHiddenMessage
                    ) && (
                      <div className="hidden-preview-wrapper">

                        <img
                          src={
                            currentHiddenMessage
                          }
                          alt="Hidden Message"
                          className="hidden-preview"
                        />

                      </div>
                    )}

                    <button
                      type="button"
                      className="arrow-btn"
                      onClick={() =>
                        setSelectedMessage(
                          (prev) =>
                            prev ===
                            hiddenMessages.length -
                              1
                              ? 0
                              : prev + 1
                        )
                      }
                    >
                      →
                    </button>

                  </div>

                  <p className="message-counter">
                    {selectedMessage +
                      1}{" "}
                    /{" "}
                    {
                      hiddenMessages.length
                    }
                  </p>
                </>
              )}
            </>
          )}

          {/* ADD TO CART */}

          <button
            type="button"
            className="add-cart-btn"
            onClick={
              addToCart
            }
          >
            Add To Cart
          </button>

        </div>

      </section>

    </main>
  );
}