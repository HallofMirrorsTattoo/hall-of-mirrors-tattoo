import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            artist?: {
                id: string;
                email: string;
                full_name: string;
            };
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map