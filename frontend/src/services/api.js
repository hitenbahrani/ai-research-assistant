import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export async function healthCheck() {
  const res = await client.get("/health");
  return res.data;
}

export async function askChat({
  question,
  messages = [],
  top_k = 6,
  mode = "auto",
  use_web = false,
}) {
  const res = await client.post("/ask", {
    question,
    messages,
    top_k,
    mode,
    use_web,
  });

  return res.data;
}
