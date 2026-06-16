// import pino from "pino";

// export const logger = pino({
//   level: process.env.LOG_LEVEL || "info",

//   transport:
//     process.env.NODE_ENV !== "production"
//       ? {
//           target: "pino-pretty",
//           options: {
//             colorize: true,
//           },
//         }
//       : undefined,
// });

import pino from "pino";
import util from "util";

const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
});

// Helper function to process multiple arguments into a structured format
const formatArgs = (args: any[]) => {
  // If the first argument is an object, Pino treats it as metadata
  if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
    const [mergingObject, ...restStrings] = args;
    return [mergingObject, util.format(...restStrings)];
  }
  // Otherwise, format everything into a single message string
  return [util.format(...args)];
};

// Exported wrapper that acts like console.log but preserves Pino formatting
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
