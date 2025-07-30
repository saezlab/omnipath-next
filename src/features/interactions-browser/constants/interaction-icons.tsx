import { Dna, Pill, Share2, Scissors } from "lucide-react";

export const INTERACTION_TYPE_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  post_translational: { icon: <Share2 className="h-4 w-4" />, label: "Post-translational" },
  transcriptional: { icon: <Dna className="h-4 w-4" />, label: "Transcriptional" },
  post_transcriptional: { icon: <Scissors className="h-4 w-4" />, label: "Post-transcriptional" },
  mirna_transcriptional: { icon: <Dna className="h-4 w-4" />, label: "miRNA Transcriptional" },
  small_molecule_protein: { icon: <Pill className="h-4 w-4" />, label: "Small Molecule-Protein" },
  lncrna_post_transcriptional: { icon: <Scissors className="h-4 w-4" />, label: "lncRNA Post-transcriptional" },
};