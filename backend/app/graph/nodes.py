from app.services.llm import llm
from app.graph.state import ChatState

def chatbot_node(state : ChatState):
    response = llm.invoke(state["messages"])
    return{
        "messages" :[response]
    }