const success = (data = null, message = "Success") => {
  return {
    success: true,
    message,
    data,
  };
};

module.exports = {
  success,
};