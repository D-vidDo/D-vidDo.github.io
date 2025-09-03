import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

const BUCKET_NAME = "photos_of_bill";

const BillOfTheDay = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list("", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });

      if (error) {
        console.error("Error fetching images:", error.message);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
  const totalImages = data.length;
  const dayIndex = new Date().getDate() % totalImages;
  const selectedImage = data[dayIndex];

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(selectedImage.name);

  setImageUrl(publicUrlData?.publicUrl ?? null);
}


      setLoading(false);
    }

    fetchImage();
  }, []);

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-accent" />
        <CardTitle className="text-2xl font-bold">Bill of the Day</CardTitle>
        <Badge variant="secondary" className="ml-auto font-semibold">
          {new Date().toLocaleDateString()}
        </Badge>
      </CardHeader>
      <CardContent className="flex justify-center items-center">
        {loading ? (
          <p className="text-muted-foreground">Loading image...</p>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Bill of the Day"
            className="rounded-lg shadow-md max-h-[400px] object-contain"
          />
        ) : (
          <p className="text-muted-foreground">No image available.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default BillOfTheDay;
