# Unprivileged-варіант nginx: працює не від root і слухає порт 8080
FROM nginxinc/nginx-unprivileged:1.27.3-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 8080
