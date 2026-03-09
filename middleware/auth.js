function requireAdmin(req, res, next) {
  if (req.session && req.session.adminLoggedIn === true) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/admin/login');
}

module.exports = { requireAdmin };
