"use client";

type ColorItem = {
  name: string;
  code: string;
  images: string[];
};

type Props = {
  colors: ColorItem[];
  setColors: React.Dispatch<React.SetStateAction<ColorItem[]>>;
  images: string[];
};

const presetColors = [
  { name: "Black", code: "#000000" },
  { name: "White", code: "#ffffff" },
  { name: "Navy", code: "#172554" },
  { name: "Burgundy", code: "#800020" },
  { name: "Olive", code: "#556B2F" },
  { name: "Beige", code: "#D8C3A5" },
  { name: "Pink", code: "#FFC0CB" },
  { name: "Gray", code: "#808080" },
];

export default function ProductColors({
  colors,
  setColors,
  images,
}: Props) {
  function addColor(color: {
    name: string;
    code: string;
  }) {
    if (colors.some((item) => item.name === color.name)) {
      return;
    }

    setColors((prev) => [
      ...prev,
      {
        name: color.name,
        code: color.code,
        images: [],
      },
    ]);
  }

  function addCustomColor(code: string) {
    if (!code) return;

    if (colors.some((item) => item.code === code)) {
      return;
    }

    setColors((prev) => [
      ...prev,
      {
        name: `Custom ${prev.length + 1}`,
        code,
        images: [],
      },
    ]);
  }

  function removeColor(index: number) {
    setColors((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  function toggleImage(
    colorIndex: number,
    image: string
  ) {
    setColors((prev) =>
      prev.map((color, i) => {
        if (i !== colorIndex) return color;

        const exists = color.images.includes(image);

        return {
          ...color,
          images: exists
            ? color.images.filter((img) => img !== image)
            : [...color.images, image],
        };
      })
    );
  }

  return (
    <div
      style={{
        marginTop: 25,
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 15,
        background: "#fafafa",
      }}
    >
      <h3
        style={{
          color: "#111",
          marginBottom: 15,
        }}
      >
        Product Colors
      </h3>

      {/* COLORS */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {presetColors.map((color) => (
          <button
            key={color.code}
            type="button"
            onClick={() => addColor(color)}
            title={color.name}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: colors.some(
                (item) => item.name === color.name
              )
                ? "3px solid #d4af37"
                : "2px solid #ccc",
              background: color.code,
              cursor: "pointer",
              boxShadow:
                color.code === "#ffffff"
                  ? "0 0 0 1px #aaa"
                  : "none",
            }}
          />
        ))}
      </div>

      {/* CUSTOM COLOR */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <label
          style={{
            color: "#111",
            fontWeight: "bold",
          }}
        >
          Custom Color:
        </label>

        <input
          type="color"
          onChange={(e) =>
            addCustomColor(e.target.value)
          }
          style={{
            width: 55,
            height: 40,
            cursor: "pointer",
          }}
        />
      </div>

      {/* SELECTED COLORS */}

      {colors.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4
            style={{
              color: "#111",
              marginBottom: 15,
            }}
          >
            Selected Colors
          </h4>

          {colors.map((color, index) => (
            <div
              key={`${color.name}-${index}`}
              style={{
                position: "relative",
                padding: 15,
                marginBottom: 12,
                border: "1px solid #ddd",
                borderRadius: 12,
                background: "#fff",
              }}
            >
              <button
                type="button"
                onClick={() => removeColor(index)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 25,
                  height: 25,
                  borderRadius: "50%",
                  border: "none",
                  background: "#ff4d4f",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ×
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 15,
                }}
              >
                <div
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: "50%",
                    background: color.code,
                    border:
                      color.code === "#ffffff"
                        ? "1px solid #aaa"
                        : "1px solid #ddd",
                  }}
                />

                <strong style={{ color: "#111" }}>
                  {color.name}
                </strong>
              </div>

              <label
                style={{
                  display: "block",
                  color: "#111",
                  fontWeight: "bold",
                  marginBottom: 10,
                }}
              >
                Images for {color.name}
              </label>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {images.map((image, imageIndex) => {
                  const selected =
                    color.images.includes(image);

                  return (
                    <button
                      key={imageIndex}
                      type="button"
                      onClick={() =>
                        toggleImage(index, image)
                      }
                      style={{
                        position: "relative",
                        padding: 0,
                        border: selected
                          ? "3px solid #d4af37"
                          : "2px solid #ddd",
                        borderRadius: 10,
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <img
                        src={image}
                        alt={`Product ${imageIndex + 1}`}
                        style={{
                          width: 90,
                          height: 90,
                          objectFit: "cover",
                          borderRadius: 8,
                          display: "block",
                        }}
                      />

                      {selected && (
                        <span
                          style={{
                            position: "absolute",
                            top: 5,
                            right: 5,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#d4af37",
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p
                style={{
                  color: "#777",
                  fontSize: 13,
                  marginTop: 10,
                }}
              >
                Selected images: {color.images.length}
              </p>
            </div>
          ))}
        </div>
      )}

      {colors.length === 0 && (
        <p
          style={{
            color: "#777",
            marginTop: 15,
          }}
        >
          No colors selected
        </p>
      )}
    </div>
  );
}