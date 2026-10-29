import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AccountingModule } from './accounting/accounting.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { MessagesModule } from './messages/messages.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AccountingModule,
    SettingsModule,
    TransactionsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
