FROM debian:bullseye-slim AS builder

RUN apt-get update && apt-get install -y curl file && rm -rf /var/lib/apt/lists/*

RUN curl -L -o /sops https://github.com/getsops/sops/releases/download/v3.11.0/sops-v3.11.0.linux.amd64 \
    && chmod +x /sops \
    && echo "Checking binary format..." \
    && file /sops \
    && echo "Verifying version..." \
    && /sops --version


FROM quay.io/argoproj/argocd:v3.1.9

USER root
COPY --from=builder /sops /usr/local/bin/sops
RUN chmod +x /usr/local/bin/sops && /usr/local/bin/sops --version
USER argocd

ENTRYPOINT ["/usr/local/bin/argocd-repo-server"]
CMD ["--loglevel", "info"]
