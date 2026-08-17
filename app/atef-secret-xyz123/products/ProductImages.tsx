"use client";

import { useState } from "react";

type Props = {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
};

const CLOUDINARY_CLOUD_NAME = "qrqhxbig";
const CLOUDINARY_UPLOAD_PRESET = "ago_products";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function ProductImages({
  images,
  setImages,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");

  async function handleImages(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = e.target.files;

    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const files = Array.from(selectedFiles);

    try {
      setUploading(true);
      setUploadProgress(0);
      setMessage("");

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // ==========================================
        // VALIDATE FILE TYPE
        // ==========================================

        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(
            `الملف "${file.name}" غير مسموح به. استخدم JPG أو PNG أو WEBP.`
          );
        }

        // ==========================================
        // VALIDATE FILE SIZE
        // ==========================================

        if (file.size > MAX_SIZE) {
          throw new Error(
            `الصورة "${file.name}" أكبر من 10MB.`
          );
        }

        // ==========================================
        // FORM DATA
        // ==========================================

        const formData = new FormData();

        formData.append("file", file);
        formData.append(
          "upload_preset",
          CLOUDINARY_UPLOAD_PRESET
        );

        // ==========================================
        // UPLOAD
        // ==========================================

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        // ==========================================
        // READ RESPONSE
        // ==========================================

        const data = await response.json();

        console.log(
          "CLOUDINARY RESPONSE:",
          data
        );

        // ==========================================
        // CLOUDINARY ERROR
        // ==========================================

        if (!response.ok) {
          const cloudinaryMessage =
            data?.error?.message ||
            `HTTP ${response.status}`;

          throw new Error(
            `Cloudinary: ${cloudinaryMessage}`
          );
        }

        // ==========================================
        // NO URL
        // ==========================================

        if (!data?.secure_url) {
          throw new Error(
            "Cloudinary لم يرجع رابط الصورة."
          );
        }

        // ==========================================
        // SAVE URL
        // ==========================================

        uploadedUrls.push(
          data.secure_url
        );

        // ==========================================
        // PROGRESS
        // ==========================================

        const progress = Math.round(
          ((i + 1) / files.length) * 100
        );

        setUploadProgress(progress);
      }

      // ==========================================
      // ADD IMAGES
      // ==========================================

      setImages((prev) => [
        ...prev,
        ...uploadedUrls,
      ]);

      setMessage(
        `تم رفع ${uploadedUrls.length} صورة بنجاح ✅`
      );

    } catch (error: any) {
      console.error(
        "IMAGE UPLOAD ERROR:",
        error
      );

      const errorMessage =
        error?.message ||
        "حدث خطأ غير معروف أثناء رفع الصورة.";

      setMessage(
        `❌ ${errorMessage}`
      );

    } finally {
      setUploading(false);

      // يسمح باختيار نفس الصورة مرة أخرى
      e.target.value = "";
    }
  }

  // ==========================================
  // REMOVE IMAGE
  // ==========================================

  function removeImage(index: number) {
    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 15,
        background: "#fafafa",
      }}
    >
      {/* TITLE */}

      <h3
        style={{
          color: "#111",
          marginBottom: 15,
        }}
      >
        Product Images
      </h3>

      {/* FILE INPUT */}

      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImages}
        disabled={uploading}
      />

      {/* UPLOADING */}

      {uploading && (
        <div
          style={{
            marginTop: 12,
          }}
        >
          <p
            style={{
              color: "#d4af37",
              fontWeight: "bold",
              marginBottom: 7,
            }}
          >
            Uploading images...{" "}
            {uploadProgress}%
          </p>

          <div
            style={{
              width: "100%",
              height: 8,
              background: "#e5e5e5",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: "100%",
                background: "#d4af37",
                transition:
                  "width .2s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* MESSAGE */}

      {message && (
        <div
          style={{
            marginTop: 15,
            padding: 12,
            borderRadius: 10,
            background: "#fff",
            border: "1px solid #ddd",
            color: "#222",
            fontSize: 13,
            lineHeight: 1.6,
            wordBreak: "break-word",
          }}
        >
          {message}
        </div>
      )}

      {/* UPLOADED IMAGES */}

      {images.length > 0 && (
        <div
          style={{
            marginTop: 20,
          }}
        >
          <h4
            style={{
              color: "#111",
              marginBottom: 12,
            }}
          >
            Uploaded Images
          </h4>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {images.map(
              (img, index) => (
                <div
                  key={`${img}-${index}`}
                  style={{
                    position:
                      "relative",
                  }}
                >
                  <img
                    src={img}
                    alt={`Product ${
                      index + 1
                    }`}
                    style={{
                      width: 110,
                      height: 110,
                      objectFit:
                        "cover",
                      borderRadius: 10,
                      border:
                        "1px solid #ddd",
                      display: "block",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(index)
                    }
                    style={{
                      position:
                        "absolute",
                      top: -8,
                      right: -8,
                      width: 26,
                      height: 26,
                      borderRadius:
                        "50%",
                      border: "none",
                      background:
                        "#ff4d4f",
                      color: "#fff",
                      cursor:
                        "pointer",
                      fontWeight:
                        "bold",
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      textAlign:
                        "center",
                      fontSize: 12,
                      color: "#555",
                    }}
                  >
                    Image{" "}
                    {index + 1}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}