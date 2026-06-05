require('dotenv').config();
const axios = require('axios');

axios.post(
  'https://api.groq.com/openai/v1/chat/completions',
  {
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Say hello in one word' }],
    max_tokens: 10
  },
  { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
)
.then(r => console.log('SUCCESS:', r.data.choices[0].message.content))
.catch(e => console.log('FAIL:', e.response?.data?.error?.message || e.message));