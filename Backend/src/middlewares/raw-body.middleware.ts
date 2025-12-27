import { Request, Response, NextFunction } from "express";




export function rawBodyMiddleware(
  req: Request & { rawBody?: string },
  res: Response,
  next: NextFunction
) {
  
  if (req.path.includes("/payments/webhook")) {
    let data = "";
    req.setEncoding("utf8");
    
    req.on("data", (chunk: string) => {
      data += chunk;
    });
    
    req.on("end", () => {
      (req as any).rawBody = data;
      
      try {
        req.body = JSON.parse(data);
      } catch (e) {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
}

