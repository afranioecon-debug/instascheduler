// netlify/functions/upload-media.js
// Recebe uma imagem em base64, faz upload para o Cloudinary
// e retorna a URL pública para usar na Meta Graph API

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME || 'dcmjgbesa';
  const API_KEY     = process.env.CLOUDINARY_API_KEY    || '522372519552151';
  const API_SECRET  = process.env.CLOUDINARY_API_SECRET;

  if (!API_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary não configurado' }) };
  }

  try {
    const { base64, mimeType, fileName } = JSON.parse(event.body);
    if (!base64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'base64 é obrigatório' }) };
    }

    // Cloudinary aceita data URI direto
    const dataUri = `data:${mimeType};base64,${base64}`;

    // Gerar timestamp e assinatura
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'instascheduler';

    // Criar assinatura SHA-1
    const crypto = require('crypto');
    const toSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    // Fazer upload via API REST do Cloudinary
    const formData = new URLSearchParams();
    formData.append('file', dataUri);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      { method: 'POST', body: formData }
    );

    const uploadData = await uploadRes.json();

    if (!uploadData.secure_url) {
      console.error('Cloudinary error:', uploadData);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: uploadData.error?.message || 'Falha no upload' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: uploadData.secure_url,
        publicId: uploadData.public_id,
        resourceType: uploadData.resource_type,
      })
    };

  } catch (err) {
    console.error('Upload error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Erro interno' })
    };
  }
};
