import { Controller, Get } from '@nestjs/common';
import { CurrentAuth, RequirePermissions } from '../auth/auth.decorators.js';
import type { AuthContext } from '../auth/auth.types.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @RequirePermissions('Client : View')
  async getDashboard(@CurrentAuth() auth: AuthContext) {
    return this.dashboard.getDashboard(auth);
  }
}