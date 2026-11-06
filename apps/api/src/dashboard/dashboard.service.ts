import { Injectable, Inject } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@aimscams/db';
import type { AuthContext } from '../auth/auth.types.js';
import { PRISMA } from '../prisma/prisma.module.js';

type DashboardKpi = {
  id: string;
  label: string;
  value: string;
  format: 'integer' | 'money' | 'percent' | 'text';
  accent: 'teal' | 'red' | 'yellow';
  icon: string;
  hint?: string;
};

@Injectable()
export class DashboardService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async getDashboard(auth: AuthContext) {
    const org = auth.user.organisation;
    const branch = auth.user.branch;

    const [clients, loans, savingsAccounts, transactions] = await Promise.all([
      this.prisma.client.findMany({ where: { organisationId: org.id }, select: { id: true, branchId: true } }),
      this.prisma.loan.findMany({ where: { organisationId: org.id }, select: { id: true, clientId: true, outstandingPrincipalMinor: true, daysPastDue: true, createdAt: true } }),
      this.prisma.savingsAccount.findMany({ where: { organisationId: org.id }, select: { balanceMinor: true } }),
      this.prisma.transaction.findMany({ where: { organisationId: org.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ]);

    const totalMembers = clients.length;
    const outstandingPrincipal = loans.reduce((sum, loan) => sum + (loan.outstandingPrincipalMinor ?? 0n), 0n);
    const arrearsLoans = loans.filter((loan) => (loan.daysPastDue ?? 0) > 0);
    const principalInArrears = arrearsLoans.reduce((sum, loan) => sum + (loan.outstandingPrincipalMinor ?? 0n), 0n);
    const clientsInArrears = new Set(arrearsLoans.map((loan) => loan.clientId).filter(Boolean)).size;

    const savingsTotal = savingsAccounts.reduce((sum, account) => sum + (account.balanceMinor ?? 0n), 0n);

    // Funds by month (last 6 months)
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - 5 + index, 1));
    const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const inByMonth = new Map(months.map((m) => [monthKey(m), 0n]));
    const outByMonth = new Map(months.map((m) => [monthKey(m), 0n]));
    for (const tx of transactions) {
      const key = monthKey(tx.createdAt);
      if (!inByMonth.has(key)) continue;
      if (tx.drCr === 'CR') inByMonth.set(key, inByMonth.get(key)! + tx.amountMinor);
      else outByMonth.set(key, outByMonth.get(key)! + tx.amountMinor);
    }
    const bars = months.flatMap((month) => {
      const key = monthKey(month);
      const period = month.toLocaleDateString('en-US', { month: 'short' });
      const inValue = inByMonth.get(key)!;
      const outValue = outByMonth.get(key)!;
      return [
        { id: `${period.toLowerCase()}-in`, series: 'funds-in', label: 'Funds In', period, value: inValue.toString(), tone: 'in' as const },
        { id: `${period.toLowerCase()}-out`, series: 'funds-out', label: 'Funds Out', period, value: outValue.toString(), tone: 'out' as const },
      ];
    });
    const fundsInTotal = [...inByMonth.values()].reduce((a, b) => a + b, 0n);
    const fundsOutTotal = [...outByMonth.values()].reduce((a, b) => a + b, 0n);
    const monthlyMax = Math.max(...months.map((m) => Number(inByMonth.get(monthKey(m))! + outByMonth.get(monthKey(m))!)), 1);
    const axisMax = Math.max(monthlyMax, 1);
    const axisStep = Math.max(Math.floor(axisMax / 5), 1);

    const unpostedTx = transactions.filter((tx) => tx.accountingStatus === 'PENDING' || tx.status === 'SUBMITTED').slice(0, 10);
    const oldest = unpostedTx.length > 0 ? unpostedTx[unpostedTx.length - 1].createdAt : null;
    const oldestAge = oldest ? `${Math.max(1, Math.floor((Date.now() - oldest.getTime()) / 86400000))} days` : '0 days';

    const cashTotal = 0n;
    const sharesTotal = 0n;
    const portfolioTotal = outstandingPrincipal + savingsTotal + sharesTotal + cashTotal;

    return {
      asOf: now.toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dar_es_Salaam' }) + ' EAT',
      institution: {
        name: org.name,
        code: org.code,
        dialect: org.dialect,
        registrationNo: org.registrationNo ?? null,
        logoUrl: org.logoUrl ?? null,
      },
      branch: {
        name: branch?.name ?? 'All branches',
        code: branch?.code ?? '',
        status: 'Open' as const,
      },
      user: {
        name: auth.user.fullName,
        initials: auth.user.fullName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
        role: auth.user.roles[0]?.name ?? 'User',
        email: auth.user.email,
        phone: auth.user.phone ?? null,
      },
      unposted: {
        count: unpostedTx.length,
        oldestAge,
        items: unpostedTx.map((tx) => ({
          reference: tx.transactionNo,
          kind: tx.type,
          amount: tx.amountMinor.toString(),
          age: `${Math.max(1, Math.floor((Date.now() - tx.createdAt.getTime()) / 86400000))} days`,
        })),
      },
      kpis: [
        { id: 'total-members', label: 'Total Members', value: String(totalMembers), format: 'integer', accent: 'teal', icon: 'members' },
        { id: 'outstanding-principal', label: 'Outstanding Loan Principal', value: outstandingPrincipal.toString(), format: 'money', accent: 'red', icon: 'principal' },
        { id: 'principal-in-arrears', label: 'Principal in Arrears', value: principalInArrears.toString(), format: 'money', accent: 'yellow', icon: 'arrears-principal' },
        { id: 'clients-in-arrears', label: 'Clients in Arrears', value: String(clientsInArrears), format: 'integer', accent: 'red', icon: 'arrears-clients' },
      ],
      funds: {
        title: 'FundsInVsFundsOut',
        period: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        axis: { min: '0', max: String(axisMax), step: String(axisStep) },
        series: [
          { id: 'funds-in', label: 'Funds In', value: fundsInTotal.toString(), tone: 'in' },
          { id: 'funds-out', label: 'Funds Out', value: fundsOutTotal.toString(), tone: 'out' },
        ],
        bars,
      },
      portfolio: {
        title: 'Portfolio composition',
        total: portfolioTotal.toString(),
        segments: [
          { id: 'loans', label: 'Loan principal', value: outstandingPrincipal.toString(), tone: 'teal' },
          { id: 'savings', label: 'Savings', value: savingsTotal.toString(), tone: 'tenant' },
          { id: 'shares', label: 'Shares', value: sharesTotal.toString(), tone: 'logo' },
          { id: 'cash', label: 'Cash & bank', value: cashTotal.toString(), tone: 'yellow' },
        ],
      },
    };
  }
}
