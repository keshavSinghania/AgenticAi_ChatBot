from fastapi import APIRouter

from app.api.schemas.chat_schema import (
    ChatRequest,
    ChatMessage,
    ChatHistoryResponse
)

from app.services.chat_service import (
    chat,
    get_chat,
    delete_chat,
    get_thread_ids
)


router = APIRouter()

#end point to chat with some thread id 
@router.post("/chat")
def chat_endpoint(request: ChatRequest):

    response = chat(
        request.message,
        request.thread_id
    )

    return {
        "response": response
    }


# Get chat history using thread id
@router.get(
    "/chat/{thread_id}",
    response_model=ChatHistoryResponse
)
def get_chat_history_endpoint(thread_id: str):

    messages = get_chat(thread_id)

    return ChatHistoryResponse(
        thread_id=thread_id,
        messages=[
            ChatMessage(
                role="user" if message.type == "human" else "assistant",
                content=message.content
            )
            for message in messages
        ]
    )

#Get all the thread ids
@router.get("/thread_ids")
def get_thread_ids_endpoint():
    return get_thread_ids()

# Delete chat using thread id
@router.delete("/chat/{thread_id}")
def delete_chat_endpoint(thread_id: str):

    response = delete_chat(thread_id)

    return {
        "response": response
    }