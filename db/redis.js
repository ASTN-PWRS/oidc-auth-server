import { createClient } from "redis";
import { config } from "../config/env.js";

export const redis = createClient({ url: config.redisUrl });
