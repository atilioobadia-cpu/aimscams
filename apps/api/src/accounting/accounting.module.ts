import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AccountingController } from './accounting.controller.js';
import { AccountingDbService } from './accounting-db.service.js';
import { AccountingService } from './accounting.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AccountingController],
  providers: [AccountingDbService, AccountingService],
  exports: [AccountingDbService],
})
export class AccountingModule {}
