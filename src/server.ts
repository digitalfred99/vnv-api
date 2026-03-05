import "reflect-metadata";
import { AppDataSource } from "@config/data-source";
import app from "./app";
import { logger } from "@utils/logger";

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    logger.info("✅ Database connected");

    app.listen(PORT, () => {
      logger.info(`🚀 VnV API running on port ${PORT}`);
      logger.info(`   ENV: ${process.env.NODE_ENV}`);
      logger.info(`   Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    logger.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

bootstrap();
