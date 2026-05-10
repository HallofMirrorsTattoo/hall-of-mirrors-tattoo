import { Request, Response } from 'express';
export declare function createBooking(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getBookings(req: Request, res: Response): Promise<void>;
export declare function getBookingById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateBooking(req: Request, res: Response): Promise<void>;
export declare function cancelBooking(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=bookingController.d.ts.map