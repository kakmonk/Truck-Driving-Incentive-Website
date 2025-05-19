export async function logAuditEvent(category, actor, targetUser, details) {
  console.log("Logging audit event:", { category, actor, targetUser, details });
  
  const response = await fetch("https://4h9hob3ugi.execute-api.us-east-1.amazonaws.com/default/Team20LogAuditEvent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category,
      actor,
      targetUser,
      details
    })
  });

  if (!response.ok) {
    console.error("Failed to log event:", response.statusText);
  } else {
    console.log("Audit event logged successfully!");
  }
}
