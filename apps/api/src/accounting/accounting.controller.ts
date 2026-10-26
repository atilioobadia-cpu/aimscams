import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../auth/auth.decorators.js';
import { CurrentAuth } from '../auth/auth.decorators.js';
import type { AuthContext } from '../auth/auth.types.js';
import { AccountingService } from './accounting.service.js';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly accounting: AccountingService) {}

  @Get('chart-of-accounts')
  @RequirePermissions('Accounting : View')
  async chartOfAccounts(@CurrentAuth() auth: AuthContext) {
    const organisationId = auth.user.organisation.id;
    return this.accounting.getChartOfAccounts(organisationId);
  }

  @Get('trial-balance')
  @RequirePermissions('Accounting : View')
  async trialBalance(@CurrentAuth() auth: AuthContext, @Query('asOf') asOf?: string) {
    const organisationId = auth.user.organisation.id;
    return this.accounting.getTrialBalance(organisationId, asOf ?? new Date().toISOString().slice(0, 10));
  }
}
