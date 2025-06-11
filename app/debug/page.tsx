import { DebugToken } from "@/components/debug-token"

export default function DebugPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Debug Token Issues</h1>
      <DebugToken />
    </div>
  )
}