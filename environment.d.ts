declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SECRET: string;
      NODE_ENV: "development" | "production";
      PORT?: string;
      REDIS_PASSWORD: string;
      REDIS_PORT: string;
      REDIS_HOST: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
