from langchain_core.messages import HumanMessage

from app.graph.workflow import chat_workflow, checkpointer

#function to chat using thread id
def chat(message: str, thread_id: str):

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    for token, metadata in chat_workflow.stream(
        {
            "messages": [HumanMessage(content=message)]
        },
        config=config,
        stream_mode="messages"
    ):
        if metadata["langgraph_node"] == "chatbot_node":
            if token.content:
                yield token.content


#function to get chat using thread id
def get_chat(thread_id: str):

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    state = chat_workflow.get_state(config)

    if not state.values:
        return []

    return state.values.get("messages", [])

#function to delete chat using thread id
def delete_chat(thread_id: str):

    chat_workflow.delete_thread(thread_id)

    return {
        "thread_id": thread_id,
        "deleted": True
    }

#fucntion to get all the exista thread id 
def get_thread_ids():
    thread_ids = set()

    for checkpoint_data in checkpointer.list(None):
        thread_ids.add(checkpoint_data.config["configurable"]["thread_id"])

    return list(thread_ids)    