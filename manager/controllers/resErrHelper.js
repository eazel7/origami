module.exports = function (res, err) {
  res.status(419);
  console.log(err);
  
  return res.end();
};
