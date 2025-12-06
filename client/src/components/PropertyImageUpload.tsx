import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Upload, X, Star, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface PropertyImageUploadProps {
  propertyId: number;
  onUploadComplete?: () => void;
}

export default function PropertyImageUpload({ propertyId, onUploadComplete }: PropertyImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: images, isLoading } = trpc.propertyImages.list.useQuery({ propertyId });
  
  // A mutação de upload está preparada para receber a URL do S3/CDN (imageUrl)
  const uploadMutation = trpc.propertyImages.upload.useMutation({
    onSuccess: () => {
      // O invalidate deve ser chamado após o upload (que acontece no backend)
      utils.propertyImages.list.invalidate({ propertyId });
      toast.success("Imagem enviada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
    },
  });

  const deleteMutation = trpc.propertyImages.delete.useMutation({
    onSuccess: () => {
      utils.propertyImages.list.invalidate({ propertyId });
      toast.success("Imagem removida com sucesso!");
    },
  });

  const setPrimaryMutation = trpc.propertyImages.setPrimary.useMutation({
    onSuccess: () => {
      utils.propertyImages.list.invalidate({ propertyId });
      toast.success("Imagem principal definida!");
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = files.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        // Validações
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} não é uma imagem válida`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} é muito grande (máximo 5MB)`);
          continue;
        }

        // 🚨 Ação Crítica: O upload real do S3/CDN deve ser implementado aqui (via Pre-Signed URL)
        // O código a seguir SIMULA o fluxo PÓS-UPLOAD S3:
        const fileKey = `properties/${propertyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
        // Placeholder de URL - DEVE SER SUBSTITUÍDO PELA URL DO S3/CDN APÓS O UPLOAD REAL
        const finalImageUrl = `https://seudominio-s3.com/bucket-name/${fileKey}`; 

        await uploadMutation.mutateAsync({
          propertyId,
          imageUrl: finalImageUrl,
          imageKey: fileKey,
          isPrimary: images?.length === 0 && i === 0 ? 1 : 0,
          displayOrder: (images?.length || 0) + i,
        });

        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      if (onUploadComplete) {
        onUploadComplete();
      }
      toast.info("Atenção: A URL de imagem usada foi um placeholder. Implemente a lógica real de upload S3/CDN no backend.");
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao fazer upload das imagens - Verifique a implementação S3 no backend.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm("Tem certeza que deseja remover esta imagem?")) return;
    await deleteMutation.mutateAsync({ id: imageId });
  };

  const handleSetPrimary = async (imageId: number) => {
    await setPrimaryMutation.mutateAsync({ imageId, propertyId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <div className="p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {uploading ? "Enviando imagens..." : "Clique para fazer upload"}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              ou arraste e solte suas imagens aqui
              <br />
              <span className="text-xs">PNG, JPG, WEBP até 5MB cada. **ATENÇÃO: A lógica REAL de upload S3 precisa ser implementada no backend.**</span>
            </p>
            {uploading && (
              <div className="w-full max-w-xs mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </label>
        </div>
      </Card>

      {/* Images Grid */}
      {images && images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={image.imageUrl} 
                  alt={image.caption || "Imagem do imóvel"}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant={image.isPrimary === 1 ? "default" : "secondary"}
                    onClick={() => handleSetPrimary(image.id)}
                    disabled={setPrimaryMutation.isPending}
                  >
                    <Star className={`h-4 w-4 ${image.isPrimary === 1 ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(image.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Badge de imagem principal */}
                {image.isPrimary === 1 && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Principal
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma imagem adicionada ainda</p>
            <p className="text-sm mt-2">Faça upload de fotos para este imóvel</p>
          </div>
        </Card>
      )}
    </div>
  );
}
