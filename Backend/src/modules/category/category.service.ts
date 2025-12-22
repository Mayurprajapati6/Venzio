import { CategoryRepository } from "./category.repository";
import { ConflictError, NotFoundError } from "../../utils/errors/app.error";

export class CategoryService {
    static async create(name: string, slug: string) {
        if (!name || !slug) {
            throw new ConflictError("Category name and slug required");
        }
        await CategoryRepository.create(name, slug);
    }


  static async list() {
    return CategoryRepository.getAll();
  }

  static async getById(id: number) {
    const cat = await CategoryRepository.getById(id);
    if (!cat) throw new NotFoundError("Category not found");
    return cat;
  }
}
