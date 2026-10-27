import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermissions } from '../auth/auth.decorators.js';
import { CurrentAuth } from '../auth/auth.decorators.js';
import type { AuthContext } from '../auth/auth.types.js';
import { AccountingService } from './accounting.service.js';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly accounting: AccountingService) {}

  @Get('chart-of-accounts')
  @RequirePermissions('Settings Accounting : View')
  async chartOfAccounts(@CurrentAuth() auth: AuthContext) {
    const organisationId = auth.user.organisation.id;
    return this.accounting.getChartOfAccounts(organisationId);
  }

  @Get('trial-balance')
  @RequirePermissions('Settings Accounting : View')
  async trialBalance(@CurrentAuth() auth: AuthContext, @Query('asOf') asOf?: string) {
    const organisationId = auth.user.organisation.id;
    return this.accounting.getTrialBalance(
      organisationId,
      asOf ?? new Date().toISOString().slice(0, 10),
    );
  }

  @Get('settings')
  @RequirePermissions('Settings Accounting : View')
  async settings(@CurrentAuth() auth: AuthContext) {
    return this.accounting.getSettings(auth.user.organisation.id);
  }

  /**
   * Delivery health for the outbox. Read-only and deliberately small: the
   * operator sees whether events are stuck, and which ones were buried, without
   * opening the database. A non-empty `dead` list is a P1.
   */
  @Get('outbox')
  @RequirePermissions('Settings Accounting : View')
  async outbox(@CurrentAuth() auth: AuthContext) {
    return this.accounting.getOutboxStatus(auth.user.organisation.id);
  }

  @Patch('settings')
  @RequirePermissions('Settings Accounting : Edit')
  async updateSettings(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.accounting.updateSettings(auth, body, requestContext(request));
  }

  @Get('periods')
  @RequirePermissions('Accounting Period : View')
  async periods(@CurrentAuth() auth: AuthContext) {
    const settings = await this.accounting.getSettings(auth.user.organisation.id);
    return settings.periods;
  }

  @Post('periods')
  @RequirePermissions('Accounting Period : Create')
  async createPeriod(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.accounting.createPeriod(auth, body, requestContext(request));
  }

  @Patch('periods/:id')
  @RequirePermissions('Accounting Period : Edit')
  async updatePeriod(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.accounting.updatePeriod(auth, id, body, requestContext(request));
  }

  @Put('posting-policies/:eventCode')
  @RequirePermissions('Settings Accounting : Edit')
  async updatePolicy(
    @CurrentAuth() auth: AuthContext,
    @Param('eventCode') eventCode: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.accounting.updatePolicy(auth, eventCode, body, requestContext(request));
  }

  @Get('entries')
  @RequirePermissions('Journal Entry : View')
  async entries(
    @CurrentAuth() auth: AuthContext,
    @Query('status') status?: string,
    @Query('eventCode') eventCode?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.accounting.listEntries(auth.user.organisation.id, {
      status,
      eventCode,
      from,
      to,
      q,
      limit: numberOr(limit, 25),
      offset: numberOr(offset, 0),
    });
  }

  @Get('entries/:id')
  @RequirePermissions('Journal Entry : View')
  async entry(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    return this.accounting.getEntry(auth.user.organisation.id, id);
  }

  @Post('entries')
  @RequirePermissions('Journal Entry : Create')
  async createEntry(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const post = body.post === true;
    return this.accounting.createEntry(auth, body, post, requestContext(request));
  }

  @Post('entries/:id/post')
  @RequirePermissions('Journal Entry : Edit')
  async postEntry(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Req() request: Request,
  ) {
    return this.accounting.postEntry(auth, id, requestContext(request));
  }

  @Post('entries/:id/reverse')
  @RequirePermissions('Journal Entry : Edit')
  async reverseEntry(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.accounting.reverseEntry(auth, id, body, requestContext(request));
  }

  @Get('ledger')
  @RequirePermissions('Journal Entry : View')
  async ledger(
    @CurrentAuth() auth: AuthContext,
    @Query('accountId') accountId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!accountId) {
      return { account: null, openingMinor: '0', closingMinor: '0', total: 0, rows: [] };
    }
    return this.accounting.getLedger(auth.user.organisation.id, {
      accountId,
      from,
      to,
      limit: numberOr(limit, 50),
      offset: numberOr(offset, 0),
    });
  }
}

function numberOr(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
}

function requestContext(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  };
}
