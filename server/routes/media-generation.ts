import { Router } from 'express';
import freepikService from '../services/freepik-service';
import replicateService from '../services/replicate-service';
import { requireAuth } from '../middleware/auth-middleware';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as crypto from 'crypto';

const router = Router();

// Rota para gerar imagens educacionais com Freepik
router.post('/generate-educational-images', requireAuth, async (req, res) => {
  try {
    const { topic, context, count = 3 } = req.body;

    if (!topic || !context) {
      return res.status(400).json({ error: 'Topic and context are required' });
    }
    
    // Garantir que o tipo de conteúdo da resposta seja JSON
    res.set('Content-Type', 'application/json; charset=utf-8');
    
    console.log(`[Image Generation] Gerando ${count} imagens educacionais sobre "${topic}"`);

    const images = await freepikService.generateEducationalImages(topic, context, count);
    
    // Salvando as imagens para o sistema de arquivos
    const savedImages = await Promise.all(
      images.map(async (image, index) => {
        console.log(`[Image Generation] Salvando imagem ${index + 1}/${images.length}`);
        const filePath = await freepikService.saveImageToFile(image.url);
        const relativePath = path.relative(process.cwd(), filePath);
        return {
          ...image,
          filePath: relativePath,
          // Construindo URL relativa para acessar a imagem no frontend
          fileUrl: `/api/uploads/${path.basename(filePath)}`
        };
      })
    );

    console.log(`[Image Generation] ${savedImages.length} imagens salvas com sucesso`);
    res.json({ images: savedImages });
  } catch (error) {
    console.error('Error generating educational images:', error);
    // Garantir que o tipo de conteúdo da resposta seja JSON mesmo em caso de erro
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.status(500).json({ error: error.message });
  }
});

// Rota para buscar diferentes tipos de mídia no Freepik
router.post('/search-stock-media', requireAuth, async (req, res) => {
  try {
    const { 
      query, 
      mediaType = 'all', // 'all', 'photos', 'vectors', 'videos'
      limit = 10,
      page = 1,
      sort = 'popular'
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[Media Search] Buscando por "${query}" (tipo: ${mediaType}, página: ${page})`);

    const options: any = {
      query,
      limit,
      page,
      sort
    };

    // Configurar filtros com base no tipo de mídia solicitado
    if (mediaType === 'photos' || mediaType === 'all') {
      options.filterPhoto = true;
    }
    if (mediaType === 'vectors' || mediaType === 'all') {
      options.filterVector = true;
    }
    if (mediaType === 'videos' || mediaType === 'all') {
      options.filterVideo = true;
    }
    
    try {
      // Garantir que o tipo de conteúdo da resposta seja JSON
      res.set('Content-Type', 'application/json; charset=utf-8');
      
      const results = await freepikService.searchStockContent(options);
      
      console.log(`[Media Search] Resultados encontrados: ${results.length}`);
      
      return res.json({ 
        results,
        page,
        mediaType,
        totalResults: results.length,
        hasMore: results.length === limit
      });
    } catch (apiError: any) {
      console.error('[Media Search] Erro da API Freepik:', apiError);
      // Garantir que o tipo de conteúdo da resposta seja JSON
      res.set('Content-Type', 'application/json; charset=utf-8');
      return res.status(400).json({
        error: `Erro na API Freepik: ${apiError.message}`,
        source: 'freepik_api'
      });
    }
  } catch (error: any) {
    console.error('Error searching stock media:', error);
    res.status(500).json({ 
      error: `Erro ao buscar mídia: ${error.message}`,
      source: 'server'
    });
  }
});

// Rota para upscale de imagens com Freepik
router.post('/upscale-image', requireAuth, async (req, res) => {
  try {
    const { imageUrl, scale = 2 } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Garantir que o tipo de conteúdo da resposta seja JSON
    res.set('Content-Type', 'application/json; charset=utf-8');
    
    console.log(`[Image Upscale] Melhorando qualidade da imagem, scale: ${scale}`);

    const upscaledImage = await freepikService.upscaleImage({
      imageUrl,
      scale
    });

    // Salvando a imagem upscaled no sistema de arquivos
    const filePath = await freepikService.saveImageToFile(upscaledImage.url);
    const relativePath = path.relative(process.cwd(), filePath);
    
    console.log(`[Image Upscale] Imagem salva em ${filePath}`);

    res.json({
      image: {
        ...upscaledImage,
        filePath: relativePath,
        fileUrl: `/api/uploads/${path.basename(filePath)}`
      }
    });
  } catch (error) {
    console.error('Error upscaling image:', error);
    // Garantir que o tipo de conteúdo da resposta seja JSON
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.status(500).json({ error: error.message });
  }
});

// Rota para gerar vídeos educacionais com Replicate
router.post('/generate-educational-video', requireAuth, async (req, res) => {
  try {
    const { topic, context } = req.body;

    if (!topic || !context) {
      return res.status(400).json({ error: 'Topic and context are required' });
    }
    
    // Garantir que o tipo de conteúdo da resposta seja JSON
    res.set('Content-Type', 'application/json; charset=utf-8');
    
    console.log(`[Video Generation] Gerando vídeo educacional sobre "${topic}"`);

    const video = await replicateService.generateEducationalVideo(topic, context);
    
    // Salvando o vídeo para o sistema de arquivos
    console.log(`[Video Generation] Salvando vídeo no sistema de arquivos`);
    const filePath = await replicateService.saveVideoToFile(video.url);
    const relativePath = path.relative(process.cwd(), filePath);
    
    console.log(`[Video Generation] Vídeo salvo em ${filePath}`);

    res.json({
      video: {
        ...video,
        filePath: relativePath,
        fileUrl: `/api/uploads/${path.basename(filePath)}`
      }
    });
  } catch (error) {
    console.error('Error generating educational video:', error);
    // Garantir que o tipo de conteúdo da resposta seja JSON
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.status(500).json({ error: error.message });
  }
});

// Rota para selecionar e salvar mídia do Freepik
router.post('/select-stock-media', requireAuth, async (req, res) => {
  try {
    const { mediaUrl, mediaType, title } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({ error: 'Media URL is required' });
    }

    // Garantir que o tipo de conteúdo da resposta seja JSON
    res.set('Content-Type', 'application/json; charset=utf-8');

    // Determinar o diretório de destino com base no tipo de mídia
    const isVideo = mediaType === 'video';
    const directory = isVideo ? 'uploads/ebook-videos' : 'uploads/ebook-images';
    
    // Gerar um nome de arquivo único
    const fileExtension = isVideo ? '.mp4' : '.jpg';
    const fileHash = crypto.createHash('md5').update(mediaUrl + Date.now()).digest('hex');
    const fileName = `freepik_stock_${fileHash}${fileExtension}`;
    const filePath = path.join(process.cwd(), directory, fileName);
    
    // Criar o diretório se não existir
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    console.log(`[Media Selection] Baixando ${mediaType} de ${mediaUrl}`);
    
    // Baixar o arquivo
    const response = await axios({
      url: mediaUrl,
      method: 'GET',
      responseType: 'stream'
    });

    // Salvar no sistema de arquivos
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`[Media Selection] Arquivo salvo em ${filePath}`);
        
        res.json({
          success: true,
          media: {
            title: title || 'Stock media from Freepik',
            type: mediaType,
            url: mediaUrl,
            filePath: relativePath,
            fileUrl: `/api/media-generation/uploads/${fileName}`
          }
        });
        resolve();
      });
      writer.on('error', (err) => {
        console.error(`[Media Selection] Erro ao salvar arquivo: ${err.message}`);
        reject(err);
        res.status(500).json({ error: 'Failed to save media file' });
      });
    });
  } catch (error) {
    console.error('Error selecting stock media:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para servir arquivos de upload
router.get('/uploads/:filename', (req, res) => {
  const { filename } = req.params;
  // Determinar o tipo de arquivo baseado na extensão
  const isVideo = filename.toLowerCase().endsWith('.mp4');
  
  // Selecionar o diretório correto com base no tipo de arquivo
  const directory = isVideo ? 'uploads/ebook-videos' : 'uploads/ebook-images';
  const filePath = path.join(process.cwd(), directory, filename);

  // Verificar se o arquivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Servir o arquivo
  res.sendFile(filePath);
});

export default router;