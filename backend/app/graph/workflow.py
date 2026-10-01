import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import StateGraph , START , END
from langgraph.checkpoint.memory import InMemorySaver

from app.graph.state import ChatState
from app.graph.nodes import chatbot_node

builder = StateGraph(ChatState)

builder.add_node("chatbot_node", chatbot_node)

builder.add_edge(START, "chatbot_node")
builder.add_edge("chatbot_node", END)

connection = sqlite3.connect(
    "app/conversation/chatbot.db",
    check_same_thread=False
)
checkpointer = SqliteSaver(connection)

chat_workflow = builder.compile(
    checkpointer=checkpointer
)