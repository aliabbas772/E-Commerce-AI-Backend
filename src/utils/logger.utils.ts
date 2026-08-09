import pino from "pino";
import util from "util";

const LOG_DIR = process.env.LOG_FILE_PATH || "/var/log/app";
const SERVICE_NAME = process.env.SERVICE_NAME || "ecommerce-server";

const targets: pino.TransportTargetOptions[] = [
  {
    target: "pino/file",
    level: process.env.LOG_LEVEL || "info",
    options: {
      destination: `${LOG_DIR}/${SERVICE_NAME}.log`,
      mkdir: true,
    },
  },
];

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  targets.push({
    target: "pino-pretty",
    level: process.env.LOG_LEVEL || "info",
    options: { colorize: true, destination: 1 },
  });
}

const transportStream = pino.transport({ targets });

const baseLogger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    base: {
      service: SERVICE_NAME,
      env: process.env.NODE_ENV || "development",
    },
  },
  transportStream,
);

const formatArgs = (args: any[]) => {
  if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
    const [mergingObject, ...restStrings] = args;
    return [mergingObject, util.format(...restStrings)];
  }
  return [util.format(...args)];
};

export const logger = {
  trace: (...args: any[]) => {
    const [obj, msg] = formatArgs(args);
    msg ? baseLogger.trace(obj, msg) : baseLogger.trace(obj);
  },
  debug: (...args: any[]) => {
    const [obj, msg] = formatArgs(args);
    msg ? baseLogger.debug(obj, msg) : baseLogger.debug(obj);
  },
  info: (...args: any[]) => {
    const [obj, msg] = formatArgs(args);
    msg ? baseLogger.info(obj, msg) : baseLogger.info(obj);
  },
  warn: (...args: any[]) => {
    const [obj, msg] = formatArgs(args);
    msg ? baseLogger.warn(obj, msg) : baseLogger.warn(obj);
  },
  error: (...args: any[]) => {
    const [obj, msg] = formatArgs(args);
    msg ? baseLogger.error(obj, msg) : baseLogger.error(obj);
  },
  fatal: (...args: any[]) => {
    const [obj, msg] = formatArgs(args);
    msg ? baseLogger.fatal(obj, msg) : baseLogger.fatal(obj);
  },
};