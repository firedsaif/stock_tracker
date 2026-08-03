'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { format } from 'date-fns'
import { Plus, Wallet, Receipt, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addExpense } from './actions'

export type Expense = {
  id: string
  amount: number
  reason: string
  user_email: string | null
  created_at: string
}

export function FinanceClient({ balance, expenses, userRole }: { balance: number, expenses: Expense[], userRole: string | null }) {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finance & Budget</h1>
          <p className="text-slate-500 mt-1">Manage your company balance and track miscellaneous expenses.</p>
        </div>
        <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Miscellaneous Expense</DialogTitle>
            </DialogHeader>
            <form action={async (formData) => {
              setLoading(true)
              await addExpense(formData)
              setLoading(false)
              setIsAddExpenseOpen(false)
            }} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (RS)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="e.g. 500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason / Description</Label>
                <Input id="reason" name="reason" required placeholder="e.g. Bought a broom" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Recording...' : 'Record Expense'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-indigo-100 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Company Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              RS {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-indigo-200 mt-2 text-sm">
              Updated automatically from sales, restocks, and expenses.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden mt-6">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Miscellaneous Expenses
          </CardTitle>
          <CardDescription>Records of manual expenses deducted from the balance.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Reason</th>
                  <th className="px-6 py-4 font-semibold">Recorded By</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount (RS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <TrendingDown className="mx-auto h-8 w-8 mb-3 text-slate-300" />
                      <p className="text-base font-medium text-slate-900">No expenses recorded yet.</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {format(new Date(expense.created_at), 'dd MMM yyyy, HH:mm')}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {expense.reason}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {expense.user_email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-red-600">
                        - {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
