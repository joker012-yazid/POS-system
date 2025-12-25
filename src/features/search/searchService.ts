import { db } from '@/services/storage/db';
import type { Job, Customer, Device, Invoice, Quotation, Product } from '@/services/storage/types';

export interface SearchResult {
  type: 'job' | 'customer' | 'device' | 'invoice' | 'quotation' | 'product';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export const searchService = {
  async search(query: string, limit: number = 50): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search jobs by jobNo or notes
    const jobs = await db.jobs
      .filter(j => !j.deletedAt && (
        j.jobNo.toLowerCase().includes(q) ||
        j.notes?.toLowerCase().includes(q) ||
        j.problemDescription.toLowerCase().includes(q)
      ))
      .limit(limit)
      .toArray();

    for (const job of jobs) {
      results.push({
        type: 'job',
        id: job.id,
        title: job.jobNo,
        subtitle: job.problemDescription.substring(0, 50),
        url: `/jobs/${job.id}`,
      });
    }

    // Search customers by name, phone, or email
    const customers = await db.customers
      .filter(c => !c.deletedAt && (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email?.toLowerCase().includes(q)
      ))
      .limit(limit)
      .toArray();

    for (const customer of customers) {
      results.push({
        type: 'customer',
        id: customer.id,
        title: customer.name,
        subtitle: customer.phone,
        url: `/customers/${customer.id}`,
      });
    }

    // Search devices by brand, model, or serial
    const devices = await db.devices
      .filter(d => !d.deletedAt && (
        d.brand.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.serialNo?.toLowerCase().includes(q)
      ))
      .limit(limit)
      .toArray();

    for (const device of devices) {
      results.push({
        type: 'device',
        id: device.id,
        title: `${device.brand} ${device.model}`,
        subtitle: device.serialNo || device.deviceType,
        url: `/devices/${device.id}`,
      });
    }

    // Search invoices by invoiceNo
    const invoices = await db.invoices
      .filter(inv => !inv.deletedAt && inv.invoiceNo.toLowerCase().includes(q))
      .limit(limit)
      .toArray();

    for (const invoice of invoices) {
      results.push({
        type: 'invoice',
        id: invoice.id,
        title: invoice.invoiceNo,
        subtitle: `RM ${(invoice.grandTotalCents / 100).toFixed(2)} - ${invoice.status}`,
        url: `/invoices/${invoice.id}`,
      });
    }

    // Search quotations by quotationNo
    const quotations = await db.quotations
      .filter(qt => !qt.deletedAt && qt.quotationNo.toLowerCase().includes(q))
      .limit(limit)
      .toArray();

    for (const quotation of quotations) {
      results.push({
        type: 'quotation',
        id: quotation.id,
        title: quotation.quotationNo,
        subtitle: `RM ${(quotation.grandTotalCents / 100).toFixed(2)} - ${quotation.status}`,
        url: `/quotations/${quotation.id}`,
      });
    }

    // Search products by name or SKU
    const products = await db.products
      .filter(p => !p.deletedAt && (
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      ))
      .limit(limit)
      .toArray();

    for (const product of products) {
      results.push({
        type: 'product',
        id: product.id,
        title: product.name,
        subtitle: product.sku || `Stock: ${product.currentStock}`,
        url: `/products/${product.id}`,
      });
    }

    return results.slice(0, limit);
  },

  async searchJobs(query: string): Promise<Job[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    const q = query.toLowerCase().trim();
    return db.jobs
      .filter(j => !j.deletedAt && (
        j.jobNo.toLowerCase().includes(q) ||
        j.notes?.toLowerCase().includes(q) ||
        j.problemDescription.toLowerCase().includes(q)
      ))
      .limit(20)
      .toArray();
  },

  async findJobByNo(jobNo: string): Promise<Job | undefined> {
    return db.jobs
      .filter(j => !j.deletedAt && j.jobNo.toLowerCase() === jobNo.toLowerCase())
      .first();
  },
};
