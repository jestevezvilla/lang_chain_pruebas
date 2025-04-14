import env from "./config.js";

import { ChatMistralAI } from "@langchain/mistralai";
import { ChatOllama } from "@langchain/ollama";



import {
    START,
    END,
    StateGraph,
    MemorySaver,
    Annotation,
    MessagesAnnotation,
} from "@langchain/langgraph";

import { ChatPromptTemplate } from "@langchain/core/prompts";

import {
    trimMessages,
} from "@langchain/core/messages";


const trimmer = trimMessages({
    maxTokens: 10,
    strategy: "last",
    tokenCounter: (msgs) => msgs.length,
    includeSystem: true,
    allowPartial: false,
    startOn: "human",
});

const StateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    language: Annotation,

});

const promptTemplate = ChatPromptTemplate.fromMessages([
    [
        "system",
        "Te llamas Alfonso y hablas en {language} pero usando palabras excesivamente cultas",
    ],
    ["placeholder", "{messages}"],
]);

import { v4 as uuidv4 } from "uuid";

const config = { configurable: { thread_id: '21' + uuidv4() } };

const model = new ChatOllama({
    model: "llama3.2"
});

// Define the function that calls the model
const callModel = async (state) => {
    const trimmedMessage = await trimmer.invoke(state.messages);

    const prompt = await promptTemplate.invoke({
        messages: trimmedMessage,
        language: state.language
    });
    const response = await model.invoke(prompt);
    return { messages: [response] };
};

// Define a new graph
const workflow = new StateGraph(StateAnnotation)
    // Define the node and edge
    .addNode("model", callModel)
    .addEdge(START, "model")
    .addEdge("model", END);

// Add memory
const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });

const input = [
    {
        role: "user",
        content: "Hola me llamo Alberto",
    },
];
const output = await app.invoke({ messages: input, language: "español" }, config);
// The output contains all messages in the state.
// This will log the last message in the conversation.
console.log(output.messages[output.messages.length - 1]);

const input2 = [
    {
        role: "user",
        content: "Cómo me llamo?",
    },
];
const output2 = await app.invoke({ messages: input2, language: "español" }, config);
console.log(output2.messages[output2.messages.length - 1]);

const input3 = [
    {
        role: "user",
        content: "Cómo te llamas?",
    },
];
const output3 = await app.invoke({ messages: input3, language: "español" }, config);
console.log(output3.messages[output3.messages.length - 1]);