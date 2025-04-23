import os
import sys
import csv
import time
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()  # Load variables from .env file

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

INPUT_FILE = "HUMAN_9606_idmapping.dat"
TABLE_NAME = "uniprot_identifiers"
BATCH_SIZE = 10000  # Insert rows in batches for better performance

# --- Check Environment Variables ---
if not all([DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME]):
    print("Error: Database configuration is missing in the .env file.")
    print("Please ensure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME are set.")
    sys.exit(1)

# --- Database Operations ---

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME,
        )
        return conn
    except psycopg2.OperationalError as e:
        print(f"Error connecting to the database: {e}")
        sys.exit(1)

def setup_database(conn):
    """Creates the table and necessary indexes if they don't exist."""
    print(f"Setting up database table '{TABLE_NAME}'...")
    with conn.cursor() as cur:
        try:
            # Create Table
            cur.execute(sql.SQL("""
                CREATE TABLE IF NOT EXISTS {} (
                    id SERIAL PRIMARY KEY,
                    uniprot_accession VARCHAR(30) NOT NULL,
                    identifier_type VARCHAR(50) NOT NULL,
                    identifier_value TEXT NOT NULL
                );
            """).format(sql.Identifier(TABLE_NAME)))
            print(f"Table '{TABLE_NAME}' ensured.")

            # --- Create Indexes ---
            # 1. Index for prefix search (most common for autocomplete)
            index_prefix_name = f"idx_{TABLE_NAME}_value_prefix"
            print(f"Ensuring index '{index_prefix_name}' for prefix search...")
            cur.execute(sql.SQL("""
                CREATE INDEX IF NOT EXISTS {}
                ON {} (identifier_value text_pattern_ops);
            """).format(sql.Identifier(index_prefix_name), sql.Identifier(TABLE_NAME)))
            print(f"Index '{index_prefix_name}' ensured.")

            # 2. Optional: Index on type if you filter by it often
            index_type_name = f"idx_{TABLE_NAME}_type"
            print(f"Ensuring index '{index_type_name}' for type filtering...")
            cur.execute(sql.SQL("""
                CREATE INDEX IF NOT EXISTS {}
                ON {} (identifier_type);
            """).format(sql.Identifier(index_type_name), sql.Identifier(TABLE_NAME)))
            print(f"Index '{index_type_name}' ensured.")

            # 3. Optional: Index on accession
            index_accession_name = f"idx_{TABLE_NAME}_accession"
            print(f"Ensuring index '{index_accession_name}' for accession lookup...")
            cur.execute(sql.SQL("""
                CREATE INDEX IF NOT EXISTS {}
                ON {} (uniprot_accession);
            """).format(sql.Identifier(index_accession_name), sql.Identifier(TABLE_NAME)))
            print(f"Index '{index_accession_name}' ensured.")

            # --- Note on Trigram Index (for infix/substring search) ---
            # If you need fast ILIKE '%query%' searches, enable pg_trgm extension
            # and create a GIN index. Uncomment the following lines if needed.
            # print("Checking pg_trgm extension...")
            # cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
            # print("Extension pg_trgm ensured.")
            # index_trgm_name = f"idx_{TABLE_NAME}_value_trgm"
            # print(f"Ensuring GIN trigram index '{index_trgm_name}' for infix search...")
            # cur.execute(sql.SQL("""
            #     CREATE INDEX IF NOT EXISTS {}
            #     ON {} USING GIN (identifier_value gin_trgm_ops);
            # """).format(sql.Identifier(index_trgm_name), sql.Identifier(TABLE_NAME)))
            # print(f"Index '{index_trgm_name}' ensured.")

            conn.commit()
            print("Database setup complete.")

        except psycopg2.Error as e:
            print(f"Error during database setup: {e}")
            conn.rollback() # Roll back any partial changes
            sys.exit(1)

def ingest_data(conn):
    """Reads the input file and inserts data into the database."""
    print(f"Starting data ingestion from '{INPUT_FILE}'...")
    start_time = time.time()
    rows_processed = 0
    rows_inserted = 0
    batch_data = []
    # Define the allowed identifier types
    allowed_types = {'HGNC', 'Gene_Name', 'GeneCards', 'GeneWiki'}
    print(f"Filtering for identifier types: {', '.join(allowed_types)}")

    # Check if file exists
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Input file not found at '{INPUT_FILE}'")
        sys.exit(1)

    with conn.cursor() as cur:
        try:
            with open(INPUT_FILE, 'r', encoding='utf-8') as infile:
                # Use csv reader for robust tab splitting, even if values contain quotes (unlikely here)
                reader = csv.reader(infile, delimiter='\t', quotechar=None) # Assuming no quote characters

                for row in reader:
                    rows_processed += 1
                    if len(row) == 3:
                        accession, id_type, id_value = [item.strip() for item in row]
                        # Only include rows with allowed identifier types
                        if accession and id_type and id_value and id_type in allowed_types:
                            batch_data.append((accession, id_type, id_value))
                            rows_inserted += 1
                    else:
                        print(f"Warning: Skipping malformed row {rows_processed} (expected 3 columns): {row}")

                    # Insert batch when full
                    if len(batch_data) >= BATCH_SIZE:
                        insert_batch(cur, batch_data)
                        conn.commit() # Commit after each successful batch
                        print(f"  Processed: {rows_processed}, Inserted: {rows_inserted}...")
                        batch_data = [] # Clear the batch

                # Insert any remaining rows in the last batch
                if batch_data:
                    insert_batch(cur, batch_data)
                    conn.commit()
                    print(f"  Processed: {rows_processed}, Inserted: {rows_inserted}...")

            end_time = time.time()
            print("-" * 30)
            print("Data ingestion finished.")
            print(f"Total rows processed: {rows_processed}")
            print(f"Total rows inserted:  {rows_inserted}")
            print(f"Time taken: {end_time - start_time:.2f} seconds")

        except psycopg2.Error as e:
            print(f"\nError during data insertion: {e}")
            print("Rolling back last transaction...")
            conn.rollback()
            sys.exit(1)
        except FileNotFoundError:
             print(f"Error: Input file not found at '{INPUT_FILE}'")
             sys.exit(1)
        except Exception as e:
            print(f"\nAn unexpected error occurred: {e}")
            conn.rollback() # Roll back just in case
            sys.exit(1)

def insert_batch(cursor, data):
    """Inserts a batch of data using execute_values for efficiency."""
    # Using execute_values is generally efficient with psycopg2
    from psycopg2.extras import execute_values
    query = sql.SQL("INSERT INTO {} (uniprot_accession, identifier_type, identifier_value) VALUES %s").format(sql.Identifier(TABLE_NAME))
    execute_values(cursor, query, data)


# --- Main Execution ---
if __name__ == "__main__":
    db_conn = None # Initialize to None
    try:
        db_conn = get_db_connection()
        if db_conn:
            setup_database(db_conn)
            # Optional: Truncate table before loading if you want a clean slate
            # print(f"Warning: Truncating table '{TABLE_NAME}' before loading.")
            # with db_conn.cursor() as cur:
            #     cur.execute(sql.SQL("TRUNCATE TABLE {} RESTART IDENTITY;").format(sql.Identifier(TABLE_NAME)))
            #     db_conn.commit()
            ingest_data(db_conn)
    finally:
        if db_conn:
            db_conn.close()
            print("Database connection closed.")