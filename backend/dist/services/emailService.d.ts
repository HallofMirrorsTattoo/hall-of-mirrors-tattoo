interface BookingData {
    id: string;
    booking_reference: string;
    appointment_date_time: Date;
    tattoo_description: string;
    placement: string;
    estimated_size: string;
    user?: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
    artist?: {
        id: string;
        full_name: string;
        email: string;
    };
}
export declare function sendNewBookingNotification(booking: BookingData): Promise<void>;
export declare function sendBookingStatusUpdate(clientEmail: string, clientName: string, bookingReference: string, status: string, artistName: string, message?: string): Promise<void>;
export {};
//# sourceMappingURL=emailService.d.ts.map