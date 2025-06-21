# orchestrator/agent.py

import os
from langchain.agents import AgentExecutor
from langchain.agents.format_scratchpad.openai_tools import format_to_openai_tool_messages
from langchain.agents.output_parsers.openai_tools import OpenAIToolsAgentOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# --- FIX: Remove the import for ConversationBufferWindowMemory ---
# from langchain.memory import ConversationBufferWindowMemory

from .tools import ToolBox
from .memory import get_session_history

SYSTEM_PROMPT = """You are an expert resume-building assistant. Your goal is to help a user create or refine a resume for a specific job by intelligently using the tools at your disposal.

You have access to the user's request, the full job description, and the user's ID. You MUST use this information when deciding which tool to call.

**Your Primary Tools:**
- `create_and_score_full_resume`: Use this for the user's initial request to build a resume from scratch. It handles everything in one step.
- `get_improvement_suggestions`: Use this when the user asks for tips or advice on how to improve their resume.
- `score_resume_text`: Use this if the user provides a complete resume text and just wants to see the score.

**Your Process:**
1.  **Analyze the user's request and the provided context (job description).**
2.  **Initial Creation:** If the user wants a new resume, your **ONLY** action should be to call the `create_and_score_full_resume` tool. This tool requires no arguments.
3.  **Refinement/Feedback:** If the user asks for suggestions, analysis, or tips, use the appropriate tool.
4.  **Respond Clearly:** Always provide a clear, conversational response to the user summarizing what you did based on the tool's output.
"""

def create_agent_executor(toolbox: ToolBox, session_id: str) -> AgentExecutor:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key: raise ValueError("GEMINI_API_KEY environment variable is required")
    
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=gemini_api_key, temperature=0.0, convert_system_message_to_human=True)
    
    tools = [
        toolbox.create_and_score_full_resume_tool,
        toolbox.get_improvement_suggestions_tool,
        toolbox.score_resume_text_tool,
    ]
    
    llm_with_tools = llm.bind_tools(tools)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    
    # We get the history object here to pass its messages to the prompt.
    chat_history = get_session_history(session_id)
    
    agent = (
        {
            "input": lambda x: f"""
                Here is the user's request and all the necessary context to fulfill it.

                **User Request:**
                {x["input"]}

                **Full Job Description:**
                {x["job_description"]}
                
                **User ID:**
                {x["user_id"]}
            """,
            "agent_scratchpad": lambda x: format_to_openai_tool_messages(x["intermediate_steps"]),
            # The history is manually inserted into the prompt here.
            "chat_history": lambda x: chat_history.messages,
        }
        | prompt
        | llm_with_tools
        | OpenAIToolsAgentOutputParser()
    )
    
    # --- FIX: Remove the conflicting memory object ---
    # memory = ConversationBufferWindowMemory(
    #     chat_memory=chat_history, memory_key="chat_history", return_messages=True, k=10
    # )
    
    # --- FIX: The AgentExecutor is now created without the `memory` parameter ---
    return AgentExecutor(
        agent=agent, tools=tools, verbose=True,
        handle_parsing_errors=True, max_iterations=15
    )