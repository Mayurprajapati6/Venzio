export function groupEscrowsByFacility(rows: any[]) {
  const map = new Map<string, any>();

  for (const row of rows) {
    const key = row.facility_id;

    if (!map.has(key)) {
      map.set(key, {
        facilityId: row.facility_id,
        facilityName: row.facility_name,
        totalAmountHeld: 0,
        totalPlatformFee: 0,
        totalOwnerAmount: 0,
        bookings: [],
      });
    }

    const group = map.get(key);

    group.totalAmountHeld += row.amount_held;
    group.totalPlatformFee += row.platform_fee;
    group.totalOwnerAmount += row.amount_held - row.platform_fee;

    group.bookings.push({
      bookingId: row.booking_id,
      userId: row.user_id,
      passDays: row.pass_days,
      amountHeld: row.amount_held,
      platformFee: row.platform_fee,
      ownerAmount: row.amount_held - row.platform_fee,
      releaseDate: row.release_date,
    });
  }

  return Array.from(map.values());
}
