import { db } from "../../db";
import { facilities, facilityImages } from "../../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export class FacilityRepository {
  static async createFacility(data: any) {
    await db.insert(facilities).values(data);
    return data.id;
  }

  static async addImages(
    facilityId: string,
    images: { url: string; isPrimary?: boolean }[]
  ) {
    if (!images.length) return;

    await db.insert(facilityImages).values(
      images.map((img) => ({
        id: randomUUID(),
        facilityId,
        imageUrl: img.url,
        isPrimary: img.isPrimary ?? false,
      }))
    );
  }

  static getByOwner(ownerId: string) {
    return db
      .select()
      .from(facilities)
      .where(eq(facilities.ownerId, ownerId));
  }

  static async getById(id: string) {
    const [facility] = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, id));

    return facility ?? null;
  }

  static updatePublishStatus(id: string, isPublished: boolean) {
    return db
      .update(facilities)
      .set({ isPublished })
      .where(eq(facilities.id, id));
  }

  static async deleteFacility(facilityId: string) {
    await db.delete(facilities).where(eq(facilities.id, facilityId));
  }

  static getPendingApproval() {
    return db
      .select()
      .from(facilities)
      .where(eq(facilities.approvalStatus, "PENDING"));
  }

  static approve(id: string) {
    return db
      .update(facilities)
      .set({
        approvalStatus: "APPROVED",
        approvedAt: new Date(),
        rejectionReason: null,
      })
      .where(eq(facilities.id, id));
  }

  static reject(id: string, reason: string) {
    return db
      .update(facilities)
      .set({
        approvalStatus: "REJECTED",
        isPublished: false,
        rejectionReason: reason,
      })
      .where(eq(facilities.id, id));
  }
}



