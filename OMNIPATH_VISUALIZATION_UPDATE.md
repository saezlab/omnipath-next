# OmniPath Database Visualization Update - Implementation Summary

## Overview
This document describes the implementation of comprehensive database statistics and visualization features for the OmniPath Next project. The work involved creating SQL queries for data analysis, implementing a data generation script, and building interactive visualizations in the web interface.

## Implementation Details

### 1. SQL Query Development (`/scripts/plot-queries.sql`)

Created a comprehensive set of SQL queries to extract data for the following visualizations:

#### a) Literature References by Database and Interaction Type
- Counts unique references across all databases grouped by source and interaction type
- Combines data from interactions, enzyme-substrate (enzsub), and complexes tables
- Uses PostgreSQL array operations (`unnest`) to handle multi-source entries
- Properly handles the "references" reserved keyword by quoting it

#### b) Reference-Record Pairs by Database and Interaction Types
- Counts total reference-record associations to show citation frequency
- Tracks which records cite which references
- Provides insight into how thoroughly each interaction is documented

#### c) Literature References by Year of Publication
- Extracts publication years from reference strings using regex patterns
- Filters for years between 1900-2099
- Note: This is a simplified approach - ideally would use PubMed API for accurate dates

#### d) Commercial Use Availability
- Counts records by database and type (interaction, enzyme-substrate, complex, annotation, intercellular)
- Designed to be joined with license metadata from external files
- Helps identify which data can be used commercially vs academic-only

#### e) Maintenance Status of Resources
- Aggregates entry counts by resource across all tables
- Designed to be joined with maintenance category data (frequent, infrequent, one_time_paper, discontinued)
- Shows resource reliability and update frequency

#### f) Entries by Evidence Type
- Categorizes entries as curated, high-throughput, predicted, or other
- Uses the evidences JSONB field and curation_effort as indicators
- Provides quality assessment of the data

#### g) References by Interaction
- Shows top 50 interactions by number of references
- Uses gene symbols for human-readable interaction names
- Helps identify well-studied vs under-studied interactions

#### h) Resource Overlap
- Analyzes how many entries appear in multiple resources
- Shows distribution (e.g., X entries appear in 1 resource, Y entries in 2 resources, etc.)
- Includes specific examples of multi-resource entries
- Helps assess data redundancy and consensus

### 2. Database Statistics Generation Script (`/scripts/generate-db-stats.ts`)

Enhanced the existing script with the following features:

#### Data Loading
- Loads maintenance category data from `/src/data/resources_by_maintenance_category.json`
- Loads resource metadata including licenses from `/src/data/resources.json`
- Creates lookup maps for efficient data enhancement

#### Query Implementation
- Implemented all 8 new plot queries using Drizzle ORM
- Properly handles PostgreSQL array types and JSONB fields
- Includes proper type casting for numeric fields

#### Data Enhancement
- Enriches commercial use data with license information
- Detects non-commercial licenses (containing "NC" in license string)
- Adds maintenance categories to resource statistics
- Filters publication years to exclude unknown/invalid dates

#### Output Structure
- Maintains backward compatibility with existing stats
- Adds new `plotData` section containing all visualization data
- Outputs to `/src/data/db-stats.json` with proper formatting

### 3. React Component Updates (`/src/components/home/database-stats.tsx`)

Completely redesigned the component with the following features:

#### Type Safety
- Added TypeScript interfaces for all new data types:
  - `LiteratureRefStat`, `ReferenceByYearStat`, `CommercialUseStat`
  - `MaintenanceStat`, `EvidenceTypeStat`, `ReferenceByInteractionStat`
  - `MultiResourceExample`

#### UI Structure
- Maintained original overview cards and Voronoi treemap
- Added new tab system with 5 main sections:
  1. **Overview**: Original database statistics
  2. **References**: Literature analysis
  3. **Maintenance**: Resource status and licensing
  4. **Evidence**: Data quality metrics
  5. **Overlap**: Resource redundancy analysis

#### Visualizations

**References Tab:**
- Line chart: Literature references by year (using Recharts LineChart)
- Table: Top 20 referenced interactions with reference counts
- Table: Complete list of references by database and interaction type

**Maintenance Tab:**
- Pie chart: Resources by maintenance category with custom colors
- Pie chart: Commercial use availability distribution
- Table: Detailed resource list with maintenance status badges

**Evidence Tab:**
- Table: Entries by evidence type with color-coded badges
- Summary cards: Totals for curated, high-throughput, and predicted data
- Shows distribution across databases

**Overlap Tab:**
- Bar chart: Entry distribution by number of resources
- Table: Examples of entries appearing in multiple resources
- Shows resource names for each multi-resource entry

#### Design Features
- Responsive grid layouts for different screen sizes
- Scrollable tables for large datasets (max-height 384px)
- Color-coded badges for categories
- Interactive charts with tooltips
- Consistent styling with the existing UI

### 4. Data Files Used

#### `/src/data/resources_by_maintenance_category.json`
- Categorizes resources into: discontinued, frequent, infrequent, one_time_paper
- Used to assess resource reliability

#### `/src/data/resources.json`
- Contains metadata for each resource including licenses
- Used to determine commercial use availability
- Includes resource types (literature curated, high-throughput, etc.)

## Technical Challenges Solved

1. **PostgreSQL Reserved Keywords**: Handled "references" column by properly quoting
2. **Array Data Handling**: Used `unnest()` to expand array columns for analysis
3. **JSONB Processing**: Extracted evidence types from JSONB fields using ILIKE patterns
4. **Type Safety**: Added proper TypeScript types for all data structures
5. **Performance**: Implemented efficient queries with proper indexing considerations
6. **Data Quality**: Filtered out invalid years and unknown values

## Usage Instructions

1. Run the database statistics generation:
   ```bash
   npx tsx scripts/generate-db-stats.ts
   ```

2. The updated statistics will be saved to `/src/data/db-stats.json`

3. The React component will automatically display the new visualizations

## Future Enhancements

1. **PubMed Integration**: Fetch actual publication dates via PubMed API
2. **License Database**: Create a comprehensive license compatibility matrix
3. **Real-time Updates**: Implement WebSocket updates for live statistics
4. **Export Features**: Add CSV/JSON export for all visualizations
5. **Advanced Filtering**: Add interactive filters for all tables and charts
6. **Caching**: Implement query result caching for better performance

## Summary

This implementation provides comprehensive insights into the OmniPath database through:
- 8 new data analysis queries covering references, maintenance, licensing, evidence quality, and resource overlap
- Enhanced data generation script with metadata integration
- Rich interactive visualizations with charts and tables
- Type-safe React implementation with modern UI patterns

The result is a powerful analytics dashboard that helps users understand data quality, licensing restrictions, maintenance status, and research coverage across the integrated OmniPath resources.