import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service.js";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok" as const,
      service: "aimscams-api",
      version: process.env.npm_package_version ?? "0.0.1",
    };
  }
}
