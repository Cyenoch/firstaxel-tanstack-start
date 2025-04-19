import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/twoFactor/security-key/register/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth/twoFactor/security-key/register/"!</div>
}
