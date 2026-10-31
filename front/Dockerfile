# Unprivileged-варіант nginx: працює не від root і слухає порт 8080
FROM nginxinc/nginx-unprivileged:1.27.3-alpine
# Шаблон: entrypoint підставляє ${BACKEND_URL} і ${NGINX_LOCAL_RESOLVERS} при старті
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY index.html /usr/share/nginx/html/index.html
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
# Локально (compose) — сервіс back; в ECS перевизначається DNS внутрішнього ALB
ENV BACKEND_URL=http://back:5000
EXPOSE 8080
