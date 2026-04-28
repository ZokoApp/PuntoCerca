  require('dotenv').config();
  const crypto = require("crypto");
  
  const express = require('express');
  const cors = require('cors');
  const pool = require('./db');
  const bcrypt = require('bcrypt');
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  const { v4: uuidv4 } = require('uuid');
  const jwt = require('jsonwebtoken');
  const rateLimit = require('express-rate-limit');
  const cookieParser = require('cookie-parser');
  const csrf = require('csurf');
  const multer = require("multer");
  const path = require("path");
  
  const app = express();
  app.set('trust proxy', 1);
  const PORT = process.env.PORT || 3000;
  
  const cloudinary = require("cloudinary").v2;
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "puntocerca",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
    },
  });
  
  const upload = multer({
    storage,
    limits: { files: 5 }
  });
  /* ================================
     TOKEN CONFIG
  ================================ */
  
  const ACCESS_TOKEN_EXPIRY = "15m";
  const REFRESH_TOKEN_EXPIRY = "7d";
  
  /* ================================
     RATE LIMIT
  ================================ */
  
  const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Demasiadas solicitudes. Intenta más tarde." }
  });
  
  const loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Demasiados intentos. Espera 15 minutos." }
  });
  
  /* ================================
     MIDDLEWARES
  ================================ */
  
  app.use(cors({
      origin: process.env.BASE_URL,
      credentials: true
  }));
  
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.static('public'));
  app.use('/api/', apiLimiter);
  
  /* ================================
     CSRF CONFIG
  ================================ */
  
  const csrfProtection = csrf({
      cookie: {
          httpOnly: false,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production"
      }
  });
  
  /* ================================
     AUTH HELPERS
  ================================ */
  
  function generateAccessToken(user) {
      return jwt.sign(
          { id: user.id, role: user.role, name: user.name },
          process.env.JWT_SECRET,
          { expiresIn: ACCESS_TOKEN_EXPIRY }
      );
  }
  
  function generateRefreshToken(user) {
      return jwt.sign(
          { id: user.id },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: REFRESH_TOKEN_EXPIRY }
      );
  }
  
  /* ================================
     AUTH MIDDLEWARE
  ================================ */
  
  function authMiddleware(req, res, next) {
  
      const token = req.cookies.access_token;
  
      if (!token) {
          return res.status(401).json({ error: "No autorizado" });
      }
  
      try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = decoded;
          next();
      } catch {
          return res.status(401).json({ error: "Token expirado o inválido" });
      }
  }
  
  function requireRole(role) {
      return (req, res, next) => {
          if (!req.user) return res.status(401).json({ error: "No autorizado" });
          if (req.user.role !== role) return res.status(403).json({ error: "Acceso prohibido" });
          next();
      };
  }
  
  /* ================================
     CSRF TOKEN ENDPOINT
  ================================ */
  
  app.get('/api/csrf-token', csrfProtection, (req, res) => {
      res.json({ csrfToken: req.csrfToken() });
  });
  
  
  
  app.get('/new-product', (req, res) => {
    res.sendFile(__dirname + '/public/new-product.html');
  });
  
  app.get('/edit-product/:id', (req, res) => {
    res.sendFile(__dirname + '/public/edit-product.html');
  });
  
  app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
  });
  
  app.get('/edit-store', (req, res) => {
    res.sendFile(__dirname + '/public/edit-store.html');
  });
  
  app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    try {
  
      const productId = req.params.id;
  
      // 🔒 aseguramos que el producto sea del usuario
      const result = await pool.query(
        `DELETE FROM products 
         WHERE id = $1 
         AND store_id IN (
           SELECT id FROM stores WHERE user_id = $2
         )
         RETURNING *`,
        [productId, req.user.id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: "Producto no encontrado o no autorizado" });
      }
  
      res.json({ message: "Producto eliminado" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error eliminando producto" });
    }
  });
  
  
  
  
  /* ================================
     REGISTER
  ================================ */
  app.post('/api/register', loginLimiter, csrfProtection, async (req, res) => {
  
      const { name, email, password, role } = req.body;
  
      try {
  
          const passwordHash = await bcrypt.hash(password, 10);
          const emailToken = uuidv4();
  
          // ✅ SOLO CREA USUARIO (NO TIENDA)
          await pool.query(
              `INSERT INTO users (name,email,password_hash,role,email_token,email_verified)
               VALUES ($1,$2,$3,$4,$5,false)`,
              [name, email, passwordHash, role, emailToken]
          );
  
          const verificationLink =
              `${process.env.BASE_URL}/api/verify-email?token=${emailToken}`;
  
          await resend.emails.send({
              from: "PuntoCerca <no-reply@puntocerca.com.ar>",
              to: email,
              subject: "Verifica tu cuenta - PuntoCerca",
              html: `
                  <h2>Verifica tu cuenta</h2>
                  <p>Haz click en el siguiente enlace:</p>
                  <a href="${verificationLink}">
                    Verificar Email
                  </a>
              `
          });
  
          res.status(201).json({
              message: "Usuario creado. Revisa tu email para verificar tu cuenta."
          });
  
      } catch (error) {
          console.error(error);
  
          if (error.code === '23505') {
              return res.status(400).json({ error: "El email ya está en uso" });
          }
  
          res.status(500).json({ error: "Error en registro" });
      }
  });
  
  
  // ⭐ RATE STORE
  app.post('/api/stores/:id/rate', authMiddleware, async (req, res) => {
    const storeId = req.params.id;
    const userId = req.user.id;
    const { rating } = req.body;
  
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating inválido" });
    }
  
    try {
      await pool.query(`
        INSERT INTO store_ratings (user_id, store_id, rating)
        VALUES ($1,$2,$3)
        ON CONFLICT (user_id, store_id)
        DO UPDATE SET rating = EXCLUDED.rating
      `, [userId, storeId, rating]);
  
      const result = await pool.query(`
        SELECT 
          AVG(rating)::numeric(10,2) as avg,
          COUNT(*) as count
        FROM store_ratings
        WHERE store_id = $1
      `, [storeId]);
  
      res.json({
        avg: result.rows[0].avg || 0,
        count: result.rows[0].count || 0
      });
  
    } catch (err) {
      console.error("ERROR RATE:", err);
      res.status(500).json({ error: "Error rating tienda" });
    }
  });
  
  // ⭐ GET RATING
  app.get('/api/stores/:id/rating', async (req, res) => {
    try {
      const storeId = req.params.id;
  
      const result = await pool.query(`
        SELECT 
          AVG(rating)::numeric(10,2) as avg,
          COUNT(*) as count
        FROM store_ratings
        WHERE store_id = $1
      `, [storeId]);
  
      let user_rating = null;
  
      if (req.cookies.access_token) {
        try {
          const decoded = jwt.verify(req.cookies.access_token, process.env.JWT_SECRET);
  
          const userRes = await pool.query(`
            SELECT rating
            FROM store_ratings
            WHERE user_id = $1 AND store_id = $2
            LIMIT 1
          `, [decoded.id, storeId]);
  
          if (userRes.rows.length > 0) {
            user_rating = userRes.rows[0].rating;
          }
        } catch (err) {
          // si el token no sirve, no rompemos la respuesta
        }
      }
  
      res.json({
        avg: result.rows[0].avg || 0,
        count: Number(result.rows[0].count) || 0,
        user_rating
      });
  
    } catch (err) {
      console.error("ERROR GET RATING:", err);
      res.status(500).json({ error: "Error obteniendo rating" });
    }
  });
  
  
  app.get('/product/:id', (req, res) => {
      res.sendFile(__dirname + '/public/product.html');
  });
  
  app.get('/api/products/slug/:slug', async (req, res) => {
  
    try {
  
      const result = await pool.query(
        `SELECT 
          p.*, 
          s.name as store_name,
          s.phone as store_phone,
          s.slug as store_slug
         FROM products p
         LEFT JOIN stores s ON p.store_id = s.id
         WHERE p.slug = $1`,
        [req.params.slug]
      );
  
      
  
      if (!result.rows.length) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
  
      const product = result.rows[0];
  
      // parse images
      if (product.images && typeof product.images === "string") {
        try {
          product.images = JSON.parse(product.images);
        } catch {
          product.images = [];
        }
      }
  
      if (product.slug) {
    return res.json({
      ...product,
      redirect_slug: product.slug
    });
  }
  
  res.json(product);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error del servidor" });
    }
  });
  
  
  app.post('/api/stores',
    authMiddleware,
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "cover", maxCount: 1 }
    ]),
    async (req, res) => {
  
    try {
  
      const { 
    name, 
    description, 
    phone, 
    city, 
    category, 
    subcategory_ids,
    street,
    local,
    apartment,
    reference_notes,
    lat,
    lng
  } = req.body;
  
  let opening_hours = null;
  
  if (req.body.opening_hours) {
    try {
      opening_hours = JSON.parse(req.body.opening_hours);
    } catch (e) {
      opening_hours = null;
    }
  }
  
  let subcategoriesToSave = null;
  
  if (subcategory_ids) {
    try {
      subcategoriesToSave = JSON.parse(subcategory_ids).map(Number);
    } catch {
      subcategoriesToSave = null;
    }
  }
  
      // 🔒 evitar duplicados
      const existing = await pool.query(
        `SELECT id FROM stores WHERE user_id = $1`,
        [req.user.id]
      );
  
      if (existing.rows.length > 0) {
        return res.status(400).json({
          error: "Ya tienes una tienda creada"
        });
      }
  
      // 🔥 GENERAR SLUG
      const baseSlug = name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
  
      let slug = baseSlug;
      let counter = 1;
  
      while (true) {
        const check = await pool.query(
          `SELECT id FROM stores WHERE slug = $1`,
          [slug]
        );
  
        if (check.rows.length === 0) break;
  
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
  
      let logo_url = null;
      let cover_url = null;
  
      if (req.files?.logo) {
        logo_url = req.files.logo[0].path;
      }
  
      if (req.files?.cover) {
        cover_url = req.files.cover[0].path;
      }
  
      const result = await pool.query(
        `INSERT INTO stores 
  (user_id, name, slug, description, phone, city, category, subcategory_ids, street, local, apartment, reference_notes, lat, lng, logo_url, cover_url, opening_hours)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        RETURNING *`,
        [
          req.user.id,
          name,
          slug,
          description,
          phone,
          city,
          category,
          subcategoriesToSave ? JSON.stringify(subcategoriesToSave) : null,
          street,
          local,
          apartment,
          reference_notes,
          lat || null,
          lng || null,
          logo_url,
          cover_url,
          opening_hours
        ]
      );
  
      res.status(201).json(result.rows[0]);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error creando tienda" });
    }
  
  });
  /* ================================
     LOGIN
  ================================ */
  
  app.post('/api/login', loginLimiter, csrfProtection, async (req, res) => {
  
      const { email, password } = req.body;
  
      try {
  
          const result = await pool.query(
              `SELECT * FROM users WHERE email = $1`,
              [email]
          );
  
          if (!result.rows.length)
              return res.status(400).json({ error: "Usuario no encontrado" });
  
          const user = result.rows[0];
  
          const match = await bcrypt.compare(password, user.password_hash);
          if (!match)
              return res.status(400).json({ error: "Contraseña incorrecta" });   
          
          if (!user.email_verified) {
      return res.status(403).json({
          error: "Debes verificar tu email antes de iniciar sesión."
      });
  }
  
          const accessToken = generateAccessToken(user);
          const refreshToken = generateRefreshToken(user);
  
          // Guardar refresh token en DB
          await pool.query(
              `UPDATE users SET refresh_token = $1 WHERE id = $2`,
              [refreshToken, user.id]
          );
  
          const isProd = process.env.NODE_ENV === "production";
  
  res.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",   // 🔥 antes: "strict"
      secure: isProd,    // 🔥 antes: false
      maxAge: 15 * 60 * 1000
  });
  
  res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
          res.json({ message: "Login correcto" });
  
      } catch (error) {
          res.status(500).json({ error: "Error en login" });
      }
  });
  
  /* ================================
     RESEND VERIFICATION EMAIL
  ================================ */
  
  app.post('/api/resend-verification', csrfProtection, async (req, res) => {
  
      const { email } = req.body;
  
      try {
  
          const result = await pool.query(
              `SELECT * FROM users WHERE email = $1`,
              [email]
          );
  
          if (!result.rows.length) {
              return res.status(404).json({
                  error: "Usuario no encontrado"
              });
          }
  
          const user = result.rows[0];
  
          if (user.email_verified) {
              return res.json({
                  message: "El email ya está verificado."
              });
          }
  
          const emailToken = uuidv4();
  
          await pool.query(
              `UPDATE users
               SET email_token = $1
               WHERE id = $2`,
              [emailToken, user.id]
          );
  
          const verificationLink =
              `${process.env.BASE_URL}/api/verify-email?token=${emailToken}`;
  
          await resend.emails.send({
    from: "PuntoCerca <no-reply@puntocerca.com.ar>",
    to: email,
    subject: "Verifica tu cuenta - PuntoCerca",
    html: `
      <h2>Verifica tu cuenta</h2>
      <p>Haz click en el siguiente enlace:</p>
      <a href="${verificationLink}">
        Verificar Email
      </a>
    `
  });
  
          res.json({
              message: "Email de verificación reenviado."
          });
  
      } catch (error) {
  
          console.error(error);
  
          res.status(500).json({
              error: "Error enviando email"
          });
  
      }
  
  });
  
  /* ================================
     REFRESH TOKEN
  ================================ */
  
  app.post('/api/refresh', async (req, res) => {
  
      const token = req.cookies.refresh_token;
  
      if (!token)
          return res.status(401).json({ error: "Refresh token requerido" });
  
      try {
  
          const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  
          const result = await pool.query(
              `SELECT * FROM users WHERE id = $1`,
              [decoded.id]
          );
  
          if (!result.rows.length)
              return res.status(403).json({ error: "Usuario no válido" });
  
          const user = result.rows[0];
  
          if (user.refresh_token !== token)
              return res.status(403).json({ error: "Refresh token inválido" });
  
          // ROTACIÓN
          const newAccessToken = generateAccessToken(user);
          const newRefreshToken = generateRefreshToken(user);
  
          await pool.query(
              `UPDATE users SET refresh_token = $1 WHERE id = $2`,
              [newRefreshToken, user.id]
          );
  
          const isProd = process.env.NODE_ENV === "production";
  
  res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 15 * 60 * 1000
  });
  
  res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
          res.json({ message: "Token renovado" });
  
      } catch {
          return res.status(403).json({ error: "Refresh inválido o expirado" });
      }
  });
  
  /* ================================
     LOGOUT
  ================================ */
  
  app.post('/api/logout', async (req, res) => {
  
      const refreshToken = req.cookies.refresh_token;
  
      if (refreshToken) {
          await pool.query(
              `UPDATE users SET refresh_token = NULL WHERE refresh_token = $1`,
              [refreshToken]
          );
      }
  
      const isProd = process.env.NODE_ENV === "production";
  
  res.clearCookie("access_token", {
    sameSite: "lax",
    secure: isProd
  });
  
  res.clearCookie("refresh_token", {
    sameSite: "lax",
    secure: isProd
  });
  
      res.json({ message: "Logout correcto" });
  });
  
  /* ================================
     WHO AM I
  ================================ */
  
  app.get('/api/me', authMiddleware, async (req, res) => {
    try {
  
      const result = await pool.query(
        `SELECT id, name, email, role, avatar_url FROM users WHERE id = $1`,
        [req.user.id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
  
      res.json(result.rows[0]);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo usuario" });
    }
  });
  
  // ================================
  // UPDATE USER
  // ================================
  app.put('/api/users/me', authMiddleware, async (req, res) => {
    try {
  
      const { name, password } = req.body;
  
      let passwordHash = null;
  
      if (password && password.trim() !== "") {
        passwordHash = await bcrypt.hash(password, 10);
      }
  
      const result = await pool.query(
        `UPDATE users
         SET 
           name = COALESCE($1, name),
           password_hash = COALESCE($2, password_hash)
         WHERE id = $3
         RETURNING id, name, email, role, avatar_url`,
        [
          name || null,
          passwordHash,
          req.user.id
        ]
      );
  
      res.json(result.rows[0]);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error actualizando usuario" });
    }
  });
  
  app.put('/api/users/avatar', authMiddleware, upload.single("avatar"), async (req, res) => {
    try {
  
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ninguna imagen" });
      }
  
      const avatar_url = req.file.path;
  
      const result = await pool.query(
        `UPDATE users
         SET avatar_url = $1
         WHERE id = $2
         RETURNING id, name, email, role, avatar_url`,
        [avatar_url, req.user.id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
  
      res.json({
        message: "Avatar actualizado correctamente",
        user: result.rows[0]
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error actualizando avatar" });
    }
  });
  
  
  // ================================
  // DELETE USER (PRO)
  // ================================
  app.delete('/api/users/me', authMiddleware, async (req, res) => {
    try {
  
      const userId = req.user.id;
  
      // 🔥 1. eliminar favoritos productos
      await pool.query(
        `DELETE FROM product_favorites WHERE user_id = $1`,
        [userId]
      );
  
      // 🔥 2. eliminar follows
      await pool.query(
        `DELETE FROM follows WHERE user_id = $1`,
        [userId]
      );
  
      // 🔥 3. eliminar favoritos tiendas
      await pool.query(
        `DELETE FROM favorites WHERE user_id = $1`,
        [userId]
      );
  
      // 🔥 4. eliminar ratings productos
      await pool.query(
        `DELETE FROM product_ratings WHERE user_id = $1`,
        [userId]
      );
  
      // 🔥 5. eliminar tiendas del usuario
      const stores = await pool.query(
        `SELECT id FROM stores WHERE user_id = $1`,
        [userId]
      );
  
      for (const store of stores.rows) {
  
        // productos de la tienda
        await pool.query(
          `DELETE FROM products WHERE store_id = $1`,
          [store.id]
        );
  
        // follows a esa tienda
        await pool.query(
          `DELETE FROM follows WHERE store_id = $1`,
          [store.id]
        );
  
        // favoritos a esa tienda
        await pool.query(
          `DELETE FROM favorites WHERE store_id = $1`,
          [store.id]
        );
      }
  
      // 🔥 6. eliminar tiendas
      await pool.query(
        `DELETE FROM stores WHERE user_id = $1`,
        [userId]
      );
  
      // 🔥 7. eliminar usuario
      await pool.query(
        `DELETE FROM users WHERE id = $1`,
        [userId]
      );
  
      // limpiar cookies
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
  
      res.json({ message: "Cuenta eliminada correctamente" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error eliminando cuenta" });
    }
  });
  
   app.post('/api/favorites', authMiddleware, async (req, res) => {
  
    const { store_id } = req.body;
  
    try {
  
      await pool.query(
        `INSERT INTO favorites (user_id, store_id)
         VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [req.user.id, store_id]
      );
  
      res.json({ message: "Guardado en favoritos" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error guardando favorito" });
    }
  
  });
  
  app.get('/api/products/:id', async (req, res) => {
    const id = req.params.id;
  
    try {
  
      // 🔥 producto + tienda
      const result = await pool.query(`
        SELECT 
    p.*, 
    s.name as store_name,
    s.phone as store_phone,
    s.slug as store_slug
  FROM products p
  LEFT JOIN stores s ON p.store_id = s.id
  WHERE p.id = $1
      `, [id]);
  
      if (!result.rows.length) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
  
      const product = result.rows[0];
  
      // 🔥 imágenes
      if (product.images && typeof product.images === "string") {
        try {
          product.images = JSON.parse(product.images);
        } catch {
          product.images = [];
        }
      }
  
      // 🔥 rating promedio
      const ratingResult = await pool.query(`
        SELECT 
          AVG(rating)::numeric(10,2) as avg,
          COUNT(*) as count
        FROM product_ratings
        WHERE product_id = $1
      `, [id]);
  
      product.rating_avg = ratingResult.rows[0].avg;
      product.rating_count = ratingResult.rows[0].count;
  
      // 🔥 rating del usuario
      let userRating = null;
  
      if (req.cookies.access_token) {
        try {
          const decoded = jwt.verify(req.cookies.access_token, process.env.JWT_SECRET);
  
          const userRes = await pool.query(`
            SELECT rating 
            FROM product_ratings 
            WHERE user_id = $1 AND product_id = $2
          `, [decoded.id, id]);
  
          if (userRes.rows.length) {
            userRating = userRes.rows[0].rating;
          }
  
        } catch {}
      }
  
      product.user_rating = userRating;
  
      let isFavorite = false;
  
  if (req.cookies.access_token) {
    try {
      const decoded = jwt.verify(req.cookies.access_token, process.env.JWT_SECRET);
  
      const favRes = await pool.query(
        `SELECT 1 FROM product_favorites 
         WHERE user_id = $1 AND product_id = $2`,
        [decoded.id, id]
      );
  
      isFavorite = favRes.rows.length > 0;
  
    } catch {}
  }
  
  product.is_favorite = isFavorite;
  
      res.json(product);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error del servidor" });
    }
  });
  
  
  
  app.post('/api/products', authMiddleware, upload.array("images", 5), async (req, res) => {
    try {
      const {
    name,
    price,
    old_price,
    store_id,
    brand,
    size,
    stock,
    extra,
    category,
    colors,
    is_offer,
    subcategory_id 
  } = req.body;
  
      const parsedPrice = price && price !== "" ? parseFloat(price) : null;
  const parsedOldPrice = old_price && old_price !== "" ? parseFloat(old_price) : null;
  const parsedStock = stock && stock !== "" && !isNaN(stock)
    ? parseInt(stock)
    : null;
      
  
      let images = [];
  
      if (req.files && req.files.length > 0) {
        images = req.files.map(file => file.path);
      }
  
      const baseSlug = name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
  
      let slug = baseSlug;
      let counter = 1;
  
      while (true) {
        const check = await pool.query(
          `SELECT id FROM products WHERE slug = $1`,
          [slug]
        );
  
        if (check.rows.length === 0) break;
  
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
  
      const mainImage = images[0] || null;
  
      let offerCreatedAt = null;
  let offerExpiresAt = null;
  
  const parsedIsOffer = is_offer === "true" || is_offer === true;
  
  if (parsedIsOffer) {
    offerCreatedAt = new Date();
    offerExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  const result = await pool.query(
    `INSERT INTO products
      (name, price, old_price, image_url, images, store_id, brand, size, stock, extra, colors, category, subcategory_id, is_offer, offer_created_at, offer_expires_at, slug)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *`,
    [
      name,
      parsedPrice,
      parsedOldPrice,
      mainImage,
      JSON.stringify(images),
      store_id,
      brand || null,
      size || null,
      parsedStock,
      extra || null,
      colors || "[]",
      category || null,
      subcategory_id || null,
      parsedIsOffer,
      offerCreatedAt,
      offerExpiresAt,
      slug
    ]
  );
      res.json(result.rows[0]);
  
    } catch (error) {
      console.error("ERROR CREANDO PRODUCTO:", error);
      res.status(500).json({ error: "Error creando producto" });
    }
  });
  
  
  
  app.delete('/api/comments/:id', authMiddleware, async (req, res) => {
    try {
  
      const commentId = req.params.id;
      const userId = req.user.id;
  
      const result = await pool.query(
        `DELETE FROM comments 
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [commentId, userId]
      );
  
      if (!result.rows.length) {
        return res.status(403).json({ error: "No autorizado" });
      }
  
      res.json({ message: "Comentario eliminado" });
  
    } catch (error) {
      console.error("DELETE COMMENT ERROR:", error);
      res.status(500).json({ error: "Error eliminando comentario" });
    }
  });
  
  app.post('/api/stores/:id/comments', authMiddleware, async (req, res) => {
  
    const { content } = req.body;
    const storeId = req.params.id;
    const userId = req.user?.id;
  
    console.log("🟡 INTENTO COMENTARIO:", {
      storeId,
      userId,
      content
    });
  
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Comentario vacío" });
    }
  
    if (!userId) {
      return res.status(401).json({ error: "Usuario no válido" });
    }
  
    try {
  
      // 🔍 validar tienda
      const storeCheck = await pool.query(
        `SELECT id FROM stores WHERE id = $1`,
        [storeId]
      );
  
      if (!storeCheck.rows.length) {
        return res.status(404).json({ error: "Tienda no existe" });
      }
  
      // 🔥 INSERT
      const result = await pool.query(
        `INSERT INTO store_comments (store_id, user_id, content)
         VALUES ($1,$2,$3)
         RETURNING *`,
        [storeId, userId, content]
      );
  
      console.log("🟢 COMENTARIO OK:", result.rows[0]);
  
      res.json(result.rows[0]);
  
    } catch (error) {
      console.error("🔴 ERROR REAL:", error);
  
      res.status(500).json({
        error: "Error comentando tienda",
        detail: error.message
      });
    }
  });
  
  
  
  // ================================
  // GET COMMENTS (CON AVATAR)
  // ================================
  app.get('/api/products/:id/comments', async (req, res) => {
    try {
  
      const result = await pool.query(
        `SELECT 
           comments.*,
           users.name,
           users.avatar_url
         FROM comments
         JOIN users ON users.id = comments.user_id
         WHERE comments.product_id = $1
         ORDER BY comments.id DESC`,
        [req.params.id]
      );
  
      res.json(result.rows);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo comentarios" });
    }
  });
  
  app.put('/api/stores/:id/status', authMiddleware, async (req, res) => {
  
    let { is_open } = req.body;
  
    console.log("STATUS RECIBIDO:", is_open);
  
    // convertir correctamente
    is_open = is_open === true || is_open === "true";
  
    try {
      const result = await pool.query(
        `UPDATE stores 
         SET is_open = $1 
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [is_open, req.params.id, req.user.id]
      );
  
      if (!result.rows.length) {
        return res.status(403).json({ error: "No autorizado" });
      }
  
      res.json(result.rows[0]);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error actualizando estado" });
    }
  });
  
  
  
  
  app.put('/api/products/:id', authMiddleware, upload.array("images", 5), async (req, res) => {
    try {
  
      const { 
        name, 
        price, 
        old_price, 
        brand,
        size, 
        stock, 
        extra, 
        category,
        colors,
        is_offer
      } = req.body;
  
      // 🔥 VALIDAR PRODUCTO
      const productData = await pool.query(
        `SELECT store_id, is_offer, price FROM products WHERE id = $1`,
        [req.params.id]
      );
  
      if (!productData.rows.length) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
  
      const storeId = productData.rows[0].store_id;
      const currentPrice = productData.rows[0].price;
      const wasOffer = productData.rows[0].is_offer;
  
      // 🔥 PARSEOS
      const parsedPrice = price ? parseFloat(price) : null;
      let parsedOldPrice = old_price ? parseFloat(old_price) : null;
      const parsedStock = stock ? parseInt(stock) : null;
      const parsedIsOffer = is_offer === "true" || is_offer === true;
  
      let parsedColors = null;
      if (colors) {
        try {
          parsedColors = typeof colors === "string" ? colors : JSON.stringify(colors);
        } catch {
          parsedColors = null;
        }
      }
  
      // 🔥 VALIDACIÓN OFERTAS
      const lastOffer = await pool.query(
        `SELECT offer_expires_at 
         FROM products 
         WHERE store_id = $1
         AND is_offer = true
         ORDER BY offer_expires_at DESC
         LIMIT 1`,
        [storeId]
      );
  
      const lastExpires = lastOffer.rows[0]?.offer_expires_at;
      const now = new Date();
  
      if (parsedIsOffer && lastExpires) {
        const expiresDate = new Date(lastExpires);
  
        if (expiresDate > now) {
          return res.status(400).json({
            error: "Tu tienda ya tiene una oferta activa"
          });
        }
  
        const cooldownEnd = new Date(expiresDate.getTime() + (24 * 60 * 60 * 1000));
  
        if (now < cooldownEnd) {
          return res.status(400).json({
            error: "Debes esperar 24h para crear otra oferta"
          });
        }
      }
  
      // 🔥 FECHAS OFERTA
      let offerCreatedAt = null;
      let offerExpiresAt = null;
  
      if (parsedIsOffer && !wasOffer) {
        offerCreatedAt = new Date();
        offerExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
  
      if (!parsedIsOffer && wasOffer) {
        offerCreatedAt = null;
        offerExpiresAt = null;
      }
  
      // 🔥 AUTO DESCUENTO
      if (parsedPrice && currentPrice && parsedPrice < currentPrice && !parsedOldPrice) {
        parsedOldPrice = currentPrice;
      }
  
      // 🔥 IMÁGENES
      let images = [];
  
      if (req.files && req.files.length > 0) {
        images = req.files.map(file => file.path);
      }
  
      const mainImage = images[0] || null;
      const imagesValue = images.length > 0 ? JSON.stringify(images) : null;
  
      // 🔥 UPDATE
      const result = await pool.query(
        `UPDATE products
         SET 
           name = COALESCE($1, name),
           price = COALESCE($2, price),
           old_price = COALESCE($3, old_price),
           brand = COALESCE($4, brand),
           size = COALESCE($5, size),
           stock = COALESCE($6, stock),
           extra = COALESCE($7, extra),
           category = COALESCE($8, category),
           colors = COALESCE($9, colors),
           is_offer = COALESCE($10, is_offer),
           offer_created_at = COALESCE($11, offer_created_at),
           offer_expires_at = COALESCE($12, offer_expires_at),
           image_url = COALESCE($13, image_url),
           images = COALESCE($14, images)
         WHERE id = $15
         RETURNING *`,
        [
          name || null,
          parsedPrice,
          parsedOldPrice,
          brand || null,
          size || null,
          parsedStock,
          extra || null,
          category || null,
          parsedColors,
          parsedIsOffer,
          offerCreatedAt,
          offerExpiresAt,
          mainImage,
          imagesValue,
          req.params.id
        ]
      );
  
      res.json(result.rows[0]);
  
    } catch (error) {
      console.error("UPDATE PRODUCT ERROR:", error);
      res.status(500).json({ error: "Error actualizando producto" });
    }
  });
  
  app.delete('/api/product-favorite/:id', authMiddleware, async (req, res) => {
  
    try {
  
      await pool.query(
        `DELETE FROM product_favorites 
         WHERE user_id = $1 AND product_id = $2`,
        [req.user.id, req.params.id]
      );
  
      res.json({ message: "Eliminado de favoritos" });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error" });
    }
  
  });
  
  
   app.get('/api/favorites', authMiddleware, async (req, res) => {
  
    try {
  
      const result = await pool.query(`
        SELECT stores.*
        FROM favorites
        JOIN stores ON stores.id = favorites.store_id
        WHERE favorites.user_id = $1
      `, [req.user.id]);
  
      res.json(result.rows);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo favoritos" });
    }
  
  });
  
  app.post('/api/follow', authMiddleware, async (req, res) => {
  
    const { store_id } = req.body;
  
    try {
  
      await pool.query(
        `INSERT INTO follows (user_id, store_id)
         VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [req.user.id, store_id]
      );
  
      res.json({ message: "Siguiendo tienda" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error siguiendo tienda" });
    }
  
  });
  
  app.post("/api/forgot-password", async (req, res) => {
  
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ error: "Email requerido" });
    }
  
    try {
  
      // 🔍 buscar usuario en PostgreSQL
      const result = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
      );
  
      const user = result.rows[0];
  
      // ⚠️ SIEMPRE responder OK (seguridad)
      if (!user) {
        return res.json({
          message: "Si el email existe, te enviamos un link"
        });
      }
  
      // 🔑 generar token
      const token = crypto.randomBytes(32).toString("hex");
  
      // ⏳ expiración (1 hora)
      const expires = new Date(Date.now() + 1000 * 60 * 60);
  
      // 💾 guardar en DB
      await pool.query(
        `UPDATE users 
         SET reset_token = $1, reset_token_expires = $2 
         WHERE id = $3`,
        [token, expires, user.id]
      );
  
      // 📧 (por ahora log)
      const resetLink = `${process.env.BASE_URL}/reset-password.html?token=${token}`;
  
  await resend.emails.send({
    from: "PuntoCerca <no-reply@puntocerca.com.ar>", 
    to: email,
    subject: "Recuperar contraseña - PuntoCerca",
    html: `
      <h2>Recuperar contraseña</h2>
      <p>Hacé click en el siguiente enlace:</p>
      <a href="${resetLink}">Restablecer contraseña</a>
      <p>Este link expira en 1 hora.</p>
    `
  });
  
      return res.json({
        message: "Si el email existe, te enviamos un link"
      });
  
    } catch (err) {
      console.error("FORGOT ERROR:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  
  });
  
  
  app.post('/api/admin/create-seller', async (req, res) => {
    try {
  
      const { name, email, password, store_name } = req.body;
  
      // 🔐 hash password
      const passwordHash = await bcrypt.hash(password, 10);
  
      // 🧑 crear usuario
      const userResult = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, email_verified)
         VALUES ($1,$2,$3,'user',true)
         RETURNING *`,
        [name, email, passwordHash]
      );
  
      const user = userResult.rows[0];
  
      // 🔥 generar slug tienda
      const baseSlug = store_name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
  
      let slug = baseSlug;
      let counter = 1;
  
      while (true) {
        const check = await pool.query(
          `SELECT id FROM stores WHERE slug = $1`,
          [slug]
        );
  
        if (check.rows.length === 0) break;
  
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
  
      // 🏪 crear tienda
      const storeResult = await pool.query(
        `INSERT INTO stores (name, user_id, slug)
         VALUES ($1,$2,$3)
         RETURNING *`,
        [store_name, user.id, slug]
      );
  
      res.json({
        user,
        store: storeResult.rows[0]
      });
  
    } catch (error) {
      console.error(error);
  
      if (error.code === '23505') {
        return res.status(400).json({ error: "Email ya existe" });
      }
  
      res.status(500).json({ error: "Error creando seller" });
    }
  });
  
  app.post("/api/reset-password", async (req, res) => {
  
    const { token, password } = req.body;
  
    if (!token || !password) {
      return res.status(400).json({ error: "Datos inválidos" });
    }
  
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }
  
    try {
  
      // 🔍 buscar usuario con token válido
      const result = await pool.query(
        `SELECT * FROM users 
         WHERE reset_token = $1 
         AND reset_token_expires > NOW()`,
        [token]
      );
  
      if (!result.rows.length) {
        return res.status(400).json({ error: "Token inválido o expirado" });
      }
  
      const user = result.rows[0];
  
      // 🔐 hashear nueva contraseña
      const passwordHash = await bcrypt.hash(password, 10);
  
      // 💾 actualizar usuario
      await pool.query(
        `UPDATE users 
         SET password_hash = $1,
             reset_token = NULL,
             reset_token_expires = NULL
         WHERE id = $2`,
        [passwordHash, user.id]
      );
  
      res.json({
        message: "Contraseña actualizada correctamente"
      });
  
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  
  });
  
  
  app.get('/api/stores/:id/comments', async (req, res) => {
    try {
  
      const result = await pool.query(
        `SELECT 
           sc.*,
           u.name,
           u.avatar_url
         FROM store_comments sc
         JOIN users u ON u.id = sc.user_id
         WHERE sc.store_id = $1
         ORDER BY sc.id DESC`,
        [req.params.id]
      );
  
      res.json(result.rows);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo comentarios" });
    }
  });
  
  
  app.post('/api/product-favorite', authMiddleware, async (req, res) => {
    try {
  
      const { product_id } = req.body;
  
      await pool.query(
        `INSERT INTO product_favorites (user_id, product_id)
         VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [req.user.id, product_id]
      );
  
      res.json({ message: "Guardado" });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error" });
    }
  });
  
  app.get('/api/is-following/:storeId', authMiddleware, async (req, res) => {
  
    const result = await pool.query(
      `SELECT 1 FROM follows WHERE user_id=$1 AND store_id=$2`,
      [req.user.id, req.params.storeId]
    );
  
    res.json({ following: result.rows.length > 0 });
  
  });
  
  app.get('/api/store-followers/:storeId', async (req, res) => {
  
    const result = await pool.query(
      `SELECT COUNT(*) FROM follows WHERE store_id=$1`,
      [req.params.storeId]
    );
  
    res.json({ count: result.rows[0].count });
  
  });
  
  app.post('/api/product-view/:id', async (req, res) => {
  
    await pool.query(
      `UPDATE products SET views = COALESCE(views,0) + 1 WHERE id=$1`,
      [req.params.id]
    );
  
    res.json({ ok:true });
  
  });
  
  
  app.delete('/api/follow/:storeId', authMiddleware, async (req, res) => {
  
    try {
  
      await pool.query(
        `DELETE FROM follows
         WHERE user_id = $1 AND store_id = $2`,
        [req.user.id, req.params.storeId]
      );
  
      res.json({ message: "Dejaste de seguir" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error" });
    }
  
  });
  
  app.delete('/api/stores/comments/:id', authMiddleware, async (req, res) => {
    try {
      const commentId = req.params.id;
      const userId = req.user.id;
  
      const result = await pool.query(
        `DELETE FROM store_comments 
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [commentId, userId]
      );
  
      if (!result.rows.length) {
        return res.status(403).json({ error: "No autorizado" });
      }
  
      res.json({ message: "Comentario eliminado" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error eliminando comentario" });
    }
  });
  
  app.get('/api/following', authMiddleware, async (req, res) => {
  
    try {
  
      const result = await pool.query(`
        SELECT stores.*
        FROM follows
        JOIN stores ON stores.id = follows.store_id
        WHERE follows.user_id = $1
      `, [req.user.id]);
  
      res.json(result.rows);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo seguidos" });
    }
  
  });
  
  /* ================================
     GET STORES
  ================================ */
  
  app.get('/api/stores', async (req, res) => {
    try {
  
      const { category, subcategory_id, lat, lng } = req.query;
  
      const userLat = lat && !isNaN(lat) ? parseFloat(lat) : null;
      const userLng = lng && !isNaN(lng) ? parseFloat(lng) : null;
  
      const hasLocation = userLat !== null && userLng !== null;
  
      let values = [];
      let index = 0;
  
      let query = `
  SELECT 
    s.*,
    COALESCE(AVG(r.rating), 0)::numeric(10,2) as rating_avg,
    COUNT(r.rating) as rating_count,
    (COALESCE(AVG(r.rating),0) * LOG(COUNT(r.rating) + 1)) as rating_score,
  
    CASE 
      WHEN s.is_open = true THEN 1
      ELSE 0
    END as open_priority
  `;
  
      // 📍 DISTANCIA SOLO SI HAY UBICACIÓN
      if (hasLocation) {
        index++;
        values.push(userLat);
  
        index++;
        values.push(userLng);
  
        query += `,
    (
      6371 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians($1)) * cos(radians(s.lat)) *
          cos(radians(s.lng) - radians($2)) +
          sin(radians($1)) * sin(radians(s.lat))
        ))
      )
    ) as distance
  `;
      } else {
        query += `, NULL as distance`;
      }
  
      query += `
  FROM stores s
  LEFT JOIN store_ratings r ON r.store_id = s.id
  `;
  
      const conditions = [];
  
      // 🔍 FILTROS
      if (category) {
        index++;
        values.push(category);
        conditions.push(`s.category = $${index}`);
      }
  
      if (subcategory_id) {
        index++;
        values.push(JSON.stringify([subcategory_id]));
        conditions.push(`s.subcategory_ids @> $${index}::jsonb`);
      }
  
      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }
  
      query += `
  GROUP BY s.id
  ORDER BY 
    open_priority DESC,
    ${hasLocation ? 'distance ASC NULLS LAST,' : ''}
    rating_score DESC
  `;
  
      const result = await pool.query(query, values);
  
      res.json(result.rows);
  
    } catch (error) {
      console.error("🔥 ERROR /api/stores:", error);
      res.status(500).json({ error: "Error obteniendo tiendas" });
    }
  });
  
  
  /* ================================
     GET MY STORE
  ================================ */
  
  app.get('/api/my-store', authMiddleware, async (req, res) => {
  
      try {
  
          const result = await pool.query(
              `SELECT * FROM stores WHERE user_id = $1 LIMIT 1`,
              [req.user.id]
          );
  
          if (!result.rows.length) {
              return res.status(404).json({
                  error: "No tienes tienda creada"
              });
          }
  
          res.json(result.rows[0]);
  
      } catch (error) {
          console.error(error);
          res.status(500).json({
              error: "Error obteniendo tienda"
          });
      }
  
  });
  
  
  app.delete('/api/my-store', authMiddleware, async (req, res) => {
    try {
  
      const userId = req.user.id;
  
      // 🔥 1. obtener la tienda del usuario
      const storeResult = await pool.query(
        `SELECT id FROM stores WHERE user_id = $1`,
        [userId]
      );
  
      if (!storeResult.rows.length) {
        return res.status(404).json({ error: "No tienes tienda" });
      }
  
      const storeId = storeResult.rows[0].id;
  
      // 🔥 2. eliminar productos
      await pool.query(
        `DELETE FROM products WHERE store_id = $1`,
        [storeId]
      );
  
      // 🔥 3. eliminar seguidores
      await pool.query(
        `DELETE FROM follows WHERE store_id = $1`,
        [storeId]
      );
  
      // 🔥 4. eliminar favoritos
      await pool.query(
        `DELETE FROM favorites WHERE store_id = $1`,
        [storeId]
      );
  
      // 🔥 5. eliminar tienda
      await pool.query(
        `DELETE FROM stores WHERE id = $1`,
        [storeId]
      );
  
      res.json({ message: "Tienda eliminada correctamente" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error eliminando tienda" });
    }
  });
  
  /* ================================
     GET STORE BY ID
  ================================ */
  
  app.get('/api/stores/:id', async (req, res) => {
  
      try {
  
          const result = await pool.query(
              `SELECT * FROM stores WHERE id = $1`,
              [req.params.id]
          );
  
          if (!result.rows.length) {
              return res.status(404).json({
                  error: "Tienda no encontrada"
              });
          }
  
          res.json(result.rows[0]);
  
      } catch (error) {
  
          console.error(error);
  
          res.status(500).json({
              error: "Error obteniendo tienda"
          });
  
      }
  
  });
  
  app.put('/api/stores/:id',
    authMiddleware,
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "cover", maxCount: 1 }
    ]),
    async (req, res) => {
  
    console.log("BODY:", req.body);
  console.log("FILES:", req.files);
  
   const { 
    name, 
    description, 
    phone, 
    city, 
    category, 
    subcategory_id,
    subcategory_ids,
    street,
    local,
    apartment,
    reference_notes,
    lat,
    lng
  } = req.body;
  
      let opening_hours = null;
  
  if (req.body.opening_hours) {
    try {
      opening_hours = JSON.parse(req.body.opening_hours);
    } catch (e) {
      console.error("Error parsing opening_hours", e);
    }
  }
  
  
  let logo_url = null;
  let cover_url = null;
  
  // archivos
  if (req.files?.logo) {
    logo_url = req.files.logo[0].path;
  }
  
  if (req.files?.cover) {
    cover_url = req.files.cover[0].path;
  }
  
  let subcategoriesToSave = null;
  
  if (subcategory_ids) {
    try {
      subcategoriesToSave = JSON.parse(subcategory_ids);
    } catch {
      subcategoriesToSave = null;
    }
  }
  
    try {
      const result = await pool.query(
    `UPDATE stores
     SET 
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       phone = COALESCE($3, phone),
       city = COALESCE($4, city),
       category = COALESCE($5, category),
       subcategory_id = COALESCE($6, subcategory_id),
       street = COALESCE($7, street),
       local = COALESCE($8, local),
       apartment = COALESCE($9, apartment),
       reference_notes = COALESCE($10, reference_notes),
       lat = COALESCE($11, lat),
       lng = COALESCE($12, lng),
       logo_url = COALESCE($13, logo_url),
       cover_url = COALESCE($14, cover_url),
       subcategory_ids = COALESCE($15, subcategory_ids),
  opening_hours = COALESCE($16, opening_hours)
  WHERE id = $17 AND user_id = $18
     RETURNING *`,
   [
    name,
    description,
    phone,
    city,
    category,
    subcategory_id,
    street,
    local,
    apartment,
    reference_notes,
    lat || null,
    lng || null,
    logo_url,
    cover_url,
    subcategoriesToSave ? JSON.stringify(subcategoriesToSave) : null,
    opening_hours,
    req.params.id,
    req.user.id
  ]
  );
  
      if(!result.rows.length){
        return res.status(403).json({ error: "No autorizado" });
      }
  
      res.json(result.rows[0]);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error actualizando tienda" });
    }
  });
  
  
  app.get('/api/stores/:id/products', async (req, res) => {
    try {
  
      const result = await pool.query(`
        SELECT 
          p.*,
          s.name AS store_name,
          AVG(r.rating)::numeric(10,2) AS rating_avg,
          COUNT(r.rating) AS rating_count
        FROM products p
        LEFT JOIN stores s ON s.id = p.store_id
        LEFT JOIN product_ratings r ON r.product_id = p.id
        WHERE p.store_id = $1
        GROUP BY p.id, s.name
        ORDER BY p.id DESC
      `, [req.params.id]);
  
      res.json(result.rows);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo productos" });
    }
  });
  
  /* ================================
     PÁGINAS
  ================================ */
  
  app.get('/', (req, res) => {
      res.sendFile(__dirname + '/public/index.html');
  });
  
  app.get('/login', (req, res) => {
      res.sendFile(__dirname + '/public/login.html');
  });
  
  app.get('/dashboard-user', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard-user.html');
  });
  
  
  app.get('/register', (req, res) => {
      res.sendFile(__dirname + '/public/register.html');
  });
  
  app.get('/dashboard', (req, res) => {
      res.sendFile(__dirname + '/public/dashboard.html');
  });
  
  app.get('/api/google-maps-key', (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
  });
  
  app.get("/products", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "products.html"));
  });
  
  app.get('/offers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'offers.html'));
  });
  
  app.get('/edit-store', (req, res) => {
    res.sendFile(__dirname + '/public/edit-store.html');
  });
  
  app.get('/profile', (req, res) => {
    res.sendFile(__dirname + '/public/profile.html');
  });
  
  app.get('/delete-store', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'delete-store.html'));
  });
  
  app.get('/api/store-by-slug/:slug', async (req, res) => {
  
    const { slug } = req.params;
  
    try {
  
      const result = await pool.query(
        `SELECT * FROM stores WHERE slug = $1`,
        [slug]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Tienda no encontrada" });
      }
  
      res.json(result.rows[0]);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error servidor" });
    }
  
  });
  app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(`
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>https://puntocerca.com.ar/</loc>
        </url>
      </urlset>
    `);
  });
  
  app.get('/:slug', async (req, res) => {
  
    const slug = req.params.slug;
  
    // bloquear rutas del sistema
    const blocked = [
      "api",
      "login",
      "register",
      "products",
      "offers",
      "dashboard",
      "profile",
      "product"
    ];
  
    if (blocked.includes(slug)) return;
  
    try {
  
      const result = await pool.query(
        `SELECT id FROM stores WHERE slug = $1`,
        [slug]
      );
  
      if (!result.rows.length) {
        return res.status(404).send("No encontrado");
      }
  
      res.sendFile(path.join(__dirname, 'public/store.html'));
  
    } catch (err) {
      res.status(500).send("Error");
    }
  
  });
  app.get('/stores', (req, res) => {
    res.sendFile(__dirname + '/public/stores.html');
  });
  
  app.get('/api/categories', async (req, res) => {
    try {
  
      const result = await pool.query(`
        SELECT DISTINCT category 
        FROM stores 
        WHERE category IS NOT NULL
        ORDER BY category ASC
      `);
  
      res.json(result.rows);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo categorías" });
    }
  });
  
  app.get('/api/stores/slug/:slug', async (req, res) => {
  
    try {
  
      const result = await pool.query(
        `SELECT * FROM stores WHERE slug = $1`,
        [req.params.slug]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: "Tienda no encontrada" });
      }
  
      res.json(result.rows[0]);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo tienda" });
    }
  
  });
  
  app.get('/store/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/store.html'));
  });
  
  
  /* ================================
     VERIFY EMAIL
  ================================ */
  
  app.get('/api/verify-email', async (req, res) => {
  
      const { token } = req.query;
  
      if (!token) {
          return res.status(400).send("Token inválido");
      }
  
      try {
  
          const result = await pool.query(
              `SELECT * FROM users WHERE email_token = $1`,
              [token]
          );
  
          if (!result.rows.length) {
              return res.status(400).send("Token inválido o expirado");
          }
  
          const user = result.rows[0];
  
          await pool.query(
              `UPDATE users
               SET email_verified = true,
                   email_token = NULL
               WHERE id = $1`,
              [user.id]
          );
  
          res.send(`
              <h2>Email verificado correctamente ✅</h2>
              <a href="/login">Ir al login</a>
          `);
  
      } catch (error) {
          console.error(error);
          res.status(500).send("Error verificando email");
      }
  });
  
  
  
  app.get('/api/products', async (req, res) => {
    try {
  
      const { featured } = req.query;
  
      let query = `
      SELECT 
    products.*, 
    stores.name AS store_name,
    AVG(r.rating) AS rating_avg,
    COUNT(r.rating) AS rating_count
  FROM products
  JOIN stores ON stores.id = products.store_id
  LEFT JOIN product_ratings r ON r.product_id = products.id
  GROUP BY products.id, stores.name
  
  `;
  
      // si pedís destacados
      if (featured === "true") {
        query += " ORDER BY products.id DESC LIMIT 10";
      }
  
      const result = await pool.query(query);
  
      res.json(result.rows);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo productos" });
    }
  });
  
  app.get('/api/daily-offers', async (req, res) => {
    try {
  
      // 🔥 1. Expirar ofertas vencidas de verdad
      await pool.query(`
        UPDATE products
        SET 
          is_offer = false
        WHERE is_offer = true
        AND offer_expires_at IS NOT NULL
        AND offer_expires_at <= NOW()
      `);
  
      // 🔥 2. Traer solo ofertas activas
      const result = await pool.query(`
        SELECT 
          p.id AS product_id,
          p.slug,
          p.name AS product_name,
          p.price,
          p.old_price,
          p.image_url,
          p.store_id,
          p.offer_created_at,
          p.offer_expires_at,
          s.name AS store_name,
          AVG(r.rating) AS rating_avg,
          COUNT(r.rating) AS rating_count
        FROM products p
        JOIN stores s ON s.id = p.store_id
        LEFT JOIN product_ratings r ON r.product_id = p.id
        WHERE p.is_offer = true
        AND p.offer_expires_at IS NOT NULL
        AND p.offer_expires_at > NOW()
        GROUP BY p.id, s.name
        ORDER BY p.offer_expires_at ASC
        LIMIT 8
      `);
  
      res.json(result.rows);
  
    } catch (error) {
      console.error("ERROR DAILY OFFERS:", error);
      res.status(500).json({ error: "Error obteniendo ofertas" });
    }
  });
  
  /* ================================
     SEARCH (STORES + PRODUCTS)
  ================================ */
  
  app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.json([]);
    }

    const rawQuery = q.trim();

    function normalize(text) {
      return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    const normalizedQuery = normalize(rawQuery);
    const search = `%${normalizedQuery}%`;

    const SUBCATEGORY_MAP = {
      1: ["restaurante"],
      2: ["pizzeria", "pizza", "pizzas"],
      3: ["bar"],
      4: ["cafeteria", "cafe"],
      5: ["heladeria", "helado"],

      10: ["peluqueria"],
      11: ["barberia"],
      12: ["estetica"],
      13: ["spa"],

      18: ["electricista"],
      19: ["plomeria", "plomero"],
      20: ["gasista"],
      21: ["tecnico pc"],
      22: ["reparaciones"],

      23: ["taller mecanico"],
      24: ["lavadero"],
      25: ["gomeria"],
      26: ["repuestos"],

      46: ["verduleria"],
      47: ["almacen"],
      48: ["kiosco", "kiosko"],
      49: ["supermercado"],
      50: ["carniceria"],
      51: ["panaderia"],
      52: ["fiambreria"],
      53: ["dietetica"],
      54: ["bebidas"],
      55: ["mayorista"],

      61: ["cerrajeria"],
      62: ["celulares"],
      63: ["accesorios para celulares"],
      64: ["computacion"],
      65: ["tv", "smart tv"],
      66: ["audio"],
      67: ["gaming"]
    };

   const matchedSubIds = Object.entries(SUBCATEGORY_MAP)
  .filter(([id, names]) =>
    names.some(name =>
      normalize(name).includes(normalizedQuery) ||
      normalizedQuery.includes(normalize(name))
    )
  )
  .map(([id]) => Number(id));
    let storesResult;

    if (matchedSubIds.length > 0) {
      const subConditions = [];
const params = [];
let whereParts = [];

// 🔹 subcategorías
if (matchedSubIds.length > 0) {
  matchedSubIds.forEach((id) => {
   params.push(JSON.stringify([String(id)]));
    whereParts.push(`s.subcategory_ids @> $${params.length}::jsonb`);
  });
}

// 🔹 búsqueda por nombre (SIEMPRE)
params.push(search);
whereParts.push(`LOWER(public.unaccent(s.name)) LIKE LOWER(public.unaccent($${params.length}))`);

storesResult = await pool.query(`
  SELECT
    s.id,
    s.slug,
    s.name,
    s.logo_url AS image,
    s.street,
    s.is_open,
    COALESCE(AVG(r.rating),0)::numeric(10,2) AS rating_avg,
    COUNT(r.rating) AS rating_count,
    'store' AS type
  FROM stores s
  LEFT JOIN store_ratings r ON r.store_id = s.id
  WHERE (${whereParts.join(" OR ")})
  GROUP BY s.id
  ORDER BY s.is_open DESC, rating_avg DESC
`, params);

    } else {
      storesResult = await pool.query(`
        SELECT 
          s.id,
          s.slug,
          s.name,
          s.logo_url AS image,
          s.street,
          s.is_open,
          COALESCE(AVG(r.rating),0)::numeric(10,2) AS rating_avg,
          COUNT(r.rating) AS rating_count,
          'store' AS type
        FROM stores s
        LEFT JOIN store_ratings r ON r.store_id = s.id
        WHERE LOWER(public.unaccent(s.name)) LIKE LOWER(public.unaccent($1))
        GROUP BY s.id
        ORDER BY s.is_open DESC, rating_avg DESC
      `, [search]);
    }

    const productsResult = await pool.query(`
      SELECT 
        p.id,
        p.slug,
        p.name,
        COALESCE(p.price, 0) AS price,
        p.image_url AS image,
        p.size,
        p.brand,
        p.colors,
        s.name AS store_name,
        p.store_id,
        'product' AS type
      FROM products p
      LEFT JOIN stores s ON s.id = p.store_id
      WHERE LOWER(public.unaccent(p.name)) LIKE LOWER(public.unaccent($1))
      ORDER BY p.id DESC
      LIMIT 20
    `, [search]);

    res.json([
      ...storesResult.rows,
      ...productsResult.rows
    ]);

  } catch (error) {
    console.error("ERROR /api/search:", error);
    res.status(500).json({ error: "Error en búsqueda" });
  }
});
  
  /* ================================
     START
  ================================ */
  
  app.listen(PORT, () => {
      console.log("=====================================");
      console.log("Servidor iniciado correctamente");
      console.log("http://localhost:" + PORT);
      console.log("=====================================");
  });
