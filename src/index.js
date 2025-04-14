import env from "./config.js";

import { ChatMistralAI } from "@langchain/mistralai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";


const model = new ChatOllama({
  model: "llama3.2"
});

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "Translate the following from English into {language}"],
  ["user", "{text}"]
])

const promptValue = await promptTemplate.invoke({
  language: "italian",
  text: "hi!",
});

const response = await model.invoke(promptValue);

console.log(response.content)

export default response.content;