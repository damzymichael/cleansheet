#!/bin/bash

# Check if a message argument was provided
if [ -z "$1" ]; then
    echo "Error: Migration message is required." >&2
    echo "Usage: ./make_migration.sh \"your migration message\"" >&2
    exit 1
fi

MIGRATION_MESSAGE="$1"

# Run the Alembic migration command
uv run python -m alembic revision --autogenerate -m "$MIGRATION_MESSAGE"