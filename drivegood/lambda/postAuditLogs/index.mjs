import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  if (event.requestContext.http.method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  const now = new Date().toISOString();

  const uniqueLogID = `AUDIT#${body.category}#${uuidv4()}`;  // Add UUID for uniqueness
  const uniqueSK = `TIMESTAMP#${now}`;

  const item = {
    LogID: uniqueLogID,
    SK: uniqueSK,
    eventID: uuidv4(),
    timestamp: now,
    actor: body.actor,
    targetUser: body.targetUser || "N/A",
    category: body.category,
    details: body.details || {}
  };

  try {
    const command = new PutItemCommand({
      TableName: "Team20_AuditLog",
      Item: marshall(item, { removeUndefinedValues: true })
    });

    await client.send(command);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("Error writing to DynamoDB:", err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: "Failed to write audit log" })
    };
  }
};
