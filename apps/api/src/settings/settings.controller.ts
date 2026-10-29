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
import { ECONOMIC_SECTORS } from './loan-applications.logic.js';
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

  @Get('clients/next-reference')
  @RequirePermissions('Client : Create')
  async nextClientReference(@CurrentAuth() auth: AuthContext) {
    return this.settings.nextClientReference(auth);
  }

  @Get('system-logs')
  @RequirePermissions('System Log : View')
  async systemLogs(@CurrentAuth() auth: AuthContext, @Query() query: Record<string, unknown>) {
    return this.settings.listAuditEvents(auth, query);
  }

  @Get('imports')
  @RequirePermissions('Import : View')
  async listImports(@CurrentAuth() auth: AuthContext, @Query('kind') kind?: string) {
    return this.settings.listImportBatches(auth, kind ?? '');
  }

  @Post('imports')
  @RequirePermissions('Import : Create')
  async createImport(@CurrentAuth() auth: AuthContext, @Body() body: Record<string, unknown>) {
    return this.settings.createImportBatch(auth, body);
  }

  @Post('imports/:id/complete')
  @RequirePermissions('Import : Create')
  async completeImport(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settings.completeImportBatch(auth, id, body);
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

  @Get('clients')
  @RequirePermissions('Client : View')
  async listClients(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.settings.listClients(auth, { q, status, clientType: type });
  }

  @Post('clients')
  @RequirePermissions('Client : Create')
  async createClient(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createClient(auth, body, requestContext(request));
  }

  @Get('clients/:id')
  @RequirePermissions('Client : View')
  async getClient(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    return this.settings.getClient(auth, id);
  }

  @Patch('clients/:id')
  @RequirePermissions('Client : Edit')
  async updateClient(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateClient(auth, id, body, requestContext(request));
  }

  @Patch('savings-accounts/:id')
  @RequirePermissions('Savings Account : Edit')
  async updateSavingsAccount(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateSavingsAccount(auth, id, body, requestContext(request));
  }

  @Get('savings-accounts')
  @RequirePermissions('Savings Account : View')
  async listSavingsAccounts(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.settings.listSavingsAccounts(auth, { q, status });
  }

  @Post('savings-accounts')
  @RequirePermissions('Savings Account : Create')
  async createSavingsAccount(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createSavingsAccount(auth, body, requestContext(request));
  }

  @Get('loan-applications')
  @RequirePermissions('Loan Account : View')
  async listLoanApplications(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.settings.listLoanApplications(auth, { q, status });
  }

  @Post('loan-applications')
  @RequirePermissions('Loan Account : Create')
  async createLoanApplication(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createLoanApplication(auth, body, requestContext(request));
  }

  @Get('loan-applications/:id')
  @RequirePermissions('Loan Account : View')
  async getLoanApplication(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    return this.settings.getLoanApplication(auth, id);
  }

  @Patch('loan-applications/:id/status')
  @RequirePermissions('Loan Account : View')
  async updateLoanApplicationStatus(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settings.updateLoanApplicationStatus(auth, id, String(body?.status ?? ''));
  }
  @Patch('loan-applications/:id')
  @RequirePermissions('Loan Account : Edit')
  async updateLoanApplication(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateLoanApplication(auth, id, body, requestContext(request));
  }

  @RequirePermissions('Loan Account : View')
  async getLoanApplicationDocument(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Param('documentId', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) documentId: string,
    @Res() response: Response,
  ) {
    const document = await this.settings.getLoanApplicationDocument(auth, id, documentId);
    response.setHeader('Content-Type', document.contentType);
    response.setHeader('Content-Length', String(document.data.length));
    response.setHeader('Cache-Control', 'private, max-age=60');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(document.name)}"`,
    );
    response.send(document.data);
  }

  @Get('loan-officers')
  @RequirePermissions('Loan Account : View')
  async listLoanOfficers(@CurrentAuth() auth: AuthContext) {
    return this.settings.listLoanOfficers(auth);
  }

  @Get('loans')
  @RequirePermissions('Loan Account : View')
  async listLoans(@CurrentAuth() auth: AuthContext, @Query('q') q?: string, @Query('status') status?: string) {
    return this.settings.listLoans(auth, { q, status });
  }

  @Get('loans/:id')
  @RequirePermissions('Loan Account : View')
  async getLoan(@CurrentAuth() auth: AuthContext, @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string) {
    return this.settings.getLoan(auth, id);
  }
  @Get('economic-sectors')
  @RequirePermissions('Loan Account : View')
  listEconomicSectors() {
    return { items: ECONOMIC_SECTORS };
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

  @Get('products/loans')
  @RequirePermissions('Settings Product : View')
  async listLoanProducts(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.settings.listLoanProducts(auth, { q, status });
  }

  @Get('products/loans/:id')
  @RequirePermissions('Settings Product : View')
  async getLoanProduct(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    return this.settings.getLoanProduct(auth, id);
  }

  @Patch('products/loans/:id')
  @RequirePermissions('Settings Product : Edit')
  async updateLoanProduct(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateLoanProduct(auth, id, body, requestContext(request));
  }

  @Get('products/fee-penalties')
  @RequirePermissions('Settings Product : View')
  async listFeePenalties(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('kind') kind?: string,
  ) {
    return this.settings.listFeePenalties(auth, { q, status, kind });
  }

  @Post('products/fee-penalties')
  @RequirePermissions('Settings Product : Create')
  async createFeePenalty(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createFeePenalty(auth, body, requestContext(request));
  }

  @Patch('products/fee-penalties/:id')
  @RequirePermissions('Settings Product : Edit')
  async updateFeePenalty(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateFeePenalty(auth, id, body, requestContext(request));
  }

  @Get('products/provisioning-rules')
  @RequirePermissions('Settings Product : View')
  async listProvisioningRules(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.settings.listProvisioningRules(auth, { q, status });
  }

  @Post('products/provisioning-rules')
  @RequirePermissions('Settings Product : Create')
  async createProvisioningRule(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createProvisioningRule(auth, body, requestContext(request));
  }

  @Get('policies/credit-product/:id')
  @RequirePermissions('Settings Policy : View')
  async getCreditProductPolicy(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    return this.settings.getCreditProductPolicy(auth, id);
  }

  @Patch('policies/credit-product/:id')
  @RequirePermissions('Settings Policy : Edit')
  async updateCreditProductPolicy(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateCreditProductPolicy(auth, id, body, requestContext(request));
  }

  @Get('policies/credit-product')
  @RequirePermissions('Settings Policy : View')
  async listCreditProductPolicies(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.settings.listCreditProductPolicies(auth, { q, status });
  }

  @Post('policies/credit-product')
  @RequirePermissions('Settings Policy : Create')
  async createCreditProductPolicy(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createCreditProductPolicy(auth, body, requestContext(request));
  }

  @Get('policies/membership/:id')
  @RequirePermissions('Settings Policy : View')
  async getMembershipPolicy(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    return this.settings.getMembershipPolicy(auth, id);
  }

  @Patch('policies/membership/:id')
  @RequirePermissions('Settings Policy : Edit')
  async updateMembershipPolicy(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateMembershipPolicy(auth, id, body, requestContext(request));
  }

  @Get('policies/membership')
  @RequirePermissions('Settings Policy : View')
  async listMembershipPolicies(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.settings.listMembershipPolicies(auth, { q, status });
  }

  @Post('policies/membership')
  @RequirePermissions('Settings Policy : Create')
  async createMembershipPolicy(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createMembershipPolicy(auth, body, requestContext(request));
  }

  @Get('policies/holidays')
  @RequirePermissions('Settings Policy : View')
  async listHolidays(@CurrentAuth() auth: AuthContext) {
    return this.settings.listHolidays(auth);
  }

  @Post('policies/holidays')
  @RequirePermissions('Settings Policy : Create')
  async createHoliday(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createHoliday(auth, body, requestContext(request));
  }

  @Patch('products/interest-rates/:id')
  @RequirePermissions('Settings Product : Edit')
  async updateInterestRate(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateInterestRate(auth, id, body, requestContext(request));
  }

  @Patch('products/provisioning-rules/:id')
  @RequirePermissions('Settings Product : Edit')
  async updateProvisioningRule(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateProvisioningRule(auth, id, body, requestContext(request));
  }

  @Get('products/interest-rates')
  @RequirePermissions('Settings Product : View')
  async listInterestRates(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.settings.listInterestRates(auth, { q, status });
  }

  @Post('products/interest-rates')
  @RequirePermissions('Settings Product : Create')
  async createInterestRate(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createInterestRate(auth, body, requestContext(request));
  }

  @Get('products/savings')
  @RequirePermissions('Settings Product : View')
  async listSavingsProducts(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.settings.listSavingsProducts(auth, { q, status });
  }

  @Get('products/savings/:id')
  @RequirePermissions('Settings Product : View')
  async getSavingsProduct(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    return this.settings.getSavingsProduct(auth, id);
  }

  @Post('products/savings')
  @RequirePermissions('Settings Product : Create')
  async createSavingsProduct(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.createSavingsProduct(auth, body, requestContext(request));
  }

  @Patch('products/savings/:id')
  @RequirePermissions('Settings Product : Edit')
  async updateSavingsProduct(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.settings.updateSavingsProduct(auth, id, body, requestContext(request));
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
