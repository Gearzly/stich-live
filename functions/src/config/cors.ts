export const corsConfig = {
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://stich-live.vercel.app',
    'https://*.vercel.app',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposeHeaders: ['X-Total-Count', 'X-Page-Count'],
  credentials: true,
  maxAge: 86400, // 24 hours
};