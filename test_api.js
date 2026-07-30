const apiKey = 'sk-5c7b894f6d434db9-49fvp3-bed51e85';
const apiUrl = 'http://localhost:20128/v1/chat/completions';
const model = 'oc/big-pickle';

const prompt = `Analisis laporan kerusakan berikut dan tentukan kategori serta tingkat prioritasnya.
Judul Laporan: gedung runtuh
Deskripsi: kena gempa

Balas HANYA dengan format JSON valid seperti ini tanpa markdown tambahan:
{"kategori": "Nama Kategori (misal: Listrik, Kebersihan, Bangunan, IT)", "prioritas": "Low/Medium/High/Urgent"}`;

async function testAPI() {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  });
  
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Raw response body:");
  console.log(text);
}

testAPI();
