import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummyKey";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadFile = async (
    file: File,
    onProgress?: (percent: number) => void,
    bucket: string = "audio-files"
) => {
    try {
        let safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        let filePath = `uploads/${safeFileName}`;
        let counter = 1;

        const { data: existingFiles } = await supabase
            .storage
            .from(bucket)
            .list("uploads/");

        const existingFileNames = existingFiles?.map((f) => f.name);

        while (existingFileNames?.includes(safeFileName)) {
            const nameParts = safeFileName.split(".");
            const extension = nameParts.pop();
            const baseName = nameParts.join(".");
            safeFileName = `${baseName}-${counter}.${extension}`;
            filePath = `uploads/${safeFileName}`;
            counter++;
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false,
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { success: true, url: urlData.publicUrl, data };
    } catch (err) {
        console.error("Upload error:", err);
        return { success: false, error: err };
    }
};
