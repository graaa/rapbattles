"""Database migrations."""
import psycopg
from sqlalchemy import text


def run_migrations():
    """Run database migrations."""
    from config import settings
    
    # Connect to PostgreSQL
    conn = psycopg.connect(
        f"host={settings.postgres_host} port={settings.postgres_port} "
        f"dbname={settings.postgres_db} user={settings.postgres_user} "
        f"password={settings.postgres_password}"
    )
    
    try:
        cur = conn.cursor()
        
        # Migration 1: Add REPLICA to votechoice enum
        print("Running migration: Add REPLICA to votechoice enum...")
        try:
            cur.execute("ALTER TYPE votechoice ADD VALUE IF NOT EXISTS 'REPLICA';")
            conn.commit()
            print("✅ Migration 1 completed: REPLICA added to votechoice enum")
        except Exception as e:
            print(f"Migration 1 skipped or failed: {e}")
            conn.rollback()
        
        cur.close()
    finally:
        conn.close()


if __name__ == "__main__":
    run_migrations()

