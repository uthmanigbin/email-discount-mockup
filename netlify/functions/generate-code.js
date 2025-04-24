const { MongoClient } = require("mongodb");

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "DEMO-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection("codes");

    const code = generateCode();
    const expiry = new Date(Date.now() + 60000); // 1 minute expiry

    await collection.insertOne({
      code,
      expiry,
      used: false,
      createdAt: new Date(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        code,
        expiry: expiry.toISOString(),
      }),
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate code" }),
    };
  } finally {
    await client.close();
  }
};
