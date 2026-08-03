'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Calendar as CalendarIcon, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markAttendance } from './actions'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type User = {
  id: string
  email?: string
}

export type AttendanceRecord = {
  id: string
  user_id: string
  user_email: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LEAVE'
}

export function AttendanceClient({ 
  users, 
  attendanceRecords, 
  currentDate 
}: { 
  users: User[], 
  attendanceRecords: AttendanceRecord[],
  currentDate: string
}) {
  const router = useRouter()
  const [date, setDate] = useState(currentDate)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setDate(newDate)
    router.push(`/attendance?date=${newDate}`)
  }

  const getRecordForUser = (userId: string) => {
    return attendanceRecords.find((record) => record.user_id === userId)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Attendance</h1>
          <p className="text-slate-500 mt-1">Mark daily attendance for all employees.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md p-2 shadow-sm">
          <CalendarIcon className="h-5 w-5 text-slate-500" />
          <Input 
            type="date" 
            value={date} 
            onChange={handleDateChange} 
            className="border-0 focus-visible:ring-0 p-0 h-auto"
          />
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <CardTitle className="text-lg font-medium text-slate-700">Employees</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Employee Email</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const record = getRecordForUser(user.id)
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {record ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            record.status === 'ABSENT' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {record.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            UNMARKED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <form action={async (formData) => {
                            setLoadingId(user.id + '-PRESENT')
                            await markAttendance(formData)
                            setLoadingId(null)
                          }}>
                            <input type="hidden" name="user_id" value={user.id} />
                            <input type="hidden" name="user_email" value={user.email || ''} />
                            <input type="hidden" name="status" value="PRESENT" />
                            <input type="hidden" name="date" value={date} />
                            <Button 
                              type="submit" 
                              variant={record?.status === 'PRESENT' ? 'default' : 'outline'}
                              size="sm" 
                              className={`h-8 ${record?.status === 'PRESENT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}
                              disabled={loadingId !== null}
                            >
                              <Check className="h-4 w-4 mr-1" /> Present
                            </Button>
                          </form>

                          <form action={async (formData) => {
                            setLoadingId(user.id + '-ABSENT')
                            await markAttendance(formData)
                            setLoadingId(null)
                          }}>
                            <input type="hidden" name="user_id" value={user.id} />
                            <input type="hidden" name="user_email" value={user.email || ''} />
                            <input type="hidden" name="status" value="ABSENT" />
                            <input type="hidden" name="date" value={date} />
                            <Button 
                              type="submit" 
                              variant={record?.status === 'ABSENT' ? 'destructive' : 'outline'}
                              size="sm" 
                              className={`h-8 ${record?.status === 'ABSENT' ? '' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                              disabled={loadingId !== null}
                            >
                              <X className="h-4 w-4 mr-1" /> Absent
                            </Button>
                          </form>

                          <form action={async (formData) => {
                            setLoadingId(user.id + '-LEAVE')
                            await markAttendance(formData)
                            setLoadingId(null)
                          }}>
                            <input type="hidden" name="user_id" value={user.id} />
                            <input type="hidden" name="user_email" value={user.email || ''} />
                            <input type="hidden" name="status" value="LEAVE" />
                            <input type="hidden" name="date" value={date} />
                            <Button 
                              type="submit" 
                              variant={record?.status === 'LEAVE' ? 'default' : 'outline'}
                              size="sm" 
                              className={`h-8 ${record?.status === 'LEAVE' ? 'bg-yellow-600 hover:bg-yellow-700' : 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'}`}
                              disabled={loadingId !== null}
                            >
                              <UserMinus className="h-4 w-4 mr-1" /> Leave
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
