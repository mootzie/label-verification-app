import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err.stack);
  if (res.headersSent) {
    res.write(
      `data: ${JSON.stringify({ type: "error", error: err.message || "Internal server error" })}\n\n`,
    );
    res.write("data: [DONE]\n\n");
    if (!res.writableEnded) res.end();
  } else {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
