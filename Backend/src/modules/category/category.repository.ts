import { db } from "../../db";
import { categories } from "../../db/schema";
import { eq } from "drizzle-orm";

export class CategoryRepository {
    static async create(name: string, slug: string) {
        await db.insert(categories).values({ name, slug });
    }


  static async getAll() {
    return db.select().from(categories);
  }

  static async getById(id: number) {
    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    return cat ?? null;
  }
}
