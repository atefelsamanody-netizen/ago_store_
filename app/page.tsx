"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function enterStore() {
    if (open) return;

    setOpen(true);

    setTimeout(() => {
      router.push("/products");
    }, 1200);
  }

  return (
    <main className={`screen ${open ? "open" : ""}`}>
      {/* BACKGROUND LIGHTS */}
      <div className="lights" />

      {/* MAIN LOGO */}
      <div className="logoWrapper">
        <div className="doorCircle">
          {/* LEFT HALF */}
          <div className="leftDoor">
            <Image
              src="/logo.png"
              alt="A.GO"
              fill
              priority
              draggable={false}
              sizes="130px"
            />
          </div>

          {/* RIGHT HALF */}
          <div className="rightDoor">
            <Image
              src="/logo.png"
              alt="A.GO"
              fill
              priority
              draggable={false}
              sizes="130px"
            />
          </div>
        </div>

        {/* ENTER BUTTON */}
        {!open && (
          <button
            type="button"
            className="enterBtn"
            onClick={enterStore}
          >
            ENTER STORE
          </button>
        )}
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #050505;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        body {
          background:
            radial-gradient(
              circle at top,
              rgba(212, 175, 55, 0.08),
              transparent 40%
            ),
            radial-gradient(
              circle at bottom,
              rgba(255, 255, 255, 0.03),
              transparent 40%
            ),
            #050505;
        }

        button {
          font-family: inherit;
        }

        .screen {
          position: relative;
          width: 100vw;
          height: 100vh;
          min-height: 100svh;

          display: flex;
          justify-content: center;
          align-items: center;

          overflow: hidden;
          border: none !important;
        }

        /* =========================================
           BACKGROUND LIGHTS
        ========================================= */

        .lights {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .lights::before,
        .lights::after {
          content: "";
          position: absolute;

          width: 700px;
          height: 700px;

          border-radius: 50%;

          filter: blur(140px);

          animation:
            floatLight 8s ease-in-out infinite;
        }

        .lights::before {
          background: rgba(212, 175, 55, 0.12);

          left: -220px;
          top: -180px;
        }

        .lights::after {
          background: rgba(255, 255, 255, 0.05);

          right: -220px;
          bottom: -180px;

          animation-delay: 4s;
        }

        @keyframes floatLight {
          0% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(40px, 30px);
          }

          100% {
            transform: translate(0, 0);
          }
        }

        /* =========================================
           LOGO WRAPPER
        ========================================= */

        .logoWrapper {
          position: relative;
          z-index: 5;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }

        /* =========================================
           LOGO CIRCLE
        ========================================= */

        .doorCircle {
          position: relative;

          width: 260px;
          height: 260px;

          border-radius: 50%;

          overflow: hidden;

          box-shadow:
            0 0 30px rgba(212, 175, 55, 0.2),
            0 0 70px rgba(212, 175, 55, 0.08);

          background: #050505;
          border: none !important;
          outline: none !important;
        }

        /* =========================================
           DOORS
        ========================================= */

        .leftDoor,
        .rightDoor {
          position: absolute;

          top: 0;

          width: 50%;
          height: 100%;

          overflow: hidden;

          transition:
            transform 1.2s cubic-bezier(
              0.77,
              0,
              0.18,
              1
            );

          will-change: transform;
        }

        .leftDoor {
          left: 0;
          transform-origin: left center;
        }

        .rightDoor {
          right: 0;
          transform-origin: right center;
        }

        .leftDoor img,
        .rightDoor img {
          position: absolute !important;

          width: 260px !important;
          height: 260px !important;

          max-width: none !important;

          object-fit: cover;
        }

        .leftDoor img {
          left: 0 !important;
          top: 0 !important;

          object-position: left center;
        }

        .rightDoor img {
          right: 0 !important;
          top: 0 !important;

          left: auto !important;

          object-position: right center;
        }

        /* =========================================
           OPEN ANIMATION
        ========================================= */

        .open .leftDoor {
          transform: translateX(-105%);
        }

        .open .rightDoor {
          transform: translateX(105%);
        }

        /* =========================================
           ENTER BUTTON
        ========================================= */

        .enterBtn {
          margin-top: 40px;

          padding: 16px 42px;

          border: none !important;
          outline: none !important;
          border-radius: 999px;

          background: #d4af37;
          color: #111;

          font-size: 18px;
          font-weight: 700;

          letter-spacing: 0.5px;

          cursor: pointer;

          box-shadow:
            0 0 25px rgba(212, 175, 55, 0.45);

          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease,
            opacity 0.35s ease;
        }

        .enterBtn:hover {
          transform:
            translateY(-3px)
            scale(1.05);

          box-shadow:
            0 0 35px rgba(212, 175, 55, 0.8),
            0 0 70px rgba(212, 175, 55, 0.25);
        }

        .enterBtn:active {
          transform: scale(0.98);
        }

        .enterBtn:focus {
          outline: none !important;
        }

        .open .enterBtn {
          opacity: 0;
          pointer-events: none;
        }

        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 600px) {
          .doorCircle {
            width: 220px;
            height: 220px;
          }

          .leftDoor img,
          .rightDoor img {
            width: 220px !important;
            height: 220px !important;
          }

          .enterBtn {
            margin-top: 32px;

            padding: 14px 34px;

            font-size: 16px;
          }
        }
      `}</style>
    </main>
  );
}