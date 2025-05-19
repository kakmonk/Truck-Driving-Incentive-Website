import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  let startDate, endDate, sponsor, category;
  try {
    const body = JSON.parse(event.body);
    startDate = body.startDate;
    endDate = body.endDate;
    sponsor = body.sponsor;
    category = body.category;
  } catch (err) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: "Invalid request body" })
    };
  }

  try {
    const data = await client.send(new ScanCommand({ TableName: "Team20_AuditLog" }));
    const allLogs = data.Items || [];

    const filteredLogs = allLogs.filter(log => {
      const timestamp = log.timestamp?.split("T")[0];
      const matchDate = (!startDate || timestamp >= startDate) && (!endDate || timestamp <= endDate);
      const matchSponsor = !sponsor || log.sponsor === sponsor;
      const matchCategory = !category || (log.category?.toLowerCase() === category.toLowerCase());
      return matchDate && matchSponsor && matchCategory;
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        "Content-Type": "application/json"
      },
      body: JSON.stringify(filteredLogs)
    };
  } catch (err) {
    console.error("Scan failed:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: "Failed to fetch audit logs" })
    };
  }
};
