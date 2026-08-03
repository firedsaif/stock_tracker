'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addEmployee, removeEmployee } from './actions'

export type Employee = {
  id: string
  name: string
  cnic: string
  created_at: string
}

export function EmployeesClient({ employees, userRole }: { employees: Employee[], userRole: string | null }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employees</h1>
          <p className="text-slate-500 mt-1">Manage staff for attendance tracking (no login required).</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form action={async (formData) => {
              setLoading(true)
              const res = await addEmployee(formData)
              if (res.error) alert(res.error)
              setLoading(false)
              if (res.success) setIsAddOpen(false)
            }} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnic">CNIC / ID Number</Label>
                <Input id="cnic" name="cnic" required placeholder="12345-6789012-3" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Adding...' : 'Add Employee'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">CNIC</th>
                  <th className="px-6 py-4 font-semibold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                      <Users className="mx-auto h-8 w-8 mb-3 text-slate-300" />
                      <p className="text-base font-medium text-slate-900">No employees added yet.</p>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {emp.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {emp.cnic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <form action={async (formData) => {
                          if (window.confirm('Remove this employee? Their attendance history will also be deleted.')) {
                            setLoadingId(emp.id)
                            await removeEmployee(formData)
                            setLoadingId(null)
                          }
                        }}>
                          <input type="hidden" name="employee_id" value={emp.id} />
                          <button 
                            type="submit" 
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors disabled:opacity-50"
                            title="Remove Employee"
                            disabled={loadingId === emp.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
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
