import { Injectable } from '@nestjs/common';

import { trialBalance } from '@aimscams/ledger';
import { AccountingDbService } from './accounting-db.service.js';

@Injectable()
export class AccountingService {
  constructor(private readonly dbService: AccountingDbService) {}

  async getChartOfAccounts(organisationId: string) {
    const db = await this.dbService.getDb();
    try {
      const result = await db.query<{ id: string; code: string; name: string; type: string; normal_balance: string; is_postable: boolean; is_assumption: boolean }>(
        `select id, code, name, type, normal_balance, is_postable, is_assumption
         from gl_account where organisation_id = $1 order by code`,
        [organisationId],
      );
      return result.rows;
    } finally {
      await db.close();
    }
  }

  async getTrialBalance(organisationId: string, asOf: string) {
    const db = await this.dbService.getDb();
    try {
      return await trialBalance(db, organisationId, asOf);
    } finally {
      await db.close();
    }
  }
}
