import { Request, Response } from 'express';
export declare function createConsultation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getConsultations(req: Request, res: Response): Promise<void>;
export declare function getConsultationById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateConsultation(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=consultationController.d.ts.map