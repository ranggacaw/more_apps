FROM php:8.4-fpm-alpine

WORKDIR /var/www/html

RUN apk add --no-cache \
    bash \
    curl \
    git \
    icu-dev \
    libpq-dev \
    libzip-dev \
    nodejs \
    npm \
    oniguruma-dev \
    postgresql-client \
    unzip \
    zip \
    && docker-php-ext-install intl pdo_pgsql zip \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY docker/entrypoint.sh /usr/local/bin/clinic-entrypoint
RUN chmod +x /usr/local/bin/clinic-entrypoint

EXPOSE 9000

ENTRYPOINT ["clinic-entrypoint"]
CMD ["php-fpm"]
