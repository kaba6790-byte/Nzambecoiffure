const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Non autorisé' });

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.adminId = payload.id;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};
