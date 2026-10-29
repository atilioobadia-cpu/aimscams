import { Controller, Get, Query } from '@nestjs/common';

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

  @Get('requests')
  @RequirePermissions('Transaction : View')
  listRequests(
    @CurrentAuth() auth: AuthContext,
    @Query() query: Readonly<Record<string, unknown>>,
  ) {
    return this.transactions.listRequests(auth, query);
  }
}
