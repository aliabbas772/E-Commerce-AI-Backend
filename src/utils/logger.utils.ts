import pino from "pino";
import util from "util";

// 1. Build the transport array configurations first
const targets: pino.TransportTargetOptions[] = [
  {
    target: "pino/file",
    level: process.env.LOG_LEVEL || "info",
    options: { destination: "/var/log/app/server.log", mkdir: true },
  },
];

if (process.env.NODE_ENV === "production") {
  targets.push({
    target: "pino/file",
    level: process.env.LOG_LEVEL || "info",
    options: { destination: 1 }, // Standard Output (stdout)
  });
} else {
  targets.push({
    target: "pino-pretty",
    level: process.env.LOG_LEVEL || "info",
    options: { colorize: true },
  });
}

// 2. Compile targets into a valid asynchronously-threaded stream
const transportStream = pino.transport({ targets });

// 3. Initialize the actual operational baseLogger instance using the stream
const baseLogger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    // Injects global indexed metadata tags on every single log payload
    base: {
      service: process.env.SERVICE_NAME || "ecommerce-server",
      env: process.env.NODE_ENV || "development",
    },
  },
  transportStream // Pass the processed stream pipeline directly here
);

// 4. Arguments formatter utility for handling printf-style parameters safely
const formatArgs = (args: any[]) => {
  if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
    const [mergingObject, ...restStrings] = args;
    return [mergingObject, util.format(...restStrings)];
  }
  return [util.format(...args)];
};

// 5. Export structured type-safe wrapper proxy methods
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

