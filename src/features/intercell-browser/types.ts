export interface IntercellEntry {
  id: number
  category: string | null
  parent: string | null
  database: string | null
  scope: string | null
  aspect: string | null
  source: string | null
  uniprot: string | null
  genesymbol: string | null
  entityType: string | null
  consensusScore: number | null
  transmitter: boolean | null
  receiver: boolean | null
  secreted: boolean | null
  plasmaMembraneTransmembrane: boolean | null
  plasmaMembranePeripheral: boolean | null
}

export interface IntercellFilters {
  aspects: string[]
  sources: string[]
  databases: string[]
  scopes: string[]
  transmitter: boolean | null
  receiver: boolean | null
  secreted: boolean | null
  plasmaMembraneTransmembrane: boolean | null
  plasmaMembranePeripheral: boolean | null
}