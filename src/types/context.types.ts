import { Request } from "express";
import { IUser } from "../models/User.model.ts";

export interface Context {
  req: Request;
  user: IUser | null;
}
