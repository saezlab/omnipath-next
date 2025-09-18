import { MetaboSearchInterface } from '@/features/metabo/components/metabo-search-interface';

export default function MetaboPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <MetaboSearchInterface />
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Metabolomics Search | OmniPath',
    description: 'Search chemical compounds using text, substructure, and similarity queries. Explore molecular properties and drug-likeness.',
  };
}