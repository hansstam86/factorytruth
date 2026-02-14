#!/bin/sh
# Ensure volume-mounted data dir is writable by the app user (uid 1001)
if [ -d /app/data ]; then
  chown -R 1001:1001 /app/data
fi
exec su-exec nextjs node server.js
