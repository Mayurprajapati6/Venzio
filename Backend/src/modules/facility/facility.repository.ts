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

  static async getByOwner(ownerId: string) {
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

  static async updatePublishStatus(
    facilityId: string,
    isPublished: boolean
  ) {
    await db
      .update(facilities)
      .set({ isPublished })
      .where(eq(facilities.id, facilityId));
  }

  static async deleteFacility(facilityId: string) {
    await db.delete(facilities).where(eq(facilities.id, facilityId));
  }

  static async getPendingApproval() {
    return db
      .select()
      .from(facilities)
      .where(eq(facilities.isApproved, false));
  }

  static async approve(facilityId: string) {
    await db
      .update(facilities)
      .set({
        isApproved: true,
        adminNote: null,
      })
      .where(eq(facilities.id, facilityId));
  }

  static async reject(facilityId: string, reason: string) {
    await db
      .update(facilities)
      .set({
        isApproved: false,
        isPublished: false,
        adminNote: reason,
      })
      .where(eq(facilities.id, facilityId));
  }

}
