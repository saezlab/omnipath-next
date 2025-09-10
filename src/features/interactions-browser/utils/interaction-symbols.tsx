import { ArrowRight, Minus } from "lucide-react";
import React from 'react';

interface InteractionData {
  isDirected?: boolean | null;
  isInhibition?: boolean | null;
  isStimulation?: boolean | null;
  consensusInhibition?: boolean | null;
  consensusStimulation?: boolean | null;
}

export function getInteractionSymbol(interaction: InteractionData) {
  if (!interaction.isDirected) {
    return <Minus className="h-6 w-6" />;
  }

  // Inhibition cases (consensus or only inhibition)
  if (interaction.consensusInhibition || (interaction.isInhibition && !interaction.isStimulation)) {
    return <span className="text-2xl leading-none">⊣</span>;
  }

  // Stimulation cases (consensus or only stimulation)
  if (interaction.consensusStimulation || (interaction.isStimulation && !interaction.isInhibition)) {
    return <ArrowRight className="h-6 w-6" />;
  }

  // Conflicting cases (both stimulation and inhibition)
  if (interaction.isStimulation && interaction.isInhibition) {
    return <span className="text-2xl leading-none">-●</span>;
  }

  // Default for unknown/neutral directed interactions
  return <ArrowRight className="h-6 w-6" />;
}