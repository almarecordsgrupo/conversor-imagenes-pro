import { GoogleGenAI, Modality } from "@google/genai";
import { GenerationConfig } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fileToGenerativePart = (base64Data: string) => {
    const match = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        throw new Error("Invalid base64 data URL");
    }
    const mimeType = match[1];
    const data = match[2];
    return {
        inlineData: { data, mimeType }
    };
};


export const generateCreative = async (config: GenerationConfig): Promise<string> => {
    const { prompt, logo, icon, inspiration, colors, aspectRatio, textOption, textInputs, baseImage } = config;

    const model = 'gemini-2.5-flash-image';
    const parts: any[] = [];
    let textPrompt = '';

    if (baseImage) {
        // MODO EDICIÓN
        textPrompt = `
          Eres un editor de fotos experto. El usuario ha proporcionado una imagen base y una instrucción de edición.
          **Instrucción de Edición:** ${prompt}
          
          Modifica la imagen base según la instrucción. Mantén el resto de la imagen y su estilo consistentes.
          **CRÍTICO:** Tu salida debe ser ÚNICAMENTE la imagen final editada. No generes texto, comentarios ni opciones.
        `;
        parts.push({ text: textPrompt });
        parts.push(fileToGenerativePart(baseImage));
    } else {
        // MODO CREACIÓN
        let textContentPrompt = "El diseño debe ser puramente visual, sin texto.";
        if (textOption === 'withText' && (textInputs.headline || textInputs.subheading)) {
            textContentPrompt = `
            **Texto a Incluir:**
            - Título Principal: "${textInputs.headline}"
            - Subtítulo/Texto secundario: "${textInputs.subheading}"
            Integra este texto de forma natural en el diseño, usando tipografías profesionales y legibles que complementen el estilo general.
            `;
        }
        
        textPrompt = `
          Eres un diseñador gráfico experto creando un recurso de marketing de alta calidad.
          
          **Objetivo:** ${prompt}
          
          **Recursos Proporcionados:**
          - Si se proporciona un "Logo", incorpóralo de manera natural y profesional en el diseño. Es el elemento de marca principal.
          - Si se proporciona un "Icono", úsalo como un elemento gráfico secundario o de apoyo que complemente el diseño.
          
          **Estilo e Inspiración:**
          - Basa el estilo visual, el ambiente y la composición en las "Imágenes de Inspiración" si se proporcionan.
          - Adhiérete estrictamente a esta paleta de colores corporativos: [${colors.join(', ')}]. Si la lista de colores está vacía, deriva una paleta profesional y atractiva del logo proporcionado.
          
          ${textContentPrompt}
    
          **Diseño y Formato:**
          - La imagen final debe tener una relación de aspecto de exactamente ${aspectRatio}.
          - Genera la imagen en alta resolución.
    
          **CRÍTICO:** Tu salida debe ser ÚNICAMENTE la imagen final. No generes descripciones de texto, comentarios ni múltiples opciones.
        `;
        
        parts.push({ text: textPrompt });
        if (logo) {
            parts.push({text: "\nLogo:"});
            parts.push(fileToGenerativePart(logo));
        }
        if (icon) {
            parts.push({text: "\nIcono:"});
            parts.push(fileToGenerativePart(icon));
        }
        if (inspiration && inspiration.length > 0) {
            parts.push({text: "\nImágenes de Inspiración:"});
            inspiration.forEach(imgSrc => {
                parts.push(fileToGenerativePart(imgSrc));
            });
        }
    }


    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("La API no generó una imagen.");
    } catch (error) {
        console.error("Error generando creatividad:", error);
        throw new Error("Falló la generación de la imagen. Por favor, revisa la consola para más detalles.");
    }
};