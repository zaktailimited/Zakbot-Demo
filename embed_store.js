// embed_and_store.js
require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const { MongoClient } = require("mongodb");

const API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGODB_URI;

const chunks = JSON.parse(fs.readFileSync("chunks.json", "utf8"));
const EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${API_KEY}`;

async function getEmbedding(text, retry = 2) {
  try {
    const res = await axios.post(EMBEDDING_URL, {
      content: { parts: [{ text }] },
    });
    return res.data.embedding.values;
  } catch (err) {
    if (retry > 0) {
      console.warn("⚠️ Retrying embedding...");
      await new Promise((r) => setTimeout(r, 1000));
      return await getEmbedding(text, retry - 1);
    }
    console.error("❌ Embedding failed:", err.message);
    return null;
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db("edtech_bot");
  const collection = db.collection("course_chunks");

  console.log("🧹 Clearing old embeddings...");
  await collection.deleteMany({});

  let count = 0;

  for (const chunk of chunks) {
    const vector = await getEmbedding(chunk.text);

    if (!vector || !Array.isArray(vector) || vector.length !== 768) {
      console.warn("⚠️ Invalid vector skipped for:", chunk.text.slice(0, 60));
      continue;
    }

    await collection.insertOne({
      chunk_id: chunk.chunk_id,
      text: chunk.text,
      embedding: vector,
      metadata: chunk.metadata,
      source_id: chunk.metadata.source_id,
      docType: chunk.metadata.docType,
    });

    count++;
    console.log(`✅ Stored chunk #${count}: ${chunk.chunk_id}`);
  }

  await client.close();
  console.log(`🚀 Done. Stored ${count} total chunks.`);
}

main();
