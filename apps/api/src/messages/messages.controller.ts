import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrentAuth, RequirePermissions } from '../auth/auth.decorators.js';
import type { AuthContext } from '../auth/auth.types.js';
import { MessagesService } from './messages.service.js';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('logs')
  @RequirePermissions('Message : View')
  logs(@CurrentAuth() auth: AuthContext) {
    return this.messages.listLogs(auth);
  }

  @Get('templates')
  @RequirePermissions('Message : View')
  templates(@CurrentAuth() auth: AuthContext) {
    return this.messages.listTemplates(auth);
  }

  @Post('templates')
  @RequirePermissions('Message : Create')
  createTemplate(@CurrentAuth() auth: AuthContext, @Body() body: Record<string, unknown>) {
    return this.messages.createTemplate(auth, body);
  }

  @Post('send')
  @RequirePermissions('Message : Create')
  send(@CurrentAuth() auth: AuthContext, @Body() body: Record<string, unknown>) {
    return this.messages.sendMessage(auth, body);
  }
}
