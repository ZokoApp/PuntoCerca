require('dotenv').config();


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
      (user_id, name, slug, description, phone, city, category, subcategory_ids, street, local, apartment, reference_notes, lat, lng, logo_url, cover_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        req.user.id,
        name,
        slug,
        description,
        phone,
        city,
        category,
        subcategory_ids,
        street,
        local,
        apartment,
        reference_notes,
        lat || null,
        lng || null,
        logo_url,
        cover_url
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

        res.cookie("access_token", accessToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
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

        res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refresh_token", newRefreshToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
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

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    res.json({ message: "Logout correcto" });
});

/* ================================
   WHO AM I
================================ */

app.get('/api/me', authMiddleware, async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT id, name, email, role FROM users WHERE id = $1`,
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
      store_id, 
      brand, 
      size, 
      stock, 
      extra, 
      category,
      colors,
      is_offer
    } = req.body;

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

// 🔥 único (evita duplicados)
const slug = `${baseSlug}-${Date.now()}`;

    const mainImage = images[0] || null;

    const result = await pool.query(
  `INSERT INTO products
(name, price, image_url, images, store_id, brand, size, stock, extra, colors, category, is_offer, slug)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
RETURNING *`,
 [
  name,
  price,
  mainImage,
  JSON.stringify(images),
  store_id,
  brand,
  size,
  stock ? parseInt(stock) : 0,
  extra,
  colors || "[]",
  category,
  is_offer === "true" || is_offer === true,
  slug
]
);

    res.json(result.rows[0]);

  } catch (error) {
    console.error("ERROR CREANDO PRODUCTO:", error);
    res.status(500).json({ error: "Error creando producto" });
  }

});


app.post('/api/products/:id/comments', async (req, res) => {

  const { content } = req.body;

  await pool.query(
    `INSERT INTO comments (product_id, content)
     VALUES ($1,$2)`,
    [req.params.id, content]
  );

  res.json({ ok: true });
});

app.post('/api/products/:id/rate', authMiddleware, async (req, res) => {
  const productId = req.params.id;
  const userId = req.user.id;
  const { rating } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating inválido" });
  }

  try {

    // 🔥 INSERT o UPDATE automático
    await pool.query(`
      INSERT INTO product_ratings (user_id, product_id, rating)
      VALUES ($1,$2,$3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET rating = EXCLUDED.rating
    `, [userId, productId, rating]);

    // 🔥 recalcular promedio
    const result = await pool.query(`
      SELECT 
        AVG(rating)::numeric(10,2) as avg,
        COUNT(*) as count
      FROM product_ratings
      WHERE product_id = $1
    `, [productId]);

    res.json({
      avg: result.rows[0].avg,
      count: result.rows[0].count
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error rating" });
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
      brand, 
      size, 
      stock, 
      extra, 
      category,
      colors,
      is_offer
    } = req.body;

    let images = [];

    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path);
    }

    const mainImage = images[0] || null;

    const result = await pool.query(
      `UPDATE products
       SET 
         name = COALESCE($1, name),
         price = COALESCE($2, price),
         brand = COALESCE($3, brand),
         size = COALESCE($4, size),
         stock = COALESCE($5, stock),
         extra = COALESCE($6, extra),
         category = COALESCE($7, category),
         colors = COALESCE($8, colors),
         is_offer = COALESCE($9, is_offer),
         image_url = COALESCE($10, image_url),
         images = COALESCE($11, images)
       WHERE id = $12
       RETURNING *`,
      [
        name,
        price,
        brand,
        size,
        stock ? parseInt(stock) : 0,
        extra,
        category,
        colors || "[]",
        is_offer === "true" || is_offer === true,
        mainImage,
        JSON.stringify(images),
        req.params.id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

app.post('/api/stores/:id/rate', authMiddleware, async (req, res) => {
  try {

    const { rating } = req.body;
    const storeId = req.params.id;
    const userId = req.user.id;

    await pool.query(
      `INSERT INTO ratings (user_id, store_id, rating)
       VALUES ($1,$2,$3)`,
      [userId, storeId, rating]
    );

    const result = await pool.query(
      `SELECT AVG(rating) as avg, COUNT(*) as count
       FROM ratings
       WHERE store_id = $1`,
      [storeId]
    );

    const avg = result.rows[0].avg;
    const count = result.rows[0].count;

    await pool.query(
      `UPDATE stores
       SET rating_avg = $1, rating_count = $2
       WHERE id = $3`,
      [avg, count, storeId]
    );

    res.json({ avg, count });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error rating tienda" });
  }
});

 app.get('/api/product-favorites', authMiddleware, async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT products.*
      FROM product_favorites
      JOIN products ON products.id = product_favorites.product_id
      WHERE product_favorites.user_id = $1
    `, [req.user.id]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error" });
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

    const { category, subcategory_id } = req.query;

    let query = `SELECT * FROM stores`;
    const conditions = [];
    const values = [];

    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    if (subcategory_id) {
  values.push(JSON.stringify([subcategory_id]));

  conditions.push(`
    subcategory_ids @> $${values.length}::jsonb
  `);
}

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
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
     subcategory_ids = COALESCE($15, subcategory_ids)
   WHERE id = $16 AND user_id = $17
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

        const result = await pool.query(
            `SELECT * FROM products WHERE store_id = $1 ORDER BY id DESC`,
            [req.params.id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error obteniendo productos"
        });
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

app.get("/products", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "products.html"));
});

app.get('/edit-store', (req, res) => {
  res.sendFile(__dirname + '/public/edit-store.html');
});

app.get('/profile', (req, res) => {
  res.sendFile(__dirname + '/public/profile.html');
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


app.get('/:slug', (req, res) => {

  const slug = req.params.slug;

  // ⚠️ evitar conflictos con otras rutas
  const blocked = [
  "api",
  "login",
  "register",
  "products",
  "map",
  "offers",
  "store",
  "product",
  "dashboard"
];

if (blocked.includes(slug)) {
  return;
}

  res.sendFile(path.join(__dirname, 'public/store.html'));
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

    const result = await pool.query(`
      SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.price,
  p.image_url,
  p.store_id,
  s.name AS store_name,
  AVG(r.rating) AS rating_avg,
  COUNT(r.rating) AS rating_count
FROM products p
JOIN stores s ON s.id = p.store_id
LEFT JOIN product_ratings r ON r.product_id = p.id
WHERE p.is_offer = true
GROUP BY p.id, s.name
ORDER BY RANDOM()
LIMIT 8
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo ofertas" });
  }
});

/* ================================
   SEARCH (STORES + PRODUCTS)
================================ */

app.get('/api/search', async (req, res) => {
  try {

    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const search = `%${q.toLowerCase()}%`;

    // 🔍 BUSCAR TIENDAS
    const storesResult = await pool.query(
      `SELECT 
        id,
        name,
        logo_url AS image,
        'store' AS type
      FROM stores
      WHERE LOWER(name) LIKE $1
         OR LOWER(category) LIKE $1`,
      [search]
    );

 
    // 🔍 BUSCAR PRODUCTOS
   const productsResult = await pool.query(
  `SELECT 
    p.id,
    p.name,
    COALESCE(p.price, 0) AS price,
    p.image_url AS image,
    p.size,
    p.brand,
    p.colors,
    s.name AS store_name,
    s.rating_avg,
    s.rating_count,
    p.store_id,
    'product' AS type
  FROM products p
  LEFT JOIN stores s ON s.id = p.store_id
  WHERE LOWER(p.name) LIKE $1`,
  [search]
);
    //  UNIR RESULTADOS
    const results = [
      ...storesResult.rows,
      ...productsResult.rows
    ];

    res.json(results);

  } catch (error) {
    console.error(error);
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



