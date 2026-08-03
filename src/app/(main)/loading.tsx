import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 animate-pulse mt-4">
      {/* Page Title Skeleton */}
      <div className="h-8 bg-slate-200 rounded-md w-48 mb-8"></div>
      
      {/* Main Content Area Skeleton */}
      <Card className="border-slate-200">
        <CardHeader className="space-y-3 pb-6">
          <div className="h-6 bg-slate-200 rounded-md w-64"></div>
          <div className="h-4 bg-slate-100 rounded-md w-96"></div>
        </CardHeader>
        <CardContent>
          {/* Action Bar Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 bg-slate-100 rounded-md w-64"></div>
            <div className="h-10 bg-slate-100 rounded-md w-32"></div>
          </div>
          
          {/* Table/Grid Skeleton */}
          <div className="space-y-4">
            <div className="h-12 bg-slate-100 rounded-md w-full"></div>
            <div className="h-12 bg-slate-50 rounded-md w-full"></div>
            <div className="h-12 bg-slate-100 rounded-md w-full"></div>
            <div className="h-12 bg-slate-50 rounded-md w-full"></div>
            <div className="h-12 bg-slate-100 rounded-md w-full"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
