export function healthCheck(_req, res) {
  res.json({
    success: true,
    message: "Virtual Lab API running",
  });
}
