export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    message,
  });
}
