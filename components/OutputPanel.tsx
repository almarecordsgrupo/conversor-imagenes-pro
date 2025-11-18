import React from 'react';
import { GenerateIcon } from './icons';

interface OutputPanelProps {
  isLoading: boolean;
  error: string | null;
  generatedImage: string | null;
  refinePrompt: string;
  setRefinePrompt: (value: string) => void;
  handleRefine: () => void;
  isRefining: boolean;
}

const SkeletonLoader: React.FC = () => (
    <div className="w-full h-full bg-gray-700 rounded-lg animate-pulse"></div>
);

const OutputPanel: React.FC<OutputPanelProps> = ({ isLoading, error, generatedImage, refinePrompt, setRefinePrompt, handleRefine, isRefining }) => {
    
    const handleDownload = () => {
        if (generatedImage) {
            const link = document.createElement('a');
            link.href = generatedImage;
            link.download = `creatividad-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center bg-gray-900">
            <div className="w-full max-w-4xl h-[75vh] flex flex-col items-center justify-center bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700 p-4 space-y-4">
                <div className="flex-grow w-full flex items-center justify-center relative">
                    {isLoading && <SkeletonLoader />}
                    {!isLoading && error && (
                        <div className="text-center text-red-400">
                            <h3 className="text-xl font-semibold">Falló la Generación</h3>
                            <p className="mt-2 text-sm">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && generatedImage && (
                        <div className='relative w-full h-full'>
                            <img src={generatedImage} alt="Creatividad generada" className="w-full h-full object-contain rounded-lg" />
                            {(isLoading || isRefining) && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-white"></div></div>}
                        </div>
                    )}
                    {!isLoading && !error && !generatedImage && (
                        <div className="text-center text-gray-500">
                            <h3 className="text-xl font-semibold">Tu creatividad aparecerá aquí</h3>
                            <p className="mt-2 text-sm">Completa los detalles a la izquierda y haz clic en 'Generar'.</p>
                        </div>
                    )}
                </div>
                
                {!isLoading && generatedImage && (
                    <div className="w-full max-w-2xl bg-gray-700/50 p-3 rounded-lg flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <input 
                                type="text"
                                value={refinePrompt}
                                onChange={(e) => setRefinePrompt(e.target.value)}
                                placeholder="Edición rápida (ej: 'haz el logo más grande', 'cambia el fondo a azul')"
                                className="flex-grow bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                                disabled={isRefining}
                            />
                            <button 
                                onClick={handleRefine} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center transition-colors disabled:bg-gray-500"
                                disabled={isRefining || !refinePrompt}
                            >
                                <GenerateIcon className='w-5 h-5 mr-1'/>
                                {isRefining ? 'Refinando...' : 'Refinar'}
                            </button>
                            <button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                Descargar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default OutputPanel;