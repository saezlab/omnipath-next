/**
 * SMILES validation utility using OpenChemLib
 */

export interface SmilesValidationResult {
  isValid: boolean;
  error?: string;
}

let OCL: any = null;

const loadOCL = async () => {
  if (OCL) return OCL;

  try {
    const { Molecule } = await import('openchemlib');
    OCL = { Molecule };
    return OCL;
  } catch (error) {
    console.error('Failed to load OpenChemLib:', error);
    throw new Error('Failed to load molecular validation library');
  }
};

/**
 * Validates a SMILES string using OpenChemLib
 * @param smiles The SMILES string to validate
 * @returns Promise<SmilesValidationResult>
 */
export async function validateSmiles(smiles: string): Promise<SmilesValidationResult> {
  if (!smiles || !smiles.trim()) {
    return {
      isValid: false,
      error: 'SMILES string is empty'
    };
  }

  try {
    const ocl = await loadOCL();

    // Try to create a molecule from the SMILES string
    const molecule = ocl.Molecule.fromSmiles(smiles.trim());

    if (!molecule) {
      return {
        isValid: false,
        error: 'Invalid SMILES pattern'
      };
    }

    // Additional validation - check if the molecule has atoms
    if (molecule.getAllAtoms() === 0) {
      return {
        isValid: false,
        error: 'SMILES pattern contains no atoms'
      };
    }

    return {
      isValid: true
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid SMILES pattern'
    };
  }
}

/**
 * Synchronous SMILES validation (returns cached result if OCL is already loaded)
 * @param smiles The SMILES string to validate
 * @returns SmilesValidationResult | null (null if OCL not loaded yet)
 */
export function validateSmilesSync(smiles: string): SmilesValidationResult | null {
  if (!OCL) return null;

  if (!smiles || !smiles.trim()) {
    return {
      isValid: false,
      error: 'SMILES string is empty'
    };
  }

  try {
    const molecule = OCL.Molecule.fromSmiles(smiles.trim());

    if (!molecule) {
      return {
        isValid: false,
        error: 'Invalid SMILES pattern'
      };
    }

    if (molecule.getAllAtoms() === 0) {
      return {
        isValid: false,
        error: 'SMILES pattern contains no atoms'
      };
    }

    return {
      isValid: true
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid SMILES pattern'
    };
  }
}