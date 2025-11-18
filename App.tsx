import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import OutputPanel from './components/OutputPanel';
import { GenerateIcon } from './components/icons';
import { Profile, GenerationConfig } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { generateCreative } from './services/geminiService';

const App: React.FC = () => {
    // State for inputs
    const [prompt, setPrompt] = useState<string>('');
    const [logo, setLogo] = useState<string | null>(null);
    const [icon, setIcon] = useState<string | null>(null);
    const [inspiration, setInspiration] = useState<string[]>([]);
    const [colors, setColors] = useState<string[]>(['#4A90E2', '#50E3C2', '#000000']);
    const [aspectRatio, setAspectRatio] = useState<string>('1:1 (Cuadrado)');
    const [textOption, setTextOption] = useState<'withText' | 'noText'>('noText');
    const [textInputs, setTextInputs] = useState({ headline: '', subheading: '' });


    // State for generation process
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRefining, setIsRefining] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [refinePrompt, setRefinePrompt] = useState('');


    // State for profiles
    const [profiles, setProfiles] = useLocalStorage<Profile[]>('creative-profiles', []);

    const saveProfile = useCallback((name: string) => {
        const newProfile: Profile = {
            id: Date.now().toString(),
            name,
            prompt,
            logo,
            icon,
            inspiration,
            colors,
            aspectRatio,
            textOption,
            textInputs,
        };
        setProfiles([...profiles, newProfile]);
    }, [prompt, logo, icon, inspiration, colors, aspectRatio, textOption, textInputs, profiles, setProfiles]);

    const loadProfile = useCallback((id: string) => {
        const profileToLoad = profiles.find(p => p.id === id);
        if (profileToLoad) {
            setPrompt(profileToLoad.prompt);
            setLogo(profileToLoad.logo);
            setIcon(profileToLoad.icon);
            setInspiration(profileToLoad.inspiration);
            setColors(profileToLoad.colors);
            setAspectRatio(profileToLoad.aspectRatio);
            setTextOption(profileToLoad.textOption);
            setTextInputs(profileToLoad.textInputs);
        }
    }, [profiles]);

    const deleteProfile = useCallback((id: string) => {
        setProfiles(profiles.filter(p => p.id !== id));
    }, [profiles, setProfiles]);
    
    const handleGenerate = async () => {
        if (!prompt) {
            setError("Por favor, proporciona un brief creativo.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const config = {
                prompt,
                logo,
                icon,
                inspiration,
                colors,
                aspectRatio: aspectRatio.split(' ')[0], // '1:1 (Cuadrado)' -> '1:1'
                textOption,
                textInputs
            };
            const image = await generateCreative(config);
            setGeneratedImage(image);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRefine = async () => {
        if (!refinePrompt || !generatedImage) {
            return;
        }
        setIsRefining(true);
        setError(null);

        try {
            // FIX: Explicitly type the config object with GenerationConfig to prevent type inference issues.
            const config: GenerationConfig = {
                prompt: refinePrompt, // Usamos el prompt de refinamiento
                baseImage: generatedImage,
                // Pasamos el resto de config por si acaso, aunque el prompt de edición es simple
                logo: null, icon: null, inspiration: [], colors: [], aspectRatio: '', textOption: 'noText', textInputs: {headline: '', subheading: ''}
            };
            const image = await generateCreative(config);
            setGeneratedImage(image);
            setRefinePrompt(''); // Limpiar después de refinar
        } catch(e) {
            setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsRefining(false);
        }
    };


    return (
        <div className="h-screen w-screen flex flex-col bg-gray-900">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                 <ControlPanel
                    prompt={prompt} setPrompt={setPrompt}
                    logo={logo} setLogo={setLogo}
                    icon={icon} setIcon={setIcon}
                    inspiration={inspiration} setInspiration={setInspiration}
                    colors={colors} setColors={setColors}
                    aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
                    textOption={textOption} setTextOption={setTextOption}
                    textInputs={textInputs} setTextInputs={setTextInputs}
                    profiles={profiles}
                    saveProfile={saveProfile}
                    loadProfile={loadProfile}
                    deleteProfile={deleteProfile}
                />
                <div className="flex flex-col h-full w-full md:w-2/3 lg:w-3/4 relative">
                    <div className="flex-grow overflow-y-auto">
                        <OutputPanel 
                            isLoading={isLoading} 
                            error={error} 
                            generatedImage={generatedImage}
                            refinePrompt={refinePrompt}
                            setRefinePrompt={setRefinePrompt}
                            handleRefine={handleRefine}
                            isRefining={isRefining}
                        />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-900/50 backdrop-blur-sm flex justify-center z-10">
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || isRefining || !prompt}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full inline-flex items-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <GenerateIcon className="w-6 h-6 mr-2" />
                            <span>{isLoading ? 'Generando...' : 'Generar Creatividad'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
