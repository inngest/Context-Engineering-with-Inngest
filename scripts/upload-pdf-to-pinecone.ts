/**
 * Script to upload PDF documents to Pinecone
 * 
 * Usage:
 *   npx tsx scripts/upload-pdf-to-pinecone.ts path/to/document.pdf
 * 
 * Or upload multiple PDFs:
 *   npx tsx scripts/upload-pdf-to-pinecone.ts path/to/*.pdf
 */

import fs from "fs";
import path from "path";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateEmbeddings } from "../src/lib/openai";
import "dotenv/config";

// pdf-parse is a CommonJS module, need to use require
import { PDFParse } from "pdf-parse";

// Configuration
const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks
const INDEX_NAME = "test-inngest-context-engineering";

// Initialize Pinecone
function getPineconeClient(): Pinecone {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      "PINECONE_API_KEY environment variable is required. " +
      "Set it in .env.local file."
    );
  }

  return new Pinecone({ apiKey });
}

// Sanitize text to remove problematic Unicode characters
function sanitizeText(text: string): string {
  return text
    // Remove lone surrogates (unpaired high/low surrogates)
    .replace(/[\uD800-\uDFFF]/g, '')
    // Replace null bytes
    .replace(/\0/g, '')
    // Normalize Unicode to NFC form
    .normalize('NFC')
    // Remove other control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim();
}

// Split text into chunks with overlap
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    // Sanitize and only add non-empty chunks
    const sanitized = sanitizeText(chunk);
    if (sanitized.length > 0) {
      chunks.push(sanitized);
    }

    // Move to next chunk with overlap
    start += chunkSize - overlap;
  }

  return chunks;
}

// Extract text from PDF
async function extractTextFromPDF(pdfPath: string): Promise<string> {
  console.log(`📄 Reading PDF: ${pdfPath}`);
  
  const parser = new PDFParse({ url: pdfPath });
  const data = await parser.getText();
  
  console.log(`   Raw text length: ${data.text.length} characters`);
  
  // Sanitize the text to remove problematic Unicode
  const sanitized = sanitizeText(data.text);
  console.log(`   Sanitized text length: ${sanitized.length} characters`);
  
  return sanitized;
}

// Upload chunks to Pinecone
async function uploadToPinecone(
  chunks: string[],
  documentName: string
): Promise<void> {
  console.log(`\n🚀 Uploading to Pinecone...`);
  
  const pinecone = getPineconeClient();
  const index = pinecone.index(INDEX_NAME);

  // Generate embeddings for all chunks
  console.log(`   Generating embeddings for ${chunks.length} chunks...`);
  const embeddings = await generateEmbeddings(chunks);

  // Prepare vectors for upsert with sanitized metadata
  const vectors = chunks.map((chunk, i) => ({
    id: `${documentName}-chunk-${i}`,
    values: embeddings[i],
    metadata: {
      text: sanitizeText(chunk), // Extra sanitization for metadata
      title: sanitizeText(documentName),
      chunkIndex: i,
      source: "pdf",
    },
  }));

  // Upsert vectors in batches of 100
  const batchSize = 100;
  let uploadedCount = 0;

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
    uploadedCount += batch.length;
    console.log(`   Uploaded ${uploadedCount}/${vectors.length} chunks`);
  }

  console.log(`✅ Successfully uploaded ${vectors.length} chunks to Pinecone!`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(`
❌ Error: No PDF file specified

Usage:
  npx tsx scripts/upload-pdf-to-pinecone.ts <path-to-pdf>

Example:
  npx tsx scripts/upload-pdf-to-pinecone.ts ./documents/research-paper.pdf
  npx tsx scripts/upload-pdf-to-pinecone.ts ./documents/*.pdf

Environment Variables Required:
  PINECONE_API_KEY - Your Pinecone API key
  OPENAI_API_KEY - Your OpenAI API key (for embeddings)
    `);
    process.exit(1);
  }

  // Check environment variables
  if (!process.env.PINECONE_API_KEY) {
    console.error("❌ Error: PINECONE_API_KEY is not set");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Error: OPENAI_API_KEY is not set");
    process.exit(1);
  }

  // Process each PDF file
  for (const pdfPath of args) {
    try {
      // Check if file exists
      if (!fs.existsSync(pdfPath)) {
        console.error(`❌ File not found: ${pdfPath}`);
        continue;
      }

      console.log(`\n${"=".repeat(60)}`);
      console.log(`Processing: ${pdfPath}`);
      console.log("=".repeat(60));

      // Extract text from PDF
      const text = await extractTextFromPDF(pdfPath);

      // Split into chunks
      console.log(`\n✂️  Chunking text...`);
      const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
      console.log(`   Created ${chunks.length} chunks`);

      // Get document name from filename
      const documentName = path.basename(pdfPath, ".pdf");

      // Upload to Pinecone
      await uploadToPinecone(chunks, documentName);

      console.log(`\n✨ Done processing ${pdfPath}\n`);
    } catch (error) {
      console.error(`\n❌ Error processing ${pdfPath}:`, error);
    }
  }

  console.log("\n🎉 All PDFs processed!");
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

