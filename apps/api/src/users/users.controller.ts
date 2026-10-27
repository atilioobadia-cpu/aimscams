import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermissions } from '../auth/auth.decorators.js';
import type { AuthContext } from '../auth/auth.types.js';
import { CurrentAuth } from '../auth/auth.decorators.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('Settings User : View')
  async list(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.users.listUsers(auth, { q, status, role, branchId });
  }

  @Get('roles')
  @RequirePermissions('Settings Role : View')
  async roles(@CurrentAuth() auth: AuthContext) {
    return this.users.listRoles(auth);
  }

  @Get('branches')
  @RequirePermissions('Settings Branch : View')
  async branches(@CurrentAuth() auth: AuthContext) {
    return this.users.listBranches(auth);
  }

  @Get(':id')
  @RequirePermissions('Settings User : View')
  async get(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    return this.users.getUser(auth, id);
  }

  @Post()
  @RequirePermissions('Settings User : Create')
  async create(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.users.createUser(auth, body, requestContext(request));
  }

  @Patch(':id')
  @RequirePermissions('Settings User : Edit')
  async update(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.users.updateUser(auth, id, body, requestContext(request));
  }

  @Post(':id/unlock')
  @RequirePermissions('Settings User : Edit')
  async unlock(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Req() request: Request,
  ) {
    return this.users.unlockUser(auth, id, requestContext(request));
  }

  @Patch('roles/:id')
  @RequirePermissions('Settings Role : Edit')
  async updateRole(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.users.updateRole(auth, id, body, requestContext(request));
  }
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

