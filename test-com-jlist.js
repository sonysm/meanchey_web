const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL || "https://api-mb.meanchey.org";
fetch(API_BASE_URL + "/com/jlist", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ limit: 1 })
}).then(res => res.json()).then(listRes => {
  console.log(JSON.stringify(listRes.data.list[0], null, 2));
}).catch(console.error);
