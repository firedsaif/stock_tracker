'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ReceiptDialog } from '@/components/receipt-dialog'
import { Trash2, RefreshCw } from 'lucide-react'
import { deleteTransaction } from './actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export type Transaction = {
  id: string
  created_at: string
  type: 'ADD' | 'SELL'
  quantity: number
  notes: string | null
  sold_to: string | null
  contact: string | null
  unit_price: number | null
  total_price: number | null
  product_name: string | null
  product_unit: string | null
  products: {
    name: string
    unit: string
  } | null
}

export function TransactionsClient({ transactions, userRole }: { transactions: Transaction[], userRole: string | null }) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const router = useRouter()
  
  const canManage = userRole === 'SUPER_OWNER' || userRole === 'OWNER'

  const handleRowClick = (tx: Transaction) => {
    setSelectedTx(tx)
    setReceiptOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
        <Button onClick={() => router.refresh()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh History
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions (Click row for receipt)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-y">
                <tr>
                  <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Date</th>
                  <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Product</th>
                  <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Type</th>
                  <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Buyer</th>
                  <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Total (RS)</th>
                  <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Quantity</th>
                  {canManage && <th className="px-4 sm:px-6 py-3 text-right whitespace-nowrap">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {transactions?.map((tx) => (
                  <tr 
                    key={tx.id} 
                    className="bg-white border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(tx)}
                  >
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500">
                      {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {tx.products?.name || tx.product_name || 'Unknown Product'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {tx.type === 'ADD' ? (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          ADDED
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          SOLD
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-700 whitespace-nowrap">
                      {tx.sold_to || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-medium whitespace-nowrap">
                      {tx.total_price ? `RS ${tx.total_price}` : '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${tx.type === 'ADD' ? 'text-green-600' : 'text-blue-600'}`}>
                        {tx.type === 'ADD' ? '+' : '-'}{tx.quantity}
                      </span>
                      <span className="text-gray-500 ml-1 text-xs">{tx.products?.unit || tx.product_unit}</span>
                    </td>
                    {canManage && (
                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <form 
                            action={async (formData) => { await deleteTransaction(formData) }} 
                            onClick={(e) => e.stopPropagation()} 
                            onSubmit={(e) => { if(!confirm('Are you sure you want to completely remove this transaction log?')) e.preventDefault() }}
                          >
                            <input type="hidden" name="transaction_id" value={tx.id} />
                            <Button 
                              type="submit"
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <tr>
                    <td colSpan={canManage ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ReceiptDialog 
        transaction={selectedTx} 
        open={receiptOpen} 
        onOpenChange={setReceiptOpen} 
      />
    </div>
  )
}
