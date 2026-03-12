// ⚠️ 這段程式碼是跑在 Vercel 伺服器上的 (Node.js 環境)
// 外部的使用者絕對看不到這裡的程式碼，所以把密碼藏在這裡很安全！

export default async function handler(req, res) {
  // 1. 安全檢查：只允許前端用 POST 方式來敲門傳資料
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: '只允許 POST 請求' } });
  }

  // 2. 從前端傳來的資料 (req.body) 中，把使用者問的問題 (prompt) 拿出來
  const { prompt } = req.body;
  
  // 3. 🔑 呼叫保險箱：從 Vercel 的環境變數裡拿取名為 GEMINI_API_KEY 的密碼
  // process.env 就是伺服器讀取系統環境變數的標準語法
  const API_KEY = process.env.GEMINI_API_KEY; 
  
  // 指定要使用的模型版本
  const MODEL = 'gemini-3-flash-preview'; 

  // 如果發現保險箱裡沒有金鑰（可能是你忘記在 Vercel 後台設定了），就退回錯誤給前端
  if (!API_KEY) {
    return res.status(500).json({ error: { message: '伺服器未設定 API Key！請檢查 Vercel 環境變數。' } });
  }

  // 4. 組合真正的 Google API 網址，並把金鑰偷偷塞在網址後面
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    // 5. 由 Vercel 伺服器代替我們，去向 Google 發送請求
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 這裡的格式跟之前一樣，只是現在是由伺服器代勞
        contents: [{ parts: [{ text: prompt }] }],
        //tools: [{ googleSearch: {} }] // 依然保留上網搜尋的功能
      })
    });

    // 6. 拿到 Google 的回覆後，解析成 JSON
    const data = await response.json();
    
    // 7. 最後一步：把 Google 給的答案，原封不動地回傳給我們自己的前端網頁
    res.status(200).json(data);
    
  } catch (error) {
    // 如果伺服器去跟 Google 溝通的過程中發生嚴重錯誤，回報給前端
    res.status(500).json({ error: { message: error.message } });
  }

}
