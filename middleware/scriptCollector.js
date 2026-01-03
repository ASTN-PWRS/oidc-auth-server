// middleware/scriptCollector.js
export function scriptCollector(req, res, next) {
  res.locals.usedScripts = new Set();
  next();
}
