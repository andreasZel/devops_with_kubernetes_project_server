FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    python3 \
    gnupg && \
    curl -sSL https://sdk.cloud.google.com | bash && \
    apt-get clean

ENV PATH="/root/google-cloud-sdk/bin:${PATH}"

WORKDIR /usr/src/app
COPY backup.sh .

CMD ["./backup.sh"]
