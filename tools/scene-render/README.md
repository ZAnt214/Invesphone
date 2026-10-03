# Gerador das cenas do Caso 01 (fotos de perícia)

Gera as 13 cenas de `public/evidence/case01/new/` (cômodos, closes e fachada). Não é usado pelo app em tempo de execução; serve para ajustar ou refazer as imagens.

- `engine.py`: motor de cena com câmera de perspectiva real e faces planas com sombreamento suave, sem contorno (mesma técnica dos retratos).
- `kit.py`: peças reutilizáveis (casca do cômodo, porta, janela, quadro, sofá, mesa, cama, cadeira, livros...).
- `scenes1.py`, `scenes2.py`, `escritorio3d.py`: uma função por cena, com o ponto de vista de foto tirada por uma pessoa.
- `phonecam.py`: efeito de foto de celular antigo (baixa resolução, ruído, flash estourado, vinheta, compressão, data da câmera).
- `finalize.py`: renderiza, aplica o efeito, a plaqueta numerada e a régua, e grava os JPG em `public/evidence/case01/new/`.

Uso (precisa de Python 3 com numpy, opencv-python e Pillow, e Node com Playwright/Chromium):

```
cd tools/scene-render
python3 finalize.py                 # todas as cenas
python3 finalize.py fechadura_porta # só uma
```

Regras de canon das cenas: ver `docs/CASE01_CANON.json`. Sem pessoas, sem violência gráfica, sem arrombamento, valores à vista, mundo de 2002.
