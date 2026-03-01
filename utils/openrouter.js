const axios = require('axios');

const generateAIResponse = async (prompt) => {
    try {
        // We use OpenRouter's recommended endpoint
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'mistralai/mixtral-8x7b-instruct',
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:5173', // Adjust in production
                    'X-Title': 'SmartStudy AI',
                },
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenRouter API Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch AI response');
    }
};

module.exports = { generateAIResponse };
