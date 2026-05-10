import { Request, Response } from 'express';
export declare function clientSignup(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function clientLogin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function clientRefresh(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function clientActivate(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getClientProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=clientAuthController.d.ts.map