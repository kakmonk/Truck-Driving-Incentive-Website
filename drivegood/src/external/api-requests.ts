export { table };
export { getRequest };
export { postRequest };
export { deleteRequest };


const baseUrl = 'https://g5esy4pnad.execute-api.us-east-1.amazonaws.com/default/Team20DynamoInteract';

enum table {
  admins = "Team20_Admins",
  drivers = "Team20_Drivers",
  sponsors = "Team20_Sponsors",
  users = "Team20_Users",
  purchases = "Team20_PurchaseOrders",
  points = "Team20_PointTransactions",
  audits = "Team20_AuditLog",
  applications = "Team20_Applications",
  organizations = "Team20_Organization"
}

const partitionKey: { [key in table] : string } = {
  [table.admins]: 'AdminID',
  [table.drivers]: 'DriverID',
  [table.sponsors]: 'SponsorID',
  [table.users]: 'UserID',
  [table.purchases]: 'OrderID',
  [table.points]: 'TransactionID',
  [table.audits]: 'LogID',
  [table.applications]: 'ApplicationID',
  [table.organizations]: 'id'
}

// Data structure of returned GET request for specific entry and required structure of item parameter for POST request
// EX: { AdminID: { S: 1 }, UserID: { N: 1 } }
interface tableItem {
  [attribute: string]: { S?: string; N?: string };
}

// Data structure of returned GET request for table scan
interface tableScan {
  Items: tableItem[];
  Count: number;
  ScannedCount: number;
  ResponseMetadata: {
    RequestId: string;
    HTTPStatusCode: number;
    HTTPHeaders: { [key: string]: string };
    RetryAttempts: number;
  };
}

async function getRequest(table: table, partitionValue: string | number | null = null): Promise<tableItem | tableScan> {
  try {

    partitionValue = typeof partitionValue == 'number' ? partitionValue.toString() : partitionValue
    let url = baseUrl;
    url += `?TableName=${table}`;

    if (partitionValue != null) {
      url += `&PartitionKey=${partitionKey[table]}&PartitionValue=${partitionValue}`;
    }

    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      throw new Error('Request failed with status ' + response.status);
    }

    const result: tableItem | tableScan = await response.json();
    return result;

  } catch (error) {
    console.error(error);
    throw error;

  }
}

async function postRequest(table: table, item: tableItem) {
  try {

    const body = JSON.stringify({
      TableName: table,
      Item: item
    });

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (!response.ok) {
      throw new Error('Request failed with status ' + response.status);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function deleteRequest(table: table, partitionValue: string | number) {
  try {

    partitionValue = typeof partitionValue == 'number' ? partitionValue.toString() : partitionValue
    const body = JSON.stringify({
      TableName: table,
      Key: { [partitionKey[table]]: { S: partitionValue } }
    });

    const response = await fetch(baseUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (!response.ok) {
      throw new Error('Request failed with status ' + response.status);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error(error);
    throw error;
  }
}
