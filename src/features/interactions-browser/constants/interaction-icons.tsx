import { Dna, Pill, Share2, Scissors } from "lucide-react";

export const INTERACTION_TYPE_ICONS: Record<string, { icon: React.ReactNode; label: string; fullName: string }> = {
  post_translational: { icon: <Share2 className="h-4 w-4" />, label: "Post-transl.", fullName: "Post-translational modification" },
  transcriptional: { icon: <Dna className="h-4 w-4" />, label: "Transcr.", fullName: "Transcriptional regulation" },
  post_transcriptional: { icon: <Scissors className="h-4 w-4" />, label: "Post-transc.", fullName: "Post-transcriptional regulation" },
  mirna_transcriptional: { icon: <Dna className="h-4 w-4" />, label: "miRNA.", fullName: "miRNA Transcriptional regulation" },
  small_molecule_protein: { icon: <Pill className="h-4 w-4" />, label: "Small Molecule", fullName: "Small Molecule-Protein interaction" },
  lncrna_post_transcriptional: { icon: <Scissors className="h-4 w-4" />, label: "lncRNA", fullName: "lncRNA Post-transcriptional regulation" },
};