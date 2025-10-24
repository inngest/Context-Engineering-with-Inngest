/**
 * Quick script to test Pinecone connection
 * Usage: npx tsx scripts/test-pinecone-connection.ts
 */

import { Pinecone } from "@pinecone-database/pinecone";

async function main() {
  console.log("🔍 Testing Pinecone connection...\n");

  // Check environment variables
  if (!process.env.PINECONE_API_KEY) {
    console.error("❌ PINECONE_API_KEY is not set");
    console.log("   Set it in your .env.local file");
    process.exit(1);
  }

  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    console.log("✅ Connected to Pinecone!");

    // List indexes
    console.log("\n📋 Your Pinecone indexes:");
    const indexes = await pinecone.listIndexes();
    
    if (indexes.indexes && indexes.indexes.length > 0) {
      indexes.indexes.forEach((index: any) => {
        console.log(`   - ${index.name} (dimension: ${index.dimension}, metric: ${index.metric})`);
      });
    } else {
      console.log("   No indexes found");
      console.log("\n💡 Create an index at: https://app.pinecone.io/");
    }

    // Check if our specific index exists
    const indexName = process.env.PINECONE_INDEX || "test-inngest-context-engineering";
    console.log(`\n🎯 Looking for index: ${indexName}`);
    
    const indexExists = indexes.indexes?.some((idx: any) => idx.name === indexName);
    
    if (indexExists) {
      console.log(`✅ Index "${indexName}" exists!`);
      
      // Get index stats
      const index = pinecone.index(indexName);
      const stats = await index.describeIndexStats();
      console.log(`   Total vectors: ${stats.totalRecordCount || 0}`);
      console.log(`   Dimension: ${stats.dimension || 'unknown'}`);
    } else {
      console.log(`❌ Index "${indexName}" not found`);
      console.log("\n📝 To create this index:");
      console.log("   1. Go to https://app.pinecone.io/");
      console.log("   2. Click 'Create Index'");
      console.log(`   3. Name: ${indexName}`);
      console.log("   4. Dimension: 1536");
      console.log("   5. Metric: cosine");
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }

  console.log("\n✨ Test complete!");
}

main();

