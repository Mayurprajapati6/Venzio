export type CreateBookingDTO = {
    facilityId: string;
    slotType: "MORNING" | "AFTERNOON" | "EVENING";
    passDays: 1 | 3 | 7;
    startDate: string; // ISO date
}