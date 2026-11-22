import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import db from "../config/db.js";
import { registerSchema, loginSchema } from "../validations/authValidation.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendOtpEmail = async (toEmail, name, otpCode) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n[FRIDGEFLOW OTP] Email: ${toEmail} | Kode: ${otpCode}\n`);
    return;
  }

  console.log({
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  });

  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"FridgeFlow" <${process.env.SMTP_USER.trim()}>`,
    to: toEmail,
    subject: "Kode Verifikasi Akun FridgeFlow Anda",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px">
        <h2 style="color:#1D7AFC;margin-bottom:8px">Verifikasi Email FridgeFlow</h2>
        <p style="color:#334155">Halo <strong>${name}</strong>, masukkan kode OTP berikut untuk mengaktifkan akun dapur digital Anda:</p>
        <div style="font-size:28px;font-weight:800;letter-spacing:6px;text-align:center;padding:16px;background:#eff6ff;color:#1D7AFC;border-radius:12px;margin:20px 0">
          ${otpCode}
        </div>
        <p style="font-size:12px;color:#64748b">Kode ini berlaku selama 10 menit. Abaikan email ini jika Anda tidak merasa mendaftar.</p>
      </div>
    `,
  });
};

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

export const register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "Failed",
      message: error.details[0].message,
    });
  }

  const { name, email, password } = value;
  const cleanEmail = email.toLowerCase().trim();

  try {
    const existing = await db.query("SELECT * FROM users WHERE email = $1", [
      cleanEmail,
    ]);

    if (existing.rows.length > 0) {
      return res.status(409).json({
        status: "Failed",
        message:
          "Alamat email sudah terdaftar. Silakan masuk melalui halaman Login.",
      });
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (name, email, password, is_verified, auth_provider, otp_code, otp_expires_at)
       VALUES ($1, $2, $3, false, 'local', $4, $5)`,
      [name, cleanEmail, hashedPassword, otpCode, otpExpires],
    );

    try {
      await sendOtpEmail(cleanEmail, name, otpCode);
    } catch (mailErr) {
      console.error("[SMTP Error]:", mailErr);
      await db.query(
        "DELETE FROM users WHERE email = $1 AND is_verified = false",
        [cleanEmail],
      );
      return res.status(502).json({
        status: "Failed",
        message: `Gagal mengirim OTP (${mailErr.code || "SMTP"}): ${mailErr.message}`,
      });
    }

    return res.status(201).json({
      status: "Success",
      requiresVerification: true,
      message: "Kode verifikasi 6 digit telah dikirim ke alamat email Anda.",
      data: { email: cleanEmail },
    });
  } catch (err) {
    console.error("[Register Error]:", err.message);
    return res.status(500).json({
      status: "Error",
      message: "Terjadi kendala saat memproses pendaftaran.",
    });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ status: "Failed", message: "Email dan kode OTP wajib diisi." });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Akun tidak ditemukan." });
    }

    const user = result.rows[0];
    if (user.is_verified) {
      return res.status(400).json({
        status: "Failed",
        message: "Akun sudah terverifikasi. Silakan masuk.",
      });
    }

    if (user.otp_code !== String(otp).trim()) {
      return res
        .status(400)
        .json({ status: "Failed", message: "Kode OTP tidak sesuai." });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({
        status: "Failed",
        message:
          "Kode OTP sudah kedaluwarsa. Silakan masuk ulang untuk meminta kode baru.",
      });
    }

    await db.query(
      "UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE id = $1",
      [user.id],
    );

    const token = signToken(user);
    return res.status(200).json({
      status: "Success",
      message: "Email berhasil diverifikasi!",
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email },
      },
    });
  } catch (err) {
    console.error("[Verify OTP Error]:", err.message);
    return res.status(500).json({
      status: "Error",
      message: "Terjadi kendala saat memverifikasi kode OTP.",
    });
  }
};

export const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "Failed",
      message:
        "Gagal masuk. Silakan cek email dan kata sandi Anda dengan benar.",
    });
  }

  const { email, password } = value;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "Failed",
        message:
          "Gagal masuk. Silakan cek email dan kata sandi Anda dengan benar.",
      });
    }

    const user = result.rows[0];
    if (!user.password) {
      return res.status(400).json({
        status: "Failed",
        message:
          "Akun ini terdaftar melalui Google. Silakan gunakan tombol Masuk dengan Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "Failed",
        message:
          "Gagal masuk. Silakan cek email dan kata sandi Anda dengan benar.",
      });
    }

    if (!user.is_verified) {
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      await db.query(
        "UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3",
        [otpCode, otpExpires, user.id],
      );

      await sendOtpEmail(user.email, user.name, otpCode);

      return res.status(403).json({
        status: "Failed",
        requiresVerification: true,
        email: user.email,
        message:
          "Akun belum diverifikasi. Kode OTP baru telah dikirim ke alamat email Anda.",
      });
    }

    const token = signToken(user);
    return res.status(200).json({
      status: "Success",
      message: "Berhasil masuk",
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email },
      },
    });
  } catch (err) {
    console.error("[Login Error]:", err.message);
    return res.status(500).json({
      status: "Error",
      message: "Terjadi kendala saat masuk. Silakan coba beberapa saat lagi.",
    });
  }
};

export const googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({
      status: "Failed",
      message: "Token autentikasi Google tidak ditemukan.",
    });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    const cleanEmail = email.toLowerCase().trim();

    let result = await db.query("SELECT * FROM users WHERE email = $1", [
      cleanEmail,
    ]);
    let user;

    if (result.rows.length === 0) {
      const insertRes = await db.query(
        `INSERT INTO users (name, email, is_verified, auth_provider, google_id)
         VALUES ($1, $2, true, 'google', $3) RETURNING *`,
        [name, cleanEmail, googleId],
      );
      user = insertRes.rows[0];
    } else {
      user = result.rows[0];
      if (!user.is_verified || !user.google_id) {
        const upd = await db.query(
          `UPDATE users SET is_verified = true, google_id = COALESCE(google_id, $1) WHERE id = $2 RETURNING *`,
          [googleId, user.id],
        );
        user = upd.rows[0];
      }
    }

    const token = signToken(user);
    return res.status(200).json({
      status: "Success",
      message: "Berhasil masuk dengan akun Google",
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email },
      },
    });
  } catch (err) {
    console.error("[Google Auth Error]:", err.message);
    return res.status(401).json({
      status: "Failed",
      message: "Verifikasi akun Google gagal.",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, auth_provider, (password IS NOT NULL) AS has_password, created_at FROM users WHERE id = $1",
      [req.user.id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Pengguna tidak ditemukan" });
    }
    return res.status(200).json({ status: "Success", data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({
      status: "Error",
      message: "Gagal memuat profil pengguna.",
    });
  }
};

export const deleteAccount = async (req, res) => {
  const { password, confirmText } = req.body || {};
  const userId = req.user.id;

  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Akun tidak ditemukan." });
    }

    const user = result.rows[0];

    if (user.password) {
      if (!password) {
        return res.status(400).json({
          status: "Failed",
          message:
            "Kata sandi wajib diisi untuk mengonfirmasi penghapusan akun.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: "Failed",
          message: "Kata sandi yang Anda masukkan salah.",
        });
      }
    } else {
      if (
        String(confirmText || "")
          .trim()
          .toUpperCase() !== "HAPUS"
      ) {
        return res.status(400).json({
          status: "Failed",
          message: 'Ketik "HAPUS" untuk mengonfirmasi penghapusan akun.',
        });
      }
    }

    await db
      .query("DELETE FROM transactions WHERE user_id = $1", [userId])
      .catch(() => {});
    await db
      .query("DELETE FROM recipes WHERE user_id = $1", [userId])
      .catch(() => {});
    await db
      .query("DELETE FROM ingredients WHERE user_id = $1", [userId])
      .catch(() => {});
    await db.query("DELETE FROM users WHERE id = $1", [userId]);

    return res.status(200).json({
      status: "Success",
      message: "Akun dan seluruh data Anda telah berhasil dihapus.",
    });
  } catch (err) {
    console.error("[Delete Account Error]:", err.message);
    return res.status(500).json({
      status: "Error",
      message: "Terjadi kendala saat menghapus akun. Silakan coba lagi.",
    });
  }
};
