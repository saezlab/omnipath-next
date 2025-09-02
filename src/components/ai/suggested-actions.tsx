"use client";

interface SuggestedAction {
  title: string;
  label: string;
  action: string;
}

const suggestedActions: SuggestedAction[] = [
  {
    title: "Which pathways does EGFR belong to?",
    label: "Find canonical pathways for a protein",
    action: "Which canonical pathways does EGFR belong to?",
  },
  {
    title: "Which TFs regulate MYC?",
    label: "Find transcriptional regulators",
    action: "Which transcription factors regulate the expression of MYC?",
  },
  {
    title: "Which TFs suppress CDKN1A?",
    label: "Find transcriptional suppressors",
    action: "Which transcription factors suppress the expression of CDKN1A?",
  },
  {
    title: "Is TP53 a transcription factor?",
    label: "Check if protein has TF activity",
    action: "Is TP53 a transcription factor?",
  },
  {
    title: "What are the ligands of EGFR?",
    label: "Find receptor-ligand interactions",
    action: "What are the ligands of EGFR?",
  },
];

interface SuggestedActionsProps {
  onActionSelect: (action: string) => void;
}

export function SuggestedActions({ onActionSelect }: SuggestedActionsProps) {
  return (
    <div className="w-full mt-4">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 w-max pb-2">
          {suggestedActions.map((suggestedAction, index) => (
            <button
              key={index}
              onClick={() => onActionSelect(suggestedAction.action)}
              className="border-none bg-muted/50 min-w-[280px] text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
            >
              <span className="font-medium">{suggestedAction.title}</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {suggestedAction.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 text-center">
        Shared limits: 10 requests/min, 250/day. Check back later if unavailable.
      </p>
    </div>
  );
}