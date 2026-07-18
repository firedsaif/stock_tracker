import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">JAAD INDUSTRY</CardTitle>
          <CardDescription className="text-center">
            Login to manage your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            {message && (
              <div className="text-sm text-red-500 font-medium text-center">
                {message}
              </div>
            )}
            <div className="flex flex-col space-y-2 mt-4">
              <Button formAction={login} type="submit" className="w-full">
                Log In
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-500">
          Only authorized personnel can log in. Contact the administrator for an account.
        </CardFooter>
      </Card>
    </div>
  )
}
