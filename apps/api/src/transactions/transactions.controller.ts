import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';

import { CurrentAuth, RequirePermissions } from '../auth/auth.decorators.js';
import type { AuthContext } from '../auth/auth.types.js';
import { TransactionsService } from './transactions.service.js';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  @RequirePermissions('Transaction : View')
  list(
    @CurrentAuth() auth: AuthContext,
    @Query() query: Readonly<Record<string, unknown>>,
  ) {
    return this.transactions.listTransactions(auth, query);
  }

  @Get('till/sessions')
  @RequirePermissions('Transaction : View')
  listTillSessions(
    @CurrentAuth() auth: AuthContext,
    @Query() query: Readonly<Record<string, unknown>>,
  ) {
    return this.transactions.listTillSessions(auth, query);
  }

  @Get('till')
  @RequirePermissions('Transaction : View')
  getTill(@CurrentAuth() auth: AuthContext) {
    return this.transactions.getTill(auth);
  }

  @Post('till/open')
  @RequirePermissions('Transaction : Create')
  openTill(@CurrentAuth() auth: AuthContext, @Body() body: Record<string, unknown>) {
    return this.transactions.openTill(auth, body);
  }

  @Post('till/close')
  @RequirePermissions('Transaction : Create')
  closeTill(@CurrentAuth() auth: AuthContext, @Body() body: Record<string, unknown>) {
    return this.transactions.closeTill(auth, body);
  }

  @Get('requests')
  @RequirePermissions('Transaction : View')
  listRequests(
    @CurrentAuth() auth: AuthContext,
    @Query() query: Readonly<Record<string, unknown>>,
  ) {
    return this.transactions.listRequests(auth, query);
  }

  @Post('requests/:id/resubmit')
  @RequirePermissions('Transaction : Edit')
  resubmitRequest(@CurrentAuth() auth: AuthContext, @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string) {
    return this.transactions.resubmitTransaction(auth, id);
  }

  @Post(':id/resubmit')
  @RequirePermissions('Transaction : Edit')
  resubmit(@CurrentAuth() auth: AuthContext, @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string) {
    return this.transactions.resubmitTransaction(auth, id);
  }

  @Post()
  @RequirePermissions('Transaction : Create')
  create(@CurrentAuth() auth: AuthContext, @Body() body: Record<string, unknown>) {
    return this.transactions.createTransaction(auth, body);
  }

  @Get(':id')
  @RequirePermissions('Transaction : View')
  get(@CurrentAuth() auth: AuthContext, @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string) {
    return this.transactions.getTransaction(auth, id);
  }
}
