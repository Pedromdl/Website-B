// API de Conversões do Meta Ads - Serverless Function (Vercel)
// Endpoint: /api/conversion
// Envia eventos para a Conversions API do Meta

const PIXEL_ID = '936439661476013';
const ACCESS_TOKEN = 'EAAGHBSDgaDwBR9ORKpqhZCZAg4924eZBIOLY9gpmwOEZBi7TZBLV5oSvFAaEwrLi8XY35Xcl2a4lJ1riuAer5zBRPSHN0ZAWo6KqDzJopOnhkZCDfZBZAs8JlZCDogULa5TcquqpDCcZBTrHoPBxwO7tUcovzge12kugWlZCmTGmTk1JK9yw8BMU45IFccI7KDD0mQrmXAZDZD';
const META_API_URL = `https://graph.facebook.com/v22.0/${PIXEL_ID}/events`;

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    try {
        const { eventName, eventId, userData, customData } = req.body;

        if (!eventName) {
            return res.status(400).json({ error: 'eventName é obrigatório' });
        }

        // Capturar IP real do cliente (Vercel envia via x-forwarded-for)
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
                      || req.headers['x-real-ip'] 
                      || req.socket?.remoteAddress 
                      || '';

        // Dados do usuário (hash SHA256)
        const defaultUserData = {
            client_ip_address: clientIp,
            client_user_agent: req.headers['user-agent'] || ''
        };
        if (userData) {
            if (userData.email) {
                const crypto = await import('crypto');
                defaultUserData.em = [crypto.createHash('sha256').update(userData.email.toLowerCase().trim()).digest('hex')];
            }
            if (userData.phone) {
                const crypto = await import('crypto');
                // Remove caracteres não numéricos
                const phone = userData.phone.replace(/\D/g, '');
                defaultUserData.ph = [crypto.createHash('sha256').update(phone).digest('hex')];
            }
            if (userData.clientUserAgent) {
                defaultUserData.client_user_agent = userData.clientUserAgent;
            }
            if (userData.fbc) {
                defaultUserData.fbc = userData.fbc;
            }
            if (userData.fbp) {
                defaultUserData.fbp = userData.fbp;
            }
        }

        // Montar o payload
        const payload = {
            data: [{
                event_name: eventName,
                event_time: Math.floor(Date.now() / 1000),
                event_id: eventId || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                action_source: 'website',
                event_source_url: req.headers.referer || 'https://binottiperformance.com.br',
                user_data: defaultUserData,
                custom_data: customData || {}
            }],
            access_token: ACCESS_TOKEN
        };

        // Enviar para a Meta
        const response = await fetch(META_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Erro na API de Conversões:', result);
            return res.status(response.status).json({
                error: 'Erro ao enviar evento para Meta',
                details: result
            });
        }

        console.log('Evento enviado com sucesso:', eventName, result);
        return res.status(200).json({
            success: true,
            eventName,
            events_received: result.events_received,
            messages: result.messages || []
        });

    } catch (error) {
        console.error('Erro interno:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
}
