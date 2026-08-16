"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

import ProductImages from "./ProductImages";
import ProductSizes from "./ProductSizes";
import ProductColors from "./ProductColors";

type ColorItem = {
  name: string;
  code: string;
  images: string[];
};

type Product = {
  id: string;
  name?: string;
  price?: number;
  oldPrice?: number;
  stock?: number;
  description?: string;
  slug?: string;
  featured?: boolean;
  images?: string[];
  sizes?: string[];
  colors?: ColorItem[];
  hiddenMessages?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;

  // المنتج الذي سيتم تعديله
  editProduct?: Product | null;

  // يتم استدعاؤها بعد الحفظ بنجاح
  onSaved?: () => void;
};

const CLOUDINARY_CLOUD_NAME = "qrqhxbig";
const CLOUDINARY_UPLOAD_PRESET = "ago_products";

export default function ProductForm({
  open,
  onClose,
  editProduct,
  onSaved,
}: Props) {

  // =====================================================
  // BASIC PRODUCT DATA
  // =====================================================

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");

  const [featured, setFeatured] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // PRODUCT IMAGES
  // =====================================================

  const [images, setImages] =
    useState<string[]>([]);

  // =====================================================
  // SIZES
  // =====================================================

  const [sizes, setSizes] =
    useState<string[]>([]);

  // =====================================================
  // COLORS
  // =====================================================

  const [colors, setColors] =
    useState<ColorItem[]>([]);

  // =====================================================
  // HIDDEN MESSAGE IMAGES
  // =====================================================

  const [hiddenMessages, setHiddenMessages] =
    useState<string[]>([]);

  const [uploadingMessages, setUploadingMessages] =
    useState(false);

  // =====================================================
  // EDIT MODE
  // =====================================================

  const isEditMode =
    !!editProduct?.id;

  // =====================================================
  // LOAD DATA INTO FORM WHEN EDITING
  // =====================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    // ===================================================
    // EDIT PRODUCT
    // ===================================================

    if (editProduct) {

      setName(
        editProduct.name || ""
      );

      setPrice(
        editProduct.price !== undefined
          ? String(editProduct.price)
          : ""
      );

      setOldPrice(
        editProduct.oldPrice !== undefined
          ? String(editProduct.oldPrice)
          : ""
      );

      setStock(
        editProduct.stock !== undefined
          ? String(editProduct.stock)
          : ""
      );

      setDescription(
        editProduct.description || ""
      );

      setSlug(
        editProduct.slug || ""
      );

      setFeatured(
        !!editProduct.featured
      );

      setImages(
        Array.isArray(editProduct.images)
          ? editProduct.images
          : []
      );

      setSizes(
        Array.isArray(editProduct.sizes)
          ? editProduct.sizes
          : []
      );

      setColors(
        Array.isArray(editProduct.colors)
          ? editProduct.colors
          : []
      );

      setHiddenMessages(
        Array.isArray(
          editProduct.hiddenMessages
        )
          ? editProduct.hiddenMessages
          : []
      );

      return;
    }

    // ===================================================
    // NEW PRODUCT
    // ===================================================

    resetForm();

  }, [open, editProduct]);

  // =====================================================
  // RESET FORM
  // =====================================================

  function resetForm() {

    setName("");
    setPrice("");
    setOldPrice("");
    setStock("");
    setDescription("");
    setSlug("");

    setFeatured(false);

    setImages([]);
    setSizes([]);
    setColors([]);

    setHiddenMessages([]);

  }

  // =====================================================
  // CLOSE FORM
  // =====================================================

  function handleClose() {

    if (loading || uploadingMessages) {
      return;
    }

    resetForm();

    onClose();

  }

  // =====================================================
  // UPLOAD HIDDEN MESSAGE IMAGES
  // =====================================================

  async function uploadHiddenMessages(
    files: FileList | null
  ) {

    if (
      !files ||
      files.length === 0
    ) {
      return;
    }

    try {

      setUploadingMessages(true);

      const uploadedUrls: string[] = [];

      for (
        const file of Array.from(files)
      ) {

        // -----------------------------------------------
        // ONLY IMAGES
        // -----------------------------------------------

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          continue;
        }

        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );

        formData.append(
          "upload_preset",
          CLOUDINARY_UPLOAD_PRESET
        );

        // -----------------------------------------------
        // CLOUDINARY
        // -----------------------------------------------

        const response =
          await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: "POST",
              body: formData,
            }
          );

        if (!response.ok) {
          throw new Error(
            "Cloudinary upload failed"
          );
        }

        const data =
          await response.json();

        if (
          data.secure_url
        ) {
          uploadedUrls.push(
            data.secure_url
          );
        }

      }

      // -----------------------------------------------
      // ADD UPLOADED IMAGES
      // -----------------------------------------------

      setHiddenMessages(
        (prev) => [
          ...prev,
          ...uploadedUrls,
        ]
      );

    } catch (error) {

      console.error(
        "HIDDEN MESSAGE UPLOAD ERROR:",
        error
      );

      alert(
        "حصل خطأ أثناء رفع صور الرسائل المخفية ❌"
      );

    } finally {

      setUploadingMessages(false);

    }

  }

  // =====================================================
  // REMOVE HIDDEN MESSAGE
  // =====================================================

  function removeHiddenMessage(
    index: number
  ) {

    setHiddenMessages(
      (prev) =>
        prev.filter(
          (_, i) =>
            i !== index
        )
    );

  }

  // =====================================================
  // SAVE / UPDATE PRODUCT
  // =====================================================

  async function saveProduct() {

    try {

      setLoading(true);

      // =================================================
      // DATA TO SAVE
      // =================================================

      const productData = {

        name,
        slug,
        description,

        price:
          Number(price || 0),

        oldPrice:
          Number(oldPrice || 0),

        stock:
          Number(stock || 0),

        featured,

        // PRODUCT IMAGES
        images,

        // SIZES
        sizes,

        // COLORS
        colors,

        // HIDDEN MESSAGE IMAGES
        hiddenMessages,

      };

      // =================================================
      // EDIT EXISTING PRODUCT
      // =================================================

      if (
        editProduct?.id
      ) {

        await updateDoc(
          doc(
            db,
            "products",
            editProduct.id
          ),
          productData
        );

        alert(
          "تم تعديل المنتج بنجاح ✅"
        );

      }

      // =================================================
      // ADD NEW PRODUCT
      // =================================================

      else {

        await addDoc(
          collection(
            db,
            "products"
          ),
          {
            ...productData,

            createdAt:
              serverTimestamp(),
          }
        );

        alert(
          "تم إضافة المنتج بنجاح ✅"
        );

      }

      // =================================================
      // RESET
      // =================================================

      resetForm();

      // =================================================
      // CLOSE
      // =================================================

      onClose();

      // =================================================
      // REFRESH PRODUCTS LIST
      // =================================================

      if (onSaved) {
        onSaved();
      }

    } catch (error) {

      console.error(
        "SAVE PRODUCT ERROR:",
        error
      );

      alert(
        isEditMode
          ? "حدث خطأ أثناء تعديل المنتج ❌"
          : "حدث خطأ أثناء إضافة المنتج ❌"
      );

    } finally {

      setLoading(false);

    }

  }

  // =====================================================
  // DON'T RENDER
  // =====================================================

  if (!open) {
    return null;
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      className="product-modal"
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,.5)",

        display: "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        zIndex: 9999,

        overflowY: "auto",

        padding: "20px",
      }}
    >

      <div
        className="product-box"
        style={{
          background: "#fff",

          width: "700px",

          maxWidth: "100%",

          maxHeight: "90vh",

          overflowY: "auto",

          borderRadius: "20px",

          padding: "25px",
        }}
      >

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="product-top">

          <h2>
            {isEditMode
              ? "Edit Product"
              : "Add Product"}
          </h2>

          <button
            type="button"
            onClick={handleClose}
            disabled={
              loading ||
              uploadingMessages
            }
          >
            ✕
          </button>

        </div>

        {/* ================================================= */}
        {/* PRODUCT NAME */}
        {/* ================================================= */}

        <input
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
          placeholder="Product Name"
        />

        {/* ================================================= */}
        {/* PRICE */}
        {/* ================================================= */}

        <input
          value={price}
          onChange={(e) =>
            setPrice(
              e.target.value
            )
          }
          placeholder="Price"
          type="number"
        />

        {/* ================================================= */}
        {/* OLD PRICE */}
        {/* ================================================= */}

        <input
          value={oldPrice}
          onChange={(e) =>
            setOldPrice(
              e.target.value
            )
          }
          placeholder="Old Price"
          type="number"
        />

        {/* ================================================= */}
        {/* STOCK */}
        {/* ================================================= */}

        <input
          value={stock}
          onChange={(e) =>
            setStock(
              e.target.value
            )
          }
          placeholder="Stock"
          type="number"
        />

        {/* ================================================= */}
        {/* DESCRIPTION */}
        {/* ================================================= */}

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
          placeholder="Description"
        />

        {/* ================================================= */}
        {/* SLUG */}
        {/* ================================================= */}

        <input
          value={slug}
          onChange={(e) =>
            setSlug(
              e.target.value
            )
          }
          placeholder="Slug"
        />

        {/* ================================================= */}
        {/* FEATURED */}
        {/* ================================================= */}

        <label
          style={{
            display: "flex",

            gap: 10,

            alignItems:
              "center",

            marginTop: 15,

            color: "#111",
          }}
        >

          <input
            type="checkbox"
            checked={
              featured
            }
            onChange={(e) =>
              setFeatured(
                e.target.checked
              )
            }
          />

          Featured Product

        </label>

        {/* ================================================= */}
        {/* PRODUCT IMAGES */}
        {/* ================================================= */}

        <ProductImages
          images={images}
          setImages={setImages}
        />

        {/* ================================================= */}
        {/* SIZES */}
        {/* ================================================= */}

        <ProductSizes
          sizes={sizes}
          setSizes={setSizes}
        />

        {/* ================================================= */}
        {/* COLORS */}
        {/* ================================================= */}

        <ProductColors
          colors={colors}
          setColors={setColors}
          images={images}
        />

        {/* ================================================= */}
        {/* HIDDEN MESSAGE IMAGES */}
        {/* ================================================= */}

        <div
          style={{
            marginTop: "25px",

            padding: "18px",

            border:
              "1px solid #ddd",

            borderRadius:
              "15px",

            background:
              "#fafafa",
          }}
        >

          <h3
            style={{
              marginBottom:
                "15px",

              color: "#111",
            }}
          >
            Hidden Messages
          </h3>

          <p
            style={{
              color: "#666",

              fontSize:
                "14px",

              marginBottom:
                "15px",
            }}
          >
            Add hidden message
            images for this
            product.
          </p>

          {/* ================================================= */}
          {/* UPLOAD */}
          {/* ================================================= */}

          <label
            style={{
              display:
                "inline-flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              padding:
                "12px 18px",

              background:
                "#d4af37",

              color: "#fff",

              borderRadius:
                "10px",

              cursor:
                uploadingMessages
                  ? "not-allowed"
                  : "pointer",

              fontWeight:
                "bold",

              opacity:
                uploadingMessages
                  ? 0.7
                  : 1,
            }}
          >

            {uploadingMessages
              ? "Uploading..."
              : "+ Add Hidden Message Image"}

            <input
              type="file"

              accept="image/*"

              multiple

              disabled={
                uploadingMessages
              }

              style={{
                display:
                  "none",
              }}

              onChange={(e) => {

                uploadHiddenMessages(
                  e.target.files
                );

                e.target.value =
                  "";

              }}
            />

          </label>

          {/* ================================================= */}
          {/* PREVIEWS */}
          {/* ================================================= */}

          {hiddenMessages.length >
          0 ? (

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fill, minmax(130px, 1fr))",

                gap: "15px",

                marginTop:
                  "20px",
              }}
            >

              {hiddenMessages.map(
                (
                  image,
                  index
                ) => (

                  <div
                    key={`${image}-${index}`}
                    style={{
                      position:
                        "relative",

                      borderRadius:
                        "12px",

                      overflow:
                        "hidden",

                      border:
                        "1px solid #ddd",

                      background:
                        "#fff",
                    }}
                  >

                    <img
                      src={image}
                      alt={`Hidden Message ${
                        index + 1
                      }`}
                      style={{
                        width:
                          "100%",

                        height:
                          "150px",

                        objectFit:
                          "cover",

                        display:
                          "block",
                      }}
                    />

                    {/* DELETE */}

                    <button
                      type="button"

                      onClick={() =>
                        removeHiddenMessage(
                          index
                        )
                      }

                      style={{
                        position:
                          "absolute",

                        top: "7px",

                        right: "7px",

                        width: "30px",

                        height: "30px",

                        borderRadius:
                          "50%",

                        border:
                          "none",

                        background:
                          "rgba(220, 38, 38, .95)",

                        color:
                          "#fff",

                        fontSize:
                          "16px",

                        fontWeight:
                          "bold",

                        cursor:
                          "pointer",
                      }}
                    >
                      ×
                    </button>

                    <div
                      style={{
                        padding:
                          "7px",

                        textAlign:
                          "center",

                        fontSize:
                          "12px",

                        color:
                          "#555",
                      }}
                    >
                      Message{" "}
                      {index + 1}
                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <p
              style={{
                marginTop:
                  "18px",

                color:
                  "#888",

                fontSize:
                  "14px",
              }}
            >
              No hidden message
              images added.
            </p>

          )}

        </div>

        {/* ================================================= */}
        {/* SAVE */}
        {/* ================================================= */}

        <button
          type="button"

          className="save-product"

          onClick={
            saveProduct
          }

          disabled={
            loading ||
            uploadingMessages
          }

          style={{
            width:
              "100%",

            marginTop:
              "25px",

            padding:
              "14px",

            border:
              "none",

            borderRadius:
              "10px",

            background:
              "#d4af37",

            color:
              "#fff",

            fontWeight:
              "bold",

            fontSize:
              "16px",

            cursor:
              loading ||
              uploadingMessages
                ? "not-allowed"
                : "pointer",

            opacity:
              loading ||
              uploadingMessages
                ? 0.7
                : 1,
          }}
        >

          {loading
            ? isEditMode
              ? "Updating..."
              : "Saving..."
            : uploadingMessages
            ? "Uploading Images..."
            : isEditMode
            ? "Update Product"
            : "Save Product"}

        </button>

      </div>

    </div>

  );
}