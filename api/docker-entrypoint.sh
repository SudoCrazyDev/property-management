#!/bin/bash
set -e

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
while ! nc -z mysql 3306; do
  sleep 1
done
echo "MySQL is ready!"

cd /var/www/html

# Set proper ownership for the working directory (run as root initially)
chown -R www-data:www-data /var/www/html

# Check if Laravel is already installed
if [ ! -f "artisan" ]; then
    echo "Laravel not found. Installing Laravel..."
    
    # Create a temporary directory for Laravel installation in /var/www (where www-data has access)
    TEMP_LARAVEL_DIR="/var/www/laravel-temp-$(date +%s)"
    mkdir -p "$TEMP_LARAVEL_DIR"
    chown -R www-data:www-data "$TEMP_LARAVEL_DIR"
    
    # Install Laravel in the temp directory
    su -s /bin/bash - www-data -c "cd /var/www && composer create-project laravel/laravel $TEMP_LARAVEL_DIR --prefer-dist --no-interaction"
    
    # Copy Laravel files to current directory, preserving existing files/directories
    cd "$TEMP_LARAVEL_DIR"
    
    # Copy each file/directory, but skip if it already exists in destination
    for item in * .[!.]*; do
        if [ -e "$item" ] && [ "$item" != "." ] && [ "$item" != ".." ]; then
            if [ -d "/var/www/html/$item" ]; then
                # Directory exists, merge contents
                cp -r "$item"/* "/var/www/html/$item/" 2>/dev/null || true
            elif [ ! -e "/var/www/html/$item" ]; then
                # File/directory doesn't exist, copy it
                cp -r "$item" "/var/www/html/" 2>/dev/null || true
            fi
        fi
    done
    
    cd /var/www/html
    
    # Clean up temp directory
    rm -rf "$TEMP_LARAVEL_DIR"
    
    echo "Laravel installed successfully!"
    
    # Set ownership again after installation
    chown -R www-data:www-data /var/www/html
fi

# Install/update dependencies
if [ -f "composer.json" ]; then
    echo "Installing Composer dependencies..."
    su -s /bin/bash - www-data -c "cd /var/www/html && composer install --no-interaction --prefer-dist --optimize-autoloader"
fi

# Set proper permissions for storage and cache
if [ -d "storage" ]; then
    chmod -R 775 storage bootstrap/cache 2>/dev/null || true
    chown -R www-data:www-data storage bootstrap/cache
fi

# Generate application key if .env doesn't exist or key is missing
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        chown www-data:www-data .env
    else
        echo "APP_KEY=" > .env
        chown www-data:www-data .env
    fi
    su -s /bin/bash - www-data -c "cd /var/www/html && php artisan key:generate --force"
fi

# Ensure proper permissions one final time
chown -R www-data:www-data /var/www/html
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# Start Laravel development server as www-data
echo "Starting Laravel development server..."
exec su -s /bin/bash - www-data -c "cd /var/www/html && php artisan serve --host=0.0.0.0 --port=8000"

