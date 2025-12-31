export interface SubscriptionCreateInput {
    ownerId: string;
    startDate: Date;
    endDate: Date;
}

export interface SubscriptionRecord {
    id: string;
    ownerId: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
}