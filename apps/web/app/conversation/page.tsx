import { ConversationAiAgent } from '../../components/modules/Conversation/ConversationAiAgent';

export default function ConversationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Conversation
          </h1>
          <p className="text-gray-600">
            Have a voice conversation with your AI assistant using ElevenLabs
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ConversationAiAgent />
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Start Conversation</h3>
              <p className="text-sm text-gray-600">
                Click the "Start Conversation" button to begin your voice interaction
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Speak Naturally</h3>
              <p className="text-sm text-gray-600">
                Speak clearly into your microphone and the AI will respond in real-time
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">End Session</h3>
              <p className="text-sm text-gray-600">
                Click "Stop Conversation" when you're done to end the session
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Features
          </h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-center">
              <span className="mr-2">🎤</span>
              Real-time voice conversation with AI
            </li>
            <li className="flex items-center">
              <span className="mr-2">🔒</span>
              Secure WebSocket connection with authentication
            </li>
            <li className="flex items-center">
              <span className="mr-2">📊</span>
              Session tracking and analytics
            </li>
            <li className="flex items-center">
              <span className="mr-2">🎯</span>
              Context-aware responses based on your data
            </li>
            <li className="flex items-center">
              <span className="mr-2">⚡</span>
              Low-latency communication
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 