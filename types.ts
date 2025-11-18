export interface Profile {
  id: string;
  name: string;
  prompt: string;
  logo: string | null;
  icon: string | null;
  inspiration: string[];
  colors: string[];
  aspectRatio: string;
  textOption: 'withText' | 'noText';
  textInputs: { headline: string; subheading: string };
}

export interface GenerationConfig {
  prompt: string;
  logo: string | null;
  icon: string | null;
  inspiration: string[];
  colors: string[];
  aspectRatio: string;
  textOption: 'withText' | 'noText';
  textInputs: { headline: string; subheading: string };
  baseImage?: string | null; // Para la función de edición
}