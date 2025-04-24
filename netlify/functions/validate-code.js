const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { code } = JSON.parse(event.body);
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection("codes");

    const foundCode = await collection.findOne({ code });
    const now = new Date();

    if (!foundCode) {
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: false, message: "❌ Invalid code" }),
      };
    }

    if (foundCode.used) {
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: false, message: "❌ Code already used" }),
      };
    }

    if (now > new Date(foundCode.expiry)) {
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: false, message: "❌ Code expired" }),
      };
    }

    // Mark as used
    await collection.updateOne({ code }, { $set: { used: true, usedAt: now } });

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: true,
        message: "✅ 25% discount applied!",
      }),
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Validation failed" }),
    };
  } finally {
    await client.close();
  }
};
