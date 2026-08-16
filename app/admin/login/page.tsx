"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "@/app/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("اكتب البريد الإلكتروني وكلمة المرور.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      router.replace("/admin");
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);

      setError(
        "البريد الإلكتروني أو كلمة المرور غير صحيحة."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page" dir="rtl">
      <div className="admin-login-box">

        <div className="admin-login-logo">
          A.GO
        </div>

        <h1>
          تسجيل دخول الأدمن
        </h1>

        <p className="admin-login-subtitle">
          A.GO Store Administration
        </p>

        <form onSubmit={handleLogin}>

          <div className="login-field">
            <label>
              البريد الإلكتروني
            </label>

            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label>
              كلمة المرور
            </label>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "جاري تسجيل الدخول..."
              : "دخول الأدمن"}
          </button>

        </form>

      </div>

      <style jsx>{`

        .admin-login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
          background: #f7f7f7;
        }

        .admin-login-box {
          width: 100%;
          max-width: 430px;
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 24px;
          padding: 35px 30px;
          box-sizing: border-box;
          box-shadow:
            0 15px 45px rgba(0, 0, 0, 0.08);
        }

        .admin-login-logo {
          width: 70px;
          height: 70px;
          margin: 0 auto 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #111;
          color: #d4af37;

          font-size: 18px;
          font-weight: 900;

          letter-spacing: 1px;
        }

        .admin-login-box h1 {
          margin: 0;
          text-align: center;
          color: #111;
          font-size: 27px;
          font-weight: 800;
        }

        .admin-login-subtitle {
          margin: 8px 0 28px;
          text-align: center;
          color: #888;
          font-size: 14px;
        }

        .login-field {
          margin-bottom: 18px;
        }

        .login-field label {
          display: block;
          margin-bottom: 8px;
          color: #111;
          font-size: 14px;
          font-weight: 700;
        }

        .login-field input {
          width: 100%;
          height: 52px;
          padding: 0 15px;

          box-sizing: border-box;

          border: 1px solid #ddd;
          border-radius: 13px;

          background: #fafafa;
          color: #111;

          font-size: 15px;

          outline: none;

          transition: 0.2s ease;
        }

        .login-field input:focus {
          border-color: #111;
          background: #fff;
        }

        .login-field input:disabled {
          opacity: 0.6;
        }

        .login-error {
          margin-bottom: 15px;
          padding: 12px 14px;

          border-radius: 11px;

          background: #fff1f1;
          color: #c62828;

          font-size: 13px;
          font-weight: 600;

          text-align: center;
        }

        .admin-login-box button {
          width: 100%;
          height: 52px;

          border: none;
          border-radius: 13px;

          background: #111;
          color: #fff;

          font-size: 15px;
          font-weight: 800;

          cursor: pointer;

          transition: 0.2s ease;
        }

        .admin-login-box button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .admin-login-box button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 600px) {

          .admin-login-page {
            padding: 15px;
          }

          .admin-login-box {
            max-width: 100%;
            padding: 30px 20px;
            border-radius: 20px;
          }

          .admin-login-logo {
            width: 64px;
            height: 64px;
          }

          .admin-login-box h1 {
            font-size: 24px;
          }

          .login-field input {
            height: 50px;
          }

          .admin-login-box button {
            height: 50px;
          }
        }

      `}</style>
    </main>
  );
}