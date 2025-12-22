import { Request, Response } from "express";
import { CategoryService } from "./category.service";
import { StatusCodes } from "http-status-codes";

export class CategoryController {
    static async create(req: Request, res: Response) {
        const { name, slug } = req.body;
        await CategoryService.create(name, slug);
        res.status(StatusCodes.CREATED).json({ message: "Category created" });
    }


  static async list(req: Request, res: Response) {
    const cats = await CategoryService.list();
    res.status(StatusCodes.OK).json(cats);
  }
}
