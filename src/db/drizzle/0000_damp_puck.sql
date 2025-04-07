-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "annotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"uniprot" varchar,
	"genesymbol" varchar,
	"entity_type" varchar,
	"source" varchar,
	"label" varchar,
	"value" varchar,
	"record_id" integer
);
--> statement-breakpoint
CREATE TABLE "complexes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"components" varchar[],
	"components_genesymbols" varchar[],
	"stoichiometry" varchar,
	"sources" varchar[],
	"references" varchar,
	"identifiers" varchar
);
--> statement-breakpoint
CREATE TABLE "enzsub" (
	"id" serial PRIMARY KEY NOT NULL,
	"enzyme" varchar,
	"enzyme_genesymbol" varchar,
	"substrate" varchar,
	"substrate_genesymbol" varchar,
	"isoforms" varchar,
	"residue_type" varchar,
	"residue_offset" integer,
	"modification" varchar,
	"sources" varchar[],
	"references" varchar,
	"curation_effort" integer,
	"ncbi_tax_id" integer
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar,
	"target" varchar,
	"source_genesymbol" varchar,
	"target_genesymbol" varchar,
	"is_directed" boolean,
	"is_stimulation" boolean,
	"is_inhibition" boolean,
	"consensus_direction" boolean,
	"consensus_stimulation" boolean,
	"consensus_inhibition" boolean,
	"sources" varchar[],
	"references" varchar,
	"omnipath" boolean,
	"kinaseextra" boolean,
	"ligrecextra" boolean,
	"pathwayextra" boolean,
	"mirnatarget" boolean,
	"dorothea" boolean,
	"collectri" boolean,
	"tf_target" boolean,
	"lncrna_mrna" boolean,
	"tf_mirna" boolean,
	"small_molecule" boolean,
	"dorothea_curated" boolean,
	"dorothea_chipseq" boolean,
	"dorothea_tfbs" boolean,
	"dorothea_coexp" boolean,
	"dorothea_level" varchar[],
	"type" varchar,
	"curation_effort" integer,
	"extra_attrs" jsonb,
	"evidences" jsonb,
	"ncbi_tax_id_source" integer,
	"entity_type_source" varchar,
	"ncbi_tax_id_target" integer,
	"entity_type_target" varchar
);
--> statement-breakpoint
CREATE TABLE "intercell" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar,
	"parent" varchar,
	"database" varchar,
	"scope" varchar,
	"aspect" varchar,
	"source" varchar,
	"uniprot" varchar,
	"genesymbol" varchar,
	"entity_type" varchar,
	"consensus_score" integer,
	"transmitter" boolean,
	"receiver" boolean,
	"secreted" boolean,
	"plasma_membrane_transmembrane" boolean,
	"plasma_membrane_peripheral" boolean
);

*/