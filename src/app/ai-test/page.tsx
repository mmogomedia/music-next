import AIChat from '@/components/ai/AIChat';

export default function AITestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Assistant Test</h1>
        <p className="text-gray-600">
          Test the AI chat functionality for the Flemoji platform
        </p>
      </div>
      
      <AIChat />
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Example Questions to Try:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• "What genres are popular in South African music?"</li>
          <li>• "How can I discover new Amapiano artists?"</li>
          <li>• "Tell me about the playlist system on Flemoji"</li>
          <li>• "What's the difference between Afrobeat and Amapiano?"</li>
          <li>• "How do artists upload their music to the platform?"</li>
        </ul>
      </div>
    </div>
  );
}

