FROM debian:bookworm-slim

# Install required tools
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    bash \
    python3 \
    gnupg \
    ca-certificates && \
    curl -sSL https://sdk.cloud.google.com | bash && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PATH="/root/google-cloud-sdk/bin:${PATH}"

WORKDIR /usr/src/app
COPY backup.sh .

RUN chmod +x backup.sh

# Use bash as entrypoint so we can pass constructed URL as env
ENTRYPOINT ["./backup.sh"]
