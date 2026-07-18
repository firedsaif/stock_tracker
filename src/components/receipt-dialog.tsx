'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import type { Transaction } from '@/app/(main)/transactions/transactions-client'
import { Button } from './ui/button'

export function ReceiptDialog({ 
  transaction, 
  open, 
  onOpenChange 
}: { 
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  if (!transaction) return null

  const isSell = transaction.type === 'SELL'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl uppercase tracking-widest text-muted-foreground">
            {isSell ? 'Sales Receipt' : 'Restock Record'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mt-2 text-sm font-mono space-y-6">
          
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-4">
            <div>
              <p className="font-bold text-slate-800">JAAD INDUSTRY</p>
              <p className="text-slate-500">Inventory System</p>
            </div>
            <div className="text-right">
              <p className="text-slate-800">{format(new Date(transaction.created_at), 'dd MMM yyyy')}</p>
              <p className="text-slate-500">{format(new Date(transaction.created_at), 'HH:mm')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="text-slate-800 font-semibold text-right">{transaction.id.split('-')[0].toUpperCase()}</span>
            </div>
            {isSell && (
              <>
                <div className="grid grid-cols-2">
                  <span className="text-slate-500">Sold To:</span>
                  <span className="text-slate-800 font-semibold text-right">{transaction.sold_to || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-500">Contact:</span>
                  <span className="text-slate-800 font-semibold text-right">{transaction.contact || 'N/A'}</span>
                </div>
              </>
            )}
          </div>

          <table className="w-full">
            <thead className="border-y border-dashed border-slate-300 text-slate-500 text-xs">
              <tr>
                <th className="py-2 text-left font-normal">ITEM</th>
                <th className="py-2 text-right font-normal">QTY</th>
                {isSell && <th className="py-2 text-right font-normal">PRICE</th>}
                {isSell && <th className="py-2 text-right font-normal">AMOUNT</th>}
              </tr>
            </thead>
            <tbody className="text-slate-800">
              <tr>
                <td className="py-3 font-semibold">{transaction.products?.name || transaction.product_name || 'Unknown Product'}</td>
                <td className="py-3 text-right">{transaction.quantity} {transaction.products?.unit || transaction.product_unit}</td>
                {isSell && <td className="py-3 text-right">RS {transaction.unit_price}</td>}
                {isSell && <td className="py-3 text-right font-bold">RS {transaction.total_price}</td>}
              </tr>
            </tbody>
          </table>

          {isSell && (
            <div className="flex justify-between items-center border-t border-dashed border-slate-300 pt-4 text-base">
              <span className="font-bold text-slate-800">TOTAL</span>
              <span className="font-bold text-slate-800">RS {transaction.total_price}</span>
            </div>
          )}

          {transaction.notes && (
            <div className="mt-4 pt-4 border-t border-dashed border-slate-300">
              <span className="text-slate-500 text-xs uppercase block mb-1">Notes</span>
              <p className="text-slate-700">{transaction.notes}</p>
            </div>
          )}

          <div className="text-center text-slate-400 text-xs pt-4">
            Thank you for using JAAD INDUSTRY
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
