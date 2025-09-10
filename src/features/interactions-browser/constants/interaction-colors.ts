export const INTERACTION_COLORS = {
  GREY: "text-grey-500",
  ORANGE: "text-orange-500", 
  GREEN: "text-green-500",
  RED: "text-red-500",
} as const;

export const INTERACTION_COLOR_MEANINGS = {
  [INTERACTION_COLORS.GREY]: "Unknown or neutral interaction",
  [INTERACTION_COLORS.ORANGE]: "Potential stimulation or inhibition", 
  [INTERACTION_COLORS.GREEN]: "Consensus stimulation",
  [INTERACTION_COLORS.RED]: "Consensus inhibition",
} as const;

export const getInteractionColor = (interaction: {
  isInhibition?: boolean | null;
  isStimulation?: boolean | null;
  consensusStimulation?: boolean | null;
  consensusInhibition?: boolean | null;
}): string => {
  // Consensus takes priority
  if (interaction.consensusStimulation) return INTERACTION_COLORS.GREEN;
  if (interaction.consensusInhibition) return INTERACTION_COLORS.RED;
  
  // Only inhibition (no stimulation) - treat as consensus inhibition
  if (interaction.isInhibition && !interaction.isStimulation) return INTERACTION_COLORS.RED;
  
  // Only stimulation (no inhibition) - treat as consensus stimulation  
  if (interaction.isStimulation && !interaction.isInhibition) return INTERACTION_COLORS.GREEN;
  
  // Both inhibition and stimulation (conflicting) - show as uncertain
  if (interaction.isInhibition && interaction.isStimulation) return INTERACTION_COLORS.ORANGE;
  
  // Neither - unknown/neutral
  return INTERACTION_COLORS.GREY;
};

export const getInteractionColorMeaning = (color: string) => {
  return INTERACTION_COLOR_MEANINGS[color as keyof typeof INTERACTION_COLOR_MEANINGS] || "Unknown interaction type";
};