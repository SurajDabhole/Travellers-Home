/*

function wrapAsync(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next); 
  };
}

module.exports = wrapAsync;
*/

function wrapAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((err) => {
      next(err);  // Ensure error is passed to the next middleware
    });
  };
}

module.exports = wrapAsync;
