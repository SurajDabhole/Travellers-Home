const wrapAsync = (fn) => {
  return (req, res, next) => { // Add next parameter
      fn(req, res, next).catch(err => next(err)); // Use next(err)
  };
};

module.exports = wrapAsync; 