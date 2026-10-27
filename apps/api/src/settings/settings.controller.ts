import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { CurrentAuth, RequirePermissions } from '../auth/auth.decorators.js';
import type { AuthContext } from '../auth/auth.types.js';
import { SettingsService } from './settings.service.js';

function requestContext(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  };
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('organisation')
  @RequirePermissions('Settings Organisation : View')
  async getOrganisation(@CurrentAuth() auth: AuthContext) {
    return this.settings.getOrganisation(auth);
  }

  @Patch('organisation')
  @RequirePermissions('Settings Organisation : Edit')
  async updateOrganisation(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateOrganisation(auth, body, requestContext(request));
  }

  @Get('organisation/logo')
  @RequirePermissions('Settings Organisation : View')
  async getLogo(@CurrentAuth() auth: AuthContext, @Res() response: Response) {
    const logo = await this.settings.getLogo(auth.user.organisation.id);
    response.setHeader('Content-Type', logo.mime);
    response.setHeader('Content-Length', String(logo.data.length));
    response.setHeader('Cache-Control', 'private, max-age=300');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.send(logo.data);
  }

  @Put('organisation/logo')
  @RequirePermissions('Settings Organisation : Edit')
  async uploadLogo(
    @CurrentAuth() auth: AuthContext,
    @Body() body: { dataUrl?: unknown },
    @Req() request: Request,
  ) {
    return this.settings.uploadLogo(auth, body, requestContext(request));
  }

  @Delete('organisation/logo')
  @RequirePermissions('Settings Organisation : Edit')
  async deleteLogo(@CurrentAuth() auth: AuthContext, @Req() request: Request) {
    return this.settings.deleteLogo(auth, requestContext(request));
  }

  @Get('branches')
  @RequirePermissions('Settings Branch : View')
  async listBranches(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.settings.listBranches(auth, { q, status });
  }

  @Get('branches/:id')
  @RequirePermissions('Settings Branch : View')
  async getBranch(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    return this.settings.getBranch(auth, id);
  }

  @Post('branches')
  @RequirePermissions('Settings Branch : Create')
  async createBranch(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createBranch(auth, body, requestContext(request));
  }

  @Patch('branches/:id')
  @RequirePermissions('Settings Branch : Edit')
  async updateBranch(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateBranch(auth, id, body, requestContext(request));
  }
}
