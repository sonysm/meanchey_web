const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL || "https://api-mb.meanchey.org";
fetch(API_BASE_URL + "/com/jlist", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ limit: 1 })
}).then(res => res.json()).then(listRes => {
  const compId = listRes.data.list[0].id;
  console.log("Found ID:", compId);
  return fetch(API_BASE_URL + "/com/get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: compId })
  });
}).then(res => res.json()).then(getRes => {
  console.log(JSON.stringify(getRes, null, 2));
}).catch(console.error);
