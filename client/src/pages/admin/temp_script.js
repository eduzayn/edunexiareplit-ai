const fs = require('fs');

// Ler o arquivo
let content = fs.readFileSync('discipline-content-page.tsx', 'utf8');

// Substituir o primeiro bloco de descrição
content = content.replace(
    /{videoForm.watch\("videoSource"\) === "youtube"\s+\? "Cole a URL completa do vídeo no YouTube\."\s+: videoForm.watch\("videoSource"\) === "onedrive"\s+\? "Cole a URL de compartilhamento do OneDrive\."\s+: "Cole a URL de upload direto do vídeo\."}/g,
    `{videoForm.watch("videoSource") === "youtube"
                        ? "Cole a URL completa do vídeo no YouTube."
                        : videoForm.watch("videoSource") === "onedrive"
                        ? "Cole a URL de compartilhamento do OneDrive."
                        : videoForm.watch("videoSource") === "google_drive"
                        ? "Cole a URL de compartilhamento do Google Drive."
                        : videoForm.watch("videoSource") === "vimeo"
                        ? "Cole a URL completa do vídeo no Vimeo."
                        : "Cole a URL de upload direto do vídeo."}`
);

// Escrever o arquivo modificado
fs.writeFileSync('discipline-content-page.tsx', content);
console.log('Arquivo modificado com sucesso!');
