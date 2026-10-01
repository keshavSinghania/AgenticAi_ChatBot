from pydantic import BaseModel

class ChatRequest(BaseModel):
    message : str
    thread_id : str

class ChatMessage(BaseModel):
    role : str
    content : str

class ChatHistoryResponse(BaseModel):
    thread_id : str
    messages : list[ChatMessage]    