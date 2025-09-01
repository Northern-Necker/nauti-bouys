#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// OpenAI proxy endpoint - Updated to use Responses API for vision
app.post('/openai-proxy', async (req, res) => {
    try {
        console.log('📡 Proxying request to OpenAI Responses API...');
        
        const { apiKey, useResponsesAPI = true, ...requestBody } = req.body;
        
        // Debug: Check if image is in the request
        const hasImage = requestBody.messages?.some(msg => 
            msg.content?.some(item => item.type === 'image_url')
        ) || requestBody.input?.some(item => 
            item.content?.some(content => content.type === 'input_image')
        );
        console.log('🖼️ Request includes image:', hasImage ? 'YES' : 'NO');
        
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }
        
        // Sanitize API key - remove any invisible characters, whitespace, etc.
        const cleanApiKey = apiKey.toString().trim().replace(/[\r\n\t\u200B-\u200D\uFEFF]/g, '');
        console.log(`🔑 API Key length: ${cleanApiKey.length}, starts with: ${cleanApiKey.substring(0, 10)}...`);
        
        // Try Responses API first, fallback to Chat Completions
        let response;
        let endpoint;
        let finalRequestBody;
        
        if (useResponsesAPI && hasImage && requestBody.input) {
            // Try Responses API first
            endpoint = 'https://api.openai.com/v1/responses';
            finalRequestBody = {
                model: requestBody.model,
                input: requestBody.input
            };
            
            console.log(`🎯 Trying Responses API: ${endpoint}`);
            
            try {
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${cleanApiKey}`,
                        'User-Agent': 'Viseme-Optimizer/1.0'
                    },
                    body: JSON.stringify(finalRequestBody)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.log(`⚠️ Responses API failed (${response.status}): ${errorText}`);
                    console.log(`🔄 Falling back to Chat Completions API...`);
                    response = null; // Will trigger fallback
                }
            } catch (error) {
                console.log(`⚠️ Responses API error: ${error.message}`);
                console.log(`🔄 Falling back to Chat Completions API...`);
                response = null; // Will trigger fallback
            }
        }
        
        if (!response) {
            // Use Chat Completions API (fallback or direct)
            endpoint = 'https://api.openai.com/v1/chat/completions';
            finalRequestBody = {
                model: requestBody.model,
                messages: requestBody.messages,
                max_tokens: requestBody.max_tokens || 500
            };
            
            console.log(`🎯 Using Chat Completions API: ${endpoint}`);
            
            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cleanApiKey}`,
                    'User-Agent': 'Viseme-Optimizer/1.0'
                },
                body: JSON.stringify(finalRequestBody)
            });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OpenAI API error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `OpenAI API error: ${response.status}`,
                details: errorText 
            });
        }
        
        const data = await response.json();
        
        // Handle different response formats
        let aiResponse;
        if (data.output_text) {
            // Responses API format
            aiResponse = data.output_text;
            console.log('✅ OpenAI Responses API success');
        } else if (data.choices?.[0]?.message?.content) {
            // Chat Completions API format
            aiResponse = data.choices[0].message.content;
            console.log('✅ OpenAI Chat Completions API success');
        }
        
        console.log('🧠 AI Response:', aiResponse ? aiResponse.substring(0, 200) + '...' : 'No content');
        res.json(data);
        
    } catch (error) {
        console.error('❌ Proxy error:', error.message);
        res.status(500).json({ 
            error: 'Proxy server error', 
            details: error.message 
        });
    }
});

// Claude proxy endpoint
app.post('/claude-proxy', async (req, res) => {
    try {
        console.log('📡 Proxying request to Claude API...');
        
        const { apiKey, ...requestBody } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Claude API error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `Claude API error: ${response.status}`,
                details: errorText 
            });
        }
        
        const data = await response.json();
        console.log('✅ Claude API success');
        res.json(data);
        
    } catch (error) {
        console.error('❌ Proxy error:', error.message);
        res.status(500).json({ 
            error: 'Proxy server error', 
            details: error.message 
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AI Proxy Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 OpenAI endpoint: http://localhost:${PORT}/openai-proxy`);
    console.log(`📡 Claude endpoint: http://localhost:${PORT}/claude-proxy`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Accessible from Windows at http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down AI Proxy Server...');
    process.exit(0);
});