import * as dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import Groq from "groq-sdk";

// ---------- INIT ONCE ----------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: "text-embedding-004",
});

const pinecone = new Pinecone();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

// keep history small (VERY IMPORTANT)
const MAX_HISTORY = 4;
const History = [];


//------decide query rewritting is needed------------
function needsRewrite(query) {
  const vaguePhrases = [
    "explain more",
    "explain in detail",
    "what about that",
    "continue",
    "tell me more",
    "elaborate",
    "expand",
    "give example"
  ];

  return vaguePhrases.some(phrase =>
    query.toLowerCase().includes(phrase)
  );
}


//-----------Transform query------------
async function transformQueryWithGroq(query) {
  // Build a short conversation summary
  const conversation = History
    .filter(msg => msg.role === "user")
    .map(msg => `User: ${msg.content}`)
    .join("\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "Rewrite the user's last question into a standalone question using the conversation context. " +
          "Return clear and concise rewritten question. Do not add explanations."+
          "rewritten query should be logical and make sence"
      },
      {
        role: "user",
        content: `
                Conversation:
                ${conversation}

                Follow-up question:
                ${query}
                `
      }
    ],
    temperature: 0,
    max_tokens: 50
  });

  return response.choices[0].message.content.trim();
}



 //------need rewritten query-------
async function getFinalQuery(query) {
  if (needsRewrite(query) && History.length > 0) {
    const rewritten = await transformQueryWithGroq(query);
    return rewritten;
  }
  return query; // already standalone
}



// ---------- MAIN CHAT FUNCTION ----------
async function chatting(quetion) {

  const query = await getFinalQuery(quetion);
 
  // 1. Embed query (only once per question)
  const queryVector = await embeddings.embedQuery(query);

  // 2. Vector search
  const searchResults = await pineconeIndex.query({
    topK: 3,
    vector: queryVector,
    includeMetadata: true,
  });
  // console.log(searchResults);

  const context = searchResults.matches
    .map(match => match.metadata.text)
    .join("\n\n---\n\n");

  // 3. Add user message
  History.push({
    role: "user",
     content: `Context:
            ${context}

            Question:
            ${query}`
  });

  // trim history (prevents token explosion)
  if (History.length > MAX_HISTORY) {
    History.splice(0, History.length - MAX_HISTORY);
  }

  // 4. Generate answer
  const response = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [
    {
      role: "system",
      content:"You are an expert in Data Structures and Algorithms and you can also respond politely to basic English greetings (such as Hi, Hello, Good morning/evening)."+
          "If the user greets you, respond with an appropriate greeting."+
          "For all other questions, answer strictly using the provided context."+
          "If the answer is not present in the context, clearly say that you do not know."+
          "Keep all answers clear, concise, and to the point." 
    },
    ...History
  ],
  temperature: 0.3,
  max_tokens: 300
});

const answer = response.choices[0].message.content;


  // 5. Save model response
  History.push({
  role: "assistant",
  content: answer
});

return answer;

}

// ---------- function return solution ----------

export async function getSolution(question){
  return await chatting(question);
  

}

