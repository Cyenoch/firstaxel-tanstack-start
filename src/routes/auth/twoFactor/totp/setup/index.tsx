import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/twoFactor/totp/setup/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth/twoFactor/totp/setup/"!</div>
}
