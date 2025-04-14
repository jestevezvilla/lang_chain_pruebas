import env from "./config.js";

import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
    MessagesAnnotation, StateGraph, START,
    END,
} from "@langchain/langgraph";

import { v4 as uuidv4 } from "uuid";

import { ChatOllama } from "@langchain/ollama";

const config = { configurable: { thread_id: uuidv4() } };

// Define the tools for the agent to use
const agentTools = [
    new TavilySearchResults({ maxResults: 3, apiKey: env.TAVILY_API_KEY })
];
const toolNode = new ToolNode(agentTools);

const agentModel = new ChatOllama({ model: "llama3.2", temperature: 0 }).bindTools(agentTools);


function shouldContinue({ messages }) {
    const lastMessage = messages[messages.length - 1];

    // If the LLM makes a tool call, then we route to the "tools" node
    if (lastMessage.tool_calls?.length) {
        return "tools";
    }
    // Otherwise, we stop (reply to the user) using the special "__end__" node
    return END;
}

async function callModel(state) {
    const response = await agentModel.invoke(state.messages);

    // We return a list, because this will get added to the existing list
    return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addEdge(START, "agent") // __start__ is a special name for the entrypoint
    .addNode("tools", toolNode)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue);

const app = workflow.compile();


// Now it's time to use!
const agentFinalState = await app.invoke(
    { messages: [new HumanMessage("what is the current weather in SF")] }, config
);


const agentNextState = await app.invoke(
    {
        messages: [
            new HumanMessage("what is the current weather in SF"),
            new HumanMessage("what about NY")]
    },
    config
);

console.log(
    agentNextState.messages[agentNextState.messages.length - 1].content,
);
