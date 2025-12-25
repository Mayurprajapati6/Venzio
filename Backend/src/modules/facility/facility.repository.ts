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
    return db.select().from(facilities).where(eq(facilities.ownerId, ownerId));
  }

  static async getById(id: string) {
    const [facility] = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, id));

    return facility ?? null;
  }

  static async deleteFacility(facilityId: string) {
    await db.delete(facilities).where(eq(facilities.id, facilityId));
  }

  // ADMIN
  static getPendingApproval() {
    return db
      .select()
      .from(facilities)
      .where(eq(facilities.approvalStatus, "PENDING"));
  }

  static updateApprovalStatus(
    id: string,
    status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED",
    reason?: string
  ) {
    const updateData: any = {
      approvalStatus: status,
    };

    if (status === "APPROVED") {
      updateData.isPublished = true; // 🔥 AUTO PUBLISH
      updateData.approvedAt = new Date();
      updateData.rejectionReason = null;
    }

    if (status === "REJECTED") {
      updateData.isPublished = false;
      updateData.approvedAt = null;
      updateData.rejectionReason = reason ?? "Rejected by admin";
    }

    if (status === "DRAFT" || status === "PENDING") {
      updateData.isPublished = false;
      updateData.approvedAt = null;
      updateData.rejectionReason = null;
    }

    return db.update(facilities).set(updateData).where(eq(facilities.id, id));
  }
}
