'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { restoreTransaction, hardDeleteTransaction } from '@/app/(main)/transactions/actions'
import { Button } from '@/components/ui/button'

export type DeletedTransaction = {
  id: string
  created_at: string
  deleted_at: string
  type: 'ADD' | 'SELL'
  quantity: number
  notes: string | null
  sold_to: string | null
  contact: string | null
  unit_price: number | null
  total_price: number | null
  product_name: string | null
  product_unit: string | null
  user_email: string | null
  products: {
    name: string
    unit: string
  } | null
}

export function RecycleBinClient({ transactions, userRole }: { transactions: DeletedTransaction[], userRole: string | null }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const canManage = userRole === 'SUPER_OWNER' || userRole === 'OWNER'

  if (!canManage) {
    return <div>Unauthorized</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Recycle Bin</h1>
          <p className="text-slate-500 mt-1">
            Items here are soft-deleted. You can restore them or delete them permanently.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <CardTitle className="text-lg font-medium text-slate-700">Deleted Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date Deleted</th>
                  <th className="px-6 py-4 font-semibold">Item</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold text-right">Quantity</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <Trash2 className="mx-auto h-8 w-8 mb-3 text-slate-300" />
                      <p className="text-base font-medium text-slate-900">Recycle bin is empty</p>
                      <p className="mt-1">No deleted items found.</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {format(new Date(tx.deleted_at), 'dd MMM yyyy, HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {tx.products?.name || tx.product_name || 'Unknown Product'}
                        </div>
                        <div className="text-xs text-slate-500">ID: {tx.id.split('-')[0]}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          tx.type === 'ADD' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">
                        {tx.type === 'ADD' ? '+' : '-'}{tx.quantity} {tx.products?.unit || tx.product_unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <form action={async (formData) => {
                            setLoadingId(tx.id + '-restore')
                            await restoreTransaction(formData)
                            setLoadingId(null)
                          }}>
                            <input type="hidden" name="transaction_id" value={tx.id} />
                            <Button 
                              type="submit" 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              disabled={loadingId === tx.id + '-restore'}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          </form>

                          <form action={async (formData) => {
                            if (window.confirm('Are you sure you want to permanently delete this? This cannot be undone.')) {
                              setLoadingId(tx.id + '-delete')
                              await hardDeleteTransaction(formData)
                              setLoadingId(null)
                            }
                          }}>
                            <input type="hidden" name="transaction_id" value={tx.id} />
                            <Button 
                              type="submit" 
                              variant="destructive" 
                              size="sm" 
                              className="h-8"
                              disabled={loadingId === tx.id + '-delete'}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Delete Forever
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
