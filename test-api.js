// Script para testar a API de Conversões
const https = require('https');

const data = JSON.stringify({
    eventName: 'TestCAPI',
    userData: {
        clientIp: '127.0.0.1',
        clientUserAgent: 'Node.js Test'
    },
    customData: {
        source: 'teste_script',
        currency: 'BRL'
    }
});

const options = {
    hostname: 'www.binottiperformance.com',
    path: '/api/conversion',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Resposta:', body);
        try {
            const parsed = JSON.parse(body);
            if (parsed.success) {
                console.log('✅ CAPI funcionando! Evento enviado com sucesso.');
            } else {
                console.log('❌ Erro:', parsed.error);
            }
        } catch (e) {
            console.log('❌ Erro ao parsear resposta:', body);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Erro na requisição:', e.message);
});

req.write(data);
req.end();
