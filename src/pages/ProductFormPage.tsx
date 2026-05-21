import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductFormPage() {
    const { id } = useParams();
    const { state, addProduct, updateProduct } = useApp();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [priceBs, setPriceBs] = useState('');
    const [isPriceInBs, setIsPriceInBs] = useState(false);
    const [category, setCategory] = useState(state.categories[0]?.name || 'Otros');
    const [imageUrl, setImageUrl] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (id) {
            const p = state.products.find(p => p.id === id);
            if (p) {
                setName(p.name);
                setPrice(p.price.toString());
                setPriceBs(p.price_bs?.toString() || '');
                setIsPriceInBs(p.is_price_in_bs || false);
                setCategory(p.category || 'Otros');
                setImageUrl(p.image_url || '');
            } else {
                toast.error('Producto no encontrado');
                navigate('/menu');
            }
        } else if (state.categories.length > 0 && category === 'Otros') {
            setCategory(state.categories[0].name);
        }
    }, [id, state.products, state.categories, navigate]);

    const handleImageUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecciona una imagen válida');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setImageUrl(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        let finalPrice = isPriceInBs ? 0 : parseFloat(price);
        const finalPriceBs = isPriceInBs ? parseFloat(priceBs) : 0;

        if (isPriceInBs && state.currentDay?.isOpen) {
            finalPrice = finalPriceBs / state.currentDay.exchangeRate;
        }

        if (!isPriceInBs && isNaN(finalPrice)) {
            toast.error('Ingresa un precio válido en USD');
            return;
        }
        if (isPriceInBs && isNaN(finalPriceBs)) {
            toast.error('Ingresa un precio válido en Bs');
            return;
        }

        if (id) {
            updateProduct(id, name.trim(), finalPrice, category, imageUrl || undefined, finalPriceBs, isPriceInBs);
            toast.success('Producto actualizado');
        } else {
            addProduct(name.trim(), finalPrice, category, imageUrl || undefined, finalPriceBs, isPriceInBs);
            toast.success('Producto creado');
        }
        navigate('/menu');
    };

    return (
        <div className="animate-slide-in max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
                    <ArrowLeft size={20} />
                </Button>
                <h1 className="text-3xl font-bold font-display">
                    {id ? 'Editar Producto' : 'Nuevo Producto'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="pos-card space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold mb-1.5 block">Nombre del Producto</label>
                        <Input
                            placeholder="Ej. Hamburguesa Doble"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold mb-1.5 block">Categoría</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {state.categories.filter(c => c.name !== 'Otros').map(cat => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                    <SelectItem value="Otros">Otros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold mb-1.5 block">Tipo de Precio</label>
                          <div className="flex items-center gap-2 h-10 px-3 bg-muted/30 rounded-md border border-input">
                            <input 
                              type="checkbox" 
                              id="isPriceInBs" 
                              checked={isPriceInBs} 
                              onChange={e => setIsPriceInBs(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="isPriceInBs" className="text-sm font-medium cursor-pointer">Fijar en Bs</label>
                          </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold mb-1.5 block">
                              {isPriceInBs ? 'Precio (Bs)' : 'Precio (USD)'}
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={isPriceInBs ? priceBs : price}
                                onChange={e => isPriceInBs ? setPriceBs(e.target.value) : setPrice(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-semibold mb-1.5 block">Imagen del Producto</label>
                    {imageUrl ? (
                        <div className="relative w-full h-48 bg-muted rounded-xl border border-border flex items-center justify-center overflow-hidden group">
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button type="button" variant="destructive" size="sm" onClick={() => setImageUrl('')} className="gap-2">
                                    <X size={16} /> Quitar imagen
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/30'
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="p-3 bg-background rounded-full shadow-sm">
                                <UploadCloud className="text-muted-foreground" size={24} />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-sm">Haz click o arrastra una imagen</p>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP hasta 2MB (Recomendado)</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleImageUpload(e.target.files[0]);
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => navigate('/menu')}>
                        Cancelar
                    </Button>
                    <Button type="submit" size="lg">
                        {id ? 'Guardar Cambios' : 'Crear Producto'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
