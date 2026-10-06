# Document retrieval milestone

Open WebUI uses paperlessngx-tika-1 with apache/tika:3.2.1.0-full.
Admin Documents settings use Tika at http://tika:9998.
Settings are stored in WebUI persistent data.

The external localai-extraction network connects WebUI and Tika.
WebUI's startup script restores its attachment on recreation.
In Portainer, the Paperless tika service must join both default and
localai-extraction. Declare localai-extraction as an external network.
Keep the other Paperless services on their existing default network.
Sharing Tika does not grant access to the Paperless document library.

Embeddings use sentence-transformers/all-MiniLM-L6-v2 locally.
Character chunks are 1000 with overlap 100. Top K is 3.
Retrieval bypass, full-context mode, and hybrid search are off.

## Acceptance on 2026-10-06

PDF upload, text retrieval, and citations worked.
Embedded URL targets were absent from displayed retrieved passages.
The original PDF contains 12 external URLs and 12 relative file links.
The model incorrectly inferred that the links were internal.
Link-aware extraction remains a follow-up.
Paperless library integration and scanned-document OCR remain unvalidated.
