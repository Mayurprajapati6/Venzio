export type CreateSlotTemplateDTO = {
  facilityId: string;
  slotType: "MORNING" | "AFTERNOON" | "EVENING";
  startTime: string;
  endTime: string;
  capacity: number;

  price1Day?: number;
  price3Day?: number;
  price7Day?: number;

  validFrom: string;
  validTill: string;
};
