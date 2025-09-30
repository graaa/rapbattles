import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-red-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            RapBattle Voter
          </h1>
          <p className="text-gray-600 mb-8">
            Live voting system for rap battles
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/admin"
            className="block w-full bg-gray-800 text-white text-center py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Admin Panel
          </Link>
          
          <div className="text-center text-sm text-gray-500">
            <p>Scan a QR code to vote in a battle</p>
          </div>
        </div>
      </div>
    </div>
  )
}
