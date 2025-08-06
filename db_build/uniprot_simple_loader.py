import os
import sys
import csv
import time
import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()  # Load variables from .env file

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

INPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "uniprotkb_taxonomy_id_9606_OR_taxonomy_2025_07_18.tsv")
BATCH_SIZE = 1000  # Insert rows in batches for better performance

# Table names
PROTEINS_TABLE = "uniprot_proteins"
IDENTIFIERS_TABLE = "uniprot_identifiers"

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
    """Creates the tables without indexes."""
    print(f"Setting up database tables...")
    with conn.cursor() as cur:
        try:
            # Enable pg_trgm extension for fuzzy search
            print("Ensuring pg_trgm extension...")
            cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
            
            # Drop existing tables if they exist with wrong schema
            print("Dropping existing tables if they exist...")
            cur.execute(sql.SQL("DROP TABLE IF EXISTS {} CASCADE;").format(sql.Identifier(IDENTIFIERS_TABLE)))
            cur.execute(sql.SQL("DROP TABLE IF EXISTS {} CASCADE;").format(sql.Identifier(PROTEINS_TABLE)))
            
            # Create main proteins table with all columns
            print(f"Creating table '{PROTEINS_TABLE}'...")
            cur.execute(sql.SQL("""
                CREATE TABLE IF NOT EXISTS {} (
                    id SERIAL PRIMARY KEY,
                    entry VARCHAR(30) UNIQUE NOT NULL,
                    entry_name TEXT,
                    protein_names TEXT,
                    length INTEGER,
                    mass INTEGER,
                    sequence TEXT,
                    gene_names_primary TEXT,
                    gene_names_synonym TEXT,
                    organism_id TEXT,
                    involvement_in_disease TEXT,
                    mutagenesis TEXT,
                    subcellular_location TEXT,
                    post_translational_modification TEXT,
                    pubmed_id TEXT,
                    function_cc TEXT,
                    ensembl TEXT,
                    kegg TEXT,
                    pathway TEXT,
                    activity_regulation TEXT,
                    keywords TEXT,
                    ec_number TEXT,
                    gene_ontology TEXT,
                    transmembrane TEXT,
                    protein_families TEXT,
                    refseq TEXT,
                    alphafolddb VARCHAR(30),
                    pdb TEXT,
                    chembl TEXT,
                    phosphositeplus TEXT,
                    signor TEXT,
                    pathwaycommons TEXT,
                    intact TEXT,
                    biogrid TEXT,
                    complexportal TEXT
                );
            """).format(sql.Identifier(PROTEINS_TABLE)))
            
            # Create identifiers table for ID mapping
            print(f"Creating table '{IDENTIFIERS_TABLE}'...")
            cur.execute(sql.SQL("""
                CREATE TABLE IF NOT EXISTS {} (
                    id SERIAL PRIMARY KEY,
                    protein_id INTEGER REFERENCES {} (id) ON DELETE CASCADE,
                    uniprot_accession VARCHAR(30) NOT NULL,
                    identifier_value TEXT NOT NULL,
                    identifier_type VARCHAR(50) NOT NULL,
                    taxon_id TEXT
                );
            """).format(sql.Identifier(IDENTIFIERS_TABLE), sql.Identifier(PROTEINS_TABLE)))
            
            conn.commit()
            print("Database tables created.")
            
        except psycopg2.Error as e:
            print(f"Error during database setup: {e}")
            conn.rollback()
            sys.exit(1)

def populate_identifiers(conn):
    """Populates the identifiers table using SQL queries from the proteins table."""
    print("Populating identifiers table...")
    start_time = time.time()
    
    with conn.cursor() as cur:
        try:
            # 1. UniProt IDs (entry column)
            print("  Adding UniProt IDs...")
            cur.execute(sql.SQL("""
                INSERT INTO {} (protein_id, uniprot_accession, identifier_value, identifier_type, taxon_id)
                SELECT id, entry, entry, 'uniprot_accession', organism_id FROM {}
                WHERE entry IS NOT NULL AND entry != ''
            """).format(sql.Identifier(IDENTIFIERS_TABLE), sql.Identifier(PROTEINS_TABLE)))
            uniprot_count = cur.rowcount
            
            # 2. Primary gene names
            print("  Adding primary gene names...")
            cur.execute(sql.SQL("""
                INSERT INTO {} (protein_id, uniprot_accession, identifier_value, identifier_type, taxon_id)
                SELECT id, entry, gene_names_primary, 'gene_primary', organism_id FROM {}
                WHERE gene_names_primary IS NOT NULL AND gene_names_primary != ''
            """).format(sql.Identifier(IDENTIFIERS_TABLE), sql.Identifier(PROTEINS_TABLE)))
            gene_primary_count = cur.rowcount
            
            # 3. Gene synonyms (split space-separated)
            print("  Adding gene synonyms...")
            cur.execute(sql.SQL("""
                INSERT INTO {} (protein_id, uniprot_accession, identifier_value, identifier_type, taxon_id)
                SELECT id, entry, trim(synonym), 'gene_synonym', organism_id
                FROM (
                    SELECT id, entry, organism_id, unnest(string_to_array(gene_names_synonym, ' ')) as synonym
                    FROM {}
                    WHERE gene_names_synonym IS NOT NULL AND gene_names_synonym != ''
                ) subq
                WHERE trim(synonym) != ''
            """).format(sql.Identifier(IDENTIFIERS_TABLE), sql.Identifier(PROTEINS_TABLE)))
            gene_synonym_count = cur.rowcount
            
            # 4. Protein names (extract primary name and parenthetical names)
            print("  Adding protein names...")
            # First, add the primary protein name (everything before first parenthesis)
            cur.execute(sql.SQL("""
                INSERT INTO {} (protein_id, uniprot_accession, identifier_value, identifier_type, taxon_id)
                SELECT id, entry,
                       CASE 
                           WHEN position('(' in protein_names) > 0 THEN 
                               trim(substring(protein_names from 1 for position('(' in protein_names) - 1))
                           ELSE trim(protein_names)
                       END,
                       'protein_primary', organism_id
                FROM {}
                WHERE protein_names IS NOT NULL AND protein_names != ''
                AND CASE 
                        WHEN position('(' in protein_names) > 0 THEN 
                            trim(substring(protein_names from 1 for position('(' in protein_names) - 1))
                        ELSE trim(protein_names)
                    END != ''
            """).format(sql.Identifier(IDENTIFIERS_TABLE), sql.Identifier(PROTEINS_TABLE)))
            protein_primary_count = cur.rowcount
            
            # Then, add parenthetical protein names
            cur.execute(sql.SQL("""
                INSERT INTO {} (protein_id, uniprot_accession, identifier_value, identifier_type, taxon_id)
                SELECT id, entry,
                       trim(regexp_replace(match[1], '^\\s*|\\s*$', '', 'g')),
                       'protein_alternative', organism_id
                FROM (
                    SELECT id, entry, organism_id, regexp_split_to_array(protein_names, '\\([^)]+\\)') as parts,
                           regexp_matches(protein_names, '\\(([^)]+)\\)', 'g') as match
                    FROM {}
                    WHERE protein_names IS NOT NULL AND protein_names != ''
                    AND protein_names ~ '\\([^)]+\\)'
                ) subq
                WHERE trim(regexp_replace(match[1], '^\\s*|\\s*$', '', 'g')) != ''
            """).format(sql.Identifier(IDENTIFIERS_TABLE), sql.Identifier(PROTEINS_TABLE)))
            protein_paren_count = cur.rowcount
            
            conn.commit()
            
            end_time = time.time()
            total_identifiers = uniprot_count + gene_primary_count + gene_synonym_count + protein_primary_count + protein_paren_count
            
            print(f"Identifiers populated successfully:")
            print(f"  UniProt IDs: {uniprot_count}")
            print(f"  Primary gene names: {gene_primary_count}")
            print(f"  Gene synonyms: {gene_synonym_count}")
            print(f"  Primary protein names: {protein_primary_count}")
            print(f"  Parenthetical protein names: {protein_paren_count}")
            print(f"  Total identifiers: {total_identifiers}")
            print(f"  Time taken: {end_time - start_time:.2f} seconds")
            
        except psycopg2.Error as e:
            print(f"Error during identifier population: {e}")
            conn.rollback()
            sys.exit(1)

def ingest_proteins(conn):
    """Reads the input file and inserts protein data into the database."""
    print(f"Starting protein data ingestion from '{INPUT_FILE}'...")
    start_time = time.time()
    rows_processed = 0
    proteins_inserted = 0
    
    # Batch for proteins
    proteins_batch = []
    
    # Check if file exists
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Input file not found at '{INPUT_FILE}'")
        sys.exit(1)
    
    with conn.cursor() as cur:
        try:
            with open(INPUT_FILE, 'r', encoding='utf-8') as infile:
                reader = csv.DictReader(infile, delimiter='\t')
                
                for row in reader:
                    rows_processed += 1
                    
                    # Extract entry (UniProt accession)
                    entry = row['Entry']
                    if not entry:
                        continue
                    
                    # Prepare main protein record with all columns
                    protein_data = (
                        entry,
                        row.get('Entry Name', ''),
                        row.get('Protein names', ''),
                        int(row['Length']) if row.get('Length', '').isdigit() else None,
                        int(row['Mass']) if row.get('Mass', '').isdigit() else None,
                        row.get('Sequence', ''),
                        row.get('Gene Names (primary)', ''),
                        row.get('Gene Names (synonym)', ''),
                        row.get('Organism (ID)', ''),
                        row.get('Involvement in disease', ''),
                        row.get('Mutagenesis', ''),
                        row.get('Subcellular location [CC]', ''),
                        row.get('Post-translational modification', ''),
                        row.get('PubMed ID', ''),
                        row.get('Function [CC]', ''),
                        row.get('Ensembl', ''),
                        row.get('KEGG', ''),
                        row.get('Pathway', ''),
                        row.get('Activity regulation', ''),
                        row.get('Keywords', ''),
                        row.get('EC number', ''),
                        row.get('Gene Ontology (GO)', ''),
                        row.get('Transmembrane', ''),
                        row.get('Protein families', ''),
                        row.get('RefSeq', ''),
                        row.get('AlphaFoldDB', ''),
                        row.get('PDB', ''),
                        row.get('ChEMBL', ''),
                        row.get('PhosphoSitePlus', ''),
                        row.get('SIGNOR', ''),
                        row.get('PathwayCommons', ''),
                        row.get('IntAct', ''),
                        row.get('BioGRID', ''),
                        row.get('ComplexPortal', '')
                    )
                    proteins_batch.append(protein_data)
                    proteins_inserted += 1
                    
                    # Insert batches when full
                    if len(proteins_batch) >= BATCH_SIZE:
                        insert_proteins_batch(cur, proteins_batch)
                        conn.commit()
                        
                        print(f"  Processed: {rows_processed}, Proteins: {proteins_inserted}...")
                        
                        # Clear batch
                        proteins_batch = []
                
                # Insert any remaining rows in the last batch
                if proteins_batch:
                    insert_proteins_batch(cur, proteins_batch)
                    conn.commit()
                    
                    print(f"  Processed: {rows_processed}, Proteins: {proteins_inserted}...")
                
                end_time = time.time()
                print("-" * 50)
                print("Protein data ingestion finished.")
                print(f"Total rows processed: {rows_processed}")
                print(f"Total proteins inserted: {proteins_inserted}")
                print(f"Time taken: {end_time - start_time:.2f} seconds")
                
        except psycopg2.Error as e:
            print(f"\nError during protein insertion: {e}")
            print("Rolling back last transaction...")
            conn.rollback()
            sys.exit(1)
        except Exception as e:
            print(f"\nAn unexpected error occurred: {e}")
            conn.rollback()
            sys.exit(1)

def insert_proteins_batch(cursor, proteins_data):
    """Inserts a batch of protein data."""
    if not proteins_data:
        return
    
    columns = [
        'entry', 'entry_name', 'protein_names', 'length', 'mass', 'sequence',
        'gene_names_primary', 'gene_names_synonym', 'organism_id',
        'involvement_in_disease', 'mutagenesis', 'subcellular_location',
        'post_translational_modification', 'pubmed_id', 'function_cc',
        'ensembl', 'kegg', 'pathway', 'activity_regulation', 'keywords',
        'ec_number', 'gene_ontology', 'transmembrane', 'protein_families',
        'refseq', 'alphafolddb', 'pdb', 'chembl', 'phosphositeplus',
        'signor', 'pathwaycommons', 'intact', 'biogrid', 'complexportal'
    ]
    
    query = sql.SQL("INSERT INTO {} ({}) VALUES %s ON CONFLICT (entry) DO UPDATE SET entry = EXCLUDED.entry").format(
        sql.Identifier(PROTEINS_TABLE),
        sql.SQL(', ').join(map(sql.Identifier, columns))
    )
    
    execute_values(cursor, query, proteins_data)

def create_indexes(conn):
    """Creates indexes on the tables after data loading."""
    print("Creating indexes...")
    start_time = time.time()
    
    with conn.cursor() as cur:
        try:
            # Index on main proteins table
            print("  Creating index on proteins.entry...")
            cur.execute(sql.SQL("""
                CREATE INDEX IF NOT EXISTS {} 
                ON {} (entry);
            """).format(sql.Identifier("idx_" + PROTEINS_TABLE + "_entry"), sql.Identifier(PROTEINS_TABLE)))
            
            # Indexes on identifiers table for fast search
            print("  Creating index on identifiers.protein_id...")
            cur.execute(sql.SQL("""
                CREATE INDEX IF NOT EXISTS {} 
                ON {} (protein_id);
            """).format(sql.Identifier("idx_" + IDENTIFIERS_TABLE + "_protein_id"), sql.Identifier(IDENTIFIERS_TABLE)))
            
            
            # GIN trigram index for fuzzy search on identifier values
            print("  Creating trigram index on identifiers.identifier_value...")
            cur.execute(sql.SQL("""
                CREATE INDEX IF NOT EXISTS {} 
                ON {} USING GIN (identifier_value gin_trgm_ops);
            """).format(sql.Identifier("idx_" + IDENTIFIERS_TABLE + "_value_trgm"), sql.Identifier(IDENTIFIERS_TABLE)))
            
            # Text pattern ops index for prefix search
            print("  Creating prefix index on identifiers.identifier_value...")
            cur.execute(sql.SQL("""
                CREATE INDEX IF NOT EXISTS {} 
                ON {} (identifier_value text_pattern_ops);
            """).format(sql.Identifier("idx_" + IDENTIFIERS_TABLE + "_value_prefix"), sql.Identifier(IDENTIFIERS_TABLE)))
            
            conn.commit()
            
            end_time = time.time()
            print(f"Indexes created successfully in {end_time - start_time:.2f} seconds")
            
        except psycopg2.Error as e:
            print(f"Error creating indexes: {e}")
            conn.rollback()
            sys.exit(1)

# --- Main Execution ---
if __name__ == "__main__":
    import sys
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        db_conn = None
        try:
            db_conn = get_db_connection()
            if db_conn:
                if command == "identifiers":
                    # Drop and recreate identifiers table with new schema
                    print("Recreating identifiers table with new schema...")
                    with db_conn.cursor() as cur:
                        cur.execute(sql.SQL("DROP TABLE IF EXISTS {} CASCADE;").format(sql.Identifier(IDENTIFIERS_TABLE)))
                        cur.execute(sql.SQL("""
                            CREATE TABLE {} (
                                id SERIAL PRIMARY KEY,
                                protein_id INTEGER REFERENCES {} (id) ON DELETE CASCADE,
                                uniprot_accession VARCHAR(30) NOT NULL,
                                identifier_value TEXT NOT NULL,
                                identifier_type VARCHAR(50) NOT NULL,
                                taxon_id TEXT
                            );
                        """).format(sql.Identifier(IDENTIFIERS_TABLE), sql.Identifier(PROTEINS_TABLE)))
                        db_conn.commit()
                        print("Identifiers table recreated.")
                    
                    # Populate identifiers using SQL
                    populate_identifiers(db_conn)
                    
                    print("\n" + "=" * 50)
                    print("Identifiers repopulated!")
                    print("=" * 50)
                
                elif command == "indexes":
                    # Just create indexes
                    create_indexes(db_conn)
                    
                    print("\n" + "=" * 50)
                    print("Indexes created!")
                    print("=" * 50)
                
                else:
                    print(f"Unknown command: {command}")
                    print("Available commands: identifiers, indexes")
                    
        finally:
            if db_conn:
                db_conn.close()
                print("Database connection closed.")
    
    else:
        # Full data loading process
        db_conn = None
        try:
            db_conn = get_db_connection()
            if db_conn:
                # 1. Setup database tables (without indexes)
                setup_database(db_conn)
                
                # Optional: Truncate tables before loading for a clean slate
                print(f"Warning: Truncating tables before loading...")
                with db_conn.cursor() as cur:
                    cur.execute(sql.SQL("TRUNCATE TABLE {} CASCADE;").format(sql.Identifier(IDENTIFIERS_TABLE)))
                    cur.execute(sql.SQL("TRUNCATE TABLE {} CASCADE;").format(sql.Identifier(PROTEINS_TABLE)))
                    db_conn.commit()
                    print("Tables truncated.")
                
                # 2. Load protein data
                ingest_proteins(db_conn)
                
                # 3. Populate identifiers using SQL
                populate_identifiers(db_conn)
                
                # 4. Create indexes after data is loaded
                create_indexes(db_conn)
                
                print("\n" + "=" * 50)
                print("Data loading complete!")
                print("=" * 50)
                
        finally:
            if db_conn:
                db_conn.close()
                print("Database connection closed.")