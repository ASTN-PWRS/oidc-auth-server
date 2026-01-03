import pg from "pg";
import { config } from "../config/env.js";

export const pgPool = new pg.Pool(config.pg);
