
# #!/bin/bash

# # MySQL credentials
# DB_USER="root"
# DB_PASS="xu4h91^HBNocz57ge"
# DB_NAME="vrmpool"

# # Directory to store exported data
# EXPORT_DIR="/var/satishdata/"

# # Specific table from which data will be exported
# TABLE_NAME="agentdata"

# # Calculate the date 6 months ago
# SIX_MONTHS_AGO=$(date -d "6 months ago" +"%Y-%m-%d")

# # Generate filename for export
# EXPORT_FILE="$EXPORT_DIR/${TABLE_NAME}_export_$(date +"%Y%m%d%H%M%S").sql"

# # Export data older than 6 months from today's date
# mysqldump -u"$DB_USER" -p"$DB_PASS" --no-create-db --no-create-info --where="createdAt < '$SIX_MONTHS_AGO'" "$DB_NAME" "$TABLE_NAME" > "$E$

# # Remove the exported data from the table
# mysql -u"$DB_USER" -p"$DB_PASS" -e "DELETE FROM $TABLE_NAME WHERE createdAt < '$SIX_MONTHS_AGO';" "$DB_NAME"


#!/bin/bash

# Read the .env file and set the variables
while IFS='=' read -r key value; do
    case "$key" in
        DB_USER) DB_USER="$value" ;;
        DB_PASSWORD) DB_PASSWORD="$value" ;;
        DB_NAME) DB_NAME="$value" ;;
        *) ;;
    esac
done < .env

# Directory to store exported data
EXPORT_DIR="/var/satishdata/"

# Specific table from which data will be exported
TABLE_NAME="agentdata"

# Calculate the date 6 months ago
SIX_MONTHS_AGO=$(date -d "6 months ago" +"%Y-%m-%d")

# Generate filename for export
EXPORT_FILE="$EXPORT_DIR/${TABLE_NAME}_export_$(date +"%Y%m%d%H%M%S").sql"

# Export data older than 6 months from today's date
mysqldump -u"$DB_USER" -p"$DB_PASSWORD" --no-create-db --no-create-info --where="createdAt < '$SIX_MONTHS_AGO'" "$DB_NAME" "$TABLE_NAME" > "$EXPORT_FILE"

# Remove the exported data from the table
mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "DELETE FROM $TABLE_NAME WHERE createdAt < '$SIX_MONTHS_AGO';" "$DB_NAME"

