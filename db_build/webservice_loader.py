import os
import sys
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

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

# Table configurations - file to table mapping
TABLE_CONFIG = {
    "annotations": {
        "file": "omnipath_webservice_annotations.tsv",
        "table": "annotations",
        "schema": """
            id SERIAL PRIMARY KEY,
            uniprot TEXT,
            genesymbol TEXT,
            entity_type VARCHAR(50),
            source TEXT,
            label TEXT,
            value TEXT,
            record_id BIGINT
        """,
        "indexes": [
            "CREATE INDEX IF NOT EXISTS idx_annotations_uniprot ON annotations (uniprot);",
            "CREATE INDEX IF NOT EXISTS idx_annotations_genesymbol ON annotations (genesymbol);",
            "CREATE INDEX IF NOT EXISTS idx_annotations_source ON annotations (source);",
            "CREATE INDEX IF NOT EXISTS idx_annotations_label ON annotations (label);"
        ]
    },
    "complexes": {
        "file": "omnipath_webservice_complexes.tsv",
        "table": "complexes",
        "schema": """
            id SERIAL PRIMARY KEY,
            name TEXT,
            components TEXT,
            components_genesymbols TEXT,
            stoichiometry TEXT,
            sources TEXT,
            "references" TEXT,
            identifiers TEXT
        """,
        "indexes": [
            "CREATE INDEX IF NOT EXISTS idx_complexes_name ON complexes (name);",
            "CREATE INDEX IF NOT EXISTS idx_complexes_sources ON complexes (sources);"
        ]
    },
    "enz_sub": {
        "file": "omnipath_webservice_enz_sub.tsv",
        "table": "enz_sub",
        "schema": """
            id SERIAL PRIMARY KEY,
            enzyme TEXT,
            enzyme_genesymbol TEXT,
            substrate TEXT,
            substrate_genesymbol TEXT,
            isoforms TEXT,
            residue_type VARCHAR(10),
            residue_offset INTEGER,
            modification TEXT,
            sources TEXT,
            "references" TEXT,
            curation_effort INTEGER,
            ncbi_tax_id INTEGER
        """,
        "indexes": [
            "CREATE INDEX IF NOT EXISTS idx_enz_sub_enzyme ON enz_sub (enzyme);",
            "CREATE INDEX IF NOT EXISTS idx_enz_sub_substrate ON enz_sub (substrate);",
            "CREATE INDEX IF NOT EXISTS idx_enz_sub_enzyme_genesymbol ON enz_sub (enzyme_genesymbol);",
            "CREATE INDEX IF NOT EXISTS idx_enz_sub_substrate_genesymbol ON enz_sub (substrate_genesymbol);"
        ]
    },
    "interactions": {
        "file": "omnipath_webservice_interactions.tsv",
        "table": "interactions",
        "schema": """
            id SERIAL PRIMARY KEY,
            source TEXT,
            target TEXT,
            source_genesymbol TEXT,
            target_genesymbol TEXT,
            is_directed BOOLEAN,
            is_stimulation BOOLEAN,
            is_inhibition BOOLEAN,
            consensus_direction BOOLEAN,
            consensus_stimulation BOOLEAN,
            consensus_inhibition BOOLEAN,
            sources TEXT,
            "references" TEXT,
            omnipath BOOLEAN,
            kinaseextra BOOLEAN,
            ligrecextra BOOLEAN,
            pathwayextra BOOLEAN,
            mirnatarget BOOLEAN,
            dorothea BOOLEAN,
            collectri BOOLEAN,
            tf_target BOOLEAN,
            lncrna_mrna BOOLEAN,
            tf_mirna BOOLEAN,
            small_molecule BOOLEAN,
            dorothea_curated BOOLEAN,
            dorothea_chipseq BOOLEAN,
            dorothea_tfbs BOOLEAN,
            dorothea_coexp BOOLEAN,
            dorothea_level VARCHAR(10),
            "type" TEXT,
            curation_effort INTEGER,
            extra_attrs JSONB,
            evidences JSONB,
            ncbi_tax_id_source INTEGER,
            entity_type_source VARCHAR(50),
            ncbi_tax_id_target INTEGER,
            entity_type_target VARCHAR(50)
        """,
        "indexes": [
            "CREATE INDEX IF NOT EXISTS idx_interactions_source ON interactions (source);",
            "CREATE INDEX IF NOT EXISTS idx_interactions_target ON interactions (target);",
            "CREATE INDEX IF NOT EXISTS idx_interactions_source_genesymbol ON interactions (source_genesymbol);",
            "CREATE INDEX IF NOT EXISTS idx_interactions_target_genesymbol ON interactions (target_genesymbol);",
            "CREATE INDEX IF NOT EXISTS idx_interactions_pair ON interactions (source, target);",
            "CREATE INDEX IF NOT EXISTS idx_interactions_sources ON interactions (sources);",
            "CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions (\"type\");"
        ]
    },
    "intercell": {
        "file": "omnipath_webservice_intercell.tsv",
        "table": "intercell",
        "schema": """
            id SERIAL PRIMARY KEY,
            category TEXT,
            parent TEXT,
            database TEXT,
            scope TEXT,
            aspect TEXT,
            source TEXT,
            uniprot TEXT,
            genesymbol TEXT,
            entity_type VARCHAR(50),
            consensus_score INTEGER,
            transmitter BOOLEAN,
            receiver BOOLEAN,
            secreted BOOLEAN,
            plasma_membrane_transmembrane BOOLEAN,
            plasma_membrane_peripheral BOOLEAN
        """,
        "indexes": [
            "CREATE INDEX IF NOT EXISTS idx_intercell_uniprot ON intercell (uniprot);",
            "CREATE INDEX IF NOT EXISTS idx_intercell_genesymbol ON intercell (genesymbol);",
            "CREATE INDEX IF NOT EXISTS idx_intercell_category ON intercell (category);",
            "CREATE INDEX IF NOT EXISTS idx_intercell_database ON intercell (database);"
        ]
    }
}

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

def create_table(conn, table_name, table_config):
    """Creates a table with the specified schema."""
    print(f"Creating table '{table_name}'...")
    
    with conn.cursor() as cur:
        try:
            # Drop table if exists
            cur.execute(sql.SQL("DROP TABLE IF EXISTS {} CASCADE;").format(sql.Identifier(table_name)))
            
            # Create table
            create_sql = f"CREATE TABLE {table_name} ({table_config['schema']})"
            cur.execute(create_sql)
            
            conn.commit()
            print(f"Table '{table_name}' created successfully.")
            
        except psycopg2.Error as e:
            print(f"Error creating table '{table_name}': {e}")
            conn.rollback()
            raise

def load_data_with_copy(conn, table_name, file_path):
    """Loads data using PostgreSQL COPY command for maximum performance."""
    print(f"Loading data into '{table_name}' from '{os.path.basename(file_path)}'...")
    start_time = time.time()
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File not found at '{file_path}'")
        return False
    
    with conn.cursor() as cur:
        try:
            # Get column names from the TSV file header (excluding the id column which is auto-generated)
            with open(file_path, 'r', encoding='utf-8') as f:
                header_line = f.readline().strip()
                columns = header_line.split('\t')
            
            # Create column list for COPY command
            column_list = ', '.join([sql.Identifier(col).as_string(cur) for col in columns])
            
            # Use COPY command for bulk loading
            with open(file_path, 'r', encoding='utf-8') as f:
                # Skip header line and copy data
                next(f)  # Skip header
                copy_sql = f"COPY {table_name} ({column_list}) FROM STDIN WITH CSV DELIMITER E'\\t' NULL AS ''"
                cur.copy_expert(copy_sql, f)
            
            conn.commit()
            
            # Get row count
            cur.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(sql.Identifier(table_name)))
            row_count = cur.fetchone()[0]
            
            end_time = time.time()
            print(f"Successfully loaded {row_count:,} rows into '{table_name}' in {end_time - start_time:.2f} seconds")
            return True
            
        except psycopg2.Error as e:
            print(f"Error loading data into '{table_name}': {e}")
            conn.rollback()
            raise
        except Exception as e:
            print(f"Unexpected error loading '{table_name}': {e}")
            conn.rollback()
            raise

def create_indexes(conn, table_name, indexes):
    """Creates indexes for a table."""
    print(f"Creating indexes for table '{table_name}'...")
    start_time = time.time()
    
    with conn.cursor() as cur:
        try:
            for index_sql in indexes:
                cur.execute(index_sql)
            
            conn.commit()
            
            end_time = time.time()
            print(f"Indexes created for '{table_name}' in {end_time - start_time:.2f} seconds")
            
        except psycopg2.Error as e:
            print(f"Error creating indexes for '{table_name}': {e}")
            conn.rollback()
            raise

def process_table(conn, config, skip_indexes=False):
    """Process a single table: create, load data, and optionally create indexes."""
    table_name = config["table"]
    file_path = os.path.join(DATA_DIR, config["file"])
    
    print(f"\n{'='*60}")
    print(f"Processing table: {table_name}")
    print(f"Source file: {config['file']}")
    print(f"{'='*60}")
    
    # Create table
    create_table(conn, table_name, config)
    
    # Load data
    if load_data_with_copy(conn, table_name, file_path):
        # Create indexes if requested
        if not skip_indexes and config.get("indexes"):
            create_indexes(conn, table_name, config["indexes"])
        
        return True
    
    return False

def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Load Omnipath webservice data into PostgreSQL")
    parser.add_argument("--table", help="Load specific table only", 
                       choices=list(TABLE_CONFIG.keys()))
    parser.add_argument("--skip-indexes", action="store_true", 
                       help="Skip creating indexes (for faster loading)")
    parser.add_argument("--indexes-only", action="store_true", 
                       help="Only create indexes for existing tables")
    
    args = parser.parse_args()
    
    conn = None
    try:
        conn = get_db_connection()
        print("Connected to PostgreSQL database successfully.")
        
        if args.indexes_only:
            # Only create indexes
            print("\nCreating indexes for all tables...")
            for table_key, config in TABLE_CONFIG.items():
                if config.get("indexes"):
                    create_indexes(conn, config["table"], config["indexes"])
            print("\nAll indexes created successfully!")
            
        elif args.table:
            # Process single table
            if args.table in TABLE_CONFIG:
                config = TABLE_CONFIG[args.table]
                success = process_table(conn, config, args.skip_indexes)
                if success:
                    print(f"\nTable '{args.table}' processed successfully!")
                else:
                    print(f"\nFailed to process table '{args.table}'")
                    sys.exit(1)
            else:
                print(f"Unknown table: {args.table}")
                sys.exit(1)
        
        else:
            # Process all tables
            print("\nProcessing all webservice data tables...")
            print(f"Found {len(TABLE_CONFIG)} tables to process")
            
            # Process tables in order of size (smallest first for faster feedback)
            table_order = [
                "complexes",      # ~35K rows
                "enz_sub",        # ~93K rows  
                "intercell",      # ~332K rows
                "interactions",   # ~1.2M rows
                "annotations"     # ~31M rows
            ]
            
            total_start_time = time.time()
            successful_tables = 0
            
            for table_key in table_order:
                if table_key in TABLE_CONFIG:
                    config = TABLE_CONFIG[table_key]
                    if process_table(conn, config, args.skip_indexes):
                        successful_tables += 1
                    else:
                        print(f"Failed to process table '{table_key}', stopping.")
                        sys.exit(1)
            
            total_end_time = time.time()
            
            print(f"\n{'='*60}")
            print(f"Data loading completed!")
            print(f"Successfully processed {successful_tables}/{len(table_order)} tables")
            print(f"Total time: {total_end_time - total_start_time:.2f} seconds")
            print(f"{'='*60}")
            
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    main()