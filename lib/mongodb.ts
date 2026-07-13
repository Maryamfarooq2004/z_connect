import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  console.log("Trying to connect to MongoDB...");
  console.log(process.env.MONGODB_URI);

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri!);
  console.log("Connected successfully!");
  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
