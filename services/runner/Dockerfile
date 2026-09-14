FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci --ignore-scripts
COPY services/analyzer/requirements.txt /tmp/requirements.txt
RUN python3 -m venv /opt/analyzer && /opt/analyzer/bin/pip install --no-cache-dir -r /tmp/requirements.txt
RUN npm install --prefix /opt/foundry @foundry-rs/forge-linux-amd64@1.7.1 --ignore-scripts && curl -fL https://github.com/ethereum/solidity/releases/download/v0.8.26/solc-static-linux -o /usr/local/bin/solc && chmod 755 /usr/local/bin/solc
COPY apps/web/lib apps/web/lib
COPY services/analyzer/*.py services/analyzer/
COPY services/analyzer/fixtures services/analyzer/fixtures
COPY services/runner services/runner
RUN mkdir -p /work && chown node:node /work
ENV WHITEHAT_ANALYZER_ROOT=/app/services/analyzer WHITEHAT_ANALYZER_WORK_DIR=/work WHITEHAT_PYTHON=/opt/analyzer/bin/python WHITEHAT_SOLC=/usr/local/bin/solc WHITEHAT_FORGE=/opt/foundry/node_modules/@foundry-rs/forge-linux-amd64/bin/forge WHITEHAT_AI_PROVIDER=ollama WHITEHAT_AI_MODEL=qwen2.5-coder:7b
USER node
CMD ["node","--import","tsx","services/runner/main.ts"]

