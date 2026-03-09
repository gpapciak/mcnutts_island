require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const BetterSQLiteStore = require('better-sqlite3-session-store')(session);

const { initDatabase } = require('./database/db');
const indexRouter = require('./routes/index');
const islandRouter = require('./routes/island');
const floraRouter = require('./routes/flora');
const activitiesRouter = require('./routes/activities');
const communityRouter = require('./routes/community');
const namingRouter = require('./routes/naming');
const bearingRouter = require('./routes/bearing-witness');
const aboutRouter = require('./routes/about');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many submissions from this address. Please try again in an hour.',
});

app.use(generalLimiter);

// ── Templating ─────────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static files ───────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
}));

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Sessions ───────────────────────────────────────────────────────────────────
app.use(session({
  store: new BetterSQLiteStore({
    client: require('better-sqlite3')(path.join(__dirname, 'database', 'sessions.db')),
  }),
  secret: process.env.SESSION_SECRET || 'mcnutts-island-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
}));

// ── Local variables for all views ──────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.siteUrl = process.env.SITE_URL || 'https://mcnuttsisland.org';
  res.locals.siteName = "McNutt's Island Alliance";
  res.locals.currentPath = req.path;
  res.locals.isAdmin = req.session && req.session.adminLoggedIn === true;
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/', indexRouter);
app.use('/island', islandRouter);
app.use('/flora-fauna', floraRouter);
app.use('/activities', activitiesRouter);
app.use('/community', formLimiter, communityRouter);
app.use('/naming', namingRouter);
app.use('/bearing-witness', bearingRouter);
app.use('/about', aboutRouter);
app.use('/admin', adminRouter);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', {
    title: "Page Not Found — McNutt's Island Alliance",
    meta: { description: 'The page you were looking for could not be found.' },
  });
});

// ── Error handler ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: "Something Went Wrong — McNutt's Island Alliance",
    meta: { description: 'An unexpected error occurred.' },
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
initDatabase();

app.listen(PORT, () => {
  console.log(`\nMcNutt's Island Alliance server running on port ${PORT}`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Mode:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Admin:   http://localhost:${PORT}/admin\n`);
});

module.exports = app;
