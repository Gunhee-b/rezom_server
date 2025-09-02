import { ValidationPipe } from "@nestjs/common";

export const GlobalValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: false, // Allow extra fields
  skipMissingProperties: true,  // Don't fail on missing optional fields
});
