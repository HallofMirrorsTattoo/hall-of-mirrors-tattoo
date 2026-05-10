import { Request, Response } from 'express';
export declare function submitContact(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getContactSubmissions(req: Request, res: Response): Promise<void>;
export declare function markAsRead(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=contactController.d.ts.map