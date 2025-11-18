import React, { useState, ChangeEvent, DragEvent, useCallback } from 'react';
import { Profile } from '../types';
import { UploadIcon, SaveIcon, LoadIcon, DeleteIcon, ChevronDownIcon } from './icons';

interface ControlPanelProps {
  prompt: string;
  setPrompt: (value: string) => void;
  logo: string | null;
  setLogo: (value: string | null) => void;
  icon: string | null;
  setIcon: (value: string | null) => void;
  inspiration: string[];
  setInspiration: (value: string[]) => void;
  colors: string[];
  setColors: (value: string[]) => void;
  aspectRatio: string;
  setAspectRatio: (value: string) => void;
  textOption: 'withText' | 'noText';
  setTextOption: (value: 'withText' | 'noText') => void;
  textInputs: { headline: string; subheading: string };
  setTextInputs: (value: { headline: string; subheading: string }) => void;
  profiles: Profile[];
  saveProfile: (name: string) => void;
  loadProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
}

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-700 rounded-lg overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-gray-800 hover:bg-gray-700/50 transition-colors">
                <h3 className="text-lg font-semibold">{title}</h3>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 bg-gray-800/50">{children}</div>}
        </div>
    );
}

const extractColors = (imageSrc: string, colorCount = 5): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) return reject(new Error('No se pudo obtener el contexto del canvas'));

            const width = img.width;
            const height = img.height;
            canvas.width = width;
            canvas.height = height;
            context.drawImage(img, 0, 0, width, height);

            try {
                const imageData = context.getImageData(0, 0, width, height).data;
                const colorMap: { [key: string]: number } = {};
                
                for (let i = 0; i < imageData.length; i += 4 * 5) { // Sample every 5th pixel
                    if (imageData[i + 3] < 128) continue; // Skip transparent/semi-transparent pixels
                    const rgb = `${imageData[i]},${imageData[i+1]},${imageData[i+2]}`;
                    colorMap[rgb] = (colorMap[rgb] || 0) + 1;
                }

                const sortedColors = Object.keys(colorMap).sort((a, b) => colorMap[b] - colorMap[a]);
                
                const toHex = (rgbStr: string) => {
                    const [r, g, b] = rgbStr.split(',').map(Number);
                    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
                };
                
                resolve(sortedColors.slice(0, colorCount).map(toHex));
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = (err) => reject(err);
        img.src = imageSrc;
    });
};

const Dropzone: React.FC<{ onDrop: (files: FileList) => void; children: React.ReactNode; className?: string; }> = ({ onDrop, children, className }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEvent = (e: DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(isEntering);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        handleDragEvent(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onDrop(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    return (
        <div
            onDragEnter={(e) => handleDragEvent(e, true)}
            onDragLeave={(e) => handleDragEvent(e, false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`${className} ${isDragging ? 'border-blue-500 bg-gray-700/50' : 'border-gray-600'}`}
        >
            {children}
        </div>
    );
};

const ImageUpload: React.FC<{ label: string; image: string | null; onFile: (file: File) => void; onClear: () => void; }> = ({ label, image, onFile, onClear }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <Dropzone onDrop={(files) => onFile(files[0])} className="border-2 border-dashed rounded-lg p-4 text-center transition-colors">
            <input type="file" id={`${label}-upload`} className="hidden" accept="image/*" onChange={(e) => e.target.files && onFile(e.target.files[0])} />
            {image ? (
                <div className='relative group'>
                    <img src={image} alt="preview" className="w-24 h-24 object-contain mx-auto rounded-md border border-gray-600" />
                    <div className='absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                        <button onClick={onClear} className="text-red-500 text-3xl font-bold">&times;</button>
                    </div>
                </div>
            ) : (
                <label htmlFor={`${label}-upload`} className="cursor-pointer flex flex-col items-center">
                    <UploadIcon className="w-8 h-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-400">Arrastra un archivo o haz clic para subir</span>
                </label>
            )}
        </Dropzone>
    </div>
);


const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  const { prompt, setPrompt, logo, setLogo, icon, setIcon, inspiration, setInspiration, colors, setColors, aspectRatio, setAspectRatio, textOption, setTextOption, textInputs, setTextInputs, profiles, saveProfile, loadProfile, deleteProfile } = props;
  const [newProfileName, setNewProfileName] = useState('');

  const handleAddColor = () => setColors([...colors, '#FFFFFF']);
  const handleColorChange = (index: number, value: string) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  };
  const handleRemoveColor = (index: number) => setColors(colors.filter((_, i) => i !== index));
  
  const handleSaveProfile = () => {
    if (newProfileName.trim()) {
      saveProfile(newProfileName.trim());
      setNewProfileName('');
    }
  };
  
  const handleLogoFile = useCallback(async (file: File) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64 = reader.result as string;
          setLogo(base64);
          try {
              const extracted = await extractColors(base64);
              if (extracted.length > 0) setColors(extracted);
          } catch (e) {
              console.error("Error extrayendo colores:", e);
          }
      };
      reader.readAsDataURL(file);
  }, [setLogo, setColors]);
  
  const handleIconFile = useCallback((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => setIcon(reader.result as string);
      reader.readAsDataURL(file);
  }, [setIcon]);

  const handleInspirationFiles = useCallback((files: FileList) => {
      const newInspirations = [...inspiration];
      Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
              newInspirations.push(reader.result as string);
              if(newInspirations.length === inspiration.length + files.length) {
                  setInspiration(newInspirations);
              }
          };
          reader.readAsDataURL(file);
      });
  }, [inspiration, setInspiration]);

  return (
    <aside className="w-full md:w-1/3 lg:w-1/4 p-4 space-y-4 h-full overflow-y-auto bg-gray-800 border-r border-gray-700">
        <div className="space-y-4">
            <AccordionSection title="1. Brief Creativo" defaultOpen={true}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Objetivo Principal</label>
                        <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: Un banner para una oferta de zapatos de verano..."></textarea>
                    </div>
                </div>
            </AccordionSection>
            
            <AccordionSection title="2. Contenido de Texto" defaultOpen={true}>
                <div className="space-y-4">
                     <fieldset className="flex space-x-4">
                        <legend className="block text-sm font-medium text-gray-300 mb-2">Opciones de Texto</legend>
                        <div>
                            <input type="radio" id="noText" name="textOption" value="noText" checked={textOption === 'noText'} onChange={() => setTextOption('noText')} className="mr-2" />
                            <label htmlFor="noText">Sin Texto</label>
                        </div>
                        <div>
                            <input type="radio" id="withText" name="textOption" value="withText" checked={textOption === 'withText'} onChange={() => setTextOption('withText')} className="mr-2" />
                            <label htmlFor="withText">Con Texto</label>
                        </div>
                    </fieldset>
                    {textOption === 'withText' && (
                        <div className='space-y-2 animate-fade-in'>
                            <input type="text" value={textInputs.headline} onChange={e => setTextInputs({...textInputs, headline: e.target.value})} placeholder="Título Principal" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2" />
                            <textarea value={textInputs.subheading} onChange={e => setTextInputs({...textInputs, subheading: e.target.value})} placeholder="Subtítulo o texto de apoyo" rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2"></textarea>
                        </div>
                    )}
                </div>
            </AccordionSection>

            <AccordionSection title="3. Recursos Gráficos" defaultOpen={true}>
                <div className="space-y-4">
                    <ImageUpload label="Logo" image={logo} onFile={handleLogoFile} onClear={() => setLogo(null)} />
                    <ImageUpload label="Icono (Opcional)" image={icon} onFile={handleIconFile} onClear={() => setIcon(null)} />

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Imágenes de Inspiración</label>
                         <Dropzone onDrop={handleInspirationFiles} className="border-2 border-dashed rounded-lg p-4 text-center transition-colors">
                            <input type="file" id="inspiration-upload" className="hidden" accept="image/*" multiple onChange={(e) => e.target.files && handleInspirationFiles(e.target.files)} />
                             <div className="grid grid-cols-3 gap-2 mb-2">
                                {inspiration.map((src, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <img src={src} className="w-full h-full object-cover rounded-md" />
                                        <button onClick={() => setInspiration(inspiration.filter((_, i) => i !== index))} className="absolute top-0 right-0 bg-red-600 rounded-full w-5 h-5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                    </div>
                                ))}
                             </div>
                             <label htmlFor="inspiration-upload" className="cursor-pointer flex flex-col items-center text-gray-400">
                                <UploadIcon className="w-8 h-8" />
                                <span className="mt-2 text-sm">Arrastra archivos o haz clic para subir</span>
                            </label>
                        </Dropzone>
                    </div>
                </div>
            </AccordionSection>

             <AccordionSection title="4. Estilo y Formato" defaultOpen={false}>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Colores de Marca</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {colors.map((color, index) => (
                            <div key={index} className="relative flex items-center">
                                <input type="color" value={color} onChange={(e) => handleColorChange(index, e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-gray-700" />
                                <input type="text" value={color} onChange={(e) => handleColorChange(index, e.target.value)} className="w-full ml-2 bg-gray-700 border-gray-600 rounded-md p-1 text-xs" />
                                <button onClick={() => handleRemoveColor(index)} className="absolute -right-1 -top-1 bg-red-600 rounded-full w-4 h-4 text-xs text-white">&times;</button>
                            </div>
                        ))}
                        </div>
                        <button onClick={handleAddColor} className="mt-2 text-sm text-blue-400 hover:text-blue-300">+ Añadir Color</button>
                    </div>
                     <div>
                        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-2">Relación de Aspecto</label>
                        <select id="aspectRatio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500">
                            <option>1:1 (Cuadrado)</option>
                            <option>16:9 (Horizontal)</option>
                            <option>9:16 (Vertical)</option>
                            <option>4:3 (Estándar)</option>
                            <option>3:2 (Fotografía)</option>
                        </select>
                    </div>
                </div>
            </AccordionSection>

            <AccordionSection title="5. Perfiles de Estilo">
                <div className="space-y-4">
                    <div className="flex space-x-2">
                        <input type="text" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} placeholder="Nombre del Perfil" className="flex-grow bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500" />
                        <button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-500" disabled={!newProfileName.trim()}>
                            <SaveIcon />
                        </button>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold">Perfiles Guardados</h4>
                        {profiles.length > 0 ? (
                            profiles.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                                    <span>{p.name}</span>
                                    <div className="flex space-x-2">
                                        <button onClick={() => loadProfile(p.id)} className="p-1 text-blue-400 hover:text-blue-300"><LoadIcon /></button>
                                        <button onClick={() => deleteProfile(p.id)} className="p-1 text-red-500 hover:text-red-400"><DeleteIcon /></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">Aún no hay perfiles guardados.</p>
                        )}
                    </div>
                </div>
            </AccordionSection>
        </div>
    </aside>
  );
};

export default ControlPanel;