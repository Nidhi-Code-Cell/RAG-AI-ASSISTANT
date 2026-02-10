# AI RAG System for DSA Question Answering

An AI-powered Retrieval-Augmented Generation (RAG) system pre-trained on a Data Structures and Algorithms (DSA) PDF. The system answers only DSA-related questions by retrieving relevant context from the indexed document and generating grounded responses using large language models.

## Features
- Pre-indexed DSA PDF for domain-specific question answering
- Text chunking and semantic embedding generation
- Vector similarity search using Pinecone
- Context-aware answer generation with LLMs
- Prevents out-of-domain responses

## Tech Stack
**Backend:** Node.js, LangChain, Pinecone  
**Embeddings:** Google Generative AI (`text-embedding-004`)  
**LLMs:** Groq / Gemini  
**Frontend:** HTML, CSS, JavaScript  

## How It Works
1. DSA PDF is processed and indexed offline
2. Text is split into chunks and converted into embeddings
3. Embeddings are stored in Pinecone
4. User queries are embedded and matched against stored vectors
5. Retrieved context is passed to the LLM for answer generation

## Setup Instructions

### Clone the Repository
### Create a .env file in the root directory



