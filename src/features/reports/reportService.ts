import { db } from '@/services/storage/db';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import type { Job, Invoice, Product, Receipt, Payment } from '@/services/storage/types';

export interface DashboardStats {
  jobsToday: number;
  jobsInProgress: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  lowStockProducts: number;
  totalSalesToday: number;
  totalSalesMonth: number;
}

export interface DailySummary {
  date: string;
  jobsCreated: number;
  jobsClosed: number;
  invoicesCreated: number;
  invoicesPaid: number;
  totalSales: number;
  paymentsReceived: number;
}

export interface MonthlySummary {
  month: string;
  totalJobs: number;
  totalInvoices: number;
  totalSales: number;
  totalPayments: number;
  averageJobValue: number;
}

export const reportService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    const todayEnd = endOfDay(now).getTime();
    const monthStart = startOfMonth(now).getTime();
    const monthEnd = endOfMonth(now).getTime();

    // Jobs today
    const jobsToday = await db.jobs
      .where('createdAt')
      .between(todayStart, todayEnd)
      .count();

    // Jobs in progress (not closed/ready)
    const jobsInProgress = await db.jobs
      .filter(j => !j.deletedAt && ['received', 'diagnose', 'quoted', 'in_progress'].includes(j.status))
      .count();

    // Unpaid invoices
    const unpaidInvoices = await db.invoices
      .filter(inv => !inv.deletedAt && ['unpaid', 'partially_paid'].includes(inv.status))
      .toArray();

    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.grandTotalCents - inv.paidAmountCents), 0);

    // Low stock products
    const lowStockProducts = await db.products
      .filter(p => !p.deletedAt && p.currentStock <= p.reorderLevel)
      .count();

    // Sales today (from paid invoices)
    const receiptsToday = await db.receipts
      .where('issuedAt')
      .between(todayStart, todayEnd)
      .toArray();
    const totalSalesToday = receiptsToday.reduce((sum, r) => sum + r.amountCents, 0);

    // Sales this month
    const receiptsMonth = await db.receipts
      .where('issuedAt')
      .between(monthStart, monthEnd)
      .toArray();
    const totalSalesMonth = receiptsMonth.reduce((sum, r) => sum + r.amountCents, 0);

    return {
      jobsToday,
      jobsInProgress,
      unpaidInvoices: unpaidInvoices.length,
      unpaidAmount,
      lowStockProducts,
      totalSalesToday,
      totalSalesMonth,
    };
  },

  async getDailySummaries(days: number = 7): Promise<DailySummary[]> {
    const summaries: DailySummary[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date).getTime();
      const dayEnd = endOfDay(date).getTime();

      const jobsCreated = await db.jobs
        .where('createdAt')
        .between(dayStart, dayEnd)
        .count();

      const jobsClosed = await db.jobs
        .filter(j => j.status === 'closed' && j.closedAt && j.closedAt >= dayStart && j.closedAt <= dayEnd)
        .count();

      const invoicesCreated = await db.invoices
        .where('createdAt')
        .between(dayStart, dayEnd)
        .count();

      const paidInvoices = await db.invoices
        .filter(inv => inv.status === 'paid' && inv.updatedAt >= dayStart && inv.updatedAt <= dayEnd)
        .count();

      const payments = await db.payments
        .where('paidAt')
        .between(dayStart, dayEnd)
        .toArray();
      const paymentsReceived = payments.reduce((sum, p) => sum + p.amountCents, 0);

      const receipts = await db.receipts
        .where('issuedAt')
        .between(dayStart, dayEnd)
        .toArray();
      const totalSales = receipts.reduce((sum, r) => sum + r.amountCents, 0);

      summaries.push({
        date: format(date, 'yyyy-MM-dd'),
        jobsCreated,
        jobsClosed,
        invoicesCreated,
        invoicesPaid: paidInvoices,
        totalSales,
        paymentsReceived,
      });
    }

    return summaries;
  },

  async getMonthlySummaries(months: number = 6): Promise<MonthlySummary[]> {
    const summaries: MonthlySummary[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = startOfMonth(date).getTime();
      const monthEnd = endOfMonth(date).getTime();

      const jobs = await db.jobs
        .where('createdAt')
        .between(monthStart, monthEnd)
        .toArray();

      const invoices = await db.invoices
        .where('createdAt')
        .between(monthStart, monthEnd)
        .toArray();

      const payments = await db.payments
        .where('paidAt')
        .between(monthStart, monthEnd)
        .toArray();
      const totalPayments = payments.reduce((sum, p) => sum + p.amountCents, 0);

      const receipts = await db.receipts
        .where('issuedAt')
        .between(monthStart, monthEnd)
        .toArray();
      const totalSales = receipts.reduce((sum, r) => sum + r.amountCents, 0);

      summaries.push({
        month: format(date, 'yyyy-MM'),
        totalJobs: jobs.length,
        totalInvoices: invoices.length,
        totalSales,
        totalPayments,
        averageJobValue: jobs.length > 0 ? Math.round(totalSales / jobs.length) : 0,
      });
    }

    return summaries;
  },

  async getRecentJobs(limit: number = 10): Promise<Job[]> {
    return db.jobs
      .orderBy('createdAt')
      .reverse()
      .filter(j => !j.deletedAt)
      .limit(limit)
      .toArray();
  },

  async getRecentInvoices(limit: number = 10): Promise<Invoice[]> {
    return db.invoices
      .orderBy('createdAt')
      .reverse()
      .filter(inv => !inv.deletedAt)
      .limit(limit)
      .toArray();
  },

  async getUnpaidInvoices(): Promise<Invoice[]> {
    return db.invoices
      .filter(inv => !inv.deletedAt && ['unpaid', 'partially_paid'].includes(inv.status))
      .toArray();
  },

  async getLowStockProducts(): Promise<Product[]> {
    return db.products
      .filter(p => !p.deletedAt && p.currentStock <= p.reorderLevel)
      .toArray();
  },
};
