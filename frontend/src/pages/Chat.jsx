import { Menu, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import api from "../api/axios"

function Chat() {
  const [isSideBarOpen, setIsSideBarOpen] = useState(true)
  const [currentChatHistory, setCurrentChatHistory] = useState([])
  const [currentChatThreadId, setCurrentChatThreadId] = useState("")
  const [allThreadIds, setAllThreadIds] = useState([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const messagesEndRef = useRef(null)

  // Scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    })
  }

  // Generate a new thread ID
  const generateThreadId = () => {
    return crypto.randomUUID()
  }

  // Get chat history using thread ID
  const getChat = async (thread_id) => {
    try {
      const response = await api.get(`/chat/${thread_id}`)

      setCurrentChatHistory(
        response.data.messages.map((message) => ({
          id: crypto.randomUUID(),
          role: message.role,
          content: message.content
        }))
      )

      setCurrentChatThreadId(thread_id)

    } catch (error) {
      console.log("Error loading chat:", error)
    }
  }

  // Get all thread IDs
  const getThreadIds = async () => {
    try {
      const response = await api.get("/thread_ids")

      setAllThreadIds(response.data)
    } catch (error) {
      console.log("Error loading thread IDs:", error)
    }
  }

  // Start a new chat
  const handleNewChat = () => {
    const newThreadId = generateThreadId()

    setCurrentChatThreadId(newThreadId)
    setCurrentChatHistory([])
    setCurrentMessage("")

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSideBarOpen(false)
    }
  }

  // Send message
  
const sendChat = async () => {
    const message = currentMessage.trim();

    if (!message || isGenerating) return;

    if (!currentChatThreadId) {
        console.log("No thread ID found");
        return;
    }

    const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message
    };

    const aiMessageId = crypto.randomUUID();
    const isNewChat = currentChatHistory.length === 0;

    try {
        setIsGenerating(true);
        setCurrentMessage("");

        // Add the user's message immediately
        setCurrentChatHistory((prev) => [
            ...prev,
            userMessage
        ]);

        // Create an empty assistant message
        setCurrentChatHistory((prev) => [
            ...prev,
            {
                id: aiMessageId,
                role: "assistant",
                content: ""
            }
        ]);

        // Send request to FastAPI
        const response = await fetch("http://localhost:8000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                thread_id: currentChatThreadId
            })
        });

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        if (!response.body) {
            throw new Error("Streaming response body is unavailable");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Read the response chunk by chunk
        while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, {
                stream: true
            });

            // Append each chunk to the same assistant message
            if (chunk) {
                setCurrentChatHistory((prev) =>
                    prev.map((msg) =>
                        msg.id === aiMessageId
                            ? {
                                ...msg,
                                content: msg.content + chunk
                            }
                            : msg
                    )
                );
            }
        }

        // Flush any remaining decoded text
        const remaining = decoder.decode();

        if (remaining) {
            setCurrentChatHistory((prev) =>
                prev.map((msg) =>
                    msg.id === aiMessageId
                        ? {
                            ...msg,
                            content: msg.content + remaining
                        }
                        : msg
                )
            );
        }

        // Add the new conversation to the sidebar
        if (isNewChat) {
            setAllThreadIds((prev) => [
                currentChatThreadId,
                ...prev.filter(
                    (id) => id !== currentChatThreadId
                )
            ]);
        }

    } catch (error) {
        console.error("Error streaming response:", error);

        // Show an error only if no response text was received
        setCurrentChatHistory((prev) =>
            prev.map((msg) =>
                msg.id === aiMessageId && !msg.content
                    ? {
                        ...msg,
                        content: "Something went wrong. Please try again."
                    }
                    : msg
            )
        );

    } finally {
        setIsGenerating(false);
    }
};


  // Handle Enter / Shift + Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendChat()
    }
  }

  // Load thread IDs when component mounts
  useEffect(() => {
    getThreadIds()
    handleNewChat()
  }, [])

  // Automatically scroll whenever chat history changes
  useEffect(() => {
    scrollToBottom()
  }, [currentChatHistory])

  return (
    <div className="h-screen bg-[#09090b] text-white flex overflow-hidden">

      {/* Mobile Overlay */}
      {isSideBarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsSideBarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static
          top-0 left-0 z-50
          h-screen
          ${isSideBarOpen ? "w-72" : "w-0"}
          shrink-0
          bg-[#0d0d10]
          border-r border-zinc-800
          flex flex-col
          overflow-hidden
          transition-all duration-300
        `}
      >

        {/* Logo */}
        <div className="h-16 px-4 md:px-5 flex items-center justify-between border-b border-zinc-800 shrink-0">

          <h1 className="text-xl font-bold whitespace-nowrap">
            Chat Bot<span className="text-zinc-500">.AI</span>
          </h1>

          <button
            onClick={() => setIsSideBarOpen(false)}
            className="p-2 rounded-lg hover:bg-zinc-800 transition shrink-0"
          >
            <X size={20} />
          </button>

        </div>

        {/* New Chat */}
        <div className="p-4 shrink-0">

          <button
            onClick={handleNewChat}
            disabled={isGenerating}
            className="
              w-full
              bg-white
              text-black
              rounded-xl
              py-3
              font-medium
              hover:bg-zinc-200
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            + New Chat
          </button>

        </div>

        {/* Recent Chats */}
        <div className="px-3 flex-1 overflow-y-auto">

          <p className="text-xs text-zinc-500 font-medium px-2 mb-3 uppercase tracking-wider">
            Recent
          </p>

          <div className="space-y-1">

            {allThreadIds.length === 0 ? (

              <p className="text-xs text-zinc-600 px-2 py-3">
                No conversations yet
              </p>

            ) : (

              allThreadIds.map((thread_id) => (

                <button
                  key={thread_id}
                  onClick={() => {
                    if (isGenerating) return

                    getChat(thread_id)

                    if (window.innerWidth < 768) {
                      setIsSideBarOpen(false)
                    }
                  }}
                  className={`
                    w-full
                    text-left
                    px-3
                    py-3
                    rounded-lg
                    transition
                    ${
                      currentChatThreadId === thread_id
                        ? "bg-zinc-800"
                        : "hover:bg-zinc-800/70"
                    }
                  `}
                >

                  <p className="text-sm truncate text-zinc-200">
                    Chat {thread_id.slice(0, 8)}
                  </p>

                </button>

              ))

            )}

          </div>

        </div>

        {/* Profile */}
        <div className="p-4 border-t border-zinc-800 shrink-0">

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-semibold shrink-0">
              K
            </div>

            <div className="min-w-0">

              <p className="text-sm font-medium truncate">
                Keshav Singhania
              </p>

              <p className="text-xs text-zinc-500 truncate">
                AI Developer
              </p>

            </div>

          </div>

        </div>

      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 shrink-0">

          <div className="flex items-center gap-3 min-w-0">

            {/* Open Sidebar */}
            {!isSideBarOpen && (
              <button
                onClick={() => setIsSideBarOpen(true)}
                className="p-2 rounded-lg hover:bg-zinc-800 transition shrink-0"
              >
                <Menu size={21} />
              </button>
            )}

            <div className="min-w-0">

              <h2 className="font-semibold truncate">
                CHAT BOT
              </h2>

              <p className="text-xs text-zinc-500 truncate">
                chat with any model
              </p>

            </div>

          </div>

          <button className="text-zinc-400 hover:text-white transition text-xl shrink-0 ml-3">
            ⋯
          </button>

        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">

          <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6">

            {currentChatHistory.length === 0 ? (

              /* Empty Chat */
              <div className="min-h-[60vh] flex items-center justify-center">

                <div className="text-center">

                  <div className="w-12 h-12 mx-auto mb-5 rounded-2xl bg-white text-black flex items-center justify-center font-bold">
                    AI
                  </div>

                  <h2 className="text-2xl font-semibold text-zinc-100">
                    Start New Conversation
                  </h2>

                  <p className="text-sm text-zinc-500 mt-2">
                    Ask anything and start chatting.
                  </p>

                </div>

              </div>

            ) : (

              /* Current Chat History */
              currentChatHistory.map((message) => (

                message.role === "user" ? (

                  /* User Message */
                  <div
                    key={message.id}
                    className="flex justify-end"
                  >

                    <div className="max-w-[85%] md:max-w-[70%] bg-zinc-800 rounded-2xl rounded-br-md px-4 py-3 shadow-sm">

                      <p className="text-sm leading-6 text-zinc-100 whitespace-pre-wrap break-words">
                        {message.content}
                      </p>

                    </div>

                  </div>

                ) : (

                  /* AI Message */
                  <div
                    key={message.id}
                    className="flex gap-3 md:gap-4 items-start"
                  >

                    {/* AI Avatar */}
                    <div className="w-8 h-8 shrink-0 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shadow-sm">
                      AI
                    </div>

                    {/* AI Content */}
                    <div className="max-w-[90%] md:max-w-[80%] pt-1">

                      <p className="text-sm leading-7 text-zinc-200 whitespace-pre-wrap break-words">
                        {message.content}
                      </p>

                    </div>

                  </div>

                )

              ))

            )}

            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />

          </div>

        </div>

        {/* Input */}
        <div className="p-3 md:p-4 shrink-0">

          <div className="max-w-3xl mx-auto">

            <div className="border border-zinc-700 bg-[#111114] rounded-2xl flex items-end p-2 focus-within:border-zinc-500 transition">

              <textarea
                placeholder={
                  isGenerating
                    ? "AI is thinking..."
                    : "Ask me anything..."
                }
                value={currentMessage}
                disabled={isGenerating}
                onChange={(e) => {
                  setCurrentMessage(e.target.value)
                }}
                onKeyDown={handleKeyDown}
                rows="1"
                className="
                  flex-1
                  min-w-0
                  resize-none
                  bg-transparent
                  outline-none
                  px-2
                  md:px-3
                  py-3
                  text-sm
                  placeholder:text-zinc-600
                  disabled:opacity-50
                "
              />

              <button
                disabled={
                  isGenerating ||
                  currentMessage.trim() === ""
                }
                onClick={sendChat}
                className="
                  w-10
                  h-10
                  shrink-0
                  rounded-xl
                  bg-white
                  text-black
                  flex
                  items-center
                  justify-center
                  hover:bg-zinc-200
                  transition
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                "
              >

                {isGenerating ? (
                  <span className="text-xs font-semibold">
                    ...
                  </span>
                ) : (
                  <span className="text-lg">
                    ↑
                  </span>
                )}

              </button>

            </div>

            <p className="text-center text-[10px] md:text-xs text-zinc-600 mt-3 px-2">
              Keshav.AI can make mistakes. Verify important information.
            </p>

          </div>

        </div>

      </main>

    </div>
  )
}

export default Chat