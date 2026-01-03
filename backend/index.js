import * as dotenv from 'dotenv';
dotenv.config();

import crypto from "crypto";
import fs from "fs";


import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';



const PDF_PATH = 'backend/data/Dsa.pdf';
 
function getFileHash(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}


//--------first load pdf pdf---------------
async function indexDocument(filePath) {


const pdfLoader = new PDFLoader(filePath);
const rawDocs = await pdfLoader.load(); 

console.log("pdf loaded",rawDocs.length);

//--------Create the chunk of the pdf-------------
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
const chunkedDocs = await textSplitter.splitDocuments(rawDocs);
console.log("chunkking complete", chunkedDocs.length);


// Initializing the Embedding model
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'text-embedding-004',
  });
  console.log("model configured");



//   Initialize Pinecone Client
const pinecone = new Pinecone();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
console.log("picone configured");


//-------compute hash of file before embedding----------------------
const fileHash = getFileHash(filePath);
console.log("file hash:", fileHash);


//-----------check pinecone metadata before inserting--------------
chunkedDocs.forEach(doc => {
  doc.metadata = {
    ...doc.metadata,
    file_hash: fileHash,
    source: filePath,
  };
});


//--------check if pdf already exists in pinecone----------------
const existing = await pineconeIndex.query({
  vector: new Array(768).fill(0), // dummy vector
  topK: 1,
  filter: {
    file_hash: fileHash,
  },
});

if (existing.matches.length > 0) {
  console.log("PDF already indexed. Skipping embedding.");
  return;
}



// Embed Chunks and Upload to Pinecone
await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });
  console.log("vector db created and vectores stored");
}



indexDocument(PDF_PATH);
