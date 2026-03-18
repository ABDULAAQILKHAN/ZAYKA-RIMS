"use client"

import { useAppSelector } from "@/store/hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const authState = useAppSelector((state) => state.auth)
  
  const testApiCall = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      console.log('Base URL:', baseUrl)
      
      const response = await fetch(`${baseUrl}special-offers?active=true`, {
        headers: {
          'Authorization': authState.token ? `Bearer ${authState.token}` : '',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.text()
      console.log('Response data:', data)
      
      try {
        const jsonData = JSON.parse(data)
        console.log('Parsed JSON:', jsonData)
      } catch (e) {
        console.log('Not valid JSON')
      }
    } catch (error) {
      console.error('API Test Error:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>API Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Environment Variables:</h3>
            <p>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Auth State:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(authState, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold">Store State:</h3>
            <p>Token available: {authState.token ? 'Yes' : 'No'}</p>
            <p>Token length: {authState.token?.length || 0}</p>
          </div>
          
          <Button onClick={testApiCall}>Test API Call (Check Console)</Button>
        </CardContent>
      </Card>
    </div>
  )
}
