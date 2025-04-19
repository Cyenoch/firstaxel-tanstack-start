import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/reset-password/twoFactor/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth/reset-password/twoFactor/"!</div>
}
