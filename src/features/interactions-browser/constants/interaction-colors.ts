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
  let color: string = INTERACTION_COLORS.GREY;
  if (interaction.isInhibition || interaction.isStimulation) color = INTERACTION_COLORS.ORANGE;
  if (interaction.consensusStimulation) color = INTERACTION_COLORS.GREEN;
  if (interaction.consensusInhibition) color = INTERACTION_COLORS.RED;
  return color;
};

export const getInteractionColorMeaning = (color: string) => {
  return INTERACTION_COLOR_MEANINGS[color as keyof typeof INTERACTION_COLOR_MEANINGS] || "Unknown interaction type";
};