import winston from "winston";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === "production" 
      ? combine(timestamp(), json()) 
      : combine(
          timestamp({ format: () => dayjs().format("DD-MMM-YYYY HH:mm:ss") }),
          colorize(),
          consoleFormat
        ),
  }),
];


//fixing for serverless environments
if (process.env.NODE_ENV !== "production") {
  const logDir = path.join(process.cwd(), "logs");
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), 
    json()
  ),
  transports: transports, 
});

export default logger;