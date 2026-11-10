const errorHandler = (err, req, res, next) => {
  console.error("API Error:", err.message);

  const statusCode = err.statusCode || err.status || (
    err.code === "LIMIT_FILE_SIZE" || err.code === "LIMIT_FILE_COUNT" ? 413 : 500
  );

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error",
  });
};

export default errorHandler;