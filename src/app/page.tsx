import { Suspense } from 'react'
import { SimulatorClient } from './SimulatorClient'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-600 text-sm">Carregando...</div>
      </div>
    }>
      <SimulatorClient />
    </Suspense>
  )
}
