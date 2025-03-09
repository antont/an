export CLOUDSDK_CORE_PROJECT=playsign-151522

# Upload HTML files with explicit content-type, charset, and encoding
gcloud storage cp -Z \
  --content-type="text/html; charset=utf-8" \
  --content-encoding="utf-8" \
  index.html gs://an.org/

gcloud storage cp -Z \
  --content-type="text/html; charset=utf-8" \
  --content-encoding="utf-8" \
  vaalit2025/index.html gs://an.org/vaalit2025/

# Other static assets
#gcloud storage cp -r at/ gs://an.org/
gcloud storage cp -r images/ gs://an.org/
