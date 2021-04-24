import { VercelRequest, VercelResponse } from "@vercel/node";

export function handleHelloAlicorn(
  req: VercelRequest,
  res: VercelResponse
): void {
  res.status(200).send("Hello from Alicorn!");
}
